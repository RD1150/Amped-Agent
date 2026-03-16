/**
 * Tests for the Creatomate video renderer
 * Verifies payload construction, API interaction, and status mapping
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

// ─── Import after mocks ───────────────────────────────────────────────────────
import { checkRenderStatus } from "./_core/creatomateRenderer";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeRenderResponse(id: string, status = "planned") {
  return {
    ok: true,
    status: 202,
    json: async () => [{ id, status, url: null }],
    text: async () => "",
  };
}

function makeStatusResponse(status: string, url?: string, errorMessage?: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      id: "test-render-id",
      status,
      url: url ?? null,
      snapshot_url: null,
      error_message: errorMessage ?? null,
    }),
    text: async () => "",
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Creatomate API payload format", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("wraps the renderScript in a source field when submitting", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("render-abc-123"));

    // Import dynamically to get fresh module after mocks
    const { renderAutoReel } = await import("./_core/creatomateRenderer");

    await renderAutoReel({
      script: "Welcome to this beautiful property.",
      hook: "You won't believe this view",
      imageUrls: ["https://example.com/photo1.jpg"],
      tone: "luxury",
      userId: 1,
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.creatomate.com/v1/renders");

    const body = JSON.parse(options.body);
    // The composition must be nested under "source"
    expect(body).toHaveProperty("source");
    expect(body.source).toHaveProperty("output_format", "mp4");
    expect(body.source).toHaveProperty("elements");
    expect(Array.isArray(body.source.elements)).toBe(true);
    // Top-level body should NOT have output_format directly
    expect(body).not.toHaveProperty("output_format");
  });

  it("uses correct Authorization header", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("render-xyz-456"));

    const { renderAutoReel } = await import("./_core/creatomateRenderer");
    await renderAutoReel({
      script: "Test script",
      hook: "Test hook",
      imageUrls: ["https://example.com/photo1.jpg"],
      tone: "calm",
      userId: 1,
    });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer test-api-key-12345");
  });
});

describe("checkRenderStatus", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("maps 'succeeded' status to 'done'", async () => {
    mockFetch.mockResolvedValueOnce(
      makeStatusResponse("succeeded", "https://cdn.creatomate.com/video.mp4")
    );

    const result = await checkRenderStatus("test-render-id");
    expect(result.status).toBe("done");
    expect(result.url).toBe("https://cdn.creatomate.com/video.mp4");
  });

  it("maps 'rendering' status to 'rendering'", async () => {
    mockFetch.mockResolvedValueOnce(makeStatusResponse("rendering"));

    const result = await checkRenderStatus("test-render-id");
    expect(result.status).toBe("rendering");
    expect(result.url).toBeUndefined();
  });

  it("maps 'planned' status to 'queued'", async () => {
    mockFetch.mockResolvedValueOnce(makeStatusResponse("planned"));

    const result = await checkRenderStatus("test-render-id");
    expect(result.status).toBe("queued");
  });

  it("maps 'failed' status to 'failed' with error message", async () => {
    mockFetch.mockResolvedValueOnce(
      makeStatusResponse("failed", undefined, "Insufficient credits")
    );

    const result = await checkRenderStatus("test-render-id");
    expect(result.status).toBe("failed");
    expect(result.error).toBe("Insufficient credits");
  });

  it("maps unknown status to 'rendering' as safe fallback", async () => {
    mockFetch.mockResolvedValueOnce(makeStatusResponse("transcribing"));

    const result = await checkRenderStatus("test-render-id");
    expect(result.status).toBe("rendering");
  });

  it("throws when API returns non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Render not found",
    });

    await expect(checkRenderStatus("nonexistent-id")).rejects.toThrow(
      "Creatomate status check failed: 404"
    );
  });
});

describe("Creatomate source field structure", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("includes correct video dimensions for vertical AutoReel (9:16)", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("reel-render-001"));

    const { renderAutoReel } = await import("./_core/creatomateRenderer");
    await renderAutoReel({
      script: "Luxury living awaits.",
      hook: "Dream home",
      imageUrls: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
      tone: "luxury",
      userId: 1,
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    // AutoReels should be vertical (9:16)
    expect(body.source.width).toBe(1080);
    expect(body.source.height).toBe(1920);
  });

  it("includes a background video element and text elements", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("reel-render-002"));

    const { renderAutoReel } = await import("./_core/creatomateRenderer");

    await renderAutoReel({
      script: "Beautiful property. Great location. Must see today.",
      hook: "Must see",
      imageUrls: ["https://example.com/photo1.jpg"],
      tone: "calm",
      userId: 1,
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const elements = body.source.elements;

    // AutoReels use a background video (stock footage), not individual property images
    const videoElements = elements.filter((el: any) => el.type === "video");
    expect(videoElements.length).toBeGreaterThanOrEqual(1);

    // Should have text elements for hook and subtitles
    const textElements = elements.filter((el: any) => el.type === "text");
    expect(textElements.length).toBeGreaterThanOrEqual(1);

    // Hook text should be the first text element
    const hookElement = textElements[0];
    expect(hookElement.text).toBe("Must see");
  });
});
