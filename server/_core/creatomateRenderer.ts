/**
 * Creatomate Video Renderer
 * Replaces Shotstack for all video generation (AutoReels + Property Tours).
 *
 * API docs: https://creatomate.com/docs/api/render-script/element-properties
 * All renders use RenderScript (pure JSON) — no templates required.
 */

import { ENV } from "./env";
import { trackCreatomate } from "./costTracker";

const CREATOMATE_API_URL = "https://api.creatomate.com/v1/renders";

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface RenderResult {
  renderId: string;
  status: "queued" | "rendering" | "done" | "failed";
  url?: string;
  error?: string;
}

export interface RenderStatusResult {
  status: "queued" | "rendering" | "done" | "failed" | "planned" | "waiting";
  url?: string;
  thumbnail?: string;
  poster?: string;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = ENV.CREATOMATE_API_KEY;
  if (!key) throw new Error("CREATOMATE_API_KEY is not configured. Please add it in Settings → Secrets.");
  return key;
}

async function submitRender(renderScript: object): Promise<string> {
  const apiKey = getApiKey();

  // Creatomate API requires the composition to be wrapped in a "source" field
  const payload = { source: renderScript };

  const response = await fetch(CREATOMATE_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Creatomate] API error:", response.status, errorText);
    throw new Error(`Creatomate API error ${response.status}: ${errorText.substring(0, 300)}`);
  }

  const results = await response.json();
  // Creatomate returns an array of render objects
  const render = Array.isArray(results) ? results[0] : results;
  if (!render?.id) throw new Error("Creatomate returned no render ID");

  console.log("[Creatomate] Render queued:", render.id);
  return render.id;
}

// ─── Ken Burns Animation Helpers ─────────────────────────────────────────────

type KenBurnsPreset =
  | "zoom-in"
  | "zoom-out"
  | "pan-right"
  | "pan-left"
  | "pan-up"
  | "pan-down"
  | "zoom-in-pan-right"
  | "zoom-out-pan-left"
  | "diagonal";

/**
 * Build Creatomate `animations` array for a Ken Burns effect on an image element.
 * Combines scale + x/y position keyframes for smooth cinematic motion.
 */
function kenBurnsAnimations(preset: KenBurnsPreset, duration: number): object[] {
  const anims: object[] = [];

  switch (preset) {
    case "zoom-in":
      anims.push({ easing: "linear", type: "scale", scope: "element", start_scale: "100%", end_scale: "120%", fade: false });
      break;
    case "zoom-out":
      anims.push({ easing: "linear", type: "scale", scope: "element", start_scale: "120%", end_scale: "100%", fade: false });
      break;
    case "pan-right":
      anims.push({ easing: "linear", type: "scale", scope: "element", start_scale: "115%", end_scale: "115%", fade: false });
      anims.push({ easing: "linear", type: "x-position", start_x: "-5%", end_x: "5%", fade: false });
      break;
    case "pan-left":
      anims.push({ easing: "linear", type: "scale", scope: "element", start_scale: "115%", end_scale: "115%", fade: false });
      anims.push({ easing: "linear", type: "x-position", start_x: "5%", end_x: "-5%", fade: false });
      break;
    case "pan-up":
      anims.push({ easing: "linear", type: "scale", scope: "element", start_scale: "115%", end_scale: "115%", fade: false });
      anims.push({ easing: "linear", type: "y-position", start_y: "5%", end_y: "-5%", fade: false });
      break;
    case "pan-down":
      anims.push({ easing: "linear", type: "scale", scope: "element", start_scale: "115%", end_scale: "115%", fade: false });
      anims.push({ easing: "linear", type: "y-position", start_y: "-5%", end_y: "5%", fade: false });
      break;
    case "zoom-in-pan-right":
      anims.push({ easing: "linear", type: "scale", scope: "element", start_scale: "105%", end_scale: "125%", fade: false });
      anims.push({ easing: "linear", type: "x-position", start_x: "-4%", end_x: "4%", fade: false });
      break;
    case "zoom-out-pan-left":
      anims.push({ easing: "linear", type: "scale", scope: "element", start_scale: "125%", end_scale: "105%", fade: false });
      anims.push({ easing: "linear", type: "x-position", start_x: "4%", end_x: "-4%", fade: false });
      break;
    case "diagonal":
      anims.push({ easing: "linear", type: "scale", scope: "element", start_scale: "110%", end_scale: "125%", fade: false });
      anims.push({ easing: "linear", type: "x-position", start_x: "-4%", end_x: "4%", fade: false });
      anims.push({ easing: "linear", type: "y-position", start_y: "3%", end_y: "-3%", fade: false });
      break;
    default:
      anims.push({ easing: "linear", type: "scale", scope: "element", start_scale: "100%", end_scale: "115%", fade: false });
  }

  return anims;
}

const KEN_BURNS_CYCLE: KenBurnsPreset[] = [
  "zoom-in",
  "zoom-out-pan-left",
  "pan-right",
  "zoom-in-pan-right",
  "pan-left",
  "diagonal",
  "pan-up",
  "zoom-out",
];

function getKenBurnsPreset(index: number, customMovement?: string): KenBurnsPreset {
  if (customMovement && customMovement !== "auto") {
    const map: Record<string, KenBurnsPreset> = {
      "zoom-in-pan-right": "zoom-in-pan-right",
      "zoom-out-pan-left": "zoom-out-pan-left",
      "pan-right-zoom": "pan-right",
      "pan-left-zoom": "pan-left",
      "dramatic-zoom": "zoom-in",
      "pan-up-zoom": "pan-up",
      "pan-down-zoom": "pan-down",
      "diagonal-pan-zoom": "diagonal",
    };
    return map[customMovement] ?? KEN_BURNS_CYCLE[index % KEN_BURNS_CYCLE.length];
  }
  return KEN_BURNS_CYCLE[index % KEN_BURNS_CYCLE.length];
}

// ─── AutoReels Renderer ───────────────────────────────────────────────────────

export interface AutoReelOptions {
  hook: string;
  script: string;
  videoLength: number;
  tone: "calm" | "bold" | "authoritative" | "warm";
  voiceoverAudioUrl?: string;
}

/** Stock footage URLs keyed by tone */
const STOCK_FOOTAGE: Record<string, string> = {
  calm: "https://shotstack-assets.s3.amazonaws.com/footage/beach-sunset.mp4",
  bold: "https://shotstack-assets.s3.amazonaws.com/footage/city-timelapse.mp4",
  authoritative: "https://shotstack-assets.s3.amazonaws.com/footage/office-professional.mp4",
  warm: "https://shotstack-assets.s3.amazonaws.com/footage/home-cozy.mp4",
};

/** Background music URLs keyed by tone */
const BACKGROUND_MUSIC: Record<string, string> = {
  calm: "https://shotstack-assets.s3.amazonaws.com/music/ambient-calm.mp3",
  bold: "https://shotstack-assets.s3.amazonaws.com/music/upbeat-energetic.mp3",
  authoritative: "https://shotstack-assets.s3.amazonaws.com/music/corporate-professional.mp3",
  warm: "https://shotstack-assets.s3.amazonaws.com/music/acoustic-warm.mp3",
};

function generateSubtitleTiming(
  script: string,
  duration: number
): Array<{ text: string; start: number; length: number }> {
  const words = script.split(/\s+/).filter((w) => w.length > 0);
  const chunks: string[] = [];
  const chunkSize = 5; // 5 words per chunk — readable at a glance
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  if (chunks.length === 0) return [];

  const MIN_TIME_PER_CHUNK = 3.5; // minimum 3.5s so text is readable
  const rawTimePerChunk = duration / chunks.length;
  const timePerChunk = Math.max(MIN_TIME_PER_CHUNK, rawTimePerChunk);
  const maxChunks = Math.floor(duration / MIN_TIME_PER_CHUNK);
  const displayChunks = chunks.slice(0, maxChunks);

  return displayChunks.map((text, index) => ({
    text,
    start: index * timePerChunk,
    length: timePerChunk + 0.1,
  }));
}

export async function renderAutoReel(options: AutoReelOptions): Promise<RenderResult> {
  const { hook, script, videoLength, tone, voiceoverAudioUrl } = options;

  try {
    const elements: object[] = [];

    // ── Track 1: Background video (bottom layer) ──────────────────────────────
    elements.push({
      type: "video",
      source: STOCK_FOOTAGE[tone] ?? STOCK_FOOTAGE.calm,
      track: 1,
      time: 0,
      duration: videoLength,
      fit: "cover",
      volume: 0, // muted — music track handles audio
    });

    // ── Track 2: Background music ─────────────────────────────────────────────
    elements.push({
      type: "audio",
      source: BACKGROUND_MUSIC[tone] ?? BACKGROUND_MUSIC.calm,
      track: 2,
      time: 0,
      duration: videoLength,
      volume: voiceoverAudioUrl ? '10%' : '30%',
    });
    // ── Track 3: Hook text (first 2 seconds)) ──────────────────────────────────
    elements.push({
      type: "text",
      track: 3,
      time: 0,
      duration: 2,
      text: hook,
      font_family: "Montserrat",
      font_size: "48px",
      font_weight: "700",
      fill_color: "#ffffff",
      x: "50%",
      y: "50%",
      width: "90%",
      height: "20%",
      x_alignment: "50%",
      y_alignment: "50%",
      animations: [
        { type: "fade", duration: 0.3, fade: true },
        { type: "fade", duration: 0.3, fade: true, reversed: true },
      ],
    });

    // ── Track 4: Script subtitles ─────────────────────────────────────────────
    const subtitles = generateSubtitleTiming(script, videoLength - 2);
    subtitles.forEach((sub, i) => {
      elements.push({
        type: "text",
        track: 4,
        time: sub.start + 2, // Start after hook
        duration: sub.length,
        text: sub.text,
        font_family: "Open Sans",
        font_size: "32px",
        font_weight: "600",
        fill_color: "#ffffff",
        background_color: "rgba(0,0,0,0.7)",
        background_x_padding: "10px",
        background_y_padding: "6px",
        border_radius: "5px",
        x: "50%",
        y: "88%",
        width: "90%",
        x_alignment: "50%",
        y_alignment: "100%",
      });
    });

    // ── Track 5: Voiceover narration (optional) ───────────────────────────────
    if (voiceoverAudioUrl) {
      elements.push({
        type: "audio",
        source: voiceoverAudioUrl,
        track: 5,
        time: 0,
        duration: 'media',
        volume: '100%',
        audio_fade_out: 0.5,
      });
    }

    const renderScript = {
      output_format: "mp4",
      width: 1080,
      height: 1920, // 9:16 vertical
      frame_rate: 30,
      elements,
    };

    const renderId = await submitRender(renderScript);
    trackCreatomate(null, "auto_reel", renderId);
    return { renderId, status: "queued" };
  } catch (error: any) {
    console.error("[Creatomate] AutoReel render error:", error.message);
    return { renderId: "", status: "failed", error: error.message };
  }
}

// ─── Property Tour Renderer ───────────────────────────────────────────────────

export interface PropertyTourOptions {
  imageUrls: string[];
  propertyDetails: {
    address: string;
    price?: string;
    beds?: number;
    baths?: number;
    sqft?: number;
    description?: string;
  };
  template?: "modern" | "luxury" | "cozy";
  duration?: number;
  musicTrackUrl?: string;
  includeBranding?: boolean;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  cardTemplate?: "modern" | "luxury" | "bold" | "classic" | "contemporary";
  videoMode?: "standard" | "ai-enhanced" | "full-ai";
  enableVoiceover?: boolean;
  voiceoverUrl?: string;
  perPhotoMovements?: string[];
  movementSpeed?: "slow" | "fast";
  aiVideoMap?: Map<string, string>;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentWebsite?: string;
  avatarVideoUrl?: string;
  avatarOverlayPosition?: "bottom-left" | "bottom-right";
  includeIntroVideo?: boolean;
  introVideoUrl?: string;
}

export async function renderPropertyTour(options: PropertyTourOptions): Promise<{ renderId: string }> {
  const {
    imageUrls,
    propertyDetails,
    duration = 30,
    musicTrackUrl,
    aspectRatio = "16:9",
    cardTemplate = "modern",
    videoMode = "standard",
    enableVoiceover = false,
    voiceoverUrl,
    perPhotoMovements,
    movementSpeed = "slow",
    aiVideoMap = new Map(),
    agentName = "",
    agentPhone,
    agentEmail,
    agentWebsite,
    avatarVideoUrl,
    avatarOverlayPosition = "bottom-left",
    includeIntroVideo = false,
    introVideoUrl,
  } = options;

  if (imageUrls.length === 0) throw new Error("At least one image is required");

  // ── Dimensions ────────────────────────────────────────────────────────────
  const [width, height] =
    aspectRatio === "9:16" ? [1080, 1920] :
    aspectRatio === "1:1" ? [1080, 1080] :
    [1920, 1080];

  const isCinematic = videoMode === "full-ai";
  const speedMultiplier = movementSpeed === "fast" ? 0.6 : 1.0;
  const cinematicMultiplier = isCinematic ? 1.4 : 1.0;
  const baseDurationPerImage = duration / imageUrls.length;
  const durationPerImage = baseDurationPerImage * speedMultiplier * cinematicMultiplier;
  const AI_CLIP_DURATION = 5;

  // ── Calculate cumulative start times ─────────────────────────────────────
  const clipDurations = imageUrls.map((url) => aiVideoMap.has(url) ? AI_CLIP_DURATION : durationPerImage);
  const clipStarts: number[] = [];
  let cumulativeStart = 0;
  for (const d of clipDurations) {
    clipStarts.push(cumulativeStart);
    cumulativeStart += d;
  }
  const mainDuration = cumulativeStart;

  // ── Intro offset ──────────────────────────────────────────────────────────
  const introVideoLength = includeIntroVideo && introVideoUrl ? 5 : 0;
  const introCardLength = 2; // Always show a 2s intro card
  const introOffset = introVideoLength + introCardLength;
  const totalDuration = introOffset + mainDuration + 3; // +3s for outro card

  const elements: object[] = [];
  let trackIdx = 1;

  // ── User intro video (optional) ───────────────────────────────────────────
  if (includeIntroVideo && introVideoUrl) {
    elements.push({
      type: "video",
      source: introVideoUrl,
      track: trackIdx++,
      time: 0,
      duration: introVideoLength,
      fit: "cover",
    });
  }

  // ── Intro card ────────────────────────────────────────────────────────────
  const introCardHtml = buildIntroCardHtml(cardTemplate, propertyDetails.address, propertyDetails.price, agentName, width, height);
  elements.push({
    type: "html",
    source: introCardHtml,
    track: trackIdx++,
    time: introVideoLength,
    duration: introCardLength,
    width,
    height,
  });

  // ── Main photo/video clips with Ken Burns ─────────────────────────────────
  const photoTrack = trackIdx++;
  imageUrls.forEach((url, index) => {
    const clipStart = introOffset + clipStarts[index];
    const clipLength = clipDurations[index];
    const aiVideoUrl = aiVideoMap.get(url);

    if (aiVideoUrl) {
      // AI-generated video clip
      elements.push({
        type: "video",
        source: aiVideoUrl,
        track: photoTrack,
        time: clipStart,
        duration: clipLength,
        fit: "cover",
        volume: 0,
        animations: index > 0 ? [{ type: "fade", duration: 0.5, fade: true }] : [],
      });
    } else if (/\.(mp4|mov|avi|webm|mkv)$/i.test(url)) {
      // Regular video file
      elements.push({
        type: "video",
        source: url,
        track: photoTrack,
        time: clipStart,
        duration: clipLength,
        fit: "cover",
        volume: 0,
        animations: index > 0 ? [{ type: "fade", duration: 0.5, fade: true }] : [],
      });
    } else {
      // Static image with Ken Burns
      const preset = getKenBurnsPreset(index, perPhotoMovements?.[index]);
      const kbAnims = kenBurnsAnimations(preset, clipLength);
      const transitionAnims = index > 0 ? [{ type: "fade", duration: 0.8, fade: true }] : [];

      elements.push({
        type: "image",
        source: url,
        track: photoTrack,
        time: clipStart - (index > 0 ? 0.4 : 0), // slight overlap for crossfade
        duration: clipLength + (index > 0 ? 0.4 : 0) + (index < imageUrls.length - 1 ? 0.4 : 0),
        fit: aspectRatio === "9:16" ? "contain" : "cover",
        clip: true, // crop to element bounds (required for Ken Burns scale)
        animations: [...transitionAnims, ...kbAnims],
      });
    }
  });

  // ── Outro card ────────────────────────────────────────────────────────────
  const outroStart = introOffset + mainDuration;
  const contactLines = [agentPhone, agentEmail, agentWebsite].filter(Boolean) as string[];
  const outroCardHtml = buildOutroCardHtml(cardTemplate, agentName, contactLines, width, height);
  elements.push({
    type: "html",
    source: outroCardHtml,
    track: trackIdx++,
    time: outroStart,
    duration: 3,
    width,
    height,
    animations: [{ type: "fade", duration: 0.5, fade: true }],
  });

  // ── Property address + details overlay ───────────────────────────────────
  const detailsParts: string[] = [];
  if (propertyDetails.price) detailsParts.push(propertyDetails.price);
  if (propertyDetails.beds && propertyDetails.baths) detailsParts.push(`${propertyDetails.beds} BD | ${propertyDetails.baths} BA`);
  if (propertyDetails.sqft) detailsParts.push(`${propertyDetails.sqft.toLocaleString()} SQ FT`);
  const detailsText = detailsParts.join(" · ");
  const addrFontSize = aspectRatio === "9:16" ? "38px" : "42px";
  const detailFontSize = aspectRatio === "9:16" ? "28px" : "32px";

  const overlayHtml = `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:${Math.round(height * (aspectRatio === "9:16" ? 0.12 : 0.08))}px;box-sizing:border-box;font-family:'Montserrat',sans-serif;"><div style="background:rgba(0,0,0,0.5);border-radius:8px;padding:12px 24px;text-align:center;"><div style="color:#FFFFFF;font-size:${addrFontSize};font-weight:700;line-height:1.2;">${propertyDetails.address}</div>${detailsText ? `<div style="color:#C9A962;font-size:${detailFontSize};font-weight:500;margin-top:4px;letter-spacing:1px;">${detailsText}</div>` : ""}</div></div>`;

  elements.push({
    type: "html",
    source: overlayHtml,
    track: trackIdx++,
    time: introOffset,
    duration: mainDuration,
    width,
    height,
  });

  // ── Background music ──────────────────────────────────────────────────────
  if (musicTrackUrl) {
    elements.push({
      type: "audio",
      source: musicTrackUrl,
      track: trackIdx++,
      time: 0,
      duration: totalDuration,
      volume: enableVoiceover ? '30%' : '60%',
    });
  }

  // ── Voiceover audio ───────────────────────────────────────────────────────
  if (enableVoiceover && voiceoverUrl) {
    elements.push({
      type: "audio",
      source: voiceoverUrl,
      track: trackIdx++,
      time: introOffset,
      duration: 'media',
      volume: '100%',
      audio_fade_out: 0.5,
    });
  }

  // ── Avatar overlay (Kling) ────────────────────────────────────────────────
  if (avatarVideoUrl) {
    const avatarSize = Math.round(Math.min(width, height) * 0.22);
    const xPos = avatarOverlayPosition === "bottom-right" ? `${width - avatarSize - 20}px` : "20px";
    const yPos = `${height - avatarSize - 40}px`;
    elements.push({
      type: "video",
      source: avatarVideoUrl,
      track: trackIdx++,
      time: introOffset,
      duration: mainDuration,
      x: xPos,
      y: yPos,
      width: `${avatarSize}px`,
      height: `${avatarSize}px`,
      fit: "cover",
      volume: 0,
      animations: [
        { type: "fade", duration: 0.5, fade: true },
        { type: "fade", duration: 0.5, fade: true, reversed: true },
      ],
    });
  }

  const renderScript = {
    output_format: "mp4",
    width,
    height,
    frame_rate: isCinematic ? 30 : 25,
    snapshot_time: Math.min(introOffset + mainDuration * 0.25, totalDuration - 0.5),
    elements,
  };

  console.log("[Creatomate] Submitting property tour render...");
  console.log("[Creatomate] Images:", imageUrls.length, "| Duration:", totalDuration.toFixed(1), "s | Aspect:", aspectRatio);

  const renderId = await submitRender(renderScript);
  // Fire-and-forget cost log — userId not available at this layer, tracked upstream
  trackCreatomate(null, "property_tour", renderId);
  return { renderId };
}

// ─── Status Polling ───────────────────────────────────────────────────────────

export async function checkRenderStatus(renderId: string): Promise<RenderStatusResult> {
  const apiKey = getApiKey();

  const response = await fetch(`${CREATOMATE_API_URL}/${renderId}`, {
    headers: { "Authorization": `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Creatomate status check failed: ${response.status} ${errorText.substring(0, 200)}`);
  }

  const render = await response.json();

  console.log("[Creatomate] Render status:", render.status, render.id);
  if (render.status === "failed") {
    console.error("[Creatomate] Render FAILED details:", JSON.stringify({
      id: render.id,
      status: render.status,
      error_message: render.error_message,
      error_type: render.error_type,
    }, null, 2));
  }

  // Map Creatomate statuses to our internal statuses
  // Creatomate statuses: planned, waiting, transcribing, rendering, succeeded, failed
  const statusMap: Record<string, RenderStatusResult["status"]> = {
    planned: "queued",
    waiting: "waiting",
    transcribing: "rendering",
    rendering: "rendering",
    succeeded: "done",
    failed: "failed",
  };

  return {
    status: statusMap[render.status] ?? "rendering",
    url: render.url ?? undefined,
    thumbnail: render.snapshot_url ?? undefined,
    poster: render.snapshot_url ?? undefined,
    error: render.error_message ?? undefined,
  };
}

// ─── Card HTML Builders ───────────────────────────────────────────────────────

function buildIntroCardHtml(
  template: string,
  address: string,
  price: string | undefined,
  agentName: string,
  width: number,
  height: number
): string {
  const priceHtml = price ? `<p style="color:white;font-size:36px;margin:20px 0 0 0;">${price}</p>` : "";
  const agentHtml = agentName ? `<p style="color:#C9A962;font-size:24px;margin:30px 0 0 0;">${agentName}</p>` : "";

  switch (template) {
    case "luxury":
      return `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0a0a0a 0%,#1a1515 50%,#0a0a0a 100%);"><div style="border:2px solid #D4AF37;padding:40px;background:rgba(0,0,0,0.5);text-align:center;"><h1 style="color:#D4AF37;font-size:52px;font-weight:300;margin:0;font-family:'Playfair Display',serif;letter-spacing:2px;">${address}</h1>${price ? `<p style="color:#F5F5F5;font-size:38px;margin:25px 0 0 0;font-family:'Playfair Display',serif;">${price}</p>` : ""}<div style="width:80px;height:1px;background:#D4AF37;margin:25px auto;"></div>${agentName ? `<p style="color:#D4AF37;font-size:22px;margin:0;font-family:'Playfair Display',serif;letter-spacing:1px;">${agentName}</p>` : ""}</div></div>`;
    case "bold":
      return `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;background:linear-gradient(90deg,#FF6B35 0%,#F7931E 100%);padding:60px;box-sizing:border-box;"><h1 style="color:white;font-size:56px;font-weight:900;margin:0;font-family:'Montserrat',sans-serif;text-transform:uppercase;line-height:1.1;">${address}</h1>${price ? `<p style="color:#1a1a1a;font-size:42px;margin:20px 0 0 0;font-weight:800;font-family:'Montserrat',sans-serif;">${price}</p>` : ""}${agentName ? `<p style="color:white;font-size:26px;margin:30px 0 0 0;font-family:'Montserrat',sans-serif;font-weight:600;">${agentName}</p>` : ""}</div>`;
    case "classic":
      return `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#FFFFFF;"><div style="text-align:center;padding:40px;"><h1 style="color:#2C3E50;font-size:46px;font-weight:600;margin:0;font-family:'Georgia',serif;">${address}</h1>${price ? `<p style="color:#34495E;font-size:34px;margin:20px 0 0 0;font-family:'Georgia',serif;">${price}</p>` : ""}<div style="width:100px;height:2px;background:#C9A962;margin:25px auto;"></div>${agentName ? `<p style="color:#7F8C8D;font-size:22px;margin:0;font-family:'Georgia',serif;font-style:italic;">${agentName}</p>` : ""}</div></div>`;
    case "contemporary":
      return `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#667eea 0%,#764ba2 100%);"><div style="background:rgba(255,255,255,0.95);padding:50px 60px;border-radius:10px;"><h1 style="color:#2D3748;font-size:50px;font-weight:700;margin:0;text-align:center;font-family:'Poppins',sans-serif;">${address}</h1>${price ? `<p style="color:#4A5568;font-size:36px;margin:20px 0 0 0;text-align:center;font-family:'Poppins',sans-serif;">${price}</p>` : ""}${agentName ? `<p style="color:#667eea;font-size:24px;margin:25px 0 0 0;text-align:center;font-family:'Poppins',sans-serif;font-weight:500;">${agentName}</p>` : ""}</div></div>`;
    default: // modern
      return `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);"><h1 style="color:#C9A962;font-size:48px;font-weight:bold;margin:0;text-align:center;font-family:'Inter',sans-serif;">${address}</h1>${priceHtml}${agentHtml}</div>`;
  }
}

function buildOutroCardHtml(
  template: string,
  agentName: string,
  contactLines: string[],
  width: number,
  height: number
): string {
  const contactHtml = contactLines.map((l) => `<p style="margin:10px 0;">${l}</p>`).join("");

  switch (template) {
    case "luxury":
      return `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0a0a0a 0%,#1a1515 50%,#0a0a0a 100%);"><div style="border:2px solid #D4AF37;padding:40px;background:rgba(0,0,0,0.5);text-align:center;"><h2 style="color:#D4AF37;font-size:44px;font-weight:300;margin:0;font-family:'Playfair Display',serif;letter-spacing:2px;">Schedule Your Private Tour</h2><div style="width:80px;height:1px;background:#D4AF37;margin:25px auto;"></div><p style="color:#F5F5F5;font-size:30px;margin:0;font-family:'Playfair Display',serif;">${agentName}</p><div style="color:#F5F5F5;font-size:22px;margin-top:20px;font-family:'Playfair Display',serif;">${contactHtml}</div></div></div>`;
    case "bold":
      return `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;background:linear-gradient(90deg,#FF6B35 0%,#F7931E 100%);padding:60px;box-sizing:border-box;"><h2 style="color:white;font-size:48px;font-weight:900;margin:0;font-family:'Montserrat',sans-serif;text-transform:uppercase;">LET'S TALK!</h2><p style="color:#1a1a1a;font-size:36px;margin:20px 0 0 0;font-weight:800;font-family:'Montserrat',sans-serif;">${agentName}</p><div style="color:white;font-size:26px;margin-top:20px;font-family:'Montserrat',sans-serif;font-weight:600;">${contactHtml}</div></div>`;
    case "classic":
      return `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#FFFFFF;"><div style="text-align:center;padding:40px;"><h2 style="color:#2C3E50;font-size:40px;font-weight:600;margin:0;font-family:'Georgia',serif;">Contact Me Today</h2><div style="width:100px;height:2px;background:#C9A962;margin:25px auto;"></div><p style="color:#34495E;font-size:28px;margin:0;font-family:'Georgia',serif;font-style:italic;">${agentName}</p><div style="color:#7F8C8D;font-size:22px;margin-top:20px;font-family:'Georgia',serif;">${contactHtml}</div></div></div>`;
    case "contemporary":
      return `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#667eea 0%,#764ba2 100%);"><div style="background:rgba(255,255,255,0.95);padding:50px 60px;border-radius:10px;text-align:center;"><h2 style="color:#2D3748;font-size:44px;font-weight:700;margin:0;font-family:'Poppins',sans-serif;">Let's Connect</h2><p style="color:#4A5568;font-size:30px;margin:20px 0 0 0;font-family:'Poppins',sans-serif;">${agentName}</p><div style="color:#667eea;font-size:22px;margin-top:20px;font-family:'Poppins',sans-serif;">${contactHtml}</div></div></div>`;
    default: // modern
      return `<div style="width:${width}px;height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);"><h2 style="color:#C9A962;font-size:42px;font-weight:bold;margin:0;text-align:center;font-family:'Inter',sans-serif;">Ready to Schedule a Showing?</h2><p style="color:white;font-size:32px;margin:30px 0 0 0;font-weight:600;font-family:'Inter',sans-serif;">${agentName}</p><div style="color:white;font-size:24px;margin-top:20px;font-family:'Inter',sans-serif;">${contactHtml}</div></div>`;
  }
}
