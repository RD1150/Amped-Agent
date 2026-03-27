import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { getDb } from "../db";
import { generatedVideos, cinematicJobs } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import * as fs from "fs";

function log(msg: string) {
  // Ensure log directory exists
  try { fs.mkdirSync("/home/ubuntu/luxestate/.manus-logs", { recursive: true }); } catch {}
  const line = `[${new Date().toISOString()}] [CinematicWalkthrough] ${msg}\n`;
  try { fs.appendFileSync("/home/ubuntu/luxestate/.manus-logs/cinematic.log", line); } catch {}
  console.log(msg);
}

// ============================================================
// ROOM-TYPE MOTION PROMPTS
// Each prompt is crafted to produce a realistic cinematic
// camera movement that feels like a physical walkthrough.
// ============================================================

const ROOM_MOTION_PROMPTS: Record<string, string> = {
  exterior_front: "Slow cinematic dolly forward approaching the front of the home, smooth and steady, golden hour lighting, slight upward tilt revealing the roofline",
  exterior_back: "Gentle wide pan left to right across the backyard, smooth tracking shot, lush landscaping in foreground",
  living_room: "Slow dolly push forward into the living room, revealing the full space, warm natural light from windows, smooth and cinematic",
  kitchen: "Smooth tracking shot moving left to right along the kitchen island, revealing countertops and appliances, bright and airy",
  dining_room: "Slow crane-style reveal starting high and tilting down to the dining table, elegant and inviting",
  master_bedroom: "Gentle dolly forward toward the bed, soft morning light, serene and luxurious atmosphere",
  bedroom: "Smooth pan from the doorway revealing the bedroom, natural light, calm and inviting",
  master_bathroom: "Slow tracking shot gliding across the vanity and into the bathroom, spa-like atmosphere, bright and clean",
  bathroom: "Gentle pan revealing the bathroom fixtures, clean and bright, smooth camera movement",
  office: "Slow dolly push into the home office, revealing the desk and built-ins, professional and focused",
  garage: "Wide establishing shot with slow push forward into the garage, clean and spacious",
  pool: "Smooth low-angle tracking shot along the pool edge, water shimmering in sunlight, resort-style feel",
  view: "Slow cinematic reveal panning across the panoramic view, wide and breathtaking",
  other: "Smooth cinematic camera movement through the space, steady and professional, revealing the full room",
};

const ROOM_TYPE_OPTIONS = Object.keys(ROOM_MOTION_PROMPTS) as [string, ...string[]];

// ============================================================
// DB HELPERS — read/write cinematic_jobs table
// All job state is persisted to DB so it survives server restarts.
// ============================================================

async function dbCreateJob(jobId: string, userId: number, totalPhotos: number, inputSnapshot?: string) {
  const database = await getDb();
  await database!.insert(cinematicJobs).values({
    id: jobId,
    userId,
    status: "pending",
    totalPhotos,
    completedClips: 0,
    inputSnapshot: inputSnapshot ?? null,
  });
}

async function dbUpdateJob(
  jobId: string,
  patch: {
    status?: "pending" | "generating_clips" | "assembling" | "done" | "failed";
    completedClips?: number;
    videoUrl?: string;
    error?: string;
    inputSnapshot?: string;
  }
) {
  const database = await getDb();
  await database!.update(cinematicJobs).set(patch).where(eq(cinematicJobs.id, jobId));
}

async function dbGetJob(jobId: string) {
  const database = await getDb();
  const rows = await database!.select().from(cinematicJobs).where(eq(cinematicJobs.id, jobId));
  return rows[0] ?? null;
}

// ============================================================
// SERVER STARTUP RECOVERY
// Called once on boot to resolve any jobs that were in-flight
// when the server last shut down (deploy, crash, idle timeout).
// These jobs will never complete on their own — mark them failed
// with a clear message so agents can retry.
// ============================================================
export async function recoverStuckCinematicJobs(): Promise<void> {
  try {
    const database = await getDb();
    if (!database) return;
    const stuckStatuses = ["pending", "generating_clips", "assembling"] as const;
    const stuck = await database
      .select({ id: cinematicJobs.id, status: cinematicJobs.status, userId: cinematicJobs.userId })
      .from(cinematicJobs)
      .where(inArray(cinematicJobs.status, [...stuckStatuses]));
    if (stuck.length === 0) {
      log(`[Startup Recovery] No stuck cinematic jobs found.`);
      return;
    }
    const ids = stuck.map((j) => j.id);
    log(`[Startup Recovery] Found ${stuck.length} stuck job(s): ${ids.join(", ")} — marking as failed.`);
    await database
      .update(cinematicJobs)
      .set({
        status: "failed",
        error: "Generation was interrupted because the server restarted. Please click Retry to restart your Cinematic Tour.",
      })
      .where(inArray(cinematicJobs.id, ids));
    log(`[Startup Recovery] Marked ${stuck.length} job(s) as failed.`);
  } catch (err) {
    // Recovery is best-effort — never crash the server on startup
    log(`[Startup Recovery] Error during recovery: ${err}`);
  }
}

// ============================================================
// RUNWAY API HELPERS (using gen4_turbo for best quality)
// ============================================================

async function generateRunwayClip(
  imageUrl: string,
  roomType: string,
  customPrompt?: string,
  attempt = 1
): Promise<string> {
  const promptText = customPrompt || ROOM_MOTION_PROMPTS[roomType] || ROOM_MOTION_PROMPTS.other;

  log(`Generating Runway clip for room: ${roomType} (attempt ${attempt}), prompt: ${promptText.substring(0, 60)}...`);

  // Add a small delay between clips to avoid rate limits (3s after first clip)
  if (attempt === 1) {
    await new Promise((r) => setTimeout(r, 3000));
  }

  const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.RUNWAY_API_KEY}`,
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify({
      model: "gen4_turbo",
      promptImage: imageUrl,
      promptText,
      duration: 5,
      ratio: "1280:720",
    }),
  });

  // Handle rate limiting with exponential backoff
  if (response.status === 429 || response.status === 503) {
    if (attempt <= 3) {
      const waitMs = attempt * 15000; // 15s, 30s, 45s
      log(`Runway rate limited (${response.status}), waiting ${waitMs/1000}s before retry ${attempt + 1}...`);
      await new Promise((r) => setTimeout(r, waitMs));
      return generateRunwayClip(imageUrl, roomType, customPrompt, attempt + 1);
    }
  }

  if (!response.ok) {
    const err = await response.text();
    log(`Runway API error ${response.status}: ${err}`);
    throw new Error(`Runway API error: ${response.status} - ${err}`);
  }

  const task = await response.json() as { id: string };
  log(`Runway task created: ${task.id}`);

  return await pollRunwayTask(task.id);
}

async function pollRunwayTask(taskId: string, maxWaitMs = 420000): Promise<string> {
  const start = Date.now();
  const interval = 8000;

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, interval));

    const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${ENV.RUNWAY_API_KEY}`,
        "X-Runway-Version": "2024-11-06",
      },
    });

    if (!res.ok) {
      log(`Runway poll error ${res.status}`);
      continue;
    }

    const task = await res.json() as {
      id: string;
      status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
      output?: string[];
      failure?: string;
    };

    log(`Runway task ${taskId} status: ${task.status}`);

    if (task.status === "SUCCEEDED") {
      if (!task.output || task.output.length === 0) {
        throw new Error("Runway returned success but no output URL");
      }
      log(`✓ Runway clip ready: ${task.output[0]}`);
      return task.output[0];
    }

    if (task.status === "FAILED") {
      throw new Error(`Runway generation failed: ${task.failure || "Unknown error"}`);
    }

    if (task.status === "CANCELLED") {
      throw new Error("Runway generation was cancelled");
    }
  }

  throw new Error("Runway generation timed out after 7 minutes");
}

// ============================================================
// CREATOMATE ASSEMBLY
// Stitches all clips into a final walkthrough video via Creatomate
// ============================================================

async function assembleCreatomateVideo(opts: {
  clips: Array<{ url: string; roomLabel: string; duration: number }>;
  propertyAddress: string;
  agentName: string;
  agentBrokerage?: string;
  musicTrackUrl?: string;
  voiceoverUrl?: string;
  aspectRatio: "16:9" | "9:16";
  userId?: number | null;
}): Promise<string> {
  const { clips, propertyAddress, agentName, agentBrokerage, musicTrackUrl, voiceoverUrl, aspectRatio, userId } = opts;

  const [width, height] = aspectRatio === "16:9" ? [1920, 1080] : [1080, 1920];

  // Build Creatomate elements
  // BLACK SCREEN FIX: Use a single track (track 1) for all video clips placed
  // sequentially. Creatomate's single-track mode renders clips back-to-back with
  // no gaps. Cross-fades are achieved via animations on the clip itself.
  // A solid black background on track 0 ensures no transparent gaps show through.
  const elements: any[] = [];

  // Track 0: Solid black background — always visible, prevents any transparent gaps
  // This is the safety net: even if a clip has encoding issues, the background is black
  // rather than undefined/transparent.
  const clipsDuration = clips.reduce((sum, c) => sum + c.duration, 0);
  const OUTRO_DURATION = 4;
  const totalDuration = clipsDuration + OUTRO_DURATION;

  elements.push({
    type: "shape",
    track: 1,
    time: 0,
    duration: totalDuration,
    x: "50%",
    y: "50%",
    width: "100%",
    height: "100%",
    fill_color: "#000000",
  });

  // Tracks 2+: Video clips placed sequentially on the SAME track (track 2)
  // Creatomate places same-track elements back-to-back automatically.
  // Using fill_mode: "stretch" ensures the clip fills its time slot with no gaps.
  let currentTime = 0;
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const FADE = 0.4; // cross-fade duration in seconds

    elements.push({
      type: "video",
      source: clip.url,
      track: 2,
      time: currentTime,
      duration: clip.duration,
      fill_mode: "cover",   // fill the frame, no letterboxing
      volume: 0,            // mute the clip's own audio (music track handles audio)
      animations: [
        // Fade in from black at start of each clip
        { time: 0,                    duration: FADE, easing: "ease-in-out", type: "fade", fade: "in" },
        // Fade out to black at end of each clip (overlaps with next clip's fade-in)
        { time: clip.duration - FADE, duration: FADE, easing: "ease-in-out", type: "fade", fade: "out" },
      ],
    });

    // Room label — appears after fade-in, disappears before fade-out
    const labelDuration = Math.min(2.5, clip.duration - FADE * 2 - 0.2);
    if (labelDuration > 0.5) {
      elements.push({
        type: "text",
        track: 3,
        text: clip.roomLabel,
        time: currentTime + FADE + 0.1,
        duration: labelDuration,
        x: "8%",
        y: aspectRatio === "16:9" ? "85%" : "88%",
        x_anchor: "0%",
        y_anchor: "50%",
        font_family: "Montserrat",
        font_size: aspectRatio === "16:9" ? "3.5 vmin" : "4 vmin",
        font_weight: "700",
        fill_color: "#ffffff",
        background_color: "rgba(0,0,0,0.55)",
        background_x_padding: "6%",
        background_y_padding: "4%",
        background_border_radius: "2%",
        animations: [
          { time: 0,              duration: 0.3, easing: "ease-out", type: "fade", fade: "in" },
          { time: labelDuration - 0.3, duration: 0.3, easing: "ease-in",  type: "fade", fade: "out" },
        ],
      });
    }

    currentTime += clip.duration;
  }

  // Outro card — solid dark overlay with agent branding
  // Placed on track 4 so it composites over the black background
  const outroStart = clipsDuration;
  elements.push({
    type: "shape",
    track: 4,
    time: outroStart,
    duration: OUTRO_DURATION,
    x: "50%",
    y: "50%",
    width: "100%",
    height: "100%",
    fill_color: "#0d1b2a",
    animations: [{ time: 0, duration: 0.6, easing: "ease-out", type: "fade", fade: "in" }],
  });

  // Gold accent line on outro
  elements.push({
    type: "shape",
    track: 5,
    time: outroStart + 0.3,
    duration: OUTRO_DURATION - 0.3,
    x: "50%",
    y: "35%",
    width: "30%",
    height: "0.4%",
    fill_color: "#c9a84c",
    animations: [{ time: 0, duration: 0.4, easing: "ease-out", type: "fade", fade: "in" }],
  });

  elements.push({
    type: "text",
    track: 5,
    time: outroStart + 0.4,
    duration: OUTRO_DURATION - 0.4,
    text: "Presented by",
    x: "50%",
    y: "42%",
    font_family: "Georgia",
    font_size: aspectRatio === "16:9" ? "2.5 vmin" : "3.5 vmin",
    fill_color: "#c9a84c",
    text_align: "center",
    letter_spacing: "3px",
    animations: [{ time: 0, duration: 0.4, easing: "ease-out", type: "fade", fade: "in" }],
  });

  elements.push({
    type: "text",
    track: 5,
    time: outroStart + 0.5,
    duration: OUTRO_DURATION - 0.5,
    text: agentName,
    x: "50%",
    y: "52%",
    font_family: "Montserrat",
    font_size: aspectRatio === "16:9" ? "4.5 vmin" : "6 vmin",
    font_weight: "700",
    fill_color: "#ffffff",
    text_align: "center",
    animations: [{ time: 0, duration: 0.4, easing: "ease-out", type: "text-slide", direction: "up", scope: "word" }],
  });

  if (agentBrokerage) {
    elements.push({
      type: "text",
      track: 5,
      time: outroStart + 0.6,
      duration: OUTRO_DURATION - 0.6,
      text: agentBrokerage,
      x: "50%",
      y: "62%",
      font_family: "Georgia",
      font_size: aspectRatio === "16:9" ? "2 vmin" : "3 vmin",
      fill_color: "#aaaaaa",
      text_align: "center",
      animations: [{ time: 0, duration: 0.4, easing: "ease-out", type: "fade", fade: "in" }],
    });
  }

  elements.push({
    type: "text",
    track: 5,
    time: outroStart + 0.7,
    duration: OUTRO_DURATION - 0.7,
    text: propertyAddress,
    x: "50%",
    y: agentBrokerage ? "72%" : "65%",
    font_family: "Georgia",
    font_size: aspectRatio === "16:9" ? "1.8 vmin" : "2.8 vmin",
    fill_color: "#c9a84c",
    text_align: "center",
    letter_spacing: "1px",
    animations: [{ time: 0, duration: 0.4, easing: "ease-out", type: "fade", fade: "in" }],
  });

  // Audio tracks
  if (musicTrackUrl) {
    elements.push({
      type: "audio",
      track: 6,
      source: musicTrackUrl,
      time: 0,
      duration: totalDuration,
      volume: voiceoverUrl ? 0.2 : 0.5,
      audio_fade_in: 1.0,
      audio_fade_out: 2.0,
    });
  }

  if (voiceoverUrl) {
    elements.push({
      type: "audio",
      track: 7,
      source: voiceoverUrl,
      time: 0,
      duration: totalDuration,
      volume: 1.0,
    });
  }

  // Creatomate requires a `source` object for dynamic (template-free) renders.
  // Passing elements at the top level causes a 400 "template_id must be provided" error.
  const payload = {
    output_format: "mp4",
    source: {
      output_format: "mp4",
      width,
      height,
      duration: totalDuration,
      elements,
    },
  };

  log(`Submitting Creatomate render: ${clips.length} clips, ${totalDuration}s total`);

  const CREATOMATE_API_KEY = ENV.CREATOMATE_API_KEY;
  if (!CREATOMATE_API_KEY) throw new Error("CREATOMATE_API_KEY not configured");

  const renderRes = await fetch("https://api.creatomate.com/v1/renders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CREATOMATE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!renderRes.ok) {
    const err = await renderRes.text();
    throw new Error(`Creatomate render error: ${renderRes.status} - ${err}`);
  }

  const renderData = await renderRes.json() as Array<{ id: string }>;
  const renderId = renderData[0]?.id;
  if (!renderId) throw new Error("Creatomate did not return a render ID");
  log(`Creatomate render started: ${renderId}`);

  // Track cost (estimate: 1 credit per second)
  try {
    const { trackCreatomate } = await import("../_core/costTracker");
    await trackCreatomate(userId ?? null, "cinematic_walkthrough", renderId);
  } catch {}

  return await pollCreatomateRender(renderId);
}

async function pollCreatomateRender(renderId: string, maxWaitMs = 600000): Promise<string> {
  const start = Date.now();
  const interval = 10000;
  const CREATOMATE_API_KEY = ENV.CREATOMATE_API_KEY;

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, interval));

    const res = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
      headers: { "Authorization": `Bearer ${CREATOMATE_API_KEY}` },
    });

    if (!res.ok) continue;

    const data = await res.json() as { status: string; url?: string; error_message?: string; error_type?: string };
    log(`Creatomate render ${renderId} status: ${data.status}`);

    if (data.status === "succeeded" && data.url) {
      log(`✓ Creatomate render complete: ${data.url}`);
      return data.url;
    }

    if (data.status === "failed") {
      const detail = data.error_message
        ? ` — ${data.error_message}`
        : data.error_type ? ` (${data.error_type})` : "";
      log(`✗ Creatomate render FAILED for ${renderId}: ${data.error_message ?? data.error_type ?? "unknown"}`);
      throw new Error(`Creatomate render failed${detail}`);
    }
  }

  throw new Error("Creatomate render timed out");
}

// ============================================================
// JOB ID GENERATOR
// ============================================================

function generateJobId(): string {
  return `cw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// ROUTER
// ============================================================

export const cinematicWalkthroughRouter = router({
  /**
   * Get available room type options and their motion prompts
   */
  getRoomTypes: protectedProcedure.query(() => {
    return ROOM_TYPE_OPTIONS.map((key) => ({
      value: key,
      label: key
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      prompt: ROOM_MOTION_PROMPTS[key],
    }));
  }),

  /**
   * Start a cinematic walkthrough generation job.
   * Returns a jobId immediately; poll getJobProgress for updates.
   * Job state is persisted to DB so it survives server restarts.
   */
  generate: protectedProcedure
    .input(
      z.object({
        photos: z
          .array(
            z.object({
              url: z.string().url("Photo URL must be a valid HTTPS URL"),
              roomType: z.string().default("other"),
              customPrompt: z.string().optional(),
              label: z.string().optional(),
            })
          )
          .min(2, "At least 2 photos are required")
          .max(12, "Maximum 12 photos per walkthrough"),
        propertyAddress: z.string().min(1),
        agentName: z.string().optional(),
        agentBrokerage: z.string().optional(),
        musicTrackUrl: z.string().url().optional(),
        enableVoiceover: z.boolean().default(false),
        voiceoverScript: z.string().optional(),
        voiceId: z.string().optional(),
        aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const jobId = generateJobId();

      // Persist job to DB immediately — survives server restarts
      await dbCreateJob(jobId, ctx.user.id, input.photos.length, JSON.stringify(input));
      log(`Job ${jobId} created in DB for user ${ctx.user.id}`);

      // Run generation in background (don't await)
      runWalkthroughJob(jobId, ctx.user.id, input).catch(async (err) => {
        log(`Job ${jobId} top-level failure: ${err.message}`);
        try {
          await dbUpdateJob(jobId, { status: "failed", error: err.message });
        } catch (dbErr: any) {
          log(`Job ${jobId}: Failed to persist error to DB: ${dbErr.message}`);
        }
      });

      return { jobId, totalPhotos: input.photos.length };
    }),

  /**
   * Retry a failed job — creates a new job with the same input snapshot
   */
  retry: protectedProcedure
    .input(z.object({ failedJobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const MAX_RETRIES = 3;
      const failedJob = await dbGetJob(input.failedJobId);
      if (!failedJob || failedJob.userId !== ctx.user.id) {
        throw new Error("Job not found or access denied");
      }
      if (!failedJob.inputSnapshot) {
        throw new Error("No input snapshot available for retry");
      }
      // Enforce retry limit
      const nextRetryCount = (failedJob.retryCount ?? 0) + 1;
      if (nextRetryCount > MAX_RETRIES) {
        throw new Error(`RETRY_LIMIT_REACHED:${MAX_RETRIES}`);
      }
      const originalInput = JSON.parse(failedJob.inputSnapshot);
      const newJobId = generateJobId();
      const database = await getDb();
      // Create new job with incremented retryCount
      await database!.insert(cinematicJobs).values({
        id: newJobId,
        userId: ctx.user.id,
        status: "pending",
        totalPhotos: originalInput.photos.length,
        completedClips: 0,
        inputSnapshot: failedJob.inputSnapshot,
        retryCount: nextRetryCount,
      });
      runWalkthroughJob(newJobId, ctx.user.id, originalInput).catch(async (err) => {
        log(`Retry job ${newJobId} top-level failure: ${err.message}`);
        try {
          await dbUpdateJob(newJobId, { status: "failed", error: err.message });
        } catch {}
      });
      return { jobId: newJobId, totalPhotos: originalInput.photos.length, retryCount: nextRetryCount, maxRetries: MAX_RETRIES };
    }),

  /**
   * Poll job progress — reads from DB, survives server restarts
   */
  getJobProgress: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await dbGetJob(input.jobId);
      if (!job) {
        return { status: "not_found" as const, completedClips: 0, totalPhotos: 0 };
      }
      // Security: only the job owner can poll it
      if (job.userId !== ctx.user.id) {
        return { status: "not_found" as const, completedClips: 0, totalPhotos: 0 };
      }
      return {
        status: job.status,
        totalPhotos: job.totalPhotos,
        completedClips: job.completedClips,
        videoUrl: job.videoUrl ?? undefined,
        error: job.error ?? undefined,
        elapsedMs: Date.now() - new Date(job.createdAt).getTime(),
        retryCount: job.retryCount ?? 0,
      };
    }),

  /**
   * Get the most recent active job for the current user (for job recovery on page load)
   */
  getLatestPendingJob: protectedProcedure
    .query(async ({ ctx }) => {
      const { getDb } = await import("../db");
      const { cinematicJobs } = await import("../../drizzle/schema");
      const { eq, and, desc, inArray } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) return null;
      const rows = await database
        .select()
        .from(cinematicJobs)
        .where(
          and(
            eq(cinematicJobs.userId, ctx.user.id),
            inArray(cinematicJobs.status, ["pending", "generating_clips", "assembling"])
          )
        )
        .orderBy(desc(cinematicJobs.createdAt))
        .limit(1);
      return rows[0] ? { jobId: rows[0].id, status: rows[0].status } : null;
    }),
});

// ============================================================
// BACKGROUND JOB RUNNER
// All state mutations go through dbUpdateJob() — no in-memory state
// ============================================================

async function runWalkthroughJob(
  jobId: string,
  userId: number,
  input: {
    photos: Array<{ url: string; roomType: string; customPrompt?: string; label?: string }>;
    propertyAddress: string;
    agentName?: string;
    agentBrokerage?: string;
    musicTrackUrl?: string;
    enableVoiceover?: boolean;
    voiceoverScript?: string;
    voiceId?: string;
    aspectRatio: "16:9" | "9:16";
  }
) {
  await dbUpdateJob(jobId, { status: "generating_clips" });
  log(`Job ${jobId}: Generating ${input.photos.length} Runway clips...`);

  // Get agent info from persona if not provided
  let agentName = input.agentName;
  let agentBrokerage = input.agentBrokerage;
  if (!agentName) {
    try {
      const persona = await db.getPersonaByUserId(userId);
      agentName = persona?.agentName || "Your Agent";
      agentBrokerage = agentBrokerage || persona?.brokerageName || "";
    } catch {
      agentName = "Your Agent";
    }
  }

  // Generate all Runway clips (sequentially to respect rate limits)
  const clips: Array<{ url: string; roomLabel: string; duration: number }> = [];

  for (let i = 0; i < input.photos.length; i++) {
    const photo = input.photos[i];
    log(`Job ${jobId}: Generating clip ${i + 1}/${input.photos.length} (${photo.roomType})`);

    try {
      const clipUrl = await generateRunwayClip(photo.url, photo.roomType, photo.customPrompt);
      const roomLabel =
        photo.label ||
        photo.roomType
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

      clips.push({ url: clipUrl, roomLabel, duration: 5 });
      await dbUpdateJob(jobId, { completedClips: i + 1 });
      log(`Job ${jobId}: Clip ${i + 1} done ✓`);
    } catch (err: any) {
      log(`Job ${jobId}: Clip ${i + 1} failed: ${err.message} — using fallback static photo`);
      // Fallback: use the original photo as a static clip
      clips.push({
        url: photo.url,
        roomLabel:
          photo.label ||
          photo.roomType
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        duration: 5,
      });
      await dbUpdateJob(jobId, { completedClips: i + 1 });
    }
  }

  // Generate voice-over if requested
  let voiceoverUrl: string | undefined;
  if (input.enableVoiceover && input.voiceoverScript && input.voiceId) {
    try {
      log(`Job ${jobId}: Generating ElevenLabs voice-over...`);
      voiceoverUrl = await generateVoiceover(input.voiceoverScript, input.voiceId);
      log(`Job ${jobId}: Voice-over ready: ${voiceoverUrl}`);
    } catch (err: any) {
      log(`Job ${jobId}: Voice-over failed: ${err.message} — continuing without`);
    }
  }

  // Assemble final video via Creatomate
  await dbUpdateJob(jobId, { status: "assembling" });
  log(`Job ${jobId}: Assembling final video via Creatomate...`);

  const videoUrl = await assembleCreatomateVideo({
    clips,
    propertyAddress: input.propertyAddress,
    agentName: agentName!,
    agentBrokerage,
    musicTrackUrl: input.musicTrackUrl,
    voiceoverUrl,
    aspectRatio: input.aspectRatio,
    userId,
  });

  // Save to My Videos library
  try {
    const database = await getDb();
    await database!.insert(generatedVideos).values({
      userId,
      title: `Cinematic Walkthrough — ${input.propertyAddress}`,
      videoUrl,
      thumbnailUrl: input.photos[0]?.url,
      type: "property_tour",
      status: "completed",
      hasVoiceover: !!voiceoverUrl,
      creditsCost: input.photos.length * 5,
      metadata: JSON.stringify({ address: input.propertyAddress, mode: "cinematic_walkthrough" }),
    });
    log(`Job ${jobId}: Saved to My Videos library ✓`);
  } catch (err: any) {
    log(`Job ${jobId}: Failed to save to My Videos: ${err.message}`);
  }

  // Mark job as done with final video URL — this is what the frontend polls for
  await dbUpdateJob(jobId, { status: "done", videoUrl });
  log(`Job ${jobId}: ✓ Complete! Video: ${videoUrl}`);

  // Send email notification to the agent
  try {
    const database = await getDb();
    const userRows = await database!.select().from(
      (await import("../../drizzle/schema")).users
    ).where(eq((await import("../../drizzle/schema")).users.id, userId)).limit(1);
    const userRecord = userRows[0];
    if (userRecord?.email) {
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: `🎬 Cinematic Walkthrough Ready — ${input.propertyAddress}`,
        content: `Hi ${userRecord.name || "Agent"},\n\nYour AI Cinematic Walkthrough for ${input.propertyAddress} is ready!\n\nWatch and download your video here:\n${videoUrl}\n\nLog in to Authority Content to view it in your library.\n\nBest,\nAuthority Content`,
      });
      log(`Job ${jobId}: Email notification sent to ${userRecord.email} ✓`);
    }
  } catch (err: any) {
    log(`Job ${jobId}: Email notification failed (non-critical): ${err.message}`);
  }
}

// ============================================================
// ELEVENLABS VOICE-OVER HELPER
// ============================================================

async function generateVoiceover(script: string, voiceId: string): Promise<string> {
  const { storagePut } = await import("../storage");

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": ENV.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: script,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs error: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const key = `voiceovers/cw_${Date.now()}.mp3`;
  const { url } = await storagePut(key, buffer, "audio/mpeg");
  return url;
}
