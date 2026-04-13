import { describe, it, expect } from "vitest";
import {
  isTrialActive,
  hasPlatformAccess,
  requirePlatformAccess,
  areTierRestrictionsEnabled,
  getEffectiveTier,
  TRIAL_DAYS,
} from "./_core/featureGating";
import type { User } from "../drizzle/schema";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    role: "user",
    subscriptionStatus: "inactive",
    subscriptionTier: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    dailyVideoCount: 0,
    lastDailyReset: new Date(),
    lastSignedIn: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    avatarVideoUrl: null,
    loginMethod: null,
    creditBalance: 0,
    trialEndsAt: null,
    ...overrides,
  } as unknown as User;
}

describe("featureGating", () => {
  it("ENABLE_TIER_RESTRICTIONS env var is set to true", () => {
    expect(process.env.ENABLE_TIER_RESTRICTIONS).toBe("true");
    expect(areTierRestrictionsEnabled()).toBe(true);
  });

  it("TRIAL_DAYS is 14", () => {
    expect(TRIAL_DAYS).toBe(14);
  });

  it("user with trialing status and future trialEndsAt is on active trial", () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7); // 7 days from now
    const user = makeUser({ subscriptionStatus: "trialing", trialEndsAt: trialEnd });
    expect(isTrialActive(user)).toBe(true);
    expect(hasPlatformAccess(user)).toBe(true);
  });

  it("user with trialing status and past trialEndsAt is NOT on active trial", () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() - 1); // 1 day ago
    const user = makeUser({ subscriptionStatus: "trialing", trialEndsAt: trialEnd });
    expect(isTrialActive(user)).toBe(false);
    expect(hasPlatformAccess(user)).toBe(false);
  });

  it("user with trialing status and no trialEndsAt trusts Stripe status", () => {
    const user = makeUser({ subscriptionStatus: "trialing", trialEndsAt: null });
    expect(isTrialActive(user)).toBe(true);
    expect(hasPlatformAccess(user)).toBe(true);
  });

  it("user with inactive status and no trial is blocked", () => {
    const user = makeUser({ subscriptionStatus: "inactive", trialEndsAt: null });
    expect(isTrialActive(user)).toBe(false);
    expect(hasPlatformAccess(user)).toBe(false);
  });

  it("user with active subscription is always allowed", () => {
    const user = makeUser({ subscriptionStatus: "active", subscriptionTier: "pro" });
    expect(hasPlatformAccess(user)).toBe(true);
  });

  it("admin is always allowed regardless of subscription", () => {
    const user = makeUser({ subscriptionStatus: "inactive", role: "admin" });
    expect(hasPlatformAccess(user)).toBe(true);
  });

  it("requirePlatformAccess throws FORBIDDEN for user with no subscription or trial", () => {
    const user = makeUser({ subscriptionStatus: "inactive" });
    expect(() => requirePlatformAccess(user)).toThrow("SUBSCRIPTION_REQUIRED");
  });

  it("trial user gets Authority effective tier regardless of stored tier", () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 5);
    const user = makeUser({
      subscriptionStatus: "trialing",
      subscriptionTier: "starter",
      trialEndsAt: trialEnd,
    });
    expect(getEffectiveTier(user)).toBe("authority");
  });

  it("active user gets their stored tier as effective tier", () => {
    const user = makeUser({ subscriptionStatus: "active", subscriptionTier: "pro" });
    expect(getEffectiveTier(user)).toBe("pro");
  });

  it("inactive user defaults to starter effective tier", () => {
    const user = makeUser({ subscriptionStatus: "inactive", subscriptionTier: null });
    expect(getEffectiveTier(user)).toBe("starter");
  });
});
