import { describe, it, expect } from "vitest";
import { VIDEO_LIMITS, type VideoMode, type SubscriptionTier } from "./videoUsageTracking";

describe("videoUsageTracking", () => {
  it("should have correct video limits for starter tier", () => {
    expect(VIDEO_LIMITS.starter.standard).toBe(5);
    expect(VIDEO_LIMITS.starter.aiEnhanced).toBe(2);
    expect(VIDEO_LIMITS.starter.fullAi).toBe(0);
  });

  it("should have correct video limits for pro tier", () => {
    expect(VIDEO_LIMITS.pro.standard).toBe(20);
    expect(VIDEO_LIMITS.pro.aiEnhanced).toBe(10);
    expect(VIDEO_LIMITS.pro.fullAi).toBe(3);
  });

  it("should have correct video limits for premium tier", () => {
    expect(VIDEO_LIMITS.authority.standard).toBe(999);
    expect(VIDEO_LIMITS.authority.aiEnhanced).toBe(25);
    expect(VIDEO_LIMITS.authority.fullAi).toBe(10);
  });

  it("should define all video modes", () => {
    const modes: VideoMode[] = ["standard", "ai-enhanced", "full-ai"];
    expect(modes).toHaveLength(3);
  });

  it("should define all subscription tiers", () => {
    const tiers: SubscriptionTier[] = ["starter", "pro", "premium"];
    expect(tiers).toHaveLength(3);
  });
});
