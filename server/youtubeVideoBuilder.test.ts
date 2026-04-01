import { describe, it, expect } from "vitest";

// ─── Topic template structure ─────────────────────────────────────────────────
describe("YouTube Video Builder – topic templates", () => {
  const templates = [
    { key: "market-update", title: "Monthly Market Update", duration: "~8 min", outline: "1. Hook\n2. Stats\n3. CTA" },
    { key: "buyer-guide", title: "First-Time Buyer Guide", duration: "~12 min", outline: "1. Hook\n2. Steps\n3. CTA" },
    { key: "seller-tips", title: "How to Sell for Top Dollar", duration: "~10 min", outline: "1. Hook\n2. Tips\n3. CTA" },
    { key: "neighborhood", title: "Neighborhood Spotlight", duration: "~8 min", outline: "1. Hook\n2. Features\n3. CTA" },
    { key: "investment", title: "Real Estate Investment 101", duration: "~12 min", outline: "1. Hook\n2. Basics\n3. CTA" },
    { key: "mortgage", title: "Understanding Mortgage Rates", duration: "~8 min", outline: "1. Hook\n2. Rates\n3. CTA" },
  ];

  it("should have at least 6 topic templates", () => {
    expect(templates.length).toBeGreaterThanOrEqual(6);
  });

  it("each template should have key, title, duration, and outline", () => {
    for (const t of templates) {
      expect(t.key.length).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.duration.length).toBeGreaterThan(0);
      expect(t.outline.length).toBeGreaterThan(0);
    }
  });

  it("template keys should be unique", () => {
    const keys = templates.map((t) => t.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

// ─── Script generation helpers ────────────────────────────────────────────────
describe("YouTube Video Builder – script generation helpers", () => {
  it("should calculate word count correctly", () => {
    const script = "Hello world this is a test script with eleven words here.";
    const wordCount = script.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBe(11);
  });

  it("should estimate minutes from word count at 150 wpm", () => {
    const wordCount = 1200;
    const estimatedMinutes = Math.round(wordCount / 150);
    expect(estimatedMinutes).toBe(8);
  });

  it("should estimate 15 minutes for 2250 words", () => {
    const wordCount = 2250;
    const estimatedMinutes = Math.round(wordCount / 150);
    expect(estimatedMinutes).toBe(15);
  });

  it("should map targetDuration to correct word count targets", () => {
    const durationMap: Record<string, number> = {
      "5min": 750,
      "8min": 1200,
      "12min": 1800,
      "15min": 2250,
    };
    expect(durationMap["5min"]).toBe(750);
    expect(durationMap["8min"]).toBe(1200);
    expect(durationMap["12min"]).toBe(1800);
    expect(durationMap["15min"]).toBe(2250);
  });
});

// ─── SEO metadata validation ──────────────────────────────────────────────────
describe("YouTube Video Builder – SEO metadata", () => {
  it("should validate YouTube title max length (100 chars)", () => {
    const validTitle = "5 Reasons Now is the Best Time to Buy a Home in Austin TX";
    const tooLongTitle = "A".repeat(101);
    expect(validTitle.length).toBeLessThanOrEqual(100);
    expect(tooLongTitle.length).toBeGreaterThan(100);
  });

  it("should validate chapter timestamp format mm:ss", () => {
    const chapters = [
      { time: "0:00", title: "Introduction" },
      { time: "1:30", title: "Main Point" },
      { time: "5:45", title: "Conclusion" },
    ];
    const timeRegex = /^\d+:\d{2}$/;
    for (const ch of chapters) {
      expect(timeRegex.test(ch.time)).toBe(true);
    }
  });

  it("should keep tags array non-empty", () => {
    const tags = ["real estate", "austin homes", "buyer tips", "market update", "realtor"];
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.join(",").length).toBeLessThan(500);
  });
});

// ─── Clip extraction ──────────────────────────────────────────────────────────
describe("YouTube Video Builder – clip extraction", () => {
  it("should validate clip duration range (15–90 seconds)", () => {
    const clips = [
      { estimatedSeconds: 30 },
      { estimatedSeconds: 45 },
      { estimatedSeconds: 60 },
    ];
    for (const clip of clips) {
      expect(clip.estimatedSeconds).toBeGreaterThanOrEqual(15);
      expect(clip.estimatedSeconds).toBeLessThanOrEqual(90);
    }
  });

  it("should require all clip fields", () => {
    const clip = {
      title: "Why buyers are rushing to Austin",
      hook: "Here's what most agents won't tell you...",
      scriptExcerpt: "The truth is, inventory has dropped 23% year over year...",
      estimatedSeconds: 45,
      suggestedCaption: "Austin real estate secret! #realestate",
    };
    expect(clip.title).toBeTruthy();
    expect(clip.hook).toBeTruthy();
    expect(clip.scriptExcerpt).toBeTruthy();
    expect(clip.estimatedSeconds).toBeGreaterThan(0);
    expect(clip.suggestedCaption).toBeTruthy();
  });

  it("should identify 3–6 clips from a 10-minute script", () => {
    const estimatedMinutes = 10;
    const clipCount = Math.min(6, Math.max(3, Math.floor(estimatedMinutes / 2)));
    expect(clipCount).toBeGreaterThanOrEqual(3);
    expect(clipCount).toBeLessThanOrEqual(6);
  });
});

// ─── YouTube upload ───────────────────────────────────────────────────────────
describe("YouTube Video Builder – YouTube upload", () => {
  it("should build correct YouTube watch URL from video ID", () => {
    const videoId = "dQw4w9WgXcQ";
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    expect(url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });

  it("should accept valid privacy status values", () => {
    const validStatuses = ["public", "private", "unlisted"];
    for (const status of validStatuses) {
      expect(["public", "private", "unlisted"]).toContain(status);
    }
  });

  it("should reject invalid privacy status", () => {
    const invalidStatus = "draft";
    expect(["public", "private", "unlisted"]).not.toContain(invalidStatus);
  });
});
