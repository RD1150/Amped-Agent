/**
 * D-ID AI Avatar Video Generation Service
 * 
 * This module provides functions to interact with the D-ID API
 * for creating AI avatar videos with talking heads.
 */

const DID_API_BASE_URL = "https://api.d-id.com";

interface DIDTalkRequest {
  source_url: string; // Avatar image URL
  script: {
    type: "text" | "audio";
    input: string; // Text to speak or audio URL
    provider?: {
      type: string;
      voice_id: string;
    };
  };
  config?: {
    fluent?: boolean;
    pad_audio?: number;
    stitch?: boolean;
    result_format?: string;
  };
}

interface DIDTalkResponse {
  id: string;
  created_at: string;
  status: "created" | "started" | "done" | "error";
  result_url?: string;
  error?: {
    kind: string;
    description: string;
  };
}

/**
 * Get D-ID API authentication headers
 */
function getAuthHeaders(): HeadersInit {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) {
    throw new Error("DID_API_KEY environment variable is not set");
  }

  const [username, password] = apiKey.split(":");
  if (!username || !password) {
    throw new Error("Invalid DID_API_KEY format. Expected: username:password");
  }

  const base64Auth = Buffer.from(`${username}:${password}`).toString("base64");

  return {
    "Authorization": `Basic ${base64Auth}`,
    "Content-Type": "application/json",
  };
}

/**
 * Create a talking avatar video
 * 
 * @param avatarImageUrl - URL of the avatar image (headshot)
 * @param scriptText - Text for the avatar to speak
 * @param voiceId - Optional voice ID (default: en-US-JennyNeural)
 * @returns Talk ID to poll for completion
 */
export async function createTalkingAvatar(
  avatarImageUrl: string,
  scriptText: string,
  voiceId: string = "en-US-JennyNeural"
): Promise<string> {
  const requestBody: DIDTalkRequest = {
    source_url: avatarImageUrl,
    script: {
      type: "text",
      input: scriptText,
      provider: {
        type: "microsoft",
        voice_id: voiceId,
      },
    },
    config: {
      fluent: true,
      pad_audio: 0.0,
      stitch: true,
      result_format: "mp4",
    },
  };

  const response = await fetch(`${DID_API_BASE_URL}/talks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `D-ID API error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const data: DIDTalkResponse = await response.json();
  return data.id;
}

/**
 * Get the status of a talking avatar video
 * 
 * @param talkId - The talk ID returned from createTalkingAvatar
 * @returns Talk status and result URL if completed
 */
export async function getTalkStatus(talkId: string): Promise<DIDTalkResponse> {
  const response = await fetch(`${DID_API_BASE_URL}/talks/${talkId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `D-ID API error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  return await response.json();
}

/**
 * Poll for talk completion with timeout
 * 
 * @param talkId - The talk ID to poll
 * @param maxWaitSeconds - Maximum time to wait (default: 120 seconds)
 * @returns Result URL when video is ready
 */
export async function waitForTalkCompletion(
  talkId: string,
  maxWaitSeconds: number = 120
): Promise<string> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds

  while (true) {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > maxWaitSeconds) {
      throw new Error(`D-ID video generation timed out after ${maxWaitSeconds} seconds`);
    }

    const status = await getTalkStatus(talkId);

    if (status.status === "done" && status.result_url) {
      return status.result_url;
    }

    if (status.status === "error") {
      throw new Error(
        `D-ID video generation failed: ${status.error?.description || "Unknown error"}`
      );
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

/**
 * Get remaining credits from D-ID account
 */
export async function getRemainingCredits(): Promise<number> {
  const response = await fetch(`${DID_API_BASE_URL}/credits`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch D-ID credits: ${response.status}`);
  }

  const data = await response.json();
  return data.remaining || 0;
}

/**
 * Generate a complete AI avatar intro video
 * 
 * This is a high-level function that creates an avatar video and waits for completion.
 * 
 * @param avatarImageUrl - URL of the avatar headshot image
 * @param introScript - Text for the avatar to speak
 * @param voiceId - Optional voice ID
 * @returns URL of the completed video
 */
export async function generateAvatarIntro(
  avatarImageUrl: string,
  introScript: string,
  voiceId?: string
): Promise<string> {
  // Create the talking avatar
  const talkId = await createTalkingAvatar(avatarImageUrl, introScript, voiceId);

  // Wait for completion and return video URL
  const videoUrl = await waitForTalkCompletion(talkId);

  return videoUrl;
}
