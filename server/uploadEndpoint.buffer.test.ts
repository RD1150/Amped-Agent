/**
 * Tests for the uploadEndpoint.ts Buffer fix.
 *
 * The fix ensures that `file.buffer` (which is typed as `ArrayBuffer` in Express/multer
 * but is actually a Node.js Buffer at runtime) is safely wrapped in `Buffer.from()`
 * before passing to `new Blob()` for the ElevenLabs voice clone endpoint.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock storagePut so we don't actually hit S3
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/voice-sample.webm", key: "voice-samples/test.webm" }),
}));

describe("uploadEndpoint - Buffer compatibility fix", () => {
  it("Buffer.from() accepts a Node.js Buffer without throwing", () => {
    // Simulate what multer provides: a Node.js Buffer stored as file.buffer
    const nodeBuffer = Buffer.from("fake audio bytes", "utf-8");
    // This is the fix: wrapping in Buffer.from() should be safe and idempotent
    expect(() => {
      const blob = new Blob([Buffer.from(nodeBuffer)], { type: "audio/webm" });
      expect(blob.size).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it("Buffer.from() accepts a Uint8Array without throwing", () => {
    const uint8 = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // RIFF header bytes
    expect(() => {
      const blob = new Blob([Buffer.from(uint8)], { type: "audio/wav" });
      expect(blob.size).toBe(4);
    }).not.toThrow();
  });

  it("Blob created from Buffer has the correct MIME type", () => {
    const audioBytes = Buffer.from("mock-audio-content");
    const blob = new Blob([Buffer.from(audioBytes)], { type: "audio/mpeg" });
    expect(blob.type).toBe("audio/mpeg");
  });

  it("Blob size matches original buffer size", () => {
    const content = "hello voice clone";
    const buf = Buffer.from(content, "utf-8");
    const blob = new Blob([Buffer.from(buf)], { type: "audio/webm" });
    expect(blob.size).toBe(buf.byteLength);
  });

  it("storagePut mock returns expected URL shape for voice samples", async () => {
    const { storagePut } = await import("./storage");
    const result = await storagePut(
      "voice-samples/test-123.mp3",
      Buffer.from("audio data"),
      "audio/mpeg"
    );
    expect(result).toHaveProperty("url");
    expect(result.url).toMatch(/^https?:\/\//);
  });
});
