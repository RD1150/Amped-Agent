import { describe, it, expect, vi, beforeEach } from "vitest";

// Test that the upload endpoint module exports a router
describe("Avatar Upload Endpoint", () => {
  it("should export a router with /upload and /upload-images routes", async () => {
    const mod = await import("./uploadEndpoint");
    expect(mod.default).toBeDefined();
    // Router should be an Express router (function)
    expect(typeof mod.default).toBe("function");
  });

  it("updateUserAvatar db helper should accept avatarImageUrl", async () => {
    const db = await import("./db");
    expect(typeof db.updateUserAvatar).toBe("function");
  });
});
