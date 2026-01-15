import { User } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Feature Gating System
 * Controls access to features based on subscription tier
 */

export type SubscriptionTier = "starter" | "professional" | "agency";

export interface TierFeatures {
  // Content features
  contentGeneration: boolean;
  contentCalendar: boolean;
  trendingNews: boolean;
  marketStats: boolean;
  videoConversion: boolean;

  // Posting features
  directPosting: boolean; // FB/IG/LinkedIn
  ghlIntegration: boolean;
  autoFunnels: boolean;

  // Analytics features
  contentAnalytics: boolean;
  abTesting: boolean;

  // Agency features
  subAccounts: boolean;
  whiteLabel: boolean;
  customDomain: boolean;

  // Limits
  maxPostsPerMonth: number;
  maxImagesPerMonth: number;
}

/**
 * Feature matrix by tier
 */
export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  starter: {
    contentGeneration: true,
    contentCalendar: true,
    trendingNews: true,
    marketStats: true,
    videoConversion: true,
    directPosting: true,
    ghlIntegration: false,
    autoFunnels: false,
    contentAnalytics: false,
    abTesting: false,
    subAccounts: false,
    whiteLabel: false,
    customDomain: false,
    maxPostsPerMonth: 100,
    maxImagesPerMonth: 50,
  },
  professional: {
    contentGeneration: true,
    contentCalendar: true,
    trendingNews: true,
    marketStats: true,
    videoConversion: true,
    directPosting: true,
    ghlIntegration: true,
    autoFunnels: true,
    contentAnalytics: true,
    abTesting: true,
    subAccounts: false,
    whiteLabel: false,
    customDomain: false,
    maxPostsPerMonth: 500,
    maxImagesPerMonth: 250,
  },
  agency: {
    contentGeneration: true,
    contentCalendar: true,
    trendingNews: true,
    marketStats: true,
    videoConversion: true,
    directPosting: true,
    ghlIntegration: true,
    autoFunnels: true,
    contentAnalytics: true,
    abTesting: true,
    subAccounts: true,
    whiteLabel: true,
    customDomain: true,
    maxPostsPerMonth: -1, // unlimited
    maxImagesPerMonth: -1, // unlimited
  },
};

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(
  user: User,
  feature: keyof TierFeatures
): boolean {
  const tier = user.subscriptionTier || "starter";
  const features = TIER_FEATURES[tier];
  return features[feature] as boolean;
}

/**
 * Require feature access (throws error if not allowed)
 */
export function requireFeatureAccess(
  user: User,
  feature: keyof TierFeatures,
  featureName: string
): void {
  if (!hasFeatureAccess(user, feature)) {
    const tier = user.subscriptionTier || "starter";
    const requiredTier = getRequiredTier(feature);
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${featureName} is only available on the ${requiredTier} plan. Upgrade to unlock this feature.`,
    });
  }
}

/**
 * Get required tier for a feature
 */
function getRequiredTier(feature: keyof TierFeatures): string {
  if (TIER_FEATURES.professional[feature] && !TIER_FEATURES.starter[feature]) {
    return "Professional";
  }
  if (TIER_FEATURES.agency[feature] && !TIER_FEATURES.professional[feature]) {
    return "Agency";
  }
  return "Starter";
}

/**
 * Get user's tier features
 */
export function getUserFeatures(user: User): TierFeatures {
  const tier = user.subscriptionTier || "starter";
  return TIER_FEATURES[tier];
}

/**
 * Check if user is on trial
 */
export function isOnTrial(user: User): boolean {
  return user.subscriptionStatus === "trialing";
}

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(user: User): boolean {
  return (
    user.subscriptionStatus === "active" ||
    user.subscriptionStatus === "trialing"
  );
}

/**
 * Environment flag to enable/disable tier restrictions
 * Useful for development and testing
 */
export function areTierRestrictionsEnabled(): boolean {
  return process.env.ENABLE_TIER_RESTRICTIONS === "true";
}
