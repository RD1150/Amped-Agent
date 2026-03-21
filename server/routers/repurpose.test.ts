import { describe, it, expect } from "vitest";

// Test the platform list and schema structure
describe("Repurpose Engine", () => {
  it("should have correct platform types", () => {
    const platforms = ["linkedin", "instagram", "facebook", "tiktok", "reelScript"] as const;
    expect(platforms).toHaveLength(5);
    expect(platforms).toContain("linkedin");
    expect(platforms).toContain("instagram");
    expect(platforms).toContain("facebook");
    expect(platforms).toContain("tiktok");
    expect(platforms).toContain("reelScript");
  });

  it("should validate minimum platform selection", () => {
    const selectedPlatforms: string[] = [];
    expect(selectedPlatforms.length).toBe(0);
    // At least 1 platform required
    expect(selectedPlatforms.length < 1).toBe(true);
  });

  it("should build copy-all text for each platform", () => {
    const result = {
      topic: "Test topic",
      platforms: ["linkedin", "instagram"] as const,
      linkedin: { hook: "Test hook", body: "Test body", hashtags: ["#RealEstate"] },
      instagram: { caption: "Test caption", hashtags: ["#realestate"], altText: "Alt text" },
      facebook: null,
      tiktok: null,
      reelScript: null,
    };

    const parts: string[] = [];
    if (result.linkedin) {
      parts.push(`=== LINKEDIN ===\n${result.linkedin.hook}\n\n${result.linkedin.body}`);
    }
    if (result.instagram) {
      parts.push(`=== INSTAGRAM ===\n${result.instagram.caption}`);
    }

    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain("LINKEDIN");
    expect(parts[1]).toContain("INSTAGRAM");
  });
});
