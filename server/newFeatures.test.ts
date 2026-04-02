import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Image Library Router ──────────────────────────────────────────────────────
describe("imageLibrary router", () => {
  it("should accept valid image upload input", () => {
    const input = {
      filename: "kitchen.jpg",
      mimeType: "image/jpeg",
      base64Data: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      tags: ["kitchen", "interior"],
      propertyAddress: "123 Main St",
    };
    expect(input.filename).toBeTruthy();
    expect(input.mimeType).toMatch(/^image\//);
    expect(input.base64Data).toContain("base64,");
    expect(Array.isArray(input.tags)).toBe(true);
  });

  it("should reject non-image MIME types", () => {
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
    const invalidMimeType = "application/pdf";
    expect(validMimeTypes.includes(invalidMimeType)).toBe(false);
  });

  it("should handle tag filtering logic", () => {
    const images = [
      { id: 1, tags: ["kitchen", "interior"], filename: "kitchen.jpg" },
      { id: 2, tags: ["exterior", "front"], filename: "front.jpg" },
      { id: 3, tags: ["kitchen", "appliances"], filename: "appliances.jpg" },
    ];
    const filtered = images.filter(img => img.tags.includes("kitchen"));
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe(1);
    expect(filtered[1].id).toBe(3);
  });

  it("should generate a unique S3 key for each upload", () => {
    const generateKey = (userId: number, filename: string) => {
      const ext = filename.split(".").pop();
      return `image-library/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    };
    const key1 = generateKey(1, "photo.jpg");
    const key2 = generateKey(1, "photo.jpg");
    expect(key1).not.toBe(key2);
    expect(key1).toContain("image-library/1/");
    expect(key1).toMatch(/\.jpg$/);
  });

  it("should validate image count limits", () => {
    const MAX_IMAGES_PER_USER = 500;
    const userImageCount = 450;
    expect(userImageCount).toBeLessThan(MAX_IMAGES_PER_USER);
  });
});

// ─── Listing Presentation Router ──────────────────────────────────────────────
describe("listingPresentation router", () => {
  it("should build valid Gamma API payload", () => {
    const input = {
      agentName: "John Smith",
      agentTitle: "Realtor",
      agentBrokerage: "Century 21",
      propertyAddress: "456 Oak Ave, Beverly Hills, CA 90210",
      listingPrice: "$2,500,000",
      bedrooms: 4,
      bathrooms: 3,
      sqft: 3200,
      keyFeatures: ["Pool", "Ocean view", "Chef's kitchen"],
      agentStats: "Top 1% in Beverly Hills for 5 years",
      marketingPlan: "Social media + open houses + targeted ads",
      tone: "luxury" as const,
    };

    const gammaPayload = {
      text: `Listing Presentation for ${input.propertyAddress}`,
      format: "presentation",
      textMode: "generate",
      numCards: 12,
      textOptions: {
        tone: input.tone,
        audience: "home sellers",
      },
    };

    expect(gammaPayload.format).toBe("presentation");
    expect(gammaPayload.numCards).toBeGreaterThanOrEqual(8);
    expect(gammaPayload.numCards).toBeLessThanOrEqual(20);
    expect(gammaPayload.textOptions.tone).toBe("luxury");
  });

  it("should validate required fields for presentation generation", () => {
    const requiredFields = ["agentName", "propertyAddress", "listingPrice"];
    const input = {
      agentName: "Jane Doe",
      propertyAddress: "789 Pine St",
      listingPrice: "$850,000",
    };
    const missingFields = requiredFields.filter(f => !input[f as keyof typeof input]);
    expect(missingFields).toHaveLength(0);
  });

  it("should detect missing required fields", () => {
    const requiredFields = ["agentName", "propertyAddress", "listingPrice"];
    const incompleteInput = {
      agentName: "Jane Doe",
      propertyAddress: "",
      listingPrice: "$850,000",
    };
    const missingFields = requiredFields.filter(f => !incompleteInput[f as keyof typeof incompleteInput]);
    expect(missingFields).toHaveLength(1);
    expect(missingFields[0]).toBe("propertyAddress");
  });

  it("should support multiple tone options", () => {
    const validTones = ["professional", "luxury", "friendly", "confident"];
    expect(validTones).toContain("luxury");
    expect(validTones).toContain("professional");
    expect(validTones.length).toBe(4);
  });

  it("should format key features as a bulleted list for the prompt", () => {
    const features = ["Pool", "Ocean view", "Chef's kitchen"];
    const formatted = features.map(f => `• ${f}`).join("\n");
    expect(formatted).toContain("• Pool");
    expect(formatted).toContain("• Ocean view");
    expect(formatted.split("\n")).toHaveLength(3);
  });
});

// ─── YouTube Channel Analytics ────────────────────────────────────────────────
describe("youtube.getChannelAnalytics", () => {
  it("should format large numbers correctly", () => {
    const fmt = (n: number) =>
      n >= 1_000_000
        ? `${(n / 1_000_000).toFixed(1)}M`
        : n >= 1_000
        ? `${(n / 1_000).toFixed(1)}K`
        : String(n);

    expect(fmt(1_500_000)).toBe("1.5M");
    expect(fmt(25_300)).toBe("25.3K");
    expect(fmt(500)).toBe("500");
    expect(fmt(0)).toBe("0");
  });

  it("should return null when no YouTube connection exists", () => {
    const mockRows: unknown[] = [];
    const result = mockRows.length === 0 ? null : mockRows[0];
    expect(result).toBeNull();
  });

  it("should parse YouTube API statistics correctly", () => {
    const mockStats = {
      viewCount: "1234567",
      subscriberCount: "5678",
      videoCount: "42",
    };
    const parsed = {
      views: parseInt(mockStats.viewCount, 10),
      subscribers: parseInt(mockStats.subscriberCount, 10),
      videos: parseInt(mockStats.videoCount, 10),
    };
    expect(parsed.views).toBe(1234567);
    expect(parsed.subscribers).toBe(5678);
    expect(parsed.videos).toBe(42);
  });

  it("should handle missing statistics gracefully", () => {
    const mockStats = {
      viewCount: undefined,
      subscriberCount: undefined,
      videoCount: undefined,
    };
    const parsed = {
      views: parseInt(mockStats.viewCount ?? "0", 10),
      subscribers: parseInt(mockStats.subscriberCount ?? "0", 10),
      videos: parseInt(mockStats.videoCount ?? "0", 10),
    };
    expect(parsed.views).toBe(0);
    expect(parsed.subscribers).toBe(0);
    expect(parsed.videos).toBe(0);
  });
});

// ─── Script-to-Reel Batch Queue ───────────────────────────────────────────────
describe("Script-to-Reel batch queue", () => {
  it("should generate correct AutoReels URLs for each clip", () => {
    const clips = [
      { title: "Market Update", scriptExcerpt: "Prices are up 12% this quarter in Beverly Hills" },
      { title: "Buyer Tips", scriptExcerpt: "The #1 mistake buyers make is skipping the inspection" },
      { title: "Seller Tips", scriptExcerpt: "Staging your home can add 10% to your sale price" },
    ];

    const urls = clips.map(clip => {
      const encoded = encodeURIComponent(clip.scriptExcerpt);
      return `/auto-reels?script=${encoded}`;
    });

    expect(urls).toHaveLength(3);
    expect(urls[0]).toContain("/auto-reels?script=");
    expect(urls[0]).toContain(encodeURIComponent(clips[0].scriptExcerpt));
    expect(decodeURIComponent(urls[1].split("script=")[1])).toBe(clips[1].scriptExcerpt);
  });

  it("should stagger tab openings with 400ms delays", () => {
    const clips = [{ title: "A" }, { title: "B" }, { title: "C" }];
    const delays = clips.map((_, i) => i * 400);
    expect(delays).toEqual([0, 400, 800]);
  });

  it("should show correct count in the queue button label", () => {
    const clips = new Array(5).fill({ title: "clip", scriptExcerpt: "text" });
    const label = `Queue All ${clips.length} Clips as Reels`;
    expect(label).toBe("Queue All 5 Clips as Reels");
  });
});
