import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { getDb } from "../db";
import { generatedVideos } from "../../drizzle/schema";
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

  // Poll for completion
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
// SHOTSTACK ASSEMBLY
// Stitches all clips into a final walkthrough video
// ============================================================

async function assembleShotstackVideo(opts: {
  clips: Array<{ url: string; roomLabel: string; duration: number }>;
  propertyAddress: string;
  agentName: string;
  agentBrokerage?: string;
  musicTrackUrl?: string;
  voiceoverUrl?: string;
  aspectRatio: "16:9" | "9:16";
}): Promise<string> {
  const { clips, propertyAddress, agentName, agentBrokerage, musicTrackUrl, voiceoverUrl, aspectRatio } = opts;

  const [width, height] = aspectRatio === "16:9" ? [1280, 720] : [720, 1280];
  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0) + 3; // +3 for outro

  // Build clip tracks
  let currentTime = 0;
  const videoClips = clips.map((clip) => {
    const item = {
      asset: { type: "video", src: clip.url },
      start: currentTime,
      length: clip.duration,
      transition: { in: "fade", out: "fade" },
    };
    currentTime += clip.duration - 0.5; // 0.5s overlap for smooth transitions
    return item;
  });

  // Room label overlays
  let labelTime = 0;
  const labelOverlays = clips.map((clip) => {
    const item = {
      asset: {
        type: "html",
        html: `<p style="font-family: 'Georgia', serif; font-size: 28px; color: white; text-shadow: 2px 2px 8px rgba(0,0,0,0.8); letter-spacing: 1px;">${clip.roomLabel}</p>`,
        width: 600,
        height: 60,
      },
      start: labelTime + 0.5,
      length: 2.5,
      position: "bottomLeft",
      offset: { x: 0.05, y: 0.08 },
      transition: { in: "fade", out: "fade" },
    };
    labelTime += clip.duration - 0.5;
    return item;
  });

  // Outro card
  const outroCard = {
    asset: {
      type: "html",
      html: `<div style="background: rgba(0,0,0,0.85); padding: 40px; text-align: center; font-family: 'Georgia', serif;">
        <p style="color: #c9a84c; font-size: 18px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px;">Presented by</p>
        <p style="color: white; font-size: 32px; font-weight: bold; margin-bottom: 4px;">${agentName}</p>
        ${agentBrokerage ? `<p style="color: #aaa; font-size: 18px;">${agentBrokerage}</p>` : ""}
        <p style="color: #c9a84c; font-size: 14px; margin-top: 16px; letter-spacing: 1px;">${propertyAddress}</p>
      </div>`,
      width,
      height,
    },
    start: totalDuration - 3,
    length: 3,
    transition: { in: "fade" },
  };

  const tracks: any[] = [
    { clips: videoClips },
    { clips: [...labelOverlays, outroCard] },
  ];

  // Music track
  if (musicTrackUrl) {
    tracks.push({
      clips: [{
        asset: { type: "audio", src: musicTrackUrl, volume: voiceoverUrl ? 0.2 : 0.5 },
        start: 0,
        length: totalDuration,
      }],
    });
  }

  // Voice-over track
  if (voiceoverUrl) {
    tracks.push({
      clips: [{
        asset: { type: "audio", src: voiceoverUrl, volume: 1.0 },
        start: 0,
        length: totalDuration,
      }],
    });
  }

  const payload = {
    timeline: {
      background: "#000000",
      tracks,
    },
    output: {
      format: "mp4",
      resolution: aspectRatio === "16:9" ? "hd" : "sd",
      aspectRatio,
    },
  };

  log(`Submitting Shotstack render: ${clips.length} clips, ${totalDuration}s total`);

  const renderRes = await fetch(`${ENV.SHOTSTACK_HOST}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ENV.SHOTSTACK_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!renderRes.ok) {
    const err = await renderRes.text();
    throw new Error(`Shotstack render error: ${renderRes.status} - ${err}`);
  }

  const renderData = await renderRes.json() as { response: { id: string } };
  const renderId = renderData.response.id;
  log(`Shotstack render started: ${renderId}`);

  return await pollShotstackRender(renderId);
}

async function pollShotstackRender(renderId: string, maxWaitMs = 600000): Promise<string> {
  const start = Date.now();
  const interval = 10000;

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, interval));

    const res = await fetch(`${ENV.SHOTSTACK_HOST}/render/${renderId}`, {
      headers: { "x-api-key": ENV.SHOTSTACK_API_KEY },
    });

    if (!res.ok) continue;

    const data = await res.json() as { response: { status: string; url?: string } };
    const { status, url } = data.response;
    log(`Shotstack render ${renderId} status: ${status}`);

    if (status === "done" && url) {
      log(`✓ Shotstack render complete: ${url}`);
      return url;
    }

    if (status === "failed") {
      throw new Error("Shotstack render failed");
    }
  }

  throw new Error("Shotstack render timed out");
}

// ============================================================
// IN-MEMORY JOB STORE (for progress tracking)
// ============================================================

interface WalkthroughJob {
  status: "pending" | "generating_clips" | "assembling" | "done" | "failed";
  totalPhotos: number;
  completedClips: number;
  videoUrl?: string;
  error?: string;
  startedAt: number;
}

const walkthroughJobs = new Map<string, WalkthroughJob>();

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
              label: z.string().optional(), // Display label for the room
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

      walkthroughJobs.set(jobId, {
        status: "pending",
        totalPhotos: input.photos.length,
        completedClips: 0,
        startedAt: Date.now(),
      });

      // Run generation in background (don't await)
      runWalkthroughJob(jobId, ctx.user.id, input).catch((err) => {
        log(`Job ${jobId} failed: ${err.message}`);
        const job = walkthroughJobs.get(jobId);
        if (job) {
          job.status = "failed";
          job.error = err.message;
        }
      });

      return { jobId, totalPhotos: input.photos.length };
    }),

  /**
   * Poll job progress
   */
  getJobProgress: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ input }) => {
      const job = walkthroughJobs.get(input.jobId);
      if (!job) {
        return { status: "not_found" as const, completedClips: 0, totalPhotos: 0 };
      }
      return {
        status: job.status,
        totalPhotos: job.totalPhotos,
        completedClips: job.completedClips,
        videoUrl: job.videoUrl,
        error: job.error,
        elapsedMs: Date.now() - job.startedAt,
      };
    }),
});

// ============================================================
// BACKGROUND JOB RUNNER
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
  const job = walkthroughJobs.get(jobId)!;
  job.status = "generating_clips";

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
      job.completedClips = i + 1;
      log(`Job ${jobId}: Clip ${i + 1} done ✓`);
    } catch (err: any) {
      log(`Job ${jobId}: Clip ${i + 1} failed: ${err.message} — using fallback Ken Burns`);
      // Fallback: use the original photo as a static clip via Shotstack Ken Burns
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
      job.completedClips = i + 1;
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

  // Assemble final video via Shotstack
  job.status = "assembling";
  log(`Job ${jobId}: Assembling final video via Shotstack...`);

  const videoUrl = await assembleShotstackVideo({
    clips,
    propertyAddress: input.propertyAddress,
    agentName: agentName!,
    agentBrokerage,
    musicTrackUrl: input.musicTrackUrl,
    voiceoverUrl,
    aspectRatio: input.aspectRatio,
  });

  // Save to My Videos
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
  } catch (err: any) {
    log(`Job ${jobId}: Failed to save to My Videos: ${err.message}`);
  }

  job.status = "done";
  job.videoUrl = videoUrl;
  log(`Job ${jobId}: ✓ Complete! Video: ${videoUrl}`);
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
