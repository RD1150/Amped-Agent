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

// Base prompts define the room's character. Direction (L→R or R→L) is injected
// at call time based on clip index so consecutive rooms always pan opposite ways,
// creating the physical sensation of turning through doorways.
const ROOM_MOTION_PROMPTS: Record<string, { ltr: string; rtl: string; tilt?: string }> = {
  exterior_front: {
    ltr: "Smooth cinematic tilt upward from the front driveway slowly revealing the full facade and roofline, steady and majestic",
    rtl: "Smooth cinematic tilt upward from the front driveway slowly revealing the full facade and roofline, steady and majestic",
    tilt: "Smooth cinematic tilt upward from the front driveway slowly revealing the full facade and roofline, steady and majestic",
  },
  exterior_back: {
    ltr: "Wide tracking shot panning steadily left to right across the entire backyard, lush landscaping in foreground, smooth and cinematic",
    rtl: "Wide tracking shot panning steadily right to left across the entire backyard, lush landscaping in foreground, smooth and cinematic",
  },
  living_room: {
    ltr: "Smooth lateral tracking shot moving left to right across the living room, revealing the full space and windows, warm natural light, steady cinematic movement",
    rtl: "Smooth lateral tracking shot moving right to left across the living room, revealing the full space and windows, warm natural light, steady cinematic movement",
  },
  kitchen: {
    ltr: "Smooth tracking shot moving left to right along the kitchen island and countertops, bright and airy, revealing appliances and cabinetry",
    rtl: "Smooth tracking shot moving right to left along the kitchen island and countertops, bright and airy, revealing appliances and cabinetry",
  },
  dining_room: {
    ltr: "Lateral tracking shot panning left to right to reveal the full dining table and room, elegant and inviting, smooth camera movement",
    rtl: "Lateral tracking shot panning right to left to reveal the full dining table and room, elegant and inviting, smooth camera movement",
  },
  master_bedroom: {
    ltr: "Slow lateral pan left to right across the master bedroom, revealing the bed and windows, soft morning light, serene and luxurious",
    rtl: "Slow lateral pan right to left across the master bedroom, revealing the bed and windows, soft morning light, serene and luxurious",
  },
  bedroom: {
    ltr: "Smooth pan left to right from the doorway revealing the full bedroom, natural light, calm and inviting",
    rtl: "Smooth pan right to left from the doorway revealing the full bedroom, natural light, calm and inviting",
  },
  master_bathroom: {
    ltr: "Slow tracking shot panning left to right across the vanity and into the bathroom, spa-like atmosphere, bright and clean",
    rtl: "Slow tracking shot panning right to left across the vanity and into the bathroom, spa-like atmosphere, bright and clean",
  },
  bathroom: {
    ltr: "Smooth pan left to right revealing the bathroom fixtures, clean and bright, steady camera movement",
    rtl: "Smooth pan right to left revealing the bathroom fixtures, clean and bright, steady camera movement",
  },
  office: {
    ltr: "Lateral tracking shot panning left to right across the home office, revealing the desk and built-ins, professional and focused",
    rtl: "Lateral tracking shot panning right to left across the home office, revealing the desk and built-ins, professional and focused",
  },
  garage: {
    ltr: "Wide lateral pan left to right across the garage interior, clean and spacious, smooth cinematic movement",
    rtl: "Wide lateral pan right to left across the garage interior, clean and spacious, smooth cinematic movement",
  },
  pool: {
    ltr: "Smooth low-angle tracking shot panning left to right along the pool edge, water shimmering in sunlight, resort-style feel",
    rtl: "Smooth low-angle tracking shot panning right to left along the pool edge, water shimmering in sunlight, resort-style feel",
  },
  view: {
    ltr: "Slow cinematic pan left to right across the panoramic view, wide and breathtaking, steady and majestic",
    rtl: "Slow cinematic pan right to left across the panoramic view, wide and breathtaking, steady and majestic",
  },
  other: {
    ltr: "Smooth lateral tracking shot panning left to right through the space, steady and professional, revealing the full room",
    rtl: "Smooth lateral tracking shot panning right to left through the space, steady and professional, revealing the full room",
  },
};

// Returns the motion prompt for a given room type and clip index.
// Even-indexed clips pan L→R, odd-indexed clips pan R→L — alternating
// direction creates the physical sensation of turning through doorways.
// isExterior: agent-tagged exterior shots always use tilt-up regardless of room type.
function getMotionPrompt(roomType: string, clipIndex: number, customPrompt?: string, isExterior?: boolean): string {
  if (customPrompt) return customPrompt;
  const prompts = ROOM_MOTION_PROMPTS[roomType] ?? ROOM_MOTION_PROMPTS.other;
  // Exterior front room type OR explicit isExterior tag → always tilt-up
  if (isExterior || (prompts.tilt && roomType === "exterior_front")) {
    return prompts.tilt ?? ROOM_MOTION_PROMPTS.exterior_front.tilt!;
  }
  return clipIndex % 2 === 0 ? prompts.ltr : prompts.rtl;
}

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
  clipIndex: number,
  customPrompt?: string,
  attempt = 1,
  isExterior?: boolean
): Promise<string> {
  const promptText = getMotionPrompt(roomType, clipIndex, customPrompt, isExterior);

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
      return generateRunwayClip(imageUrl, roomType, clipIndex, customPrompt, attempt + 1);
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
  clips: Array<{ url: string; roomLabel: string; duration: number; roomType: string }>;
  propertyAddress: string;
  agentName: string;
  agentBrokerage?: string;
  agentPhone?: string;
  agentAvatarUrl?: string;
  musicTrackUrl?: string;
  voiceoverUrl?: string;
  aspectRatio: "16:9" | "9:16";
  luxuryMode?: boolean;
  letterboxMode?: boolean;
  userId?: number | null;
}): Promise<string> {
  const { clips, propertyAddress, agentName, agentBrokerage, agentPhone, agentAvatarUrl, musicTrackUrl, voiceoverUrl, aspectRatio, luxuryMode, letterboxMode, userId } = opts;

  const [width, height] = aspectRatio === "16:9" ? [1920, 1080] : [1080, 1920];

  // Build Creatomate elements
  // BLACK SCREEN FIX: Use a single track (track 1) for all video clips placed
  // sequentially. Creatomate's single-track mode renders clips back-to-back with
  // no gaps. Cross-fades are achieved via animations on the clip itself.
  // A solid black background on track 0 ensures no transparent gaps show through.
  const elements: any[] = [];

  // CROSSFADE: Each clip overlaps the previous by FADE seconds so the fade-out of
  // one clip and the fade-in of the next happen simultaneously — no black gap.
  const FADE = 0.5; // crossfade duration in seconds
  const clipsDuration = clips.reduce((sum, c) => sum + c.duration, 0)
    - FADE * Math.max(0, clips.length - 1); // subtract overlaps
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

  // Tracks 2+: Each clip is placed on its OWN track so they can overlap in time.
  // Clip N starts FADE seconds before clip N-1 ends, creating a true crossfade
  // with no black gap — the fade-out and fade-in happen simultaneously.
  let currentTime = 0;
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const isFirst = i === 0;
    const isLast = i === clips.length - 1;

    // Alternating pan direction: even clips pan L→R, odd clips pan R→L
    // Exterior front gets a tilt-up (driveway → roofline) instead of a horizontal pan
    const isExteriorFront = clip.roomType === "exterior_front";
    const panAnim = isExteriorFront
      ? { type: "pan", time: 0, duration: clip.duration, easing: "linear", y_start: "5%", y_end: "-5%" }
      : i % 2 === 0
        ? { type: "pan", time: 0, duration: clip.duration, easing: "linear", x_start: "-5%", x_end: "5%" }
        : { type: "pan", time: 0, duration: clip.duration, easing: "linear", x_start: "5%", x_end: "-5%" };
    elements.push({
      type: "video",
      source: clip.url,
      track: i + 2, // each clip on its own track so overlaps render correctly
      time: currentTime,
      duration: clip.duration,
      fill_mode: "cover",
      width: "110%",
      height: "110%",
      volume: 0,
      animations: [
        // Fade in on all clips (crossfades from previous for non-first clips)
        { time: 0, duration: FADE, easing: "ease-in-out", type: "fade", fade: true },
        // Fade out only on the last clip; middle clips let the next clip's fade-in cover the transition
        ...(isLast ? [{ time: clip.duration - FADE, duration: FADE, easing: "ease-in-out", type: "fade", fade: true, reversed: true }] : []),
        // Pan animation for walkthrough feel (validated against Creatomate API)
        panAnim,
      ],
    });

    // Room label — appears after fade-in, disappears before next clip starts
    const labelDuration = Math.min(2.5, clip.duration - FADE * 2 - 0.2);
    if (labelDuration > 0.5) {
      elements.push({
        type: "text",
        track: 100 + i, // high track numbers to stay above video tracks
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
          { time: 0, duration: 0.3, easing: "ease-out", type: "fade", fade: true },
          { time: labelDuration - 0.3, duration: 0.3, easing: "ease-in", type: "fade", fade: true, reversed: true },
        ],
      });
    }

    // Advance time by clip duration minus FADE to create the overlap
    currentTime += clip.duration - (isLast ? 0 : FADE);
  }

  // Letterbox mode: 2.35:1 cinematic crop — black bars top and bottom
  // Enabled when luxuryMode is on OR letterboxMode is explicitly set
  if ((luxuryMode || letterboxMode) && aspectRatio === "16:9") {
    const barHeight = "13.5%";
    // Top bar
    elements.push({
      type: "shape",
      track: 150,
      time: 0,
      duration: totalDuration,
      x: "50%",
      y: "0%",
      y_anchor: "0%",
      width: "100%",
      height: barHeight,
      fill_color: "#000000",
    });
    // Bottom bar
    elements.push({
      type: "shape",
      track: 150,
      time: 0,
      duration: totalDuration,
      x: "50%",
      y: "100%",
      y_anchor: "100%",
      width: "100%",
      height: barHeight,
      fill_color: "#000000",
    });
  }

  // Outro card — solid dark overlay with agent branding
  // TRACK SAFETY: clips use tracks 2...(clips.length+1), max track 13 for 12 photos.
  // Outro uses tracks 20-26 to never collide with clip tracks.
  const outroStart = clipsDuration;
  elements.push({
    type: "shape",
    track: 20,
    time: outroStart,
    duration: OUTRO_DURATION,
    x: "50%",
    y: "50%",
    width: "100%",
    height: "100%",
    fill_color: "#0d1b2a",
    animations: [{ time: 0, duration: 0.6, easing: "ease-out", type: "fade", fade: true }],
  });

  // Gold accent line on outro
  elements.push({
    type: "shape",
    track: 21,
    time: outroStart + 0.3,
    duration: OUTRO_DURATION - 0.3,
    x: "50%",
    y: "35%",
    width: "30%",
    height: "0.4%",
    fill_color: "#c9a84c",
    animations: [{ time: 0, duration: 0.4, easing: "ease-out", type: "fade", fade: true }],
  });

  // Agent headshot on outro (circular, left of center when present)
  const hasHeadshot = !!agentAvatarUrl;
  const outroTextX = hasHeadshot ? (aspectRatio === "16:9" ? "58%" : "55%") : "50%";
  if (hasHeadshot) {
    elements.push({
      type: "image",
      track: 22,
      time: outroStart + 0.2,
      duration: OUTRO_DURATION - 0.2,
      source: agentAvatarUrl,
      x: aspectRatio === "16:9" ? "30%" : "28%",
      y: "52%",
      width: aspectRatio === "16:9" ? "12%" : "18%",
      height: aspectRatio === "16:9" ? "22%" : "14%",
      fill_mode: "cover",
      border_radius: "9999px",
      animations: [{ time: 0, duration: 0.5, easing: "ease-out", type: "fade", fade: true }],
    });
  }

  elements.push({
    type: "text",
    track: 23,
    time: outroStart + 0.4,
    duration: OUTRO_DURATION - 0.4,
    text: "Presented by",
    x: outroTextX,
    y: "42%",
    font_family: "Georgia",
    font_size: aspectRatio === "16:9" ? "2.5 vmin" : "3.5 vmin",
    fill_color: "#c9a84c",
    text_align: "center",
    letter_spacing: "2%",
    animations: [{ time: 0, duration: 0.4, easing: "ease-out", type: "fade", fade: true }],
  });

  elements.push({
    type: "text",
    track: 24,
    time: outroStart + 0.5,
    duration: OUTRO_DURATION - 0.5,
    text: agentName,
    x: outroTextX,
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
      track: 25,
      time: outroStart + 0.6,
      duration: OUTRO_DURATION - 0.6,
      text: agentBrokerage,
      x: outroTextX,
      y: "62%",
      font_family: "Georgia",
      font_size: aspectRatio === "16:9" ? "2 vmin" : "3 vmin",
      fill_color: "#aaaaaa",
      text_align: "center",
      animations: [{ time: 0, duration: 0.4, easing: "ease-out", type: "fade", fade: true }],
    });
  }

  if (agentPhone) {
    elements.push({
      type: "text",
      track: 26,
      time: outroStart + 0.65,
      duration: OUTRO_DURATION - 0.65,
      text: agentPhone,
      x: outroTextX,
      y: agentBrokerage ? "71%" : "64%",
      font_family: "Montserrat",
      font_size: aspectRatio === "16:9" ? "2 vmin" : "3 vmin",
      fill_color: "#ffffff",
      text_align: "center",
      animations: [{ time: 0, duration: 0.4, easing: "ease-out", type: "fade", fade: true }],
    });
  }
  elements.push({
    type: "text",
    track: 27,
    time: outroStart + 0.7,
    duration: OUTRO_DURATION - 0.7,
    text: propertyAddress,
    x: outroTextX,
    y: agentBrokerage ? (agentPhone ? "82%" : "72%") : (agentPhone ? "75%" : "65%"),
    font_family: "Georgia",
    font_size: aspectRatio === "16:9" ? "1.8 vmin" : "2.8 vmin",
    fill_color: "#c9a84c",
    text_align: "center",
    letter_spacing: "1%",
    animations: [{ time: 0, duration: 0.4, easing: "ease-out", type: "fade", fade: true }],
  });

  // Audio tracks
  // Audio tracks use high track numbers (200+) to never collide with video clip tracks
  // (which occupy tracks i+2, i.e. up to track ~14 for 12 photos) or label tracks (100+).
  if (musicTrackUrl) {
    elements.push({
      type: "audio",
      track: 200,
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
      track: 201,
      source: voiceoverUrl,
      time: 0,
      duration: totalDuration,
      volume: 1.0,
    });
  }

  // Creatomate requires a `source` object for dynamic (template-free) renders.
  // Passing elements at the top level causes a 400 "template_id must be provided" error.
  const CREATOMATE_API_KEY = ENV.CREATOMATE_API_KEY;
  if (!CREATOMATE_API_KEY) throw new Error("CREATOMATE_API_KEY not configured");

  // Luxury mode + 16:9: submit BOTH 16:9 and 9:16 in a single Creatomate call
  // Creatomate supports an array of render objects in one request
  const renders: any[] = [{
    output_format: "mp4",
    source: { output_format: "mp4", width, height, duration: totalDuration, elements },
  }];

  if (luxuryMode && aspectRatio === "16:9") {
    // Build a 9:16 version of the same elements (no letterbox bars, adjusted text positions)
    const vertElements = elements.filter((el: any) => el.track !== 150); // remove letterbox bars
    renders.push({
      output_format: "mp4",
      source: { output_format: "mp4", width: 1080, height: 1920, duration: totalDuration, elements: vertElements },
    });
  }

  log(`Submitting Creatomate render: ${clips.length} clips, ${totalDuration}s total${luxuryMode ? " (luxury mode — dual output)" : ""}`);

  const renderRes = await fetch("https://api.creatomate.com/v1/renders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CREATOMATE_API_KEY}`,
    },
    body: JSON.stringify(renders.length === 1 ? renders[0] : renders),
  });

  if (!renderRes.ok) {
    const err = await renderRes.text();
    throw new Error(`Creatomate render error: ${renderRes.status} - ${err}`);
  }

  const renderData = await renderRes.json() as Array<{ id: string }>;
  const renderId = Array.isArray(renderData) ? renderData[0]?.id : (renderData as any).id;
  if (!renderId) throw new Error("Creatomate did not return a render ID");
  log(`Creatomate render started: ${renderId}`);

  // Track cost (estimate: 1 credit per second)
  try {
    const { trackCreatomate } = await import("../_core/costTracker");
    await trackCreatomate(userId ?? null, "cinematic_walkthrough", renderId);
  } catch {}

  // For luxury dual-output, return both URLs separated by newline
  if (luxuryMode && aspectRatio === "16:9" && Array.isArray(renderData) && renderData.length > 1) {
    const [url1, url2] = await Promise.all([
      pollCreatomateRender(renderData[0].id),
      pollCreatomateRender(renderData[1].id),
    ]);
    return `${url1}|||${url2}`; // caller splits on ||| to get both URLs
  }

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
      prompt: ROOM_MOTION_PROMPTS[key]?.ltr ?? "",
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
              isExterior: z.boolean().optional(), // forces tilt-up motion regardless of room type
            })
          )
          .min(2, "At least 2 photos are required")
          .max(12, "Maximum 12 photos per walkthrough"),
        propertyAddress: z.string().min(1),
        agentName: z.string().optional(),
        agentBrokerage: z.string().optional(),
        agentPhone: z.string().optional(),
        musicTrackUrl: z.string().url().optional(),
        enableVoiceover: z.boolean().default(false),
        voiceoverScript: z.string().optional(),
        voiceId: z.string().optional(),
        aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
        luxuryMode: z.boolean().default(false),
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
    photos: Array<{ url: string; roomType: string; customPrompt?: string; label?: string; isExterior?: boolean }>;
     propertyAddress: string;
    agentName?: string;
    agentBrokerage?: string;
    agentPhone?: string;
    musicTrackUrl?: string;
    enableVoiceover?: boolean;
    voiceoverScript?: string;
    voiceId?: string;
    aspectRatio: "16:9" | "9:16";
    luxuryMode?: boolean;
  }
) {
  await dbUpdateJob(jobId, { status: "generating_clips" });
  log(`Job ${jobId}: Generating ${input.photos.length} Runway clips...`);
  // Get agent info from persona if not provided
  let agentName = input.agentName;
  let agentBrokerage = input.agentBrokerage;
  let agentAvatarUrl: string | undefined;
  if (!agentName) {
    try {
      const persona = await db.getPersonaByUserId(userId);
      agentName = persona?.agentName || "Your Agent";
      agentBrokerage = agentBrokerage || persona?.brokerageName || "";
    } catch {
      agentName = "Your Agent";
    }
  }
  // Fetch agent avatar for luxury outro headshot
  try {
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const database = await getDb();
    if (database) {
      const rows = await database.select({ avatarImageUrl: users.avatarImageUrl }).from(users).where(eq(users.id, userId)).limit(1);
      agentAvatarUrl = rows[0]?.avatarImageUrl ?? undefined;
    }
  } catch { /* non-critical */ }

  // Generate all Runway clips (sequentially to respect rate limits)
  const clips: Array<{ url: string; roomLabel: string; duration: number; roomType: string }> = [];

  for (let i = 0; i < input.photos.length; i++) {
    const photo = input.photos[i];
    log(`Job ${jobId}: Generating clip ${i + 1}/${input.photos.length} (${photo.roomType})`);

    try {
      const clipUrl = await generateRunwayClip(photo.url, photo.roomType, i, photo.customPrompt, 1, photo.isExterior);
      const roomLabel =
        photo.label ||
        photo.roomType
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

      clips.push({ url: clipUrl, roomLabel, duration: 5, roomType: photo.roomType });
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
        roomType: photo.roomType,
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
    agentPhone: input.agentPhone,
    agentAvatarUrl,
    musicTrackUrl: input.musicTrackUrl,
    voiceoverUrl,
    aspectRatio: input.aspectRatio,
    luxuryMode: input.luxuryMode,
    userId,
  });

  // Parse dual-output URLs (luxury mode returns "url1|||url2")
  const [primaryVideoUrl, secondaryVideoUrl] = videoUrl.includes("|||") ? videoUrl.split("|||") : [videoUrl, undefined];
  // Save to My Videos library
  try {
    const database = await getDb();
    await database!.insert(generatedVideos).values({
      userId,
      title: `Cinematic Walkthrough — ${input.propertyAddress}`,
      videoUrl: primaryVideoUrl,
      secondaryVideoUrl: secondaryVideoUrl ?? null,
      thumbnailUrl: input.photos[0]?.url,
      type: "property_tour",
      status: "completed",
      hasVoiceover: !!voiceoverUrl,
      creditsCost: input.photos.length * 5,
      metadata: JSON.stringify({ address: input.propertyAddress, mode: "cinematic_walkthrough", luxuryMode: !!input.luxuryMode }),
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
