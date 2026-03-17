import { describe, it, expect } from "vitest";

/**
 * Zero-Friction Output Experience — unit tests
 *
 * These tests validate the helper logic used by the new UI components
 * (RepurposeEngine, MyContent, PropertyTours video-ready modal).
 * They do NOT require a running server or database.
 */

// ─── Repurpose Engine helpers ────────────────────────────────────────────────

type Slide = { slideNumber: number; headline: string; body: string };

function buildCopyAll(result: {
  topic: string;
  carousel: { slides: Slide[]; caption: string };
  reelScript: { hook: string; script: string; cta: string };
  newsletter: { subjectLine: string; previewText: string; body: string };
  gbpPost: { text: string; callToAction: string };
  linkedin: { hook: string; body: string; hashtags: string[] };
}): string {
  const slides = result.carousel.slides
    .map((s) => `Slide ${s.slideNumber}: ${s.headline}\n${s.body}`)
    .join("\n\n");
  return [
    `=== CAROUSEL (7 Slides) ===\n${slides}\n\nCaption: ${result.carousel.caption}`,
    `=== REEL SCRIPT ===\nHook: ${result.reelScript.hook}\n\n${result.reelScript.script}\n\nCTA: ${result.reelScript.cta}`,
    `=== NEWSLETTER ===\nSubject: ${result.newsletter.subjectLine}\nPreview: ${result.newsletter.previewText}\n\n${result.newsletter.body}`,
    `=== GOOGLE BUSINESS POST ===\n${result.gbpPost.text}\nCTA: ${result.gbpPost.callToAction}`,
    `=== LINKEDIN ===\n${result.linkedin.hook}\n\n${result.linkedin.body}\n\n${result.linkedin.hashtags.join(" ")}`,
  ].join("\n\n" + "─".repeat(40) + "\n\n");
}

const mockResult = {
  topic: "5 mistakes first-time buyers make",
  carousel: {
    slides: [
      { slideNumber: 1, headline: "Skipping Pre-Approval", body: "Always get pre-approved first." },
      { slideNumber: 2, headline: "Ignoring Closing Costs", body: "Budget 2–5% of the home price." },
    ],
    caption: "Avoid these 5 costly mistakes! #RealEstate",
  },
  reelScript: {
    hook: "Are you making these 5 first-time buyer mistakes?",
    script: "Mistake #1: Skipping pre-approval...",
    cta: "Follow for more real estate tips!",
  },
  newsletter: {
    subjectLine: "5 Mistakes First-Time Buyers Make",
    previewText: "Don't let these errors cost you thousands",
    body: "Dear [Name], buying your first home is exciting...",
  },
  gbpPost: {
    text: "Thinking about buying your first home? Avoid these 5 common mistakes...",
    callToAction: "Learn More",
  },
  linkedin: {
    hook: "5 mistakes that cost first-time buyers thousands",
    body: "After helping hundreds of buyers, here's what I see most often...",
    hashtags: ["#RealEstate", "#FirstTimeBuyer", "#HomeBuying"],
  },
};

describe("buildCopyAll", () => {
  it("includes all 5 section headers", () => {
    const output = buildCopyAll(mockResult);
    expect(output).toContain("=== CAROUSEL (7 Slides) ===");
    expect(output).toContain("=== REEL SCRIPT ===");
    expect(output).toContain("=== NEWSLETTER ===");
    expect(output).toContain("=== GOOGLE BUSINESS POST ===");
    expect(output).toContain("=== LINKEDIN ===");
  });

  it("includes slide headlines", () => {
    const output = buildCopyAll(mockResult);
    expect(output).toContain("Skipping Pre-Approval");
    expect(output).toContain("Ignoring Closing Costs");
  });

  it("includes the carousel caption", () => {
    const output = buildCopyAll(mockResult);
    expect(output).toContain("Avoid these 5 costly mistakes!");
  });

  it("includes the reel hook", () => {
    const output = buildCopyAll(mockResult);
    expect(output).toContain("Are you making these 5 first-time buyer mistakes?");
  });

  it("includes the newsletter subject line", () => {
    const output = buildCopyAll(mockResult);
    expect(output).toContain("5 Mistakes First-Time Buyers Make");
  });

  it("includes LinkedIn hashtags", () => {
    const output = buildCopyAll(mockResult);
    expect(output).toContain("#RealEstate");
    expect(output).toContain("#FirstTimeBuyer");
  });

  it("separates sections with dividers", () => {
    const output = buildCopyAll(mockResult);
    expect(output).toContain("─".repeat(40));
  });
});

// ─── Content filter logic ────────────────────────────────────────────────────

type ContentFilter = "all" | "videos" | "reels" | "lead_magnets";

function filterItems(
  items: Array<{ kind: "video" | "reel" | "lead_magnet" }>,
  filter: ContentFilter
) {
  if (filter === "all") return items;
  const map: Record<ContentFilter, string> = {
    all: "",
    videos: "video",
    reels: "reel",
    lead_magnets: "lead_magnet",
  };
  return items.filter((item) => item.kind === map[filter]);
}

describe("filterItems", () => {
  const items = [
    { kind: "video" as const },
    { kind: "video" as const },
    { kind: "reel" as const },
    { kind: "lead_magnet" as const },
  ];

  it("returns all items when filter is 'all'", () => {
    expect(filterItems(items, "all")).toHaveLength(4);
  });

  it("returns only videos when filter is 'videos'", () => {
    const result = filterItems(items, "videos");
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.kind === "video")).toBe(true);
  });

  it("returns only reels when filter is 'reels'", () => {
    const result = filterItems(items, "reels");
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("reel");
  });

  it("returns only lead magnets when filter is 'lead_magnets'", () => {
    const result = filterItems(items, "lead_magnets");
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("lead_magnet");
  });

  it("returns empty array when no items match", () => {
    const videoOnly = [{ kind: "video" as const }];
    expect(filterItems(videoOnly, "reels")).toHaveLength(0);
  });
});

// ─── Total count helper ───────────────────────────────────────────────────────

function getTotalCount(
  videos: unknown[] | undefined,
  reels: unknown[] | undefined,
  magnets: unknown[] | undefined
): number {
  return (videos?.length ?? 0) + (reels?.length ?? 0) + (magnets?.length ?? 0);
}

describe("getTotalCount", () => {
  it("sums all three arrays", () => {
    expect(getTotalCount([1, 2], [3], [4, 5, 6])).toBe(6);
  });

  it("handles undefined arrays gracefully", () => {
    expect(getTotalCount(undefined, undefined, undefined)).toBe(0);
  });

  it("handles empty arrays", () => {
    expect(getTotalCount([], [], [])).toBe(0);
  });

  it("handles mixed defined and undefined", () => {
    expect(getTotalCount([1, 2, 3], undefined, [4])).toBe(4);
  });
});
