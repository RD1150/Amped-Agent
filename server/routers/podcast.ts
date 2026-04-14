import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { podcastSeries, podcastEpisodes, personas } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { textToSpeech } from "../_core/elevenLabs";
import { storagePut } from "../storage";

// ── Helpers ─────────────────────────────────────────────────────────────────

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

/** Estimate audio duration from word count (130 wpm average) */
function estimateDuration(script: string): number {
  const words = script.trim().split(/\s+/).length;
  return Math.ceil((words / 130) * 60);
}

// ── Router ───────────────────────────────────────────────────────────────────

export const podcastRouter = router({

  // ── Series CRUD ────────────────────────────────────────────────────────────

  listSeries: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    return db
      .select()
      .from(podcastSeries)
      .where(eq(podcastSeries.userId, ctx.user.id))
      .orderBy(desc(podcastSeries.updatedAt));
  }),

  createSeries: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().max(2000).optional(),
      seriesType: z.enum(["podcast", "book"]).default("podcast"),
      category: z.string().max(128).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const persona = await db.select().from(personas).where(eq(personas.userId, ctx.user.id)).limit(1);
      const authorName = persona[0]?.agentName || ctx.user.name || "Agent";
      const [row] = await db.insert(podcastSeries).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        seriesType: input.seriesType,
        category: input.category ?? "Real Estate",
        authorName,
      }).$returningId();
      return { id: row.id };
    }),

  updateSeries: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().max(2000).optional(),
      category: z.string().max(128).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(podcastSeries)
        .set({ title: input.title, description: input.description, category: input.category })
        .where(and(eq(podcastSeries.id, input.id), eq(podcastSeries.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteSeries: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(podcastEpisodes)
        .where(and(eq(podcastEpisodes.seriesId, input.id), eq(podcastEpisodes.userId, ctx.user.id)));
      await db.delete(podcastSeries)
        .where(and(eq(podcastSeries.id, input.id), eq(podcastSeries.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Episode CRUD ───────────────────────────────────────────────────────────

  listEpisodes: protectedProcedure
    .input(z.object({ seriesId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      return db
        .select()
        .from(podcastEpisodes)
        .where(and(eq(podcastEpisodes.seriesId, input.seriesId), eq(podcastEpisodes.userId, ctx.user.id)))
        .orderBy(podcastEpisodes.episodeNumber);
    }),

  createEpisode: protectedProcedure
    .input(z.object({
      seriesId: z.number(),
      title: z.string().min(1).max(255),
      rawInput: z.string().max(20000).optional(),
      episodeNumber: z.number().int().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      // Auto-assign episode number
      const existing = await db.select({ n: podcastEpisodes.episodeNumber })
        .from(podcastEpisodes)
        .where(and(eq(podcastEpisodes.seriesId, input.seriesId), eq(podcastEpisodes.userId, ctx.user.id)))
        .orderBy(desc(podcastEpisodes.episodeNumber))
        .limit(1);
      const nextNum = input.episodeNumber ?? ((existing[0]?.n ?? 0) + 1);
      const [row] = await db.insert(podcastEpisodes).values({
        seriesId: input.seriesId,
        userId: ctx.user.id,
        episodeNumber: nextNum,
        title: input.title,
        rawInput: input.rawInput ?? null,
        status: "draft",
      }).$returningId();
      return { id: row.id };
    }),

  updateEpisode: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      rawInput: z.string().max(20000).optional(),
      script: z.string().max(50000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(podcastEpisodes)
        .set({ title: input.title, rawInput: input.rawInput, script: input.script })
        .where(and(eq(podcastEpisodes.id, input.id), eq(podcastEpisodes.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteEpisode: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(podcastEpisodes)
        .where(and(eq(podcastEpisodes.id, input.id), eq(podcastEpisodes.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── AI Script Generation ───────────────────────────────────────────────────

  generateScript: protectedProcedure
    .input(z.object({
      episodeId: z.number(),
      seriesType: z.enum(["podcast", "book"]).default("podcast"),
      targetMinutes: z.number().min(1).max(60).default(5),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [ep] = await db.select().from(podcastEpisodes)
        .where(and(eq(podcastEpisodes.id, input.episodeId), eq(podcastEpisodes.userId, ctx.user.id)))
        .limit(1);
      if (!ep) throw new TRPCError({ code: "NOT_FOUND", message: "Episode not found" });

      const [persona] = await db.select().from(personas).where(eq(personas.userId, ctx.user.id)).limit(1);
      const agentName = persona?.agentName || ctx.user.name || "Your Agent";
      const city = persona?.primaryCity || "your area";
      const brokerage = persona?.brokerageName || "";

      const targetWords = input.targetMinutes * 130;
      const format = input.seriesType === "book"
        ? `a book chapter narration (~${targetWords} words)`
        : `a podcast episode script (~${targetWords} words)`;

      const systemPrompt = `You are a professional scriptwriter for real estate agents. Write ${format} for ${agentName}${brokerage ? `, ${brokerage}` : ""}, serving ${city}. 
The script should sound natural when read aloud — conversational but authoritative. 
Structure: warm intro (10%), 3-5 main points (75%), memorable close with CTA (15%).
Do NOT include stage directions, sound effects, or [MUSIC] tags. Just the spoken words.
Use first person ("I", "we"). Reference the agent's name and city naturally.`;

      const userPrompt = ep.rawInput
        ? `Turn these notes into a polished script:\n\n${ep.rawInput}`
        : `Write a ${format} on the topic: "${ep.title}"`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const script = (response.choices[0]?.message?.content as string) ?? "";
      const duration = estimateDuration(script);

      await db.update(podcastEpisodes)
        .set({ script, durationSeconds: duration, status: "draft" })
        .where(eq(podcastEpisodes.id, input.episodeId));

      return { script, durationSeconds: duration };
    }),

  // ── Audio Generation (ElevenLabs) ─────────────────────────────────────────

  generateAudio: protectedProcedure
    .input(z.object({
      episodeId: z.number(),
      voiceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [ep] = await db.select().from(podcastEpisodes)
        .where(and(eq(podcastEpisodes.id, input.episodeId), eq(podcastEpisodes.userId, ctx.user.id)))
        .limit(1);
      if (!ep) throw new TRPCError({ code: "NOT_FOUND", message: "Episode not found" });
      if (!ep.script) throw new TRPCError({ code: "BAD_REQUEST", message: "Generate a script first" });

      // Pick voice: input override → user's cloned voice → user's preferred voice → Rachel default
      const [persona] = await db.select().from(personas).where(eq(personas.userId, ctx.user.id)).limit(1);
      const voiceId = input.voiceId
        ?? persona?.elevenlabsVoiceId
        ?? "21m00Tcm4TlvDq8ikWAM";

      await db.update(podcastEpisodes)
        .set({ status: "generating", voiceId })
        .where(eq(podcastEpisodes.id, input.episodeId));

      try {
        const audioBuffer = await textToSpeech({ text: ep.script, voice_id: voiceId });
        const key = `podcast-audio/${ctx.user.id}/${input.episodeId}-${randomSuffix()}.mp3`;
        const { url } = await storagePut(key, audioBuffer, "audio/mpeg");

        const duration = estimateDuration(ep.script);
        const credits = Math.max(1, Math.ceil(duration / 60)); // 1 credit per minute

        await db.update(podcastEpisodes)
          .set({ audioUrl: url, status: "ready", outputType: "audio", durationSeconds: duration, creditsCost: credits })
          .where(eq(podcastEpisodes.id, input.episodeId));

        return { audioUrl: url, durationSeconds: duration, credits };
      } catch (err) {
        await db.update(podcastEpisodes)
          .set({ status: "failed", errorMessage: String(err) })
          .where(eq(podcastEpisodes.id, input.episodeId));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Audio generation failed: ${err}` });
      }
    }),

  // ── Avatar Video Generation (HeyGen) ──────────────────────────────────────

  generateAvatarVideo: protectedProcedure
    .input(z.object({
      episodeId: z.number(),
      voiceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [ep] = await db.select().from(podcastEpisodes)
        .where(and(eq(podcastEpisodes.id, input.episodeId), eq(podcastEpisodes.userId, ctx.user.id)))
        .limit(1);
      if (!ep) throw new TRPCError({ code: "NOT_FOUND", message: "Episode not found" });
      if (!ep.script) throw new TRPCError({ code: "BAD_REQUEST", message: "Generate a script first" });

      const { generateCustomAvatarVideo, waitForHeyGenVideo } = await import("../lib/heygen-service");
      const [persona] = await db.select().from(personas).where(eq(personas.userId, ctx.user.id)).limit(1);
      const voiceId = input.voiceId ?? persona?.elevenlabsVoiceId ?? "21m00Tcm4TlvDq8ikWAM";

      await db.update(podcastEpisodes)
        .set({ status: "generating", outputType: "avatar_video", voiceId })
        .where(eq(podcastEpisodes.id, input.episodeId));

      try {
        // Require a custom avatar to be set up
        const avatarId = persona?.headshotUrl ?? "";
        if (!avatarId) throw new TRPCError({ code: "BAD_REQUEST", message: "Set up your AI Avatar first in Avatar Video settings" });
        const jobId = await generateCustomAvatarVideo({
          avatarId,
          script: ep.script,
          voiceId,
          title: ep.title,
        });

        await db.update(podcastEpisodes)
          .set({ videoJobId: jobId })
          .where(eq(podcastEpisodes.id, input.episodeId));

        // Poll for completion (up to 10 min)
        const { videoUrl } = await waitForHeyGenVideo(jobId);
        const duration = estimateDuration(ep.script);
        const credits = Math.max(5, Math.ceil(duration / 60) * 5); // 5 credits per minute for avatar video

        await db.update(podcastEpisodes)
          .set({ videoUrl, status: "ready", durationSeconds: duration, creditsCost: credits })
          .where(eq(podcastEpisodes.id, input.episodeId));

        return { videoUrl, durationSeconds: duration, credits };
      } catch (err) {
        await db.update(podcastEpisodes)
          .set({ status: "failed", errorMessage: String(err) })
          .where(eq(podcastEpisodes.id, input.episodeId));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Avatar video generation failed: ${err}` });
      }
    }),

  // ── Poll episode status ────────────────────────────────────────────────────

  getEpisode: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [ep] = await db.select().from(podcastEpisodes)
        .where(and(eq(podcastEpisodes.id, input.id), eq(podcastEpisodes.userId, ctx.user.id)))
        .limit(1);
      if (!ep) throw new TRPCError({ code: "NOT_FOUND", message: "Episode not found" });
      return ep;
    }),
});
