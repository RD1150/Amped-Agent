/**
 * Template Background Image Mapping
 * Maps template categories to their pre-generated background images
 */

export interface BackgroundImageConfig {
  category: string;
  images: string[];
}

export const templateBackgrounds: Record<string, string[]> = {
  "luxury-buyers": [
    "/template-backgrounds/luxury-buyers-01.png",
    "/template-backgrounds/luxury-buyers-02.png",
    "/template-backgrounds/luxury-buyers-03.png",
    "/template-backgrounds/luxury-buyers-04.png",
    "/template-backgrounds/luxury-buyers-05.png",
    "/template-backgrounds/luxury-buyers-06.png",
    "/template-backgrounds/luxury-buyers-07.png",
    "/template-backgrounds/luxury-buyers-08.png",
  ],
  "luxury-sellers": [
    "/template-backgrounds/luxury-sellers-01.png",
    "/template-backgrounds/luxury-sellers-02.png",
    "/template-backgrounds/luxury-sellers-03.png",
    "/template-backgrounds/luxury-sellers-04.png",
    "/template-backgrounds/luxury-sellers-05.png",
    "/template-backgrounds/luxury-sellers-06.png",
    "/template-backgrounds/luxury-sellers-07.png",
    "/template-backgrounds/luxury-sellers-08.png",
  ],
  "buyers": [
    "/template-backgrounds/buyers-01.png",
    "/template-backgrounds/buyers-02.png",
    "/template-backgrounds/buyers-03.png",
    "/template-backgrounds/buyers-04.png",
    "/template-backgrounds/buyers-05.png",
    "/template-backgrounds/buyers-06.png",
  ],
  "sellers": [
    "/template-backgrounds/sellers-01.png",
    "/template-backgrounds/sellers-02.png",
    "/template-backgrounds/sellers-03.png",
    "/template-backgrounds/sellers-04.png",
    "/template-backgrounds/sellers-05.png",
    "/template-backgrounds/sellers-06.png",
  ],
  "first-time-sellers": [
    "/template-backgrounds/first-time-sellers-01.png",
    "/template-backgrounds/first-time-sellers-02.png",
    "/template-backgrounds/first-time-sellers-03.png",
    "/template-backgrounds/first-time-sellers-04.png",
  ],
  "expired-listings": [
    "/template-backgrounds/expired-listings-01.png",
    "/template-backgrounds/expired-listings-02.png",
    "/template-backgrounds/expired-listings-03.png",
    "/template-backgrounds/expired-listings-04.png",
    "/template-backgrounds/expired-listings-05.png",
    "/template-backgrounds/expired-listings-06.png",
  ],
  "urgent-sellers": [
    "/template-backgrounds/urgent-sellers-01.png",
    "/template-backgrounds/urgent-sellers-02.png",
    "/template-backgrounds/urgent-sellers-03.png",
    "/template-backgrounds/urgent-sellers-04.png",
  ],
  "fsbos": [
    "/template-backgrounds/fsbos-01.png",
    "/template-backgrounds/fsbos-02.png",
    "/template-backgrounds/fsbos-03.png",
    "/template-backgrounds/fsbos-04.png",
  ],
  "investors": [
    "/template-backgrounds/investors-01.png",
    "/template-backgrounds/investors-02.png",
    "/template-backgrounds/investors-03.png",
    "/template-backgrounds/investors-04.png",
  ],
};

/**
 * Get a background image for a template based on its category
 * Cycles through available images for variety
 */
export function getTemplateBackground(category: string, index: number = 0): string {
  const images = templateBackgrounds[category];
  if (!images || images.length === 0) {
    // Fallback to a default category if not found
    return templateBackgrounds["buyers"][0];
  }
  
  // Cycle through images using modulo
  return images[index % images.length];
}

/**
 * Get all available backgrounds for a category
 */
export function getCategoryBackgrounds(category: string): string[] {
  return templateBackgrounds[category] || templateBackgrounds["buyers"];
}
