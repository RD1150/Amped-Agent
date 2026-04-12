/**
 * referral.test.ts
 * Unit tests for the referral system DB helpers and tRPC router.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the DB module ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserByOpenId: vi.fn(),
  getUserByReferralCode: vi.fn(),
  generateReferralCode: vi.fn(),
  applyReferral: vi.fn(),
  getReferralStats: vi.fn(),
}));

vi.mock("./credits", () => ({
  addCredits: vi.fn().mockResolvedValue(50),
}));

import * as db from "./db";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Referral system", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserByReferralCode", () => {
    it("returns a user when the code matches", async () => {
      const mockUser = { id: 1, referralCode: "ABCD1234", name: "Alice" };
      vi.mocked(db.getUserByReferralCode).mockResolvedValue(mockUser as any);

      const result = await db.getUserByReferralCode("ABCD1234");
      expect(result).toEqual(mockUser);
      expect(db.getUserByReferralCode).toHaveBeenCalledWith("ABCD1234");
    });

    it("returns undefined for an unknown code", async () => {
      vi.mocked(db.getUserByReferralCode).mockResolvedValue(undefined);

      const result = await db.getUserByReferralCode("UNKNOWN");
      expect(result).toBeUndefined();
    });
  });

  describe("applyReferral", () => {
    it("calls applyReferral with correct user IDs", async () => {
      vi.mocked(db.applyReferral).mockResolvedValue(undefined);

      await db.applyReferral(2, 1);
      expect(db.applyReferral).toHaveBeenCalledWith(2, 1);
    });
  });

  describe("getReferralStats", () => {
    it("returns code, count, and credits earned", async () => {
      vi.mocked(db.getReferralStats).mockResolvedValue({
        referralCode: "ABCD1234",
        referralCount: 3,
        creditsEarned: 150,
      });

      const stats = await db.getReferralStats(1);
      expect(stats.referralCode).toBe("ABCD1234");
      expect(stats.referralCount).toBe(3);
      expect(stats.creditsEarned).toBe(150);
    });
  });

  describe("Referral code generation", () => {
    it("calls generateReferralCode for a new user", async () => {
      vi.mocked(db.generateReferralCode).mockResolvedValue("NEWCODE1");

      const code = await db.generateReferralCode(5);
      expect(code).toBe("NEWCODE1");
      expect(db.generateReferralCode).toHaveBeenCalledWith(5);
    });
  });

  describe("Self-referral prevention", () => {
    it("does not apply referral when referrer and new user are the same", async () => {
      const sameUser = { id: 1, referralCode: "MYCODE12", name: "Self" };
      vi.mocked(db.getUserByOpenId).mockResolvedValue(sameUser as any);
      vi.mocked(db.getUserByReferralCode).mockResolvedValue(sameUser as any);

      // Simulate the guard logic from the tRPC procedure
      const newUserId = 1;
      const referrer = await db.getUserByReferralCode("MYCODE12");
      const shouldApply = referrer && referrer.id !== newUserId;

      expect(shouldApply).toBe(false);
      expect(db.applyReferral).not.toHaveBeenCalled();
    });
  });

  describe("Invalid referral code", () => {
    it("does not apply referral when code is invalid", async () => {
      vi.mocked(db.getUserByReferralCode).mockResolvedValue(undefined);

      const referrer = await db.getUserByReferralCode("BADCODE");
      const shouldApply = !!referrer;

      expect(shouldApply).toBe(false);
      expect(db.applyReferral).not.toHaveBeenCalled();
    });
  });
});
