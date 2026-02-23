/**
 * Smart hero photo selection algorithm for property tours
 * Selects 3-5 best photos to apply Luma AI cinematic effects
 */

export interface PhotoScore {
  url: string;
  score: number;
  reason: string;
}

/**
 * Analyze photo filename/URL to determine importance
 */
function scorePhotoByName(url: string): { score: number; reason: string } {
  const lowerUrl = url.toLowerCase();
  
  // High priority: Exterior/facade shots
  if (lowerUrl.includes("exterior") || lowerUrl.includes("facade") || lowerUrl.includes("front")) {
    return { score: 100, reason: "Exterior/facade shot" };
  }
  
  // High priority: Living room/main living area
  if (lowerUrl.includes("living") || lowerUrl.includes("family room")) {
    return { score: 95, reason: "Main living area" };
  }
  
  // High priority: Kitchen
  if (lowerUrl.includes("kitchen")) {
    return { score: 90, reason: "Kitchen" };
  }
  
  // Medium-high: Master bedroom/bathroom
  if (lowerUrl.includes("master") || lowerUrl.includes("primary")) {
    return { score: 85, reason: "Master/primary suite" };
  }
  
  // Medium-high: Pool/water features
  if (lowerUrl.includes("pool") || lowerUrl.includes("spa") || lowerUrl.includes("water")) {
    return { score: 80, reason: "Water feature" };
  }
  
  // Medium: Backyard/outdoor living
  if (lowerUrl.includes("backyard") || lowerUrl.includes("patio") || lowerUrl.includes("deck")) {
    return { score: 75, reason: "Outdoor living space" };
  }
  
  // Medium: Dining room
  if (lowerUrl.includes("dining")) {
    return { score: 70, reason: "Dining area" };
  }
  
  // Medium-low: Bedrooms
  if (lowerUrl.includes("bedroom") || lowerUrl.includes("bed")) {
    return { score: 60, reason: "Bedroom" };
  }
  
  // Medium-low: Bathrooms
  if (lowerUrl.includes("bathroom") || lowerUrl.includes("bath")) {
    return { score: 55, reason: "Bathroom" };
  }
  
  // Low: Other rooms
  if (lowerUrl.includes("office") || lowerUrl.includes("den") || lowerUrl.includes("study")) {
    return { score: 50, reason: "Office/den" };
  }
  
  // Low: Garage/utility
  if (lowerUrl.includes("garage") || lowerUrl.includes("laundry")) {
    return { score: 40, reason: "Utility space" };
  }
  
  // Default: Unknown
  return { score: 30, reason: "General photo" };
}

/**
 * Select 3-5 hero photos from a list of property photos
 * Returns photos that will get Luma AI cinematic treatment
 */
export function selectHeroPhotos(photoUrls: string[], targetCount: number = 4): PhotoScore[] {
  // Score all photos
  const scoredPhotos: PhotoScore[] = photoUrls.map((url) => {
    const { score, reason } = scorePhotoByName(url);
    return { url, score, reason };
  });
  
  // Sort by score (highest first)
  scoredPhotos.sort((a, b) => b.score - a.score);
  
  // Ensure we have at least the first photo (exterior/main shot)
  if (scoredPhotos.length === 0) {
    return [];
  }
  
  // Clamp target count between 3 and 5
  const clampedCount = Math.max(3, Math.min(5, targetCount));
  
  // Return top N photos, but don't exceed total available
  const heroCount = Math.min(clampedCount, scoredPhotos.length);
  
  return scoredPhotos.slice(0, heroCount);
}

/**
 * Determine if a photo should get AI treatment based on its position
 */
export function isHeroPhoto(photoUrl: string, allPhotos: string[], heroPhotos: PhotoScore[]): boolean {
  const heroUrls = new Set(heroPhotos.map((p) => p.url));
  return heroUrls.has(photoUrl);
}

/**
 * Get recommended count of hero photos based on total photo count
 */
export function getRecommendedHeroCount(totalPhotos: number): number {
  // AI-Enhanced mode: use 70-80% of photos for dramatic effect
  if (totalPhotos <= 5) return totalPhotos; // Use all photos for small sets
  if (totalPhotos <= 8) return 6; // 75% of 8 photos
  if (totalPhotos <= 10) return 8; // 80% of 10 photos
  return Math.ceil(totalPhotos * 0.75); // For 11+ photos, use 75% as AI heroes
}
