/**
 * Runway ML API integration for image-to-video generation
 * Generates cinematic camera movements from still images
 */

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
const RUNWAY_API_URL = "https://api.runwayml.com/v1";

export interface RunwayGenerateParams {
  imageUrl: string;
  prompt: string; // Camera movement description (e.g., "slow zoom in", "pan right")
  duration?: number; // seconds (default: 5)
}

export interface RunwayTaskResponse {
  id: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
  output?: string[]; // Video URLs
  error?: string;
}

/**
 * Generate video from image with camera movement
 */
export async function generateImageToVideo(params: RunwayGenerateParams): Promise<{ taskId: string }> {
  if (!RUNWAY_API_KEY) {
    throw new Error("RUNWAY_API_KEY not configured");
  }

  const response = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RUNWAY_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gen3a_turbo",
      promptImage: params.imageUrl,
      promptText: params.prompt,
      duration: params.duration || 5,
      ratio: "16:9",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Runway API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return { taskId: data.id };
}

/**
 * Check status of Runway generation task
 */
export async function getTaskStatus(taskId: string): Promise<RunwayTaskResponse> {
  if (!RUNWAY_API_KEY) {
    throw new Error("RUNWAY_API_KEY not configured");
  }

  const response = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
    headers: {
      "Authorization": `Bearer ${RUNWAY_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Runway API error: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Poll Runway task until completion (with timeout)
 */
export async function waitForCompletion(taskId: string, timeoutMs: number = 300000): Promise<string> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const status = await getTaskStatus(taskId);
    
    if (status.status === "SUCCEEDED" && status.output && status.output.length > 0) {
      return status.output[0]; // Return video URL
    }
    
    if (status.status === "FAILED") {
      throw new Error(`Runway generation failed: ${status.error || "Unknown error"}`);
    }
    
    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error("Runway generation timed out");
}
