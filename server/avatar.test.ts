import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
vi.mock("./db", () => ({
  default: {
    getUserById: vi.fn().mockResolvedValue({
      id: 1, name: "Test Agent", email: "test@example.com",
      avatarImageUrl: "https://s3.example.com/avatar.png",
      avatarVideoUrl: "https://s3.example.com/avatar-video.mp4",
      role: "user", subscriptionTier: "basic",
    }),
    updateUserAvatar: vi.fn().mockResolvedValue({ id: 1 }),
  },
}));

import * as db from "./db";

describe("Avatar persistence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updateUserAvatar saves avatarImageUrl when provided", async () => {
    await db.default.updateUserAvatar(1, "https://s3.example.com/new-avatar.png", null);
    expect(db.default.updateUserAvatar).toHaveBeenCalledWith(
      1,
      "https://s3.example.com/new-avatar.png",
      null
    );
  });

  it("updateUserAvatar saves avatarVideoUrl when provided", async () => {
    await db.default.updateUserAvatar(1, null, "https://s3.example.com/video.mp4");
    expect(db.default.updateUserAvatar).toHaveBeenCalledWith(
      1,
      null,
      "https://s3.example.com/video.mp4"
    );
  });

  it("getUserById returns saved avatar fields", async () => {
    const user = await db.default.getUserById(1);
    expect(user?.avatarImageUrl).toBe("https://s3.example.com/avatar.png");
    expect(user?.avatarVideoUrl).toBe("https://s3.example.com/avatar-video.mp4");
  });
});
