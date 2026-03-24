/**
 * Tests for data transparency features:
 * 1. Market update stat slides use real statLabel (not hardcoded "YoY")
 * 2. "Data as of [Month Year]  ·  Source: Realtor.com" appears on the final CTA slide
 * 3. MarketUpdateRenderOptions accepts optional statLabel field
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

// ─── Tests: statLabel on price slide ─────────────────────────────────────────

describe("renderMarketUpdateReel: statLabel on price slide", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("uses the provided statLabel on the median price slide (not hardcoded YoY)", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("market-statlabel-001"));

    const { renderMarketUpdateReel } = await import("./_core/videoRenderer");

    await renderMarketUpdateReel({
      location: "Thousand Oaks, CA",
      medianPrice: 1250000,
      priceChange: -4.2,
      daysOnMarket: 28,
      activeListings: 142,
      pricePerSqft: 520,
      marketTemperature: "balanced",
      statLabel: "vs last month",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const elements = body.source.elements;

    // Find the price slide subline (contains "Median Home Price")
    const priceSubline = elements.find(
      (el: any) => el.type === "text" && typeof el.text === "string" && el.text.includes("Median Home Price")
    );

    expect(priceSubline).toBeDefined();
    expect(priceSubline.text).toContain("vs last month");
    // Must NOT contain hardcoded "YoY"
    expect(priceSubline.text).not.toContain("YoY");
  });

  it("uses 'MoM' as fallback statLabel when none is provided", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("market-statlabel-002"));

    const { renderMarketUpdateReel } = await import("./_core/videoRenderer");

    await renderMarketUpdateReel({
      location: "Thousand Oaks, CA",
      medianPrice: 1250000,
      priceChange: 2.1,
      daysOnMarket: 22,
      activeListings: 130,
      pricePerSqft: 510,
      marketTemperature: "hot",
      // No statLabel provided — should fall back to "MoM"
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const elements = body.source.elements;

    const priceSubline = elements.find(
      (el: any) => el.type === "text" && typeof el.text === "string" && el.text.includes("Median Home Price")
    );

    expect(priceSubline).toBeDefined();
    expect(priceSubline.text).toContain("MoM");
  });

  it("shows down arrow (↓) for negative price change", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("market-statlabel-003"));

    const { renderMarketUpdateReel } = await import("./_core/videoRenderer");

    await renderMarketUpdateReel({
      location: "Thousand Oaks, CA",
      medianPrice: 1200000,
      priceChange: -4.5,
      daysOnMarket: 35,
      activeListings: 180,
      pricePerSqft: 490,
      marketTemperature: "cold",
      statLabel: "vs last month",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const elements = body.source.elements;

    const priceSubline = elements.find(
      (el: any) => el.type === "text" && typeof el.text === "string" && el.text.includes("Median Home Price")
    );

    expect(priceSubline).toBeDefined();
    expect(priceSubline.text).toContain("↓");
    expect(priceSubline.text).toContain("4.5%");
  });
});

// ─── Tests: "Data as of" timestamp on final slide ────────────────────────────

describe("renderMarketUpdateReel: data timestamp on final slide", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("includes 'Data as of' text element on the final CTA slide", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("market-timestamp-001"));

    const { renderMarketUpdateReel } = await import("./_core/videoRenderer");

    await renderMarketUpdateReel({
      location: "Thousand Oaks, CA",
      medianPrice: 1250000,
      priceChange: -4.2,
      daysOnMarket: 28,
      activeListings: 142,
      pricePerSqft: 520,
      marketTemperature: "balanced",
      statLabel: "vs last month",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const elements = body.source.elements;

    const dataTimestamp = elements.find(
      (el: any) => el.type === "text" && typeof el.text === "string" && el.text.includes("Data as of")
    );

    expect(dataTimestamp).toBeDefined();
    expect(dataTimestamp.text).toContain("Source: Realtor.com");
  });

  it("data timestamp element appears only on the final slide (time >= 20s)", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("market-timestamp-002"));

    const { renderMarketUpdateReel } = await import("./_core/videoRenderer");

    await renderMarketUpdateReel({
      location: "Conejo Valley, CA",
      medianPrice: 1300000,
      priceChange: 1.8,
      daysOnMarket: 20,
      activeListings: 110,
      pricePerSqft: 545,
      marketTemperature: "hot",
      statLabel: "MoM",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const elements = body.source.elements;

    const dataTimestamp = elements.find(
      (el: any) => el.type === "text" && typeof el.text === "string" && el.text.includes("Data as of")
    );

    expect(dataTimestamp).toBeDefined();
    // Final slide starts at 5 * 4s = 20s
    expect(dataTimestamp.time).toBeGreaterThanOrEqual(20);
  });

  it("data timestamp contains current year", async () => {
    mockFetch.mockResolvedValueOnce(makeRenderResponse("market-timestamp-003"));

    const { renderMarketUpdateReel } = await import("./_core/videoRenderer");

    await renderMarketUpdateReel({
      location: "Thousand Oaks, CA",
      medianPrice: 1250000,
      priceChange: 0,
      daysOnMarket: 30,
      activeListings: 150,
      pricePerSqft: 510,
      marketTemperature: "balanced",
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const elements = body.source.elements;

    const dataTimestamp = elements.find(
      (el: any) => el.type === "text" && typeof el.text === "string" && el.text.includes("Data as of")
    );

    expect(dataTimestamp).toBeDefined();
    const currentYear = new Date().getFullYear().toString();
    expect(dataTimestamp.text).toContain(currentYear);
  });
});
