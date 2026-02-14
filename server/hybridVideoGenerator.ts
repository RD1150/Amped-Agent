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
  aspectRatio: "16:9" | "9:16" | "1:1" = "16:9"
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
      
      // Create cinematic prompt based on photo type
      const prompt = generateCinematicPrompt(hero.reason);
      
      // Generate video with Runway ML
      const videoUrl = await imageToVideo(hero.url, prompt, {
        aspectRatio,
        duration: 5, // 5 seconds for cost efficiency
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
    "Exterior/facade shot": "Cinematic slow push-in camera movement revealing the architectural details, golden hour lighting, professional real estate cinematography",
    "Main living area": "Smooth dolly shot moving through the living space, revealing the room's depth and natural lighting",
    "Kitchen": "Elegant crane shot descending to reveal the kitchen's layout and modern appliances",
    "Master/primary suite": "Gentle tracking shot showcasing the bedroom's spaciousness and luxury details",
    "Water feature": "Serene camera movement with subtle water ripples and reflections, peaceful ambiance",
    "Outdoor living space": "Sweeping pan across the outdoor area with natural elements gently swaying",
    "Dining area": "Smooth arc shot around the dining space, highlighting the room's elegance",
    "Bedroom": "Calm dolly shot revealing the bedroom's comfort and natural light",
    "Bathroom": "Sophisticated camera movement showcasing the bathroom's modern fixtures and design",
  };
  
  return prompts[photoReason] || "Cinematic camera movement revealing the space with professional real estate videography style";
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
