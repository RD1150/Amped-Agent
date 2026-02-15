import { ENV } from "./env";

/**
 * D-ID API Integration for Talking Avatar Videos
 * Generates realistic talking head videos from text scripts and avatar images
 */

interface CreateTalkOptions {
  /**
   * URL or base64 of the avatar image
   */
  sourceUrl: string;
  
  /**
   * Text script for the avatar to speak (max ~150-180 words for 60 seconds)
   */
  script: string;
  
  /**
   * Voice ID from D-ID's voice library
   * Examples: "en-US-JennyNeural", "en-US-GuyNeural", etc.
   */
  voiceId?: string;
  
  /**
   * Optional provider (default: "microsoft")
   */
  provider?: string;
}

interface CreateTalkResponse {
  id: string;
  status: string;
  result_url?: string;
}

interface GetTalkResponse {
  id: string;
  status: "created" | "started" | "done" | "error";
  result_url?: string;
  error?: {
    kind: string;
    description: string;
  };
}

/**
 * Create a talking avatar video
 */
export async function createTalkingAvatar(options: CreateTalkOptions): Promise<CreateTalkResponse> {
  const response = await fetch("https://api.d-id.com/talks", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${ENV.DID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_url: options.sourceUrl,
      script: {
        type: "text",
        input: options.script,
        provider: {
          type: options.provider || "microsoft",
          voice_id: options.voiceId || "en-US-JennyNeural",
        },
      },
      config: {
        fluent: true,
        pad_audio: 0,
        stitch: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`D-ID API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Get the status of a talking avatar video
 */
export async function getTalkingAvatarStatus(talkId: string): Promise<GetTalkResponse> {
  const response = await fetch(`https://api.d-id.com/talks/${talkId}`, {
    headers: {
      "Authorization": `Basic ${ENV.DID_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`D-ID API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Wait for talking avatar video to complete (with polling)
 */
export async function waitForTalkingAvatar(
  talkId: string,
  maxWaitMs: number = 120000, // 2 minutes
  pollIntervalMs: number = 3000 // 3 seconds
): Promise<string> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const status = await getTalkingAvatarStatus(talkId);
    
    if (status.status === "done" && status.result_url) {
      return status.result_url;
    }
    
    if (status.status === "error") {
      throw new Error(`D-ID generation failed: ${status.error?.description || "Unknown error"}`);
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  throw new Error("D-ID generation timed out");
}

/**
 * Generate a talking avatar video and wait for completion
 * (Convenience function that combines create + wait)
 */
export async function generateTalkingAvatar(options: CreateTalkOptions): Promise<string> {
  const talk = await createTalkingAvatar(options);
  return waitForTalkingAvatar(talk.id);
}
