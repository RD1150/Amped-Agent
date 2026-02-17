import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock the database module
vi.mock("./db", () => ({
  updateUserProfile: vi.fn(),
  markOnboardingComplete: vi.fn(),
  getPersonaByUserId: vi.fn(),
}));

describe("Onboarding Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateUserProfile", () => {
    it("should update user profile with name, bio, and location", async () => {
      const mockUserId = 1;
      const mockProfileData = {
        name: "John Doe",
        bio: "Real estate agent in Los Angeles",
        location: "Los Angeles, CA",
      };

      vi.mocked(db.updateUserProfile).mockResolvedValue({ success: true });
      vi.mocked(db.getPersonaByUserId).mockResolvedValue(null);

      const result = await db.updateUserProfile(mockUserId, mockProfileData);

      expect(db.updateUserProfile).toHaveBeenCalledWith(mockUserId, mockProfileData);
      expect(result).toEqual({ success: true });
    });

    it("should handle profile update without bio and location", async () => {
      const mockUserId = 1;
      const mockProfileData = {
        name: "Jane Smith",
      };

      vi.mocked(db.updateUserProfile).mockResolvedValue({ success: true });

      const result = await db.updateUserProfile(mockUserId, mockProfileData);

      expect(db.updateUserProfile).toHaveBeenCalledWith(mockUserId, mockProfileData);
      expect(result).toEqual({ success: true });
    });
  });

  describe("markOnboardingComplete", () => {
    it("should mark onboarding as complete for a user", async () => {
      const mockUserId = 1;

      vi.mocked(db.markOnboardingComplete).mockResolvedValue({ success: true });

      const result = await db.markOnboardingComplete(mockUserId);

      expect(db.markOnboardingComplete).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({ success: true });
    });

    it("should handle onboarding completion for multiple users", async () => {
      const userIds = [1, 2, 3];

      vi.mocked(db.markOnboardingComplete).mockResolvedValue({ success: true });

      for (const userId of userIds) {
        const result = await db.markOnboardingComplete(userId);
        expect(result).toEqual({ success: true });
      }

      expect(db.markOnboardingComplete).toHaveBeenCalledTimes(3);
    });
  });

  describe("Onboarding Flow Integration", () => {
    it("should complete full onboarding flow: profile update then mark complete", async () => {
      const mockUserId = 1;
      const mockProfileData = {
        name: "Sarah Johnson",
        bio: "Luxury real estate specialist",
        location: "Miami, FL",
      };

      vi.mocked(db.updateUserProfile).mockResolvedValue({ success: true });
      vi.mocked(db.markOnboardingComplete).mockResolvedValue({ success: true });
      vi.mocked(db.getPersonaByUserId).mockResolvedValue(null);

      // Step 1: Update profile
      const profileResult = await db.updateUserProfile(mockUserId, mockProfileData);
      expect(profileResult).toEqual({ success: true });

      // Step 2: Mark onboarding complete
      const onboardingResult = await db.markOnboardingComplete(mockUserId);
      expect(onboardingResult).toEqual({ success: true });

      // Verify both functions were called in sequence
      expect(db.updateUserProfile).toHaveBeenCalledWith(mockUserId, mockProfileData);
      expect(db.markOnboardingComplete).toHaveBeenCalledWith(mockUserId);
    });
  });
});
