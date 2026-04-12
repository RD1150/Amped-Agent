import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally to avoid real D-ID API calls (account may be out of credits)
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  createTalkingAvatar,
  getTalkStatus,
  getRemainingCredits,
  generateAvatarIntro,
} from "./did-service";

/**
 * Test D-ID Service Module
 *
 * These tests validate the D-ID API integration functions using mocked responses.
 * Real API calls are avoided to prevent credit consumption and flaky tests.
 */
describe("D-ID Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get remaining credits", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ remaining: 42 }),
    });

    const credits = await getRemainingCredits();

    expect(credits).toBeGreaterThanOrEqual(0);
    expect(typeof credits).toBe("number");
  });

  it("should create a talking avatar video", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "tlk_mock_abc123", status: "created" }),
    });

    const avatarUrl = "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg";
    const script = "Hello! This is a test of the D-ID API integration.";

    const talkId = await createTalkingAvatar(avatarUrl, script);

    expect(talkId).toBeDefined();
    expect(typeof talkId).toBe("string");
    expect(talkId.length).toBeGreaterThan(0);
  });

  it("should get talk status", async () => {
    // Mock createTalkingAvatar
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "tlk_mock_xyz789", status: "created" }),
    });
    // Mock getTalkStatus
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "tlk_mock_xyz789", status: "done", result_url: "https://cdn.d-id.com/video.mp4" }),
    });

    const avatarUrl = "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg";
    const script = "Testing status check.";

    const talkId = await createTalkingAvatar(avatarUrl, script);
    const status = await getTalkStatus(talkId);

    expect(status).toBeDefined();
    expect(status.id).toBe(talkId);
    expect(status.status).toMatch(/created|started|done/);
  });

  it("should generate a complete avatar intro video", async () => {
    // Mock createTalkingAvatar
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "tlk_mock_intro001", status: "created" }),
    });
    // Mock polling getTalkStatus (done on first poll)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "tlk_mock_intro001",
        status: "done",
        result_url: "https://cdn.d-id.com/intro-video.mp4",
      }),
    });

    const avatarUrl = "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg";
    const script = "Welcome to Amped Agent! I'm here to help you create amazing real estate videos.";

    const videoUrl = await generateAvatarIntro(avatarUrl, script);

    expect(videoUrl).toBeDefined();
    expect(typeof videoUrl).toBe("string");
    expect(videoUrl).toMatch(/^https?:\/\//);
  });
});
