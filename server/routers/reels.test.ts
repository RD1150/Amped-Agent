import { describe, it, expect, vi, beforeEach } from "vitest";
import { reelsRouter } from "./reels";
import * as didAi from "../_core/didAi";

// Mock the D-ID AI module
vi.mock("../_core/didAi", () => ({
  generateTalkingAvatar: vi.fn(),
}));

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn(async () => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockResolvedValue([]), // Return array for listReels query
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  })),
}));

// Mock the storage module
vi.mock("../storage", () => ({
  storagePut: vi.fn(async () => ({ url: "https://s3.example.com/reel-1.mp4" })),
}));

// Mock fetch for video download
global.fetch = vi.fn(async () => ({
  ok: true,
  arrayBuffer: async () => new ArrayBuffer(1024),
})) as any;

describe("reelsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUsage", () => {
    it("should return usage stats for authenticated user", async () => {
      const caller = reelsRouter.createCaller({
        user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getUsage();

      expect(result).toHaveProperty("current");
      expect(result).toHaveProperty("limit");
      expect(result).toHaveProperty("tier");
      expect(result).toHaveProperty("remaining");
      expect(result).toHaveProperty("month");
    });
  });

  describe("generate", () => {
    it("should generate a talking avatar reel with valid input and store to S3", async () => {
      const mockVideoUrl = "https://d-id.example.com/video.mp4";
      vi.mocked(didAi.generateTalkingAvatar).mockResolvedValue(mockVideoUrl);

      const caller = reelsRouter.createCaller({
        user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.generate({
        script: "Hello, this is a test script for my talking avatar video.",
        avatarUrl: "https://example.com/avatar.jpg",
        voiceId: "en-US-JennyNeural",
      });

      expect(result).toHaveProperty("reelId");
      expect(result).toHaveProperty("videoUrl", "https://s3.example.com/reel-1.mp4");
      expect(result).toHaveProperty("needsWatermark");
      expect(result).toHaveProperty("expiresAt");
      expect(result).toHaveProperty("usage");
      expect(didAi.generateTalkingAvatar).toHaveBeenCalledWith({
        sourceUrl: "https://example.com/avatar.jpg",
        script: "Hello, this is a test script for my talking avatar video.",
        voiceId: "en-US-JennyNeural",
      });
    });

    it("should reject script that is too short", async () => {
      const caller = reelsRouter.createCaller({
        user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.generate({
          script: "Short",
          avatarUrl: "https://example.com/avatar.jpg",
        })
      ).rejects.toThrow();
    });

    it("should reject script that is too long", async () => {
      const caller = reelsRouter.createCaller({
        user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      const longScript = "a".repeat(1001);

      await expect(
        caller.generate({
          script: longScript,
          avatarUrl: "https://example.com/avatar.jpg",
        })
      ).rejects.toThrow();
    });

    it("should use default voice when not specified", async () => {
      const mockVideoUrl = "https://example.com/video.mp4";
      vi.mocked(didAi.generateTalkingAvatar).mockResolvedValue(mockVideoUrl);

      const caller = reelsRouter.createCaller({
        user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      await caller.generate({
        script: "Hello, this is a test script without voice ID.",
        avatarUrl: "https://example.com/avatar.jpg",
      });

      expect(didAi.generateTalkingAvatar).toHaveBeenCalledWith({
        sourceUrl: "https://example.com/avatar.jpg",
        script: "Hello, this is a test script without voice ID.",
        voiceId: "en-US-JennyNeural", // Default voice
      });
    });

    it("should handle D-ID API errors gracefully", async () => {
      vi.mocked(didAi.generateTalkingAvatar).mockRejectedValue(
        new Error("D-ID API rate limit exceeded")
      );

      const caller = reelsRouter.createCaller({
        user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.generate({
          script: "Hello, this is a test script.",
          avatarUrl: "https://example.com/avatar.jpg",
        })
      ).rejects.toThrow("Failed to generate reel");
    });
  });

  describe("listReels", () => {
    it("should return list of active reels for authenticated user", async () => {
      const caller = reelsRouter.createCaller({
        user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.listReels();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
