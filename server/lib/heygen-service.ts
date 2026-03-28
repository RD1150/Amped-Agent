/**
 * HeyGen API service for Full Avatar Video generation.
 * Docs: https://docs.heygen.com/reference
 */

const HEYGEN_API = "https://api.heygen.com";

function heygenHeaders() {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error("HEYGEN_API_KEY is not configured");
  return {
    "X-Api-Key": key,
    "Content-Type": "application/json",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url: string;
  preview_video_url?: string;
  gender?: string;
}

export interface HeyGenVideoStatus {
  video_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string;
}

// ─── Instant Avatar (photo → talking head, like D-ID V2) ─────────────────────

/**
 * Upload a photo to create an Instant Avatar (one-time, no training required).
 * Returns the avatar_id to use in video generation.
 */
export async function createInstantAvatarFromPhoto(imageUrl: string): Promise<string> {
  // HeyGen Instant Avatar: upload image URL
  const res = await fetch(`${HEYGEN_API}/v2/photo_avatar/photo/upload`, {
    method: "POST",
    headers: heygenHeaders(),
    body: JSON.stringify({ image_url: imageUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HeyGen photo upload failed: ${(err as any).message || res.statusText}`);
  }
  const data = await res.json() as { data: { photo_avatar_id: string } };
  return data.data.photo_avatar_id;
}

/**
 * Generate a talking photo video from a photo avatar ID and script.
 * This is the "Quick Avatar" path — no training required.
 */
export async function generateTalkingPhotoVideo(opts: {
  photoAvatarId: string;
  script: string;
  voiceId?: string;
  title?: string;
}): Promise<string> {
  const { photoAvatarId, script, voiceId = "en-US-JennyNeural", title } = opts;

  const res = await fetch(`${HEYGEN_API}/v2/video/generate`, {
    method: "POST",
    headers: heygenHeaders(),
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "talking_photo",
            talking_photo_id: photoAvatarId,
          },
          voice: {
            type: "text",
            input_text: script,
            voice_id: voiceId,
          },
          background: {
            type: "color",
            value: "#1a1a2e",
          },
        },
      ],
      title: title || "Avatar Video",
      dimension: { width: 720, height: 1280 }, // Vertical 9:16 for social
      aspect_ratio: null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HeyGen video generation failed: ${(err as any).message || res.statusText}`);
  }

  const data = await res.json() as { data: { video_id: string } };
  return data.data.video_id;
}

// ─── Custom Avatar (trained digital twin, V3-equivalent) ─────────────────────

/**
 * Upload a training video to create a custom HeyGen avatar.
 * Returns the avatar_id — training happens asynchronously.
 */
export async function createCustomAvatar(opts: {
  trainingVideoUrl: string;
  name?: string;
}): Promise<{ avatarId: string; status: string }> {
  const res = await fetch(`${HEYGEN_API}/v2/photo_avatar/video/upload`, {
    method: "POST",
    headers: heygenHeaders(),
    body: JSON.stringify({
      video_url: opts.trainingVideoUrl,
      name: opts.name || "My Digital Twin",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HeyGen avatar training failed: ${(err as any).message || res.statusText}`);
  }

  const data = await res.json() as { data: { photo_avatar_id: string; status: string } };
  return {
    avatarId: data.data.photo_avatar_id,
    status: data.data.status || "processing",
  };
}

/**
 * Check the training status of a custom avatar.
 */
export async function getCustomAvatarStatus(avatarId: string): Promise<{
  status: "processing" | "completed" | "failed";
  previewImageUrl?: string;
}> {
  const res = await fetch(`${HEYGEN_API}/v2/photo_avatar/${avatarId}`, {
    headers: heygenHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HeyGen avatar status check failed: ${(err as any).message || res.statusText}`);
  }

  const data = await res.json() as {
    data: { status: string; preview_image_url?: string };
  };

  const rawStatus = data.data.status;
  const status =
    rawStatus === "completed" || rawStatus === "ready" || rawStatus === "success"
      ? "completed"
      : rawStatus === "failed" || rawStatus === "error"
      ? "failed"
      : "processing";

  return { status, previewImageUrl: data.data.preview_image_url };
}

/**
 * Generate a video using a trained custom avatar.
 */
export async function generateCustomAvatarVideo(opts: {
  avatarId: string;
  script: string;
  voiceId?: string;
  title?: string;
  landscape?: boolean;
}): Promise<string> {
  const { avatarId, script, voiceId = "en-US-JennyNeural", title, landscape = false } = opts;

  const res = await fetch(`${HEYGEN_API}/v2/video/generate`, {
    method: "POST",
    headers: heygenHeaders(),
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "talking_photo",
            talking_photo_id: avatarId,
          },
          voice: {
            type: "text",
            input_text: script,
            voice_id: voiceId,
          },
          background: {
            type: "color",
            value: "#1a1a2e",
          },
        },
      ],
      title: title || "Custom Avatar Video",
      dimension: landscape
        ? { width: 1280, height: 720 }
        : { width: 720, height: 1280 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HeyGen custom avatar video failed: ${(err as any).message || res.statusText}`);
  }

  const data = await res.json() as { data: { video_id: string } };
  return data.data.video_id;
}

// ─── Video status polling ─────────────────────────────────────────────────────

/**
 * Get the current status of a HeyGen video generation job.
 */
export async function getVideoStatus(videoId: string): Promise<HeyGenVideoStatus> {
  const res = await fetch(`${HEYGEN_API}/v1/video_status.get?video_id=${videoId}`, {
    headers: heygenHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HeyGen status check failed: ${(err as any).message || res.statusText}`);
  }

  const data = await res.json() as {
    data: {
      video_id: string;
      status: string;
      video_url?: string;
      thumbnail_url?: string;
      duration?: number;
      error?: string;
    };
  };

  const d = data.data;
  const status: HeyGenVideoStatus["status"] =
    d.status === "completed" ? "completed"
    : d.status === "failed" ? "failed"
    : d.status === "processing" ? "processing"
    : "pending";

  return {
    video_id: d.video_id,
    status,
    video_url: d.video_url,
    thumbnail_url: d.thumbnail_url,
    duration: d.duration,
    error: d.error,
  };
}

/**
 * Poll until a HeyGen video is completed or failed.
 * Resolves with the final video URL.
 */
export async function waitForHeyGenVideo(
  videoId: string,
  timeoutMs = 600_000,
  intervalMs = 5_000
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const status = await getVideoStatus(videoId);
    if (status.status === "completed" && status.video_url) {
      return status.video_url;
    }
    if (status.status === "failed") {
      throw new Error(`HeyGen video generation failed: ${status.error || "Unknown error"}`);
    }
  }
  throw new Error("HeyGen video generation timed out after 10 minutes");
}

// ─── Voice helpers ────────────────────────────────────────────────────────────

/**
 * List available HeyGen voices (cached-friendly — call once at startup if needed).
 */
export async function listHeyGenVoices(): Promise<
  Array<{ voice_id: string; language: string; name: string; gender: string }>
> {
  const res = await fetch(`${HEYGEN_API}/v2/voices`, {
    headers: heygenHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json() as { data: { voices: any[] } };
  return data.data?.voices || [];
}
