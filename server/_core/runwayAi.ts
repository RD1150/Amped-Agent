import { ENV } from "./env";

import { trackRunway } from "./costTracker";

/**
 * Runway ML Gen-3 Alpha API client for image-to-video generation
 * Documentation: https://docs.runwayml.com/reference/image-to-video
 */

const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";

export interface RunwayGenerationRequest {
  promptImage: string; // Image URL to animate
  promptText?: string; // Optional text prompt for camera movement
  duration?: 5 | 10; // Video duration in seconds
  ratio?: "1280:768" | "768:1280"; // Aspect ratio (landscape or portrait)
  watermark?: boolean; // Add Runway watermark (free tier)
}

export interface RunwayTask {
  id: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  output?: string[]; // Array of output video URLs
  failure?: string; // Failure reason if status is FAILED
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new image-to-video generation task
 */
export async function createImageToVideo(
  request: RunwayGenerationRequest
): Promise<RunwayTask> {
  const response = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENV.RUNWAY_API_KEY}`,
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify({
      model: "gen3a_turbo", // Use Gen-3 Alpha Turbo for cost efficiency
      promptImage: request.promptImage,
      promptText: request.promptText || "Cinematic camera movement",
      duration: request.duration || 5,
      ratio: request.ratio || "16:9",
      watermark: request.watermark ?? false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Runway API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get task status by ID
 */
export async function getTask(taskId: string): Promise<RunwayTask> {
  const response = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
    headers: {
      "Authorization": `Bearer ${ENV.RUNWAY_API_KEY}`,
      "X-Runway-Version": "2024-11-06",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Runway API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Poll for task completion with timeout
 */
export async function waitForTask(
  taskId: string,
  maxWaitMs: number = 180000 // 3 minutes default
): Promise<RunwayTask> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const task = await getTask(taskId);

    if (task.status === "SUCCEEDED") {
      return task;
    }

    if (task.status === "FAILED") {
      throw new Error(
        `Runway generation failed: ${task.failure || "Unknown error"}`
      );
    }

    if (task.status === "CANCELLED") {
      throw new Error("Runway generation was cancelled");
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Runway generation timed out after ${maxWaitMs}ms`);
}

/**
 * Generate video from image with cinematic camera movement
 */
export async function imageToVideo(
  imageUrl: string,
  prompt: string,
  options: {
    aspectRatio?: "16:9" | "9:16" | "1:1";
    duration?: 5 | 10;
  } = {}
): Promise<string> {
  // Map aspect ratios to Runway format
  const ratioMap: Record<string, "1280:768" | "768:1280"> = {
    "16:9": "1280:768",
    "9:16": "768:1280",
    "1:1": "1280:768", // Default to landscape for square
  };
  const runwayRatio = ratioMap[options.aspectRatio || "16:9"];
  console.log(`[Runway] Creating image-to-video task for: ${imageUrl}`);
  
  // Create generation task
  const task = await createImageToVideo({
    promptImage: imageUrl,
    promptText: prompt,
    duration: options.duration || 5,
    ratio: runwayRatio,
    watermark: false,
  });

  console.log(`[Runway] Task created: ${task.id}, status: ${task.status}`);

  // Wait for completion
  const completed = await waitForTask(task.id);

  if (!completed.output || completed.output.length === 0) {
    throw new Error("Runway generation completed but no video URL returned");
  }

  const duration = options.duration || 5;
  console.log(`[Runway] ✓ Video generated: ${completed.output[0]}`);
  // Fire-and-forget cost log
  trackRunway(null, "ai_clip", duration, task.id);
  return completed.output[0];
}
