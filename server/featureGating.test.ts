import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { isTrialActive, hasPlatformAccess, requirePlatformAccess, areTierRestrictionsEnabled, TRIAL_DAYS } from "./_core/featureGating";
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
    ...overrides,
  } as unknown as User;
}

describe("featureGating", () => {
  it("ENABLE_TIER_RESTRICTIONS env var is set to true", () => {
    expect(process.env.ENABLE_TIER_RESTRICTIONS).toBe("true");
    expect(areTierRestrictionsEnabled()).toBe(true);
  });

  it("TRIAL_DAYS is 7", () => {
    expect(TRIAL_DAYS).toBe(7);
  });

  it("user created today is within trial", () => {
    const user = makeUser({ createdAt: new Date() });
    expect(isTrialActive(user)).toBe(true);
    expect(hasPlatformAccess(user)).toBe(true);
  });

  it("user created 8 days ago with no subscription is blocked", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8);
    const user = makeUser({ createdAt: oldDate, subscriptionStatus: "inactive" });
    expect(isTrialActive(user)).toBe(false);
    expect(hasPlatformAccess(user)).toBe(false);
  });

  it("user with active subscription is always allowed", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30);
    const user = makeUser({ createdAt: oldDate, subscriptionStatus: "active" });
    expect(hasPlatformAccess(user)).toBe(true);
  });

  it("admin is always allowed regardless of subscription", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30);
    const user = makeUser({ createdAt: oldDate, subscriptionStatus: "inactive", role: "admin" });
    expect(hasPlatformAccess(user)).toBe(true);
  });

  it("requirePlatformAccess throws FORBIDDEN for expired trial user when restrictions enabled", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8);
    const user = makeUser({ createdAt: oldDate, subscriptionStatus: "inactive" });
    expect(() => requirePlatformAccess(user)).toThrow("SUBSCRIPTION_REQUIRED");
  });
});
