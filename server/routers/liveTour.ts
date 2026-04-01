/**
 * Live Tour — in-browser guided room-by-room video recorder
 *
 * Flow:
 *  1. User creates a session (create) with property info + room list
 *  2. For each room, client records a clip and uploads it to S3 via saveClip
 *  3. When all clips are recorded, client calls assemble to kick off Creatomate stitching
 *  4. Client polls getStatus to check progress
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { liveTourJobs, personas } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { ENV } from "../_core/env";

const CREATOMATE_API_URL = "https://api.creatomate.com/v1/renders";

async function submitLiveTourRender(renderScript: object): Promise<{
  id: string;
  url?: string;
  snapshot_url?: string;
}> {
  const apiKey = ENV.CREATOMATE_API_KEY;
  if (!apiKey) throw new Error("CREATOMATE_API_KEY not configured");
  const response = await fetch(CREATOMATE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source: renderScript }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Creatomate error ${response.status}: ${err.substring(0, 300)}`);
  }
  const results = await response.json();
  const render = Array.isArray(results) ? results[0] : results;
  if (!render?.id) throw new Error("No render ID returned");

  // Poll for completion (max 5 min)
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const poll = await fetch(`${CREATOMATE_API_URL}/${render.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const status = await poll.json();
    if (status.status === "succeeded") {
      return { id: render.id, url: status.url, snapshot_url: status.snapshot_url };
    }
    if (status.status === "failed") throw new Error(status.error ?? "Render failed");
  }
  throw new Error("Render timed out after 5 minutes");
}

type Clip = { roomName: string; clipUrl: string; duration: number };

// ─── Router ──────────────────────────────────────────────────────────────────

export const liveTourRouter = router({
  /** Create a new recording session */
  create: protectedProcedure
    .input(
      z.object({
        propertyAddress: z.string().min(1),
        rooms: z.array(z.string().min(1)).min(1).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Pull agent info from persona
      const [persona] = await db
        .select()
        .from(personas)
        .where(eq(personas.userId, ctx.user.id))
        .limit(1);

      const id = randomUUID();

      await db.insert(liveTourJobs).values({
        id,
        userId: ctx.user.id,
        propertyAddress: input.propertyAddress,
        agentName: persona?.agentName ?? ctx.user.name ?? "",
        agentPhone: persona?.phoneNumber ?? "",
        agentLogoUrl: persona?.logoUrl ?? "",
        clips: JSON.stringify(
          input.rooms.map((r) => ({ roomName: r, clipUrl: "", duration: 0 }))
        ),
        status: "recording",
        videoUrl: "",
        thumbnailUrl: "",
      });

      return { id, rooms: input.rooms };
    }),

  /** Get the status of a live tour job */
  getStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [job] = await db
        .select()
        .from(liveTourJobs)
        .where(and(eq(liveTourJobs.id, input.id), eq(liveTourJobs.userId, ctx.user.id)))
        .limit(1);

      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        ...job,
        clips: JSON.parse(job.clips ?? "[]") as Clip[],
      };
    }),

  /** Save a recorded clip URL after upload */
  saveClip: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        roomIndex: z.number().int().min(0),
        clipUrl: z.string().url(),
        duration: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [job] = await db
        .select()
        .from(liveTourJobs)
        .where(and(eq(liveTourJobs.id, input.jobId), eq(liveTourJobs.userId, ctx.user.id)))
        .limit(1);

      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      const clips: Clip[] = JSON.parse(job.clips ?? "[]");

      if (input.roomIndex >= clips.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Room index out of range" });
      }

      clips[input.roomIndex].clipUrl = input.clipUrl;
      clips[input.roomIndex].duration = input.duration;

      await db
        .update(liveTourJobs)
        .set({ clips: JSON.stringify(clips) })
        .where(eq(liveTourJobs.id, input.jobId));

      return { ok: true };
    }),

  /** Assemble all clips into a final video via Creatomate */
  assemble: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [job] = await db
        .select()
        .from(liveTourJobs)
        .where(and(eq(liveTourJobs.id, input.jobId), eq(liveTourJobs.userId, ctx.user.id)))
        .limit(1);

      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.status !== "recording") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Job is not in recording state" });
      }

      const clips: Clip[] = JSON.parse(job.clips ?? "[]");
      const recordedClips = clips.filter((c) => c.clipUrl);

      if (recordedClips.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No clips recorded yet" });
      }

      // Mark as processing
      await db
        .update(liveTourJobs)
        .set({ status: "processing" })
        .where(eq(liveTourJobs.id, input.jobId));

      // Build Creatomate render script
      const MUSIC_URL =
        "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/bg-music-luxury.mp3";

      // Address intro card
      const addressCard = {
        type: "composition",
        duration: 3,
        elements: [
          {
            type: "shape",
            shape: "rectangle",
            fill_color: "rgba(10,20,40,0.95)",
            width: "100%",
            height: "100%",
          },
          {
            type: "text",
            text: job.propertyAddress,
            font_family: "Montserrat",
            font_weight: "700",
            font_size: "32 vmin",
            fill_color: "#FFFFFF",
            x_alignment: "50%",
            y_alignment: "42%",
            width: "85%",
            height: "20%",
          },
          {
            type: "text",
            text: "LIVE PROPERTY TOUR",
            font_family: "Montserrat",
            font_weight: "400",
            font_size: "18 vmin",
            fill_color: "#C9A962",
            x_alignment: "50%",
            y_alignment: "60%",
            width: "85%",
            height: "10%",
          },
        ],
      };

      // Outro card
      const outroCard = {
        type: "composition",
        duration: 4,
        elements: [
          {
            type: "shape",
            shape: "rectangle",
            fill_color: "rgba(10,20,40,0.95)",
            width: "100%",
            height: "100%",
          },
          {
            type: "text",
            text: job.agentName || "Your Agent",
            font_family: "Montserrat",
            font_weight: "700",
            font_size: "36 vmin",
            fill_color: "#FFFFFF",
            x_alignment: "50%",
            y_alignment: "38%",
            width: "85%",
            height: "20%",
          },
          ...(job.agentPhone
            ? [
                {
                  type: "text",
                  text: job.agentPhone,
                  font_family: "Montserrat",
                  font_weight: "400",
                  font_size: "24 vmin",
                  fill_color: "#C9A962",
                  x_alignment: "50%",
                  y_alignment: "58%",
                  width: "85%",
                  height: "12%",
                },
              ]
            : []),
        ],
      };

      // Room clips with label overlay
      const roomCompositions = recordedClips.map((clip) => ({
        type: "composition",
        elements: [
          {
            type: "video",
            source: clip.clipUrl,
            fit: "cover",
            volume: "100%",
          },
          {
            type: "shape",
            shape: "rectangle",
            fill_color: "rgba(0,0,0,0.45)",
            width: "100%",
            height: "18%",
            y_alignment: "100%",
          },
          {
            type: "text",
            text: clip.roomName,
            font_family: "Montserrat",
            font_weight: "700",
            font_size: "26 vmin",
            fill_color: "#FFFFFF",
            x_alignment: "5%",
            y_alignment: "88%",
            width: "90%",
            height: "12%",
          },
        ],
      }));

      const renderScript = {
        output_format: "mp4",
        width: 1920,
        height: 1080,
        elements: [
          {
            type: "composition",
            track: 1,
            elements: [addressCard, ...roomCompositions, outroCard],
          },
          {
            type: "audio",
            source: MUSIC_URL,
            volume: "20%",
            audio_fade_out: 2,
          },
        ],
      };

      // Submit to Creatomate async — don't await the full render
      submitLiveTourRender(renderScript)
        .then(async (result) => {
          const db2 = await getDb();
          if (!db2) return;
          if (result?.url) {
            await db2
              .update(liveTourJobs)
              .set({
                status: "completed",
                videoUrl: result.url,
                thumbnailUrl: result.snapshot_url ?? "",
              })
              .where(eq(liveTourJobs.id, input.jobId));
          } else {
            await db2
              .update(liveTourJobs)
              .set({ status: "failed", errorMessage: "No URL returned" })
              .where(eq(liveTourJobs.id, input.jobId));
          }
        })
        .catch(async (err: unknown) => {
          const db2 = await getDb();
          if (!db2) return;
          await db2
            .update(liveTourJobs)
            .set({ status: "failed", errorMessage: String(err) })
            .where(eq(liveTourJobs.id, input.jobId));
        });

      return { ok: true, status: "processing" };
    }),

  /** List all live tour jobs for the current user */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const jobs = await db
      .select()
      .from(liveTourJobs)
      .where(eq(liveTourJobs.userId, ctx.user.id))
      .orderBy(desc(liveTourJobs.createdAt));

    return jobs.map((j) => ({
      ...j,
      clips: JSON.parse(j.clips ?? "[]") as Clip[],
    }));
  }),

  /** Delete a live tour job */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(liveTourJobs)
        .where(and(eq(liveTourJobs.id, input.id), eq(liveTourJobs.userId, ctx.user.id)));

      return { ok: true };
    }),
});
