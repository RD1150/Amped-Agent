import { describe, it, expect } from "vitest";

/**
 * Unit tests for Avatar Library multi-avatar support logic.
 * These tests validate the business rules around managing multiple avatars per user.
 */

// --- Helper: simulate the isDefault logic ---
function applyDefaultFlag(
  avatars: Array<{ id: number; isDefault: boolean }>,
  newDefaultId: number
) {
  return avatars.map((a) => ({ ...a, isDefault: a.id === newDefaultId }));
}

// --- Helper: simulate the "get default avatar" query ---
function getDefaultAvatar(
  avatars: Array<{ id: number; isDefault: boolean; status: string }>
) {
  return (
    avatars.find((a) => a.isDefault && a.status === "ready") ??
    avatars.find((a) => a.status === "ready") ??
    null
  );
}

// --- Helper: validate avatar ID format ---
function isValidAvatarId(id: string): boolean {
  return typeof id === "string" && id.trim().length > 0;
}

describe("Avatar Library — multi-avatar support", () => {
  describe("setDefaultAvatar", () => {
    it("sets the correct avatar as default and clears others", () => {
      const avatars = [
        { id: 1, isDefault: true },
        { id: 2, isDefault: false },
        { id: 3, isDefault: false },
      ];
      const updated = applyDefaultFlag(avatars, 2);
      expect(updated.find((a) => a.id === 2)?.isDefault).toBe(true);
      expect(updated.find((a) => a.id === 1)?.isDefault).toBe(false);
      expect(updated.find((a) => a.id === 3)?.isDefault).toBe(false);
    });

    it("handles single avatar correctly", () => {
      const avatars = [{ id: 1, isDefault: false }];
      const updated = applyDefaultFlag(avatars, 1);
      expect(updated[0].isDefault).toBe(true);
    });
  });

  describe("getDefaultAvatar", () => {
    it("returns the default ready avatar", () => {
      const avatars = [
        { id: 1, isDefault: false, status: "ready" },
        { id: 2, isDefault: true, status: "ready" },
        { id: 3, isDefault: false, status: "training" },
      ];
      const result = getDefaultAvatar(avatars);
      expect(result?.id).toBe(2);
    });

    it("falls back to first ready avatar if none is default", () => {
      const avatars = [
        { id: 1, isDefault: false, status: "training" },
        { id: 2, isDefault: false, status: "ready" },
        { id: 3, isDefault: false, status: "ready" },
      ];
      const result = getDefaultAvatar(avatars);
      expect(result?.id).toBe(2);
    });

    it("returns null if no ready avatars exist", () => {
      const avatars = [
        { id: 1, isDefault: false, status: "training" },
        { id: 2, isDefault: false, status: "failed" },
      ];
      const result = getDefaultAvatar(avatars);
      expect(result).toBeNull();
    });

    it("returns null for empty library", () => {
      expect(getDefaultAvatar([])).toBeNull();
    });
  });

  describe("avatar ID validation", () => {
    it("accepts valid HeyGen avatar IDs", () => {
      expect(isValidAvatarId("06d9f77a44e74f649c0ce6416ab23684")).toBe(true);
      expect(isValidAvatarId("abc123")).toBe(true);
    });

    it("rejects empty or whitespace IDs", () => {
      expect(isValidAvatarId("")).toBe(false);
      expect(isValidAvatarId("   ")).toBe(false);
    });
  });

  describe("avatar intro script handling", () => {
    it("uses custom script when provided", () => {
      const script = "Hi, I'm Reena and I'm excited to show you this home!";
      const resolved = script || "Welcome! Let me show you this beautiful property.";
      expect(resolved).toBe(script);
    });

    it("uses default script when none provided", () => {
      const script = "";
      const defaultScript = "Welcome! Let me show you this beautiful property.";
      const resolved = script || defaultScript;
      expect(resolved).toBe(defaultScript);
    });
  });
});
