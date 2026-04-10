import { ENV } from "./env";

/**
 * Luma AI Dream Machine API client for image-to-video generation
 * Documentation: https://docs.lumalabs.ai/docs/video-generation
 */

const LUMA_API_BASE = "https://api.lumalabs.ai/dream-machine/v1";

export interface LumaGenerationRequest {
  prompt: string;
  model?: "ray-2" | "ray-flash-2";
  keyframes?: {
    frame0?: {
      type: "image";
      url: string;
    };
    frame1?: {
      type: "image";
      url: string;
    };
  };
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  resolution?: "540p" | "720p" | "1080p" | "4k";
  duration?: "5s";
  loop?: boolean;
}

export interface LumaGeneration {
  id: string;
  state: "pending" | "processing" | "completed" | "failed";
  assets?: {
    video?: string;
    image?: string;
  };
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new image-to-video generation
 */
export async function createGeneration(
  request: LumaGenerationRequest
): Promise<LumaGeneration> {
  const response = await fetch(`${LUMA_API_BASE}/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.LUMA_API_KEY}`,
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Luma AI API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get generation status by ID
 */
export async function getGeneration(id: string): Promise<LumaGeneration> {
  const response = await fetch(`${LUMA_API_BASE}/generations/${id}`, {
    headers: {
      Authorization: `Bearer ${ENV.LUMA_API_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Luma AI API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Poll for generation completion with timeout
 */
export async function waitForGeneration(
  id: string,
  maxWaitMs: number = 180000 // 3 minutes default
): Promise<LumaGeneration> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const generation = await getGeneration(id);

    if (generation.state === "completed") {
      return generation;
    }

    if (generation.state === "failed") {
      throw new Error(
        `Luma AI generation failed: ${generation.failure_reason || "Unknown error"}`
      );
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Luma AI generation timed out after ${maxWaitMs}ms`);
}

/**
 * Generate video from image with cinematic camera movement
 */
export async function imageToVideo(
  imageUrl: string,
  prompt: string,
  options: {
    aspectRatio?: "16:9" | "9:16" | "1:1";
    resolution?: "540p" | "720p" | "1080p";
    model?: "ray-2" | "ray-flash-2";
  } = {}
): Promise<string> {
  // Create generation
  const generation = await createGeneration({
    prompt,
    model: options.model || "ray-flash-2", // Use faster model by default
    keyframes: {
      frame0: {
        type: "image",
        url: imageUrl,
      },
    },
    aspect_ratio: options.aspectRatio || "16:9",
    resolution: options.resolution || "720p",
    duration: "5s",
    loop: false,
  });

  // Wait for completion
  const completed = await waitForGeneration(generation.id);

  const videoUrl = completed.assets?.video;
  if (!videoUrl) {
    throw new Error("Luma AI generation completed but no video URL returned in assets");
  }

  return videoUrl;
}
