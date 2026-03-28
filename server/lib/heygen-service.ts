/**
 * HeyGen API service for Full Avatar Video generation.
 * Docs: https://docs.heygen.com/reference
 *
 * Confirmed working endpoints (tested 2026-03-28):
 *   Upload asset:        POST https://upload.heygen.com/v1/asset  (raw binary, Content-Type header)
 *   Create avatar group: POST https://api.heygen.com/v2/photo_avatar/avatar_group/create
 *   Avatar group status: GET  https://api.heygen.com/v2/photo_avatar/avatar_group/{id}
 *   Generate video:      POST https://api.heygen.com/v2/video/generate
 *   Video status:        GET  https://api.heygen.com/v1/video_status.get?video_id={id}
 *   List avatars:        GET  https://api.heygen.com/v2/avatars
 *   List voices:         GET  https://api.heygen.com/v2/voices
 */

const HEYGEN_API = "https://api.heygen.com";
const HEYGEN_UPLOAD_API = "https://upload.heygen.com";

function apiKey(): string {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error("HEYGEN_API_KEY is not configured");
  return key;
}

function heygenHeaders(extra?: Record<string, string>) {
  return {
    "X-Api-Key": apiKey(),
    "Content-Type": "application/json",
    accept: "application/json",
    ...extra,
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

// ─── Asset Upload ─────────────────────────────────────────────────────────────

/**
 * Upload raw binary (image or video) to HeyGen's asset store.
 * Returns the image_key (for photos) or asset id (for video).
 *
 * The caller must pass the raw bytes and the correct MIME type.
 */
export async function uploadHeyGenAsset(
  buffer: Buffer | Uint8Array,
  mimeType: "image/jpeg" | "image/png" | "video/mp4" | "video/webm" | "audio/mpeg"
): Promise<{ id: string; image_key?: string; url: string }> {
  const res = await fetch(`${HEYGEN_UPLOAD_API}/v1/asset`, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey(),
      "Content-Type": mimeType,
      accept: "application/json",
    },
    body: buffer as unknown as BodyInit,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HeyGen asset upload failed (${res.status}): ${text}`);
  }

  const data = await res.json() as {
    code: number;
    data: { id: string; image_key?: string; url: string };
  };

  if (data.code !== 100) {
    throw new Error(`HeyGen asset upload error: ${JSON.stringify(data)}`);
  }

  return data.data;
}

// ─── Quick Avatar (photo → talking head) ─────────────────────────────────────

/**
 * Upload a photo (from a URL) to HeyGen and create a photo avatar group.
 * Returns the group_id which is used as the avatar_id in video generation.
 *
 * Flow:
 *   1. Download the image from imageUrl
 *   2. Upload raw bytes to upload.heygen.com/v1/asset → get image_key
 *   3. Create avatar group with image_key → get group_id
 */
export async function createPhotoAvatarFromUrl(
  imageUrl: string,
  name = "My Avatar"
): Promise<string> {
  // Step 1: Download the image
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.statusText}`);
  const contentType = imgRes.headers.get("content-type") || "image/jpeg";
  const mimeType = contentType.includes("png") ? "image/png" : "image/jpeg";
  const buffer = Buffer.from(await imgRes.arrayBuffer());

  // Step 2: Upload to HeyGen
  const asset = await uploadHeyGenAsset(buffer, mimeType as "image/jpeg" | "image/png");
  if (!asset.image_key) throw new Error("HeyGen upload did not return image_key");

  // Step 3: Create avatar group
  const res = await fetch(`${HEYGEN_API}/v2/photo_avatar/avatar_group/create`, {
    method: "POST",
    headers: heygenHeaders(),
    body: JSON.stringify({ name, image_key: asset.image_key }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HeyGen avatar group creation failed: ${JSON.stringify(err)}`);
  }

  const data = await res.json() as { data: { group_id: string } };
  return data.data.group_id;
}

/**
 * Generate a talking photo video from a photo avatar group ID and script.
 * This is the "Quick Avatar" path — no training required.
 */
export async function generateTalkingPhotoVideo(opts: {
  photoAvatarId: string;
  script: string;
  voiceId?: string;
  title?: string;
  landscape?: boolean;
}): Promise<string> {
  const {
    photoAvatarId,
    script,
    voiceId = "1bd001e7e50f421d891986aad5158bc8",
    title,
    landscape = false,
  } = opts;

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
      dimension: landscape ? { width: 1280, height: 720 } : { width: 720, height: 1280 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HeyGen video generation failed: ${JSON.stringify(err)}`);
  }

  const data = await res.json() as { data: { video_id: string } };
  return data.data.video_id;
}

// ─── Custom Avatar (trained digital twin) ────────────────────────────────────

/**
 * Upload a training video (from a URL already on S3) to HeyGen and start training.
 * Returns the avatar group_id — training happens asynchronously.
 *
 * Flow:
 *   1. Download the video from trainingVideoUrl
 *   2. Upload raw bytes to upload.heygen.com/v1/asset → get asset id
 *   3. Create avatar group with image_key (HeyGen uses same endpoint for video)
 */
export async function createCustomAvatar(opts: {
  trainingVideoUrl: string;
  name?: string;
}): Promise<{ avatarId: string; status: string }> {
  const { trainingVideoUrl, name = "My Digital Twin" } = opts;

  // Step 1: Download the video
  const vidRes = await fetch(trainingVideoUrl);
  if (!vidRes.ok) throw new Error(`Failed to download training video: ${vidRes.statusText}`);
  const contentType = vidRes.headers.get("content-type") || "video/mp4";
  const mimeType = contentType.includes("webm") ? "video/webm" : "video/mp4";
  const buffer = Buffer.from(await vidRes.arrayBuffer());

  // Step 2: Upload to HeyGen
  const asset = await uploadHeyGenAsset(buffer, mimeType as "video/mp4" | "video/webm");

  // Step 3: Create avatar group (HeyGen uses image_key field for both image and video keys)
  const imageKey = asset.image_key || asset.id;
  const res = await fetch(`${HEYGEN_API}/v2/photo_avatar/avatar_group/create`, {
    method: "POST",
    headers: heygenHeaders(),
    body: JSON.stringify({ name, image_key: imageKey }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HeyGen custom avatar creation failed: ${JSON.stringify(err)}`);
  }

  const data = await res.json() as { data: { group_id: string; status: string } };
  return {
    avatarId: data.data.group_id,
    status: data.data.status || "pending",
  };
}

/**
 * Check the training status of a custom avatar group.
 */
export async function getCustomAvatarStatus(avatarGroupId: string): Promise<{
  status: "processing" | "completed" | "failed";
  previewImageUrl?: string;
}> {
  const res = await fetch(`${HEYGEN_API}/v2/photo_avatar/avatar_group/${avatarGroupId}`, {
    headers: heygenHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`HeyGen avatar status check failed: ${JSON.stringify(err)}`);
  }

  const data = await res.json() as {
    data: { status: string; image_url?: string };
  };

  const rawStatus = data.data.status;
  const status: "processing" | "completed" | "failed" =
    rawStatus === "completed" || rawStatus === "ready" || rawStatus === "success"
      ? "completed"
      : rawStatus === "failed" || rawStatus === "error"
      ? "failed"
      : "processing";

  return { status, previewImageUrl: data.data.image_url };
}

/**
 * Generate a video using a trained custom avatar group.
 */
export async function generateCustomAvatarVideo(opts: {
  avatarId: string;
  script: string;
  voiceId?: string;
  title?: string;
  landscape?: boolean;
}): Promise<string> {
  // Custom avatar uses same talking_photo endpoint with the group_id
  return generateTalkingPhotoVideo({
    photoAvatarId: opts.avatarId,
    script: opts.script,
    voiceId: opts.voiceId,
    title: opts.title,
    landscape: opts.landscape,
  });
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
    throw new Error(`HeyGen status check failed: ${JSON.stringify(err)}`);
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
 * List available HeyGen voices.
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
