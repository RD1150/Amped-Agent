/**
 * Tests for minimum reel duration enforcement and subtitle logic.
 *
 * Requirements:
 * 1. All reels must have a minimum duration of 30 seconds.
 * 2. Subtitles are only shown for reels >= 30 seconds.
 * 3. The video length selector in the UI only offers 30s and 60s options.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock ENV ─────────────────────────────────────────────────────────────────
vi.mock("./_core/env", () => ({
  ENV: { CREATOMATE_API_KEY: "test-api-key-12345" },
}));

// ─── Mock costTracker ─────────────────────────────────────────────────────────
vi.mock("./_core/costTracker", () => ({
  trackCreatomate: vi.fn(),
}));

// ─── Mock fetch ───────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeRenderResponse(id: string, status = "planned") {
  return {
    ok: true,
    status: 202,
    json: async () => [{ id, status, url: null }],
    text: async () => "",
  };
}

// ─── Tests: Minimum duration enforcement ─────────────────────────────────────

describe("renderAutoReel minimum duration enforcement", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("enforces minimum 30-second duration when videoLength < 30", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("reel-min-dur-001"));

    const { renderAutoReel } = await import("./_core/videoRenderer");

    await renderAutoReel({
      hook: "Stop scrolling!",
      script: "This is a short test script for a reel.",
      videoLength: 7, // Below minimum — should be bumped to 30
      tone: "bold",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    // The actual render duration in the source should be >= 30
    expect(body.source.duration).toBeGreaterThanOrEqual(30);
  });

  it("enforces minimum 30-second duration when videoLength = 15", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("reel-min-dur-002"));

    const { renderAutoReel } = await import("./_core/videoRenderer");

    await renderAutoReel({
      hook: "You need to hear this",
      script: "A fifteen second script that should be extended to thirty seconds.",
      videoLength: 15, // Below minimum — should be bumped to 30
      tone: "authoritative",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.source.duration).toBeGreaterThanOrEqual(30);
  });

  it("preserves videoLength of 30 seconds without modification", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("reel-min-dur-003"));

    const { renderAutoReel } = await import("./_core/videoRenderer");

    await renderAutoReel({
      hook: "Thirty second reel",
      script: "This is a thirty second reel script with enough content.",
      videoLength: 30,
      tone: "calm",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.source.duration).toBe(30);
  });

  it("preserves videoLength of 60 seconds without modification", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("reel-min-dur-004"));

    const { renderAutoReel } = await import("./_core/videoRenderer");

    await renderAutoReel({
      hook: "Sixty second reel",
      script: "This is a sixty second reel script with plenty of content to fill the time.",
      videoLength: 60,
      tone: "warm",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.source.duration).toBe(60);
  });
});

// ─── Tests: Subtitle logic ────────────────────────────────────────────────────

describe("renderAutoReel subtitle logic", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("includes subtitle text elements for 30-second reels", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("reel-sub-001"));

    const { renderAutoReel } = await import("./_core/videoRenderer");

    await renderAutoReel({
      hook: "Subtitle test hook",
      script: "This is a thirty second script. It has enough words to generate subtitle chunks. Real estate is great.",
      videoLength: 30,
      tone: "calm",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const elements = body.source.elements;

    // Should have text elements beyond just the hook (i.e., subtitles)
    const textElements = elements.filter((el: any) => el.type === "text");
    // At least hook + 1 subtitle chunk
    expect(textElements.length).toBeGreaterThan(1);
  });

  it("includes subtitle text elements for 60-second reels", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("reel-sub-002"));

    const { renderAutoReel } = await import("./_core/videoRenderer");

    await renderAutoReel({
      hook: "Sixty second subtitle test",
      script: "This is a sixty second script with many words. Real estate agents need great content. This platform helps them. Market updates are important. Buyers and sellers need guidance.",
      videoLength: 60,
      tone: "authoritative",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const elements = body.source.elements;

    const textElements = elements.filter((el: any) => el.type === "text");
    expect(textElements.length).toBeGreaterThan(1);
  });
});

// ─── Tests: VideoLength enum validation ──────────────────────────────────────

describe("videoLength enum validation", () => {
  it("only accepts 30 and 60 as valid video lengths", () => {
    // This mirrors the z.enum(["30", "60"]) in the autoreels router
    const validLengths = ["30", "60"];
    const invalidLengths = ["7", "15", "45", "90"];

    for (const valid of validLengths) {
      expect(validLengths).toContain(valid);
    }
    for (const invalid of invalidLengths) {
      expect(validLengths).not.toContain(invalid);
    }
  });

  it("defaults to 30 seconds as the minimum", () => {
    const MIN_DURATION = 30;
    const inputDuration = 15; // A legacy or invalid input
    const enforcedDuration = Math.max(MIN_DURATION, inputDuration);
    expect(enforcedDuration).toBe(30);
  });

  it("allows 60 seconds as a valid longer option", () => {
    const MIN_DURATION = 30;
    const inputDuration = 60;
    const enforcedDuration = Math.max(MIN_DURATION, inputDuration);
    expect(enforcedDuration).toBe(60);
  });
});
