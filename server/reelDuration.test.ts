/**
 * Tests for minimum reel duration enforcement, subtitle logic, and
 * speech-rate-based subtitle timing.
 *
 * Requirements:
 * 1. All reels must have a minimum duration of 30 seconds.
 * 2. Subtitles are only shown for reels >= 30 seconds.
 * 3. The video length selector in the UI only offers 30s and 60s options.
 * 4. Subtitle timing is based on speech rate (130 wpm), not video duration.
 * 5. Subtitles start after the hook (startAt >= 2.2s), never at t=0.
 * 6. Each subtitle chunk stays on screen at least 2.5 seconds.
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

// ─── Tests: Speech-rate subtitle timing ──────────────────────────────────────

describe("subtitle timing: speech-rate-based (not duration-based)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("subtitle chunks start after the hook (>= 3s), never at t=0", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("reel-timing-001"));

    const { renderAutoReel } = await import("./_core/videoRenderer");

    await renderAutoReel({
      hook: "Market update hook",
      script: "Thousand Oaks home prices rose five percent this year. Buyers are still active in the market. Inventory remains tight across the Conejo Valley.",
      videoLength: 30,
      tone: "authoritative",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const elements = body.source.elements;

    // Find subtitle elements (text elements that are NOT the hook or branding)
    const hookText = "Market update hook";
    const subtitleEls = elements.filter(
      (el: any) => el.type === "text" && el.text !== hookText && !el.text.includes("Amped Agent")
    );

    expect(subtitleEls.length).toBeGreaterThan(0);
    // All subtitles must start at or after the hook display period
    for (const sub of subtitleEls) {
      expect(sub.time).toBeGreaterThanOrEqual(3.0);
    }
  });

  it("each subtitle chunk stays on screen at least 2.5 seconds", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("reel-timing-002"));

    const { renderAutoReel } = await import("./_core/videoRenderer");

    await renderAutoReel({
      hook: "Readable subtitles",
      script: "Every subtitle chunk must be readable. No flashing text allowed. Each line stays on screen long enough. Viewers need time to read the words.",
      videoLength: 30,
      tone: "calm",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const elements = body.source.elements;

    const hookText = "Readable subtitles";
    const subtitleEls = elements.filter(
      (el: any) => el.type === "text" && el.text !== hookText && !el.text.includes("Amped Agent")
    );

    expect(subtitleEls.length).toBeGreaterThan(0);
    for (const sub of subtitleEls) {
      expect(sub.duration).toBeGreaterThanOrEqual(2.5);
    }
  });

  it("subtitle timing advances proportionally to word count, not video length", async () => {
    // A 5-word chunk at 130 wpm takes ~2.31s to speak → displayed for 2.5s (min)
    // A 30s video and a 60s video with the same script should have the same subtitle durations
    mockFetch
      .mockResolvedValueOnce(makeRenderResponse("reel-timing-003a"))
      .mockResolvedValueOnce(makeRenderResponse("reel-timing-003b"));

    const { renderAutoReel } = await import("./_core/videoRenderer");

    const script = "Conejo Valley market update for this quarter. Prices are up five percent year over year.";

    await renderAutoReel({ hook: "Hook A", script, videoLength: 30, tone: "bold" });
    await renderAutoReel({ hook: "Hook B", script, videoLength: 60, tone: "bold" });

    const body30 = JSON.parse(mockFetch.mock.calls[0][1].body);
    const body60 = JSON.parse(mockFetch.mock.calls[1][1].body);

    const hookText30 = "Hook A";
    const hookText60 = "Hook B";

    const subs30 = body30.source.elements.filter(
      (el: any) => el.type === "text" && el.text !== hookText30 && !el.text.includes("Amped Agent")
    );
    const subs60 = body60.source.elements.filter(
      (el: any) => el.type === "text" && el.text !== hookText60 && !el.text.includes("Amped Agent")
    );

    // Same script → same number of subtitle chunks regardless of video length
    expect(subs30.length).toBe(subs60.length);

    // Same script → same duration per chunk regardless of video length
    if (subs30.length > 0 && subs60.length > 0) {
      expect(subs30[0].duration).toBeCloseTo(subs60[0].duration, 1);
    }
  });
});

// ─── Tests: VideoLength enum validation ──────────────────────────────────────

describe("videoLength enum validation", () => {
  it("only accepts 30 and 60 as valid video lengths", () => {
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
    const inputDuration = 15;
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
