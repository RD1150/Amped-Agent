import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { getDb } from "../db";
import { generatedVideos, cinematicJobs } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import * as fs from "fs";

function log(msg: string) {
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
// RUNWAY API HELPERS (using gen4_turbo for best quality)
// ============================================================

async function generateRunwayClip(
  imageUrl: string,
  roomType: string,
  customPrompt?: string
): Promise<string> {
  const promptText = customPrompt || ROOM_MOTION_PROMPTS[roomType] || ROOM_MOTION_PROMPTS.other;

  log(`Generating Runway clip for room: ${roomType}, prompt: ${promptText.substring(0, 60)}...`);

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

  if (!response.ok) {
    const err = await response.text();
    log(`Runway API error ${response.status}: ${err}`);
    throw new Error(`Runway API error: ${response.status} - ${err}`);
  }

  const task = await response.json() as { id: string };
  log(`Runway task created: ${task.id}`);

  return await pollRunwayTask(task.id);
}

async function pollRunwayTask(taskId: string, maxWaitMs = 300000): Promise<string> {
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

  throw new Error("Runway generation timed out after 5 minutes");
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
  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0) + 3;

  // Build Creatomate elements
  const elements: any[] = [];
  let currentTime = 0;

  // Video clips with room labels
  for (const clip of clips) {
    // Main video clip
    elements.push({
      type: "video",
      source: clip.url,
      time: currentTime,
      duration: clip.duration,
      animations: [
        { time: 0, duration: 0.5, easing: "linear", type: "fade", fade: "in" },
        { time: clip.duration - 0.5, duration: 0.5, easing: "linear", type: "fade", fade: "out" },
      ],
    });

    // Room label overlay
    elements.push({
      type: "text",
      text: clip.roomLabel,
      time: currentTime + 0.5,
      duration: 2.5,
      x_alignment: "0%",
      y_alignment: "85%",
      x: "8%",
      font_family: "Georgia",
      font_size: aspectRatio === "16:9" ? "36 vmin" : "28 vmin",
      font_color: "#ffffff",
      shadow_color: "rgba(0,0,0,0.8)",
      shadow_blur: "8px",
      animations: [
        { time: 0, duration: 0.4, easing: "ease-out", type: "fade", fade: "in" },
        { time: 2.1, duration: 0.4, easing: "ease-in", type: "fade", fade: "out" },
      ],
    });

    currentTime += clip.duration - 0.5;
  }

  // Outro card
  elements.push({
    type: "composition",
    time: totalDuration - 3,
    duration: 3,
    width: "100%",
    height: "100%",
    fill_color: "rgba(0,0,0,0.85)",
    animations: [{ time: 0, duration: 0.5, easing: "ease-out", type: "fade", fade: "in" }],
    elements: [
      {
        type: "text",
        text: "Presented by",
        y_alignment: "40%",
        x_alignment: "50%",
        font_family: "Georgia",
        font_size: "18 vmin",
        font_color: "#c9a84c",
        letter_spacing: "3px",
      },
      {
        type: "text",
        text: agentName,
        y_alignment: "50%",
        x_alignment: "50%",
        font_family: "Georgia",
        font_size: "32 vmin",
        font_color: "#ffffff",
        font_weight: "700",
      },
      ...(agentBrokerage ? [{
        type: "text",
        text: agentBrokerage,
        y_alignment: "60%",
        x_alignment: "50%",
        font_family: "Georgia",
        font_size: "18 vmin",
        font_color: "#aaaaaa",
      }] : []),
      {
        type: "text",
        text: propertyAddress,
        y_alignment: "72%",
        x_alignment: "50%",
        font_family: "Georgia",
        font_size: "14 vmin",
        font_color: "#c9a84c",
        letter_spacing: "1px",
      },
    ],
  });

  // Audio tracks
  if (musicTrackUrl) {
    elements.push({
      type: "audio",
      source: musicTrackUrl,
      time: 0,
      duration: totalDuration,
      volume: voiceoverUrl ? 0.2 : 0.5,
    });
  }

  if (voiceoverUrl) {
    elements.push({
      type: "audio",
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

    const data = await res.json() as { status: string; url?: string };
    log(`Creatomate render ${renderId} status: ${data.status}`);

    if (data.status === "succeeded" && data.url) {
      log(`✓ Creatomate render complete: ${data.url}`);
      return data.url;
    }

    if (data.status === "failed") {
      throw new Error("Creatomate render failed");
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
      const failedJob = await dbGetJob(input.failedJobId);
      if (!failedJob || failedJob.userId !== ctx.user.id) {
        throw new Error("Job not found or access denied");
      }
      if (!failedJob.inputSnapshot) {
        throw new Error("No input snapshot available for retry");
      }
      const originalInput = JSON.parse(failedJob.inputSnapshot);
      const newJobId = generateJobId();
      await dbCreateJob(newJobId, ctx.user.id, originalInput.photos.length, failedJob.inputSnapshot);
      runWalkthroughJob(newJobId, ctx.user.id, originalInput).catch(async (err) => {
        log(`Retry job ${newJobId} top-level failure: ${err.message}`);
        try {
          await dbUpdateJob(newJobId, { status: "failed", error: err.message });
        } catch {}
      });
      return { jobId: newJobId, totalPhotos: originalInput.photos.length };
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
      };
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
      model_id: "eleven_monolingual_v1",
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
