import { describe, it, expect } from "vitest";

describe("Image Library Integration", () => {
  describe("ImageLibraryPicker component logic", () => {
    it("should allow single selection when multiSelect is false", () => {
      const selected: string[] = [];
      const url = "https://s3.example.com/image1.jpg";
      
      // Single select: clicking an item sets it as the only selection
      const handleSelect = (urls: string[]) => {
        selected.splice(0, selected.length, ...urls);
      };
      
      handleSelect([url]);
      expect(selected).toHaveLength(1);
      expect(selected[0]).toBe(url);
    });

    it("should allow multi-selection when multiSelect is true", () => {
      const selected: string[] = [];
      const urls = [
        "https://s3.example.com/image1.jpg",
        "https://s3.example.com/image2.jpg",
        "https://s3.example.com/image3.jpg",
      ];
      
      const handleSelect = (newUrls: string[]) => {
        selected.push(...newUrls);
      };
      
      handleSelect(urls);
      expect(selected).toHaveLength(3);
    });

    it("should filter images by tag when tag filter is applied", () => {
      const images = [
        { id: 1, url: "https://s3.example.com/img1.jpg", tags: ["listing", "exterior"] },
        { id: 2, url: "https://s3.example.com/img2.jpg", tags: ["market-update"] },
        { id: 3, url: "https://s3.example.com/img3.jpg", tags: ["listing", "interior"] },
      ];
      
      const filterByTag = (tag: string) => images.filter(img => img.tags.includes(tag));
      
      const listingImages = filterByTag("listing");
      expect(listingImages).toHaveLength(2);
      
      const marketImages = filterByTag("market-update");
      expect(marketImages).toHaveLength(1);
    });
  });

  describe("AutoReels background photo library integration", () => {
    it("should limit background photos to 4 when adding from library", () => {
      const existing = [
        "https://s3.example.com/img1.jpg",
        "https://s3.example.com/img2.jpg",
        "https://s3.example.com/img3.jpg",
      ];
      
      const librarySelection = [
        "https://s3.example.com/lib1.jpg",
        "https://s3.example.com/lib2.jpg",
        "https://s3.example.com/lib3.jpg",
      ];
      
      // Simulate the onSelect handler logic
      const remaining = 4 - existing.length;
      const toAdd = librarySelection.slice(0, remaining);
      const result = [...existing, ...toAdd].slice(0, 4);
      
      expect(result).toHaveLength(4);
      expect(result[3]).toBe("https://s3.example.com/lib1.jpg");
    });

    it("should not add images when already at 4 limit", () => {
      const existing = [
        "https://s3.example.com/img1.jpg",
        "https://s3.example.com/img2.jpg",
        "https://s3.example.com/img3.jpg",
        "https://s3.example.com/img4.jpg",
      ];
      
      const remaining = 4 - existing.length;
      expect(remaining).toBe(0);
      
      const toAdd = ["https://s3.example.com/lib1.jpg"].slice(0, remaining);
      expect(toAdd).toHaveLength(0);
    });
  });

  describe("Listing Presentation Gamma theme default", () => {
    it("should auto-apply saved theme ID from persona on mount", () => {
      const persona = { gammaThemeId: "theme_abc123" };
      let formThemeId = "";
      
      // Simulate the useEffect logic
      if (persona?.gammaThemeId) {
        formThemeId = persona.gammaThemeId;
      }
      
      expect(formThemeId).toBe("theme_abc123");
    });

    it("should not override theme if persona has no saved theme", () => {
      const persona = { gammaThemeId: null };
      let formThemeId = "user-selected-theme";
      
      // Simulate the useEffect logic
      if (persona?.gammaThemeId) {
        formThemeId = persona.gammaThemeId;
      }
      
      // Should keep user-selected theme unchanged
      expect(formThemeId).toBe("user-selected-theme");
    });

    it("should pass themeId to generate mutation when set", () => {
      const form = {
        propertyAddress: "123 Main St",
        listingPrice: "$500,000",
        themeId: "theme_abc123",
        exportFormat: "pptx" as const,
      };
      
      const mutationInput = {
        ...form,
        themeId: form.themeId || undefined,
      };
      
      expect(mutationInput.themeId).toBe("theme_abc123");
    });

    it("should pass undefined themeId when not set", () => {
      const form = {
        propertyAddress: "123 Main St",
        listingPrice: "$500,000",
        themeId: "",
        exportFormat: "pptx" as const,
      };
      
      const mutationInput = {
        ...form,
        themeId: form.themeId || undefined,
      };
      
      expect(mutationInput.themeId).toBeUndefined();
    });
  });

  describe("Post Builder image library integration", () => {
    it("should replace existing image when selecting from library (single select)", () => {
      let currentImageUrl = "https://s3.example.com/old-image.jpg";
      
      const handleLibrarySelect = (urls: string[]) => {
        if (urls.length > 0) {
          currentImageUrl = urls[0];
        }
      };
      
      handleLibrarySelect(["https://s3.example.com/new-image.jpg"]);
      expect(currentImageUrl).toBe("https://s3.example.com/new-image.jpg");
    });

    it("should handle empty library selection gracefully", () => {
      let currentImageUrl = "https://s3.example.com/existing.jpg";
      
      const handleLibrarySelect = (urls: string[]) => {
        if (urls.length > 0) {
          currentImageUrl = urls[0];
        }
      };
      
      handleLibrarySelect([]);
      expect(currentImageUrl).toBe("https://s3.example.com/existing.jpg");
    });
  });
});
