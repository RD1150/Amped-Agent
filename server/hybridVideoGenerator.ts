import { imageToVideo } from "./_core/runwayAi";
import { selectHeroPhotos, getRecommendedHeroCount } from "./heroPhotoSelector";
import type { VideoGenerationOptions } from "./videoGenerator";

/**
 * Generate AI-enhanced video clips for hero photos using Luma AI
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
  const videoPromises = heroPhotos.map(async (hero) => {
    try {
      console.log(`[HybridVideoGen] Generating AI video for: ${hero.url}`);
      
      // Use custom prompt if provided, otherwise generate based on photo type
      const prompt = customCameraPrompt || generateCinematicPrompt(hero.reason);
      
      if (customCameraPrompt) {
        console.log(`[HybridVideoGen] Using custom camera prompt: "${customCameraPrompt}"`);
      }
      
      // Generate video with Runway ML
      const videoUrl = await imageToVideo(hero.url, prompt, {
        aspectRatio,
        duration: 10, // 10 seconds (max) for more dramatic cinematic effect
      });
      
      console.log(`[HybridVideoGen] ✓ Generated AI video: ${videoUrl}`);
      
      return { imageUrl: hero.url, videoUrl };
    } catch (error) {
      console.error(`[HybridVideoGen] ✗ Failed to generate AI video for ${hero.url}:`, error);
      // Return null to fall back to Ken Burns for this photo
      return { imageUrl: hero.url, videoUrl: null };
    }
  });
  
  // Wait for all generations to complete
  const results = await Promise.all(videoPromises);
  
  // Build map of image URL to video URL
  const videoMap = new Map<string, string>();
  results.forEach(({ imageUrl, videoUrl }) => {
    if (videoUrl) {
      videoMap.set(imageUrl, videoUrl);
    }
  });
  
  console.log(`[HybridVideoGen] Successfully generated ${videoMap.size}/${heroPhotos.length} AI videos`);
  
  return videoMap;
}

/**
 * Generate cinematic prompt based on photo type
 */
function generateCinematicPrompt(photoReason: string): string {
  const prompts: Record<string, string> = {
    "Exterior/facade shot": "Dramatic crane shot swooping down from above revealing the architectural masterpiece, golden hour cinematic lighting, Hollywood-style real estate cinematography",
    "Main living area": "FPV drone racing smoothly through the living space with dynamic perspective, revealing luxurious depth and dramatic natural lighting",
    "Kitchen": "Orbiting 360-degree camera movement circling around the kitchen island, showcasing modern appliances and elegant design from all angles",
    "Master/primary suite": "Cinematic dolly zoom (vertigo effect) emphasizing the bedroom's grandeur and luxury, dramatic lighting transition",
    "Water feature": "Sweeping aerial crane shot descending toward the water with cinematic reflections and serene ambiance, sunset lighting",
    "Outdoor living space": "Dynamic FPV drone shot gliding through the outdoor space, revealing entertainment areas with cinematic flair",
    "Dining area": "Elegant orbiting camera movement around the dining table, Hollywood-style lighting revealing sophisticated design",
    "Bedroom": "Smooth tracking shot with subtle push-in revealing the bedroom's comfort, warm cinematic lighting",
    "Bathroom": "Dramatic crane shot descending to showcase the spa-like bathroom, luxury fixtures with cinematic lighting",
  };
  
  return prompts[photoReason] || "Epic cinematic camera movement with dramatic lighting revealing the space, Hollywood-style real estate videography";
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
