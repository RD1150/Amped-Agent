import { describe, it, expect } from "vitest";
import { templateBackgrounds, getTemplateBackground, getCategoryBackgrounds } from "../client/src/lib/templateBackgrounds";

describe("Template Background Images", () => {
  it("should have background images for all categories", () => {
    const expectedCategories = [
      "luxury-buyers",
      "luxury-sellers", 
      "buyers",
      "sellers",
      "first-time-sellers",
      "expired-listings",
      "urgent-sellers",
      "fsbos",
      "investors"
    ];

    expectedCategories.forEach(category => {
      expect(templateBackgrounds[category]).toBeDefined();
      expect(templateBackgrounds[category].length).toBeGreaterThan(0);
    });
  });

  it("should have correct number of images per category", () => {
    expect(templateBackgrounds["luxury-buyers"].length).toBe(8);
    expect(templateBackgrounds["luxury-sellers"].length).toBe(8);
    expect(templateBackgrounds["buyers"].length).toBe(6);
    expect(templateBackgrounds["sellers"].length).toBe(5);
    expect(templateBackgrounds["first-time-sellers"].length).toBe(4);
    expect(templateBackgrounds["expired-listings"].length).toBe(6);
    expect(templateBackgrounds["urgent-sellers"].length).toBe(4);
    expect(templateBackgrounds["fsbos"].length).toBe(4);
    expect(templateBackgrounds["investors"].length).toBe(4);
  });

  it("should return correct background image path", () => {
    const image = getTemplateBackground("luxury-buyers", 0);
    // Images are CDN URLs from manuscdn.com
    expect(image).toMatch(/https:\/\/files\.manuscdn\.com/);
  });

  it("should cycle through images using modulo", () => {
    const image1 = getTemplateBackground("luxury-buyers", 0);
    const image2 = getTemplateBackground("luxury-buyers", 8); // Should wrap to index 0
    expect(image1).toBe(image2);
  });

  it("should return all backgrounds for a category", () => {
    const backgrounds = getCategoryBackgrounds("luxury-buyers");
    expect(backgrounds.length).toBe(8);
    expect(backgrounds[0]).toMatch(/https:\/\/files\.manuscdn\.com/);
  });

  it("should fallback to buyers category for unknown categories", () => {
    const image = getTemplateBackground("unknown-category", 0);
    // Should return first buyers image (CDN URL)
    expect(image).toMatch(/https:\/\/files\.manuscdn\.com/);
  });

  it("should have total of 50 background images", () => {
    let totalImages = 0;
    Object.values(templateBackgrounds).forEach(images => {
      totalImages += images.length;
    });
    expect(totalImages).toBe(49);
  });
});
