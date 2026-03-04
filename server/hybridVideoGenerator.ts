import { imageToVideo as klingImageToVideo, getCameraControlForRoom } from "./_core/klingAi";
import { imageToVideo as lumaImageToVideo } from "./_core/lumaAi";
import { imageToVideo as runwayImageToVideo } from "./_core/runwayAi";
import { ENV } from "./_core/env";
import { selectHeroPhotos, getRecommendedHeroCount } from "./heroPhotoSelector";
import type { VideoGenerationOptions } from "./videoGenerator";

/**
 * Generate AI-enhanced video clips for hero photos using Kling AI (primary)
 * Falls back to Luma AI, then Runway ML if Kling is unavailable
 * Returns map of image URL to generated video URL
 */
export async function generateHeroVideoClips(
  imageUrls: string[],
  heroCount: number,
  aspectRatio: "16:9" | "9:16" | "1:1" = "16:9",
  customCameraPrompt?: string
): Promise<Map<string, string>> {
  // Select hero photos
  const heroPhotos = selectHeroPhotos(imageUrls, heroCount);

  console.log(`[HybridVideoGen] Selected ${heroPhotos.length} hero photos for AI treatment`);
  heroPhotos.forEach((hero, i) => {
    console.log(`  ${i + 1}. ${hero.reason} (score: ${hero.score})`);
  });

  // Generate AI videos for each hero photo in parallel
  const videoPromises = heroPhotos.map(async (hero, index) => {
    try {
      console.log(`[HybridVideoGen] ========== AI VIDEO ${index + 1}/${heroPhotos.length} ==========`);
      console.log(`[HybridVideoGen] Image URL: ${hero.url}`);
      console.log(`[HybridVideoGen] Room type: ${hero.reason}`);

      const startTime = Date.now();
      let videoUrl: string;
      let engine = "unknown";

      // === PRIMARY: Kling AI with camera_control ===
      if (ENV.KLING_ACCESS_KEY && ENV.KLING_SECRET_KEY) {
        try {
          console.log(`[HybridVideoGen] Using Kling AI with camera_control for "${hero.reason}"...`);
          const cameraControl = getCameraControlForRoom(hero.reason);
          console.log(`[HybridVideoGen] Camera movement: ${cameraControl.type}`);

          videoUrl = await klingImageToVideo(hero.url, hero.reason, {
            aspectRatio,
            duration: "5",
            model: "kling-v1-5",
            mode: "std",
            prompt: customCameraPrompt || undefined,
          });
          engine = `Kling AI (${cameraControl.type})`;
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`[HybridVideoGen] ✓ Kling AI SUCCESS in ${elapsed}s: ${videoUrl}`);
        } catch (klingError) {
          console.warn(`[HybridVideoGen] Kling AI failed: ${klingError instanceof Error ? klingError.message : String(klingError)}`);
          console.log(`[HybridVideoGen] Falling back to Luma AI...`);

          // === FALLBACK 1: Luma AI ===
          if (ENV.LUMA_API_KEY) {
            try {
              const prompt = customCameraPrompt || generateCinematicPrompt(hero.reason);
              videoUrl = await lumaImageToVideo(hero.url, prompt, {
                aspectRatio,
                resolution: "720p",
                model: "ray-flash-2",
              });
              engine = "Luma AI (fallback)";
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
              console.log(`[HybridVideoGen] ✓ Luma AI SUCCESS in ${elapsed}s: ${videoUrl}`);
            } catch (lumaError) {
              console.warn(`[HybridVideoGen] Luma AI failed: ${lumaError instanceof Error ? lumaError.message : String(lumaError)}`);
              console.log(`[HybridVideoGen] Falling back to Runway ML...`);

              // === FALLBACK 2: Runway ML ===
              const prompt = customCameraPrompt || generateCinematicPrompt(hero.reason);
              videoUrl = await runwayImageToVideo(hero.url, prompt, {
                aspectRatio,
                duration: 5,
              });
              engine = "Runway ML (fallback)";
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
              console.log(`[HybridVideoGen] ✓ Runway ML SUCCESS in ${elapsed}s: ${videoUrl}`);
            }
          } else {
            // === FALLBACK 2: Runway ML (no Luma key) ===
            const prompt = customCameraPrompt || generateCinematicPrompt(hero.reason);
            videoUrl = await runwayImageToVideo(hero.url, prompt, {
              aspectRatio,
              duration: 5,
            });
            engine = "Runway ML (fallback)";
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[HybridVideoGen] ✓ Runway ML SUCCESS in ${elapsed}s: ${videoUrl}`);
          }
        }
      } else if (ENV.LUMA_API_KEY) {
        // No Kling key, try Luma
        console.log(`[HybridVideoGen] No Kling key, using Luma AI...`);
        const prompt = customCameraPrompt || generateCinematicPrompt(hero.reason);
        videoUrl = await lumaImageToVideo(hero.url, prompt, {
          aspectRatio,
          resolution: "720p",
          model: "ray-flash-2",
        });
        engine = "Luma AI";
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[HybridVideoGen] ✓ Luma AI SUCCESS in ${elapsed}s: ${videoUrl}`);
      } else {
        // Last resort: Runway
        console.log(`[HybridVideoGen] No Kling/Luma key, using Runway ML...`);
        const prompt = customCameraPrompt || generateCinematicPrompt(hero.reason);
        videoUrl = await runwayImageToVideo(hero.url, prompt, {
          aspectRatio,
          duration: 5,
        });
        engine = "Runway ML";
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[HybridVideoGen] ✓ Runway ML SUCCESS in ${elapsed}s: ${videoUrl}`);
      }

      console.log(`[HybridVideoGen] Engine used: ${engine}`);
      console.log(`[HybridVideoGen] ==========================================`);

      return { imageUrl: hero.url, videoUrl, engine, success: true };
    } catch (error) {
      console.error(`[HybridVideoGen] ========== AI VIDEO ${index + 1}/${heroPhotos.length} FAILED ==========`);
      console.error(`[HybridVideoGen] ✗ ALL AI engines failed for ${hero.url}`);
      console.error(`[HybridVideoGen] Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[HybridVideoGen] FALLING BACK TO KEN BURNS for this photo`);
      console.error(`[HybridVideoGen] ==========================================`);
      return {
        imageUrl: hero.url,
        videoUrl: null,
        engine: "Ken Burns (fallback)",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Wait for all generations to complete
  const results = await Promise.all(videoPromises);

  // Build map of image URL to video URL
  const videoMap = new Map<string, string>();
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  results.forEach(({ imageUrl, videoUrl }) => {
    if (videoUrl) {
      videoMap.set(imageUrl, videoUrl);
    }
  });

  console.log(`[HybridVideoGen] ==========================================`);
  console.log(`[HybridVideoGen] FINAL RESULTS:`);
  console.log(`[HybridVideoGen] - Total hero photos: ${heroPhotos.length}`);
  console.log(`[HybridVideoGen] - Successful AI generations: ${successCount}`);
  console.log(`[HybridVideoGen] - Failed (Ken Burns fallback): ${failureCount}`);
  console.log(`[HybridVideoGen] - AI videos in final render: ${videoMap.size}`);
  results.forEach((r, i) => {
    console.log(`[HybridVideoGen]   ${i + 1}. ${r.engine} → ${r.success ? "✓" : "✗"}`);
  });

  if (failureCount > 0) {
    console.warn(`[HybridVideoGen] WARNING: ${failureCount} photos fell back to Ken Burns!`);
  }

  console.log(`[HybridVideoGen] ==========================================`);

  return videoMap;
}

/**
 * Generate cinematic prompt based on photo type (used for Luma/Runway fallback)
 */
function generateCinematicPrompt(photoReason: string): string {
  const prompts: Record<string, string> = {
    "Exterior/facade shot": "Dramatic crane shot swooping down from above revealing the architectural masterpiece, golden hour cinematic lighting",
    "Main living area": "Smooth forward dolly through the living space revealing luxurious depth and dramatic natural lighting",
    "Kitchen": "Camera glides through the kitchen revealing premium appliances and elegant design from all angles",
    "Master/primary suite": "Gentle push-in revealing the bedroom's grandeur and luxury, warm cinematic lighting",
    "Water feature": "Sweeping camera descending toward the water with cinematic reflections and serene ambiance",
    "Outdoor living space": "Dynamic camera gliding through the outdoor space, revealing entertainment areas",
    "Dining area": "Elegant camera movement around the dining area, revealing sophisticated design",
    "Bedroom": "Smooth tracking shot with subtle push-in revealing the bedroom's comfort",
    "Bathroom": "Camera slowly reveals the spa-like bathroom with luxury fixtures",
  };

  return (
    prompts[photoReason] ||
    "Smooth cinematic camera movement revealing the beautiful space with professional real estate videography"
  );
}

/**
 * Determine hero count based on video mode and photo count
 */
export function getHeroCountForMode(
  videoMode: "standard" | "ai-enhanced" | "full-ai",
  totalPhotos: number
): number {
  switch (videoMode) {
    case "standard":
      return 0; // No AI videos, all Ken Burns
    case "ai-enhanced":
      return getRecommendedHeroCount(totalPhotos); // 3-5 hero shots
    case "full-ai":
      return totalPhotos; // All photos get AI treatment
    default:
      return 0;
  }
}

/**
 * Check if an image should use AI-generated video or Ken Burns
 */
export function shouldUseAIVideo(
  imageUrl: string,
  aiVideoMap: Map<string, string>
): boolean {
  return aiVideoMap.has(imageUrl);
}

/**
 * Get AI-generated video URL for an image, or null if not available
 */
export function getAIVideoUrl(
  imageUrl: string,
  aiVideoMap: Map<string, string>
): string | null {
  return aiVideoMap.get(imageUrl) || null;
}
