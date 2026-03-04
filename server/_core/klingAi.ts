import jwt from "jsonwebtoken";
import { ENV } from "./env";

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
  maxWaitMs: number = 300000 // 5 minutes
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
 * Room type to camera movement mapping for real estate walkthroughs
 */
export function getCameraControlForRoom(roomType: string): KlingCameraControl {
  const roomLower = roomType.toLowerCase();

  // Exterior shots: dramatic pull-back reveal
  if (
    roomLower.includes("exterior") ||
    roomLower.includes("facade") ||
    roomLower.includes("front") ||
    roomLower.includes("aerial")
  ) {
    return { type: "down_back" };
  }

  // Living rooms, great rooms: forward push-in to reveal depth
  if (
    roomLower.includes("living") ||
    roomLower.includes("great room") ||
    roomLower.includes("family room") ||
    roomLower.includes("main")
  ) {
    return { type: "forward_up" };
  }

  // Kitchens: left turn to reveal the full kitchen layout
  if (roomLower.includes("kitchen") || roomLower.includes("dining")) {
    return { type: "left_turn_forward" };
  }

  // Bedrooms: right turn for a gentle reveal
  if (
    roomLower.includes("bedroom") ||
    roomLower.includes("master") ||
    roomLower.includes("suite") ||
    roomLower.includes("primary")
  ) {
    return { type: "right_turn_forward" };
  }

  // Bathrooms: zoom in to showcase details
  if (
    roomLower.includes("bathroom") ||
    roomLower.includes("bath") ||
    roomLower.includes("spa")
  ) {
    return { type: "zoom_in" };
  }

  // Outdoor spaces, pools: pull-back to reveal the full space
  if (
    roomLower.includes("outdoor") ||
    roomLower.includes("pool") ||
    roomLower.includes("patio") ||
    roomLower.includes("water") ||
    roomLower.includes("backyard") ||
    roomLower.includes("garden")
  ) {
    return { type: "down_back" };
  }

  // Hallways, entryways: forward push
  if (
    roomLower.includes("hall") ||
    roomLower.includes("entry") ||
    roomLower.includes("foyer") ||
    roomLower.includes("stair")
  ) {
    return { type: "forward_up" };
  }

  // Default: gentle forward push for any unrecognized room type
  return { type: "forward_up" };
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

  const task = await createImageToVideoTask({
    model_name: options.model || "kling-v1-5",
    image: imageUrl,
    prompt: options.prompt || getRoomPrompt(roomType),
    cfg_scale: 0.5,
    mode: options.mode || "std",
    aspect_ratio: options.aspectRatio || "16:9",
    duration: options.duration || "5",
    camera_control: cameraControl,
  });

  console.log(`[KlingAI] Task submitted: ${task.task_id}`);

  const completed = await waitForTask(task.task_id);

  const videoUrl = completed.task_result?.videos?.[0]?.url;
  if (!videoUrl) {
    throw new Error("Kling AI task completed but no video URL returned");
  }

  console.log(`[KlingAI] ✓ Video ready: ${videoUrl}`);
  return videoUrl;
}

/**
 * Generate a cinematic prompt for the room type
 */
function getRoomPrompt(roomType: string): string {
  const roomLower = roomType.toLowerCase();

  if (roomLower.includes("exterior") || roomLower.includes("facade")) {
    return "Cinematic reveal of the property exterior, smooth camera movement showcasing architectural details";
  }
  if (roomLower.includes("living") || roomLower.includes("family")) {
    return "Smooth camera walkthrough of the living space, revealing comfortable and elegant interior design";
  }
  if (roomLower.includes("kitchen")) {
    return "Camera glides through the kitchen revealing premium appliances and modern design details";
  }
  if (roomLower.includes("bedroom") || roomLower.includes("master")) {
    return "Gentle camera movement through the bedroom revealing a serene and luxurious retreat";
  }
  if (roomLower.includes("bathroom") || roomLower.includes("bath")) {
    return "Camera slowly reveals the spa-like bathroom with premium fixtures and elegant finishes";
  }
  if (roomLower.includes("outdoor") || roomLower.includes("pool")) {
    return "Sweeping camera movement revealing the stunning outdoor living space and landscaping";
  }

  return "Smooth cinematic camera movement revealing the beautiful interior space";
}
