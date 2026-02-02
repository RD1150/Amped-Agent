import { User } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Feature Gating System
 * Controls access to features based on subscription tier
 */

export type SubscriptionTier = "starter" | "pro" | "premium";

export interface TierFeatures {
  // Content features
  contentGeneration: boolean;
  templates: number;
  scheduling: boolean;
  
  // Social media
  facebookIntegration: boolean;
  instagramIntegration: boolean;
  
  // AI Video features
  aiVideos: number; // -1 = unlimited
  listingPhotoVideos: boolean;
  voiceCloning: boolean;
  
  // Team features
  teamSeats: number;
  whiteLabel: boolean;
  apiAccess: boolean;
  
  // Support
  support: string;
}

/**
 * Feature matrix by tier
 */
export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  starter: {
    contentGeneration: true,
    templates: 50,
    scheduling: true,
    facebookIntegration: true,
    instagramIntegration: true,
    aiVideos: 5,
    listingPhotoVideos: true,
    voiceCloning: false,
    teamSeats: 1,
    whiteLabel: false,
    apiAccess: false,
    support: "email-48hr",
  },
  pro: {
    contentGeneration: true,
    templates: 50,
    scheduling: true,
    facebookIntegration: true,
    instagramIntegration: true,
    aiVideos: 20,
    listingPhotoVideos: true,
    voiceCloning: false,
    teamSeats: 1,
    whiteLabel: false,
    apiAccess: false,
    support: "email-24hr",
  },
  premium: {
    contentGeneration: true,
    templates: 100,
    scheduling: true,
    facebookIntegration: true,
    instagramIntegration: true,
    aiVideos: -1, // unlimited
    listingPhotoVideos: true,
    voiceCloning: true,
    teamSeats: 3,
    whiteLabel: true,
    apiAccess: true,
    support: "phone-4hr",
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
  if (TIER_FEATURES.pro[feature] && !TIER_FEATURES.starter[feature]) {
    return "Pro";
  }
  if (TIER_FEATURES.premium[feature] && !TIER_FEATURES.pro[feature]) {
    return "Premium";
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
