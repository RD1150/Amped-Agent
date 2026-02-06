import { describe, it, expect } from "vitest";
import { selectHeroPhotos, getRecommendedHeroCount, isHeroPhoto } from "./heroPhotoSelector";

describe("Hero Photo Selection", () => {
  it("should prioritize exterior shots", () => {
    const photos = [
      "https://example.com/bedroom1.jpg",
      "https://example.com/exterior-front.jpg",
      "https://example.com/kitchen.jpg",
    ];
    
    const heroes = selectHeroPhotos(photos, 2);
    
    expect(heroes[0].url).toContain("exterior");
    expect(heroes[0].score).toBe(100);
  });
  
  it("should select kitchen and living room as high priority", () => {
    const photos = [
      "https://example.com/garage.jpg",
      "https://example.com/living-room.jpg",
      "https://example.com/kitchen.jpg",
      "https://example.com/bedroom.jpg",
    ];
    
    const heroes = selectHeroPhotos(photos, 3);
    
    const heroUrls = heroes.map((h) => h.url);
    expect(heroUrls).toContain("https://example.com/living-room.jpg");
    expect(heroUrls).toContain("https://example.com/kitchen.jpg");
  });
  
  it("should return correct count based on target", () => {
    const photos = Array.from({ length: 15 }, (_, i) => `https://example.com/photo${i}.jpg`);
    
    const heroes3 = selectHeroPhotos(photos, 3);
    const heroes4 = selectHeroPhotos(photos, 4);
    const heroes5 = selectHeroPhotos(photos, 5);
    
    expect(heroes3.length).toBe(3);
    expect(heroes4.length).toBe(4);
    expect(heroes5.length).toBe(5);
  });
  
  it("should recommend appropriate hero count based on total", () => {
    expect(getRecommendedHeroCount(3)).toBe(3);
    expect(getRecommendedHeroCount(7)).toBe(4);
    expect(getRecommendedHeroCount(15)).toBe(5);
  });
  
  it("should identify if photo is a hero", () => {
    const photos = [
      "https://example.com/exterior.jpg",
      "https://example.com/kitchen.jpg",
      "https://example.com/bedroom.jpg",
      "https://example.com/garage.jpg",
    ];
    
    const heroes = selectHeroPhotos(photos, 3);
    
    // Top 3 should be selected (exterior, kitchen, bedroom)
    expect(isHeroPhoto("https://example.com/exterior.jpg", photos, heroes)).toBe(true);
    expect(isHeroPhoto("https://example.com/kitchen.jpg", photos, heroes)).toBe(true);
    expect(isHeroPhoto("https://example.com/bedroom.jpg", photos, heroes)).toBe(true);
    // Garage should not be selected (lowest score)
    expect(isHeroPhoto("https://example.com/garage.jpg", photos, heroes)).toBe(false);
  });
});
