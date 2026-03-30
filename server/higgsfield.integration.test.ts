/**
 * Higgsfield AI Integration Tests
 *
 * Tests the higgsfieldAi service module:
 * - Motion prompt selection logic (room type + clip index)
 * - API credential availability
 * - Correct endpoint and auth header construction
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getHiggsfieldMotionPrompt } from "./_core/higgsfieldAi";

// ── Motion prompt logic tests ─────────────────────────────────────────────────

describe("getHiggsfieldMotionPrompt", () => {
  it("returns custom prompt when provided", () => {
    const result = getHiggsfieldMotionPrompt("living_room", 0, "My custom prompt");
    expect(result).toBe("My custom prompt");
  });

  it("returns a non-empty string for every known room type", () => {
    const roomTypes = [
      "exterior_front",
      "exterior_back",
      "living_room",
      "kitchen",
      "dining_room",
      "master_bedroom",
      "bedroom",
      "master_bathroom",
      "bathroom",
      "office",
      "garage",
      "pool",
      "view",
      "other",
    ];
    for (const roomType of roomTypes) {
      const prompt = getHiggsfieldMotionPrompt(roomType, 0);
      expect(prompt.length).toBeGreaterThan(10);
    }
  });

  it("returns different prompts for even vs odd clip index (alternating motion)", () => {
    const even = getHiggsfieldMotionPrompt("living_room", 0);
    const odd = getHiggsfieldMotionPrompt("living_room", 1);
    expect(even).not.toBe(odd);
  });

  it("returns exterior-specific prompt when isExterior is true", () => {
    const exterior = getHiggsfieldMotionPrompt("living_room", 0, undefined, true);
    const interior = getHiggsfieldMotionPrompt("living_room", 0, undefined, false);
    // Exterior prompt should reference crane/tilt or exterior-specific motion
    expect(exterior).not.toBe(interior);
  });

  it("falls back to 'other' prompt for unknown room types", () => {
    const unknown = getHiggsfieldMotionPrompt("unknown_room_xyz", 0);
    const other = getHiggsfieldMotionPrompt("other", 0);
    expect(unknown).toBe(other);
  });
});

// ── API credential availability ───────────────────────────────────────────────

describe("Higgsfield API credentials", () => {
  it("HIGGSFIELD_API_KEY is set in the environment", () => {
    const key = process.env.HIGGSFIELD_API_KEY;
    expect(key).toBeTruthy();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("HIGGSFIELD_KEY_ID is set in the environment", () => {
    const keyId = process.env.HIGGSFIELD_KEY_ID;
    expect(keyId).toBeTruthy();
    expect(keyId!.length).toBeGreaterThan(3);
  });
});

// ── Endpoint construction test (mocked fetch) ─────────────────────────────────

describe("submitHiggsfieldGeneration (mocked)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("calls the correct Higgsfield endpoint with Bearer auth", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ id: "test-gen-id-123" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { submitHiggsfieldGeneration } = await import("./_core/higgsfieldAi");
    const id = await submitHiggsfieldGeneration(
      "https://example.com/listing-photo.jpg",
      "Slow cinematic dolly push-in"
    );

    expect(id).toBe("test-gen-id-123");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.higgsfield.ai/v1/generations",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Bearer /),
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("throws on non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    }));

    const { submitHiggsfieldGeneration } = await import("./_core/higgsfieldAi");
    await expect(
      submitHiggsfieldGeneration("https://example.com/photo.jpg", "test prompt")
    ).rejects.toThrow("Higgsfield API error 401");
  });
});
