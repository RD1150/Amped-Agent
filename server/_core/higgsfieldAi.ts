/**
 * Higgsfield Cloud API — Image-to-Video generation
 * Base URL: https://api.higgsfield.ai/v1/generations
 * Auth: Bearer token (HIGGSFIELD_API_KEY)
 * Polling: GET /v1/generations/{id}
 *
 * Used to replace Runway for Cinematic Walkthrough clip generation.
 * Higgsfield produces genuine AI motion (parallax, fly-through, camera movement)
 * rather than Ken Burns pan/zoom on stills.
 */

import { ENV } from "./env";

const HIGGSFIELD_BASE = "https://api.higgsfield.ai/v1";

// ── Motion presets mapped to real estate room types ──────────────────────────
// These are cinematic camera movement descriptions optimised for property tours.
// Even-index clips move left-to-right / forward; odd-index clips reverse direction
// to simulate physically turning through doorways.
const ROOM_MOTION_PROMPTS: Record<string, { primary: string; secondary: string }> = {
  exterior_front: {
    primary:
      "Slow cinematic crane shot rising up and tilting down to reveal the full facade, golden hour light, dramatic sky, ultra smooth",
    secondary:
      "Slow dolly shot pushing forward toward the front entrance, depth of field, warm afternoon light, cinematic",
  },
  exterior_back: {
    primary:
      "Wide lateral tracking shot panning left to right across the backyard and exterior, lush greenery, smooth and cinematic",
    secondary:
      "Slow push-in toward the back patio, warm light, smooth camera movement, resort-style feel",
  },
  living_room: {
    primary:
      "Smooth dolly push-in from the entryway revealing the full living room, warm natural light flooding through windows, cinematic depth of field",
    secondary:
      "Slow lateral tracking shot right to left across the living room, revealing fireplace and windows, warm ambient light",
  },
  kitchen: {
    primary:
      "Smooth tracking shot gliding left to right along the kitchen island, bright and airy, revealing appliances and cabinetry, cinematic",
    secondary:
      "Slow push-in toward the kitchen from the dining area, warm light on countertops, smooth and professional",
  },
  dining_room: {
    primary:
      "Elegant lateral pan left to right revealing the full dining table and chandelier, warm golden light, smooth cinematic movement",
    secondary:
      "Slow dolly push-in toward the dining table, soft ambient light, depth of field, inviting atmosphere",
  },
  master_bedroom: {
    primary:
      "Slow cinematic dolly push-in from the doorway revealing the master bedroom, soft morning light, luxurious and serene",
    secondary:
      "Smooth lateral pan right to left across the master bedroom, revealing bed and windows, soft natural light",
  },
  bedroom: {
    primary:
      "Smooth push-in from the doorway revealing the full bedroom, natural light, calm and inviting, cinematic depth of field",
    secondary:
      "Lateral tracking shot left to right across the bedroom, natural light, smooth camera movement",
  },
  master_bathroom: {
    primary:
      "Slow cinematic push-in revealing the master bathroom vanity and spa features, bright and clean, luxury feel",
    secondary:
      "Smooth lateral pan across the bathroom, revealing fixtures and finishes, spa-like atmosphere",
  },
  bathroom: {
    primary:
      "Smooth push-in revealing the bathroom, clean and bright, steady cinematic camera movement",
    secondary:
      "Lateral pan across bathroom fixtures, bright and clean, smooth camera movement",
  },
  office: {
    primary:
      "Lateral tracking shot left to right across the home office, revealing built-ins and desk, professional and focused, cinematic",
    secondary:
      "Slow push-in toward the desk from the doorway, warm light, professional atmosphere",
  },
  garage: {
    primary:
      "Wide lateral pan left to right across the garage interior, clean and spacious, smooth cinematic movement",
    secondary:
      "Slow push-in into the garage from the entrance, revealing the full space, clean and bright",
  },
  pool: {
    primary:
      "Smooth low-angle tracking shot along the pool edge, water shimmering in sunlight, resort-style feel, cinematic",
    secondary:
      "Slow crane-style rise above the pool area, revealing the full outdoor space, golden light",
  },
  view: {
    primary:
      "Slow cinematic pan left to right across the panoramic view, wide and breathtaking, steady and majestic",
    secondary:
      "Slow tilt up from foreground to reveal the full panoramic view, dramatic and cinematic",
  },
  other: {
    primary:
      "Smooth cinematic push-in from the doorway revealing the full space, natural light, professional camera movement",
    secondary:
      "Lateral tracking shot revealing the space, steady and professional, cinematic depth of field",
  },
};

export function getHiggsfieldMotionPrompt(
  roomType: string,
  clipIndex: number,
  customPrompt?: string,
  isExterior?: boolean
): string {
  if (customPrompt) return customPrompt;
  const key = isExterior ? "exterior_front" : (ROOM_MOTION_PROMPTS[roomType] ? roomType : "other");
  const prompts = ROOM_MOTION_PROMPTS[key];
  return clipIndex % 2 === 0 ? prompts.primary : prompts.secondary;
}

// ── API types ─────────────────────────────────────────────────────────────────
interface HiggsfieldGenerationResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  output?: string;
  error?: string;
}

// ── Submit image-to-video generation ─────────────────────────────────────────
export async function submitHiggsfieldGeneration(
  imageUrl: string,
  prompt: string,
  attempt = 1
): Promise<string> {
  const payload = {
    task: "image-to-video",
    model: "default-video-model",
    input_image: imageUrl,
    duration: 5,
    fps: 24,
    motion_intensity: "medium",
    prompt,
  };

  const response = await fetch(`${HIGGSFIELD_BASE}/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.HIGGSFIELD_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  // Rate limit handling
  if (response.status === 429 && attempt <= 3) {
    const waitMs = attempt * 15000;
    console.log(`[Higgsfield] Rate limited, waiting ${waitMs / 1000}s before retry ${attempt + 1}...`);
    await new Promise((r) => setTimeout(r, waitMs));
    return submitHiggsfieldGeneration(imageUrl, prompt, attempt + 1);
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Higgsfield API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as HiggsfieldGenerationResponse;
  if (!data.id) {
    throw new Error("Higgsfield did not return a generation ID");
  }

  console.log(`[Higgsfield] Generation submitted: ${data.id}`);
  return data.id;
}

// ── Poll until complete and return video URL ──────────────────────────────────
export async function pollHiggsfieldGeneration(
  generationId: string,
  maxWaitMs = 300000
): Promise<string> {
  const start = Date.now();
  const interval = 8000;

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, interval));

    const res = await fetch(`${HIGGSFIELD_BASE}/generations/${generationId}`, {
      headers: {
        Authorization: `Bearer ${ENV.HIGGSFIELD_API_KEY}`,
      },
    });

    if (!res.ok) {
      console.log(`[Higgsfield] Poll error ${res.status} for ${generationId}`);
      continue;
    }

    const data = (await res.json()) as HiggsfieldGenerationResponse;
    console.log(`[Higgsfield] ${generationId} status: ${data.status}`);

    if (data.status === "completed") {
      if (!data.output) {
        throw new Error("Higgsfield completed but returned no output URL");
      }
      console.log(`[Higgsfield] ✓ Clip ready: ${data.output}`);
      return data.output;
    }

    if (data.status === "failed") {
      throw new Error(`Higgsfield generation failed: ${data.error ?? "Unknown error"}`);
    }
  }

  throw new Error(`Higgsfield generation timed out after ${maxWaitMs / 1000}s`);
}

// ── Convenience: submit + poll in one call ────────────────────────────────────
export async function generateHiggsfieldClip(
  imageUrl: string,
  roomType: string,
  clipIndex: number,
  customPrompt?: string,
  isExterior?: boolean
): Promise<string> {
  const prompt = getHiggsfieldMotionPrompt(roomType, clipIndex, customPrompt, isExterior);
  console.log(`[Higgsfield] Generating clip for ${roomType} (index ${clipIndex}): ${prompt.substring(0, 80)}...`);

  // Small stagger between clips to avoid burst rate limits
  if (clipIndex > 0) {
    await new Promise((r) => setTimeout(r, 2000));
  }

  const generationId = await submitHiggsfieldGeneration(imageUrl, prompt);
  return await pollHiggsfieldGeneration(generationId);
}
