import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { trackKling } from "./costTracker";

/**
 * Kling AI API client for image-to-video generation with camera control
 * Documentation: https://app.klingai.com/global/dev/document-api/apiReference/model/imageToVideo
 *
 * Camera control types for real estate walkthroughs:
 * - forward_up: Camera pushes forward and tilts up (living rooms, entryways)
 * - left_turn_forward: Rotates left then advances (corner rooms, kitchens)
 * - right_turn_forward: Rotates right then advances (hallways, bedrooms)
 * - down_back: Camera descends and pulls back (exteriors, aerial)
 * - zoom_in: Slow push-in (any room, close-up details)
 * - zoom_out: Pull-back reveal (wide spaces, open floor plans)
 * - simple (pan_left/pan_right/tilt_up/tilt_down): Subtle pan movements
 */

const KLING_API_BASE = "https://api-singapore.klingai.com";

export type KlingCameraMovement =
  | "forward_up"
  | "left_turn_forward"
  | "right_turn_forward"
  | "down_back"
  | "zoom_in"
  | "zoom_out"
  | "pan_left"
  | "pan_right"
  | "tilt_up"
  | "tilt_down";

export interface KlingCameraControl {
  type: "simple" | "down_back" | "forward_up" | "left_turn_forward" | "right_turn_forward" | "zoom_in" | "zoom_out";
  config?: {
    horizontal?: number; // -10 to 10
    vertical?: number;   // -10 to 10
    zoom?: number;       // -10 to 10
    tilt?: number;       // -10 to 10
    pan?: number;        // -10 to 10
    roll?: number;       // -10 to 10
  };
}

export interface KlingImageToVideoRequest {
  model_name?: "kling-v1" | "kling-v1-5" | "kling-v2";
  image: string;          // URL of the input image
  image_tail?: string;    // Optional end frame image URL
  prompt?: string;        // Text prompt for motion guidance
  negative_prompt?: string;
  cfg_scale?: number;     // 0-1, creativity vs adherence (default 0.5)
  mode?: "std" | "pro";   // std = faster/cheaper, pro = higher quality
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  duration?: "5" | "10";  // seconds
  camera_control?: KlingCameraControl;
}

export interface KlingTask {
  task_id: string;
  task_status: "submitted" | "processing" | "succeed" | "failed";
  task_status_msg?: string;
  task_result?: {
    videos?: Array<{
      id: string;
      url: string;
      duration: string;
    }>;
  };
  created_at: number;
  updated_at: number;
}

export interface KlingApiResponse<T> {
  code: number;
  message: string;
  request_id: string;
  data: T;
}

/**
 * Generate JWT token for Kling API authentication
 * Uses HS256 with access_key as payload identifier and secret_key as signing key
 */
function generateKlingJWT(): string {
  const accessKey = ENV.KLING_ACCESS_KEY;
  const secretKey = ENV.KLING_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error("KLING_ACCESS_KEY and KLING_SECRET_KEY must be configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKey,
    exp: now + 1800, // 30 minutes
    nbf: now - 5,    // allow 5 second clock skew
  };

  return jwt.sign(payload, secretKey, {
    algorithm: "HS256",
    header: {
      alg: "HS256",
      typ: "JWT",
    },
  });
}

/**
 * Make authenticated request to Kling API
 */
async function klingRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<KlingApiResponse<T>> {
  const token = generateKlingJWT();

  const response = await fetch(`${KLING_API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kling AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Kling AI API error: code ${data.code} - ${data.message}`);
  }

  return data;
}

/**
 * Submit image-to-video generation task
 */
export async function createImageToVideoTask(
  request: KlingImageToVideoRequest
): Promise<KlingTask> {
  const response = await klingRequest<KlingTask>(
    "POST",
    "/v1/videos/image2video",
    request
  );
  return response.data;
}

/**
 * Get task status by ID
 */
export async function getTaskStatus(taskId: string): Promise<KlingTask> {
  const response = await klingRequest<KlingTask>(
    "GET",
    `/v1/videos/image2video/${taskId}`
  );
  return response.data;
}

/**
 * Poll for task completion with timeout
 */
export async function waitForTask(
  taskId: string,
  maxWaitMs: number = 600000 // 10 minutes (Kling pro mode clips can take 4-8 min)
): Promise<KlingTask> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const task = await getTaskStatus(taskId);

    if (task.task_status === "succeed") {
      return task;
    }

    if (task.task_status === "failed") {
      throw new Error(
        `Kling AI task failed: ${task.task_status_msg || "Unknown error"}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Kling AI task timed out after ${maxWaitMs}ms`);
}

/**
/**
 * Room type to camera movement mapping for real estate walkthroughs.
 * 
 * IMPORTANT: The Kling API only accepts type="simple" with a config object.
 * Named types (forward_up, down_back, etc.) are rejected with a 400 error.
 * We simulate the desired movements using simple pan/tilt/zoom values:
 *   - zoom > 0: push in (dolly forward), zoom < 0: pull back
 *   - pan > 0: pan right, pan < 0: pan left
 *   - tilt > 0: tilt up, tilt < 0: tilt down
 *   - horizontal: truck left/right, vertical: pedestal up/down
 * Values range from -10 to 10.
 */
export function getCameraControlForRoom(roomType: string): KlingCameraControl {
  const roomLower = roomType.toLowerCase();

  // Exterior shots: pull-back reveal (zoom out + slight tilt down)
  if (
    roomLower.includes("exterior") ||
    roomLower.includes("facade") ||
    roomLower.includes("front") ||
    roomLower.includes("aerial")
  ) {
    return { type: "simple", config: { zoom: -7, tilt: -3, horizontal: 0, vertical: 0, pan: 0, roll: 0 } };
  }

  // Living rooms, great rooms: forward dolly push-in (zoom in + slight tilt up)
  if (
    roomLower.includes("living") ||
    roomLower.includes("great room") ||
    roomLower.includes("family room") ||
    roomLower.includes("main")
  ) {
    return { type: "simple", config: { zoom: 8, tilt: 3, horizontal: 0, vertical: 0, pan: 0, roll: 0 } };
  }

  // Kitchens: pan left across the kitchen layout
  if (roomLower.includes("kitchen") || roomLower.includes("dining")) {
    return { type: "simple", config: { pan: -6, zoom: 4, horizontal: 0, vertical: 0, tilt: 0, roll: 0 } };
  }

  // Bedrooms: gentle pan right with slight zoom
  if (
    roomLower.includes("bedroom") ||
    roomLower.includes("master") ||
    roomLower.includes("suite") ||
    roomLower.includes("primary")
  ) {
    return { type: "simple", config: { pan: 5, zoom: 4, horizontal: 0, vertical: 0, tilt: 0, roll: 0 } };
  }

  // Bathrooms: zoom in to showcase details
  if (
    roomLower.includes("bathroom") ||
    roomLower.includes("bath") ||
    roomLower.includes("spa")
  ) {
    return { type: "simple", config: { zoom: 9, tilt: 2, horizontal: 0, vertical: 0, pan: 0, roll: 0 } };
  }

  // Outdoor spaces, pools: pull-back aerial reveal
  if (
    roomLower.includes("outdoor") ||
    roomLower.includes("pool") ||
    roomLower.includes("patio") ||
    roomLower.includes("water") ||
    roomLower.includes("backyard") ||
    roomLower.includes("garden")
  ) {
    return { type: "simple", config: { zoom: -8, vertical: -3, horizontal: 0, tilt: 0, pan: 0, roll: 0 } };
  }

  // Hallways, entryways: forward push through the space
  if (
    roomLower.includes("hall") ||
    roomLower.includes("entry") ||
    roomLower.includes("foyer") ||
    roomLower.includes("stair")
  ) {
    return { type: "simple", config: { zoom: 9, tilt: 2, horizontal: 0, vertical: 0, pan: 0, roll: 0 } };
  }

  // Default: gentle forward push
  return { type: "simple", config: { zoom: 7, tilt: 2, horizontal: 0, vertical: 0, pan: 0, roll: 0 } };
}

/**
 * Generate video from image with Kling AI camera control
 * This is the main entry point for property tour video generation
 */
export async function imageToVideo(
  imageUrl: string,
  roomType: string,
  options: {
    aspectRatio?: "16:9" | "9:16" | "1:1";
    duration?: "5" | "10";
    model?: "kling-v1" | "kling-v1-5" | "kling-v2";
    mode?: "std" | "pro";
    prompt?: string;
  } = {}
): Promise<string> {
  const cameraControl = getCameraControlForRoom(roomType);

  console.log(
    `[KlingAI] Room: "${roomType}" → Camera: ${cameraControl.type}`
  );

  // CRITICAL: camera_control ONLY works with mode="pro" + duration="5" + model="kling-v1-5"
  // Using std mode with camera_control causes a 400 error and falls back to Ken Burns
  const task = await createImageToVideoTask({
    model_name: "kling-v1-5",
    image: imageUrl,
    prompt: options.prompt || getRoomPrompt(roomType),
    cfg_scale: 0.5,
    mode: "pro",  // MUST be pro for camera_control to work
    aspect_ratio: options.aspectRatio || "16:9",
    duration: "5",  // MUST be 5s for camera_control to work
    camera_control: cameraControl,
  });

  console.log(`[KlingAI] Task submitted: ${task.task_id}`);

  const completed = await waitForTask(task.task_id);

  const videoUrl = completed.task_result?.videos?.[0]?.url;
  if (!videoUrl) {
    throw new Error("Kling AI task completed but no video URL returned");
  }

  console.log(`[KlingAI] ✓ Video ready: ${videoUrl}`);
  // Fire-and-forget cost log
  trackKling(null, "ai_clip", task.task_id);
  return videoUrl;
}

/**
 * Generate a dramatic cinematic prompt for the room type
 * These prompts are intentionally specific and bold to push Kling AI
 * toward visible, dramatic camera movement — not subtle Ken Burns-style pans
 */
function getRoomPrompt(roomType: string): string {
  const roomLower = roomType.toLowerCase();

  if (roomLower.includes("exterior") || roomLower.includes("facade") || roomLower.includes("front")) {
    return "Dramatic aerial crane descending from high above, sweeping down to reveal the full estate facade in golden hour light, cinematic real estate reveal shot";
  }
  if (roomLower.includes("living") || roomLower.includes("family") || roomLower.includes("great room")) {
    return "Bold forward dolly push through the living room, depth of field pulling focus from foreground furniture to the panoramic windows beyond, luxury real estate cinematic";
  }
  if (roomLower.includes("kitchen")) {
    return "Sweeping left arc tracking shot revealing the full kitchen island and premium appliances, camera moves decisively through the space like a professional film crew";
  }
  if (roomLower.includes("bedroom") || roomLower.includes("master") || roomLower.includes("suite") || roomLower.includes("primary")) {
    return "Elegant rightward arc tracking shot entering the master suite, revealing the full room from a dramatic angle, warm cinematic lighting, luxury hotel quality";
  }
  if (roomLower.includes("bathroom") || roomLower.includes("bath") || roomLower.includes("spa")) {
    return "Slow dramatic push-in toward the freestanding soaking tub, camera zooms in with purpose revealing marble surfaces and spa luxury, cinematic close-up reveal";
  }
  if (roomLower.includes("pool") || roomLower.includes("outdoor") || roomLower.includes("patio") || roomLower.includes("backyard")) {
    return "Sweeping aerial pullback from the pool surface rising to reveal the full outdoor estate, ocean or landscape visible in background, dramatic drone-style reveal";
  }
  if (roomLower.includes("dining")) {
    return "Smooth arc around the dining table revealing the full room, chandelier prominent, camera sweeps left with confidence, architectural photography motion";
  }
  if (roomLower.includes("office") || roomLower.includes("library") || roomLower.includes("study")) {
    return "Slow deliberate zoom-in toward the desk and built-in shelving, camera pushes forward with cinematic purpose, revealing the room's depth and sophistication";
  }
  if (roomLower.includes("hall") || roomLower.includes("entry") || roomLower.includes("foyer")) {
    return "Camera advances boldly through the entryway, forward push revealing the grand foyer and staircase, cinematic walk-through establishing shot";
  }

  return "Bold cinematic camera movement revealing the luxury space with professional real estate film quality, dramatic and intentional motion";
}

// ─────────────────────────────────────────────────────────────────────────────
// Kling Avatar 2.0 — AI twin narration from headshot + voice recording
// API: POST /v1/videos/avatar/image2video
// ─────────────────────────────────────────────────────────────────────────────

export interface KlingAvatarRequest {
  image: string;        // Headshot URL (jpg/png, ≥300px, ≤10MB)
  sound_file: string;   // Voice recording URL (mp3/wav/m4a/aac, 2-300s, ≤5MB)
  prompt?: string;      // Avatar actions/emotions/camera guidance
  mode?: "std" | "pro"; // std = cost-effective, pro = higher quality
  external_task_id?: string;
}

export interface KlingAvatarTask {
  task_id: string;
  task_status: "submitted" | "processing" | "succeed" | "failed";
  task_status_msg?: string;
  task_result?: {
    videos?: Array<{
      id: string;
      url: string;
      watermark_url?: string;
      duration: string;
    }>;
  };
  created_at: number;
  updated_at: number;
}

/**
 * Submit an Avatar 2.0 generation task
 * Takes a headshot image + voice recording and generates a talking-head video
 */
export async function createAvatarTask(
  request: KlingAvatarRequest
): Promise<KlingAvatarTask> {
  const response = await klingRequest<KlingAvatarTask>(
    "POST",
    "/v1/videos/avatar/image2video",
    request
  );
  return response.data;
}

/**
 * Get Avatar task status by ID
 */
export async function getAvatarTaskStatus(taskId: string): Promise<KlingAvatarTask> {
  const response = await klingRequest<KlingAvatarTask>(
    "GET",
    `/v1/videos/avatar/image2video/${taskId}`
  );
  return response.data;
}

/**
 * Poll for Avatar task completion with timeout
 */
export async function waitForAvatarTask(
  taskId: string,
  maxWaitMs: number = 600000 // 10 minutes (Kling pro mode clips can take 4-8 min)
): Promise<KlingAvatarTask> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const task = await getAvatarTaskStatus(taskId);

    if (task.task_status === "succeed") {
      return task;
    }

    if (task.task_status === "failed") {
      throw new Error(
        `Kling Avatar task failed: ${task.task_status_msg || "Unknown error"}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Kling Avatar task timed out after ${maxWaitMs}ms`);
}

/**
 * Generate an agent narration video using Kling Avatar 2.0
 * 
 * @param headshotUrl - URL of the agent's headshot (jpg/png, ≥300px)
 * @param voiceUrl    - URL of the agent's voice recording (mp3/wav, 2-300s)
 * @param propertyAddress - Used to generate a contextual prompt
 * @param mode        - "std" (faster/cheaper) or "pro" (higher quality)
 * @returns URL of the generated avatar video
 */
export async function generateAgentAvatarVideo(
  headshotUrl: string,
  voiceUrl: string,
  propertyAddress: string,
  mode: "std" | "pro" = "std"
): Promise<string> {
  const prompt = `Real estate agent presenting a property tour. Professional demeanor, warm smile, natural head movement while speaking. Property: ${propertyAddress}`;

  console.log(`[KlingAvatar] Generating avatar for property: ${propertyAddress}`);

  const task = await createAvatarTask({
    image: headshotUrl,
    sound_file: voiceUrl,
    prompt,
    mode,
  });

  console.log(`[KlingAvatar] Task submitted: ${task.task_id}`);

  const completed = await waitForAvatarTask(task.task_id);

  const videoUrl = completed.task_result?.videos?.[0]?.url;
  if (!videoUrl) {
    throw new Error("Kling Avatar task completed but no video URL returned");
  }

  console.log(`[KlingAvatar] ✓ Avatar video ready: ${videoUrl}`);
  return videoUrl;
}
