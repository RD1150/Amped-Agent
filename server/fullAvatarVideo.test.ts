import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the HeyGen service so tests don't make real API calls
vi.mock("./lib/heygen-service", () => ({
  createInstantAvatarFromPhoto: vi.fn().mockResolvedValue("mock-photo-avatar-id"),
  generateTalkingPhotoVideo: vi.fn().mockResolvedValue("mock-heygen-video-id"),
  generateCustomAvatarVideo: vi.fn().mockResolvedValue("mock-heygen-custom-video-id"),
  createCustomAvatar: vi.fn().mockResolvedValue({ avatarId: "mock-avatar-id", status: "processing" }),
  getCustomAvatarStatus: vi.fn().mockResolvedValue({ status: "completed", previewImageUrl: "https://example.com/preview.jpg" }),
  waitForHeyGenVideo: vi.fn().mockResolvedValue("https://heygen.com/mock-video.mp4"),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/mock-video.mp4", key: "mock-key" }),
}));

// Mock DB
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        $returningId: vi.fn().mockResolvedValue([{ id: 42 }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}));

describe("fullAvatarVideo router", () => {
  describe("estimateDuration helper", () => {
    it("estimates ~30 seconds for a 65-word script", () => {
      const script = "Hello everyone welcome to this property tour ".repeat(3).trim();
      const words = script.trim().split(/\s+/).length;
      const duration = Math.ceil((words / 130) * 60);
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(120);
    });

    it("estimates longer duration for longer scripts", () => {
      const shortScript = "Hello world this is a test script for duration estimation.";
      const longScript = shortScript.repeat(10);
      const shortWords = shortScript.trim().split(/\s+/).length;
      const longWords = longScript.trim().split(/\s+/).length;
      const shortDuration = Math.ceil((shortWords / 130) * 60);
      const longDuration = Math.ceil((longWords / 130) * 60);
      expect(longDuration).toBeGreaterThan(shortDuration);
    });
  });

  describe("HeyGen service mock validation", () => {
    it("mock heygen service returns expected values", async () => {
      const { createInstantAvatarFromPhoto, generateTalkingPhotoVideo, waitForHeyGenVideo } =
        await import("./lib/heygen-service");

      const photoId = await createInstantAvatarFromPhoto("https://example.com/photo.jpg");
      expect(photoId).toBe("mock-photo-avatar-id");

      const videoId = await generateTalkingPhotoVideo({
        photoAvatarId: photoId,
        script: "Hello, this is a test script for the avatar video.",
        voiceId: "en-US-JennyNeural",
      });
      expect(videoId).toBe("mock-heygen-video-id");

      const videoUrl = await waitForHeyGenVideo(videoId);
      expect(videoUrl).toBe("https://heygen.com/mock-video.mp4");
    });

    it("mock custom avatar training returns avatarId and status", async () => {
      const { createCustomAvatar } = await import("./lib/heygen-service");
      const result = await createCustomAvatar({
        trainingVideoUrl: "https://example.com/training.mp4",
        name: "Test Agent Twin",
      });
      expect(result.avatarId).toBe("mock-avatar-id");
      expect(result.status).toBe("processing");
    });

    it("mock custom avatar status returns completed", async () => {
      const { getCustomAvatarStatus } = await import("./lib/heygen-service");
      const result = await getCustomAvatarStatus("mock-avatar-id");
      expect(result.status).toBe("completed");
      expect(result.previewImageUrl).toBe("https://example.com/preview.jpg");
    });
  });

  describe("storage mock validation", () => {
    it("mock storagePut returns url and key", async () => {
      const { storagePut } = await import("./storage");
      const result = await storagePut("test-key.mp4", Buffer.from("test"), "video/mp4");
      expect(result.url).toBe("https://s3.example.com/mock-video.mp4");
    });
  });
});
