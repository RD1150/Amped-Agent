import { User } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Feature Gating System
 * Controls access to features based on subscription tier and trial status
 */

export type SubscriptionTier = "starter" | "pro" | "authority";

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
  authority: {
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
 * Trial period in days (Stripe-backed trial)
 */
export const TRIAL_DAYS = 14;

/**
 * Check if user is currently on a Stripe-backed trial.
 * A trial is active when subscriptionStatus === 'trialing'.
 */
export function isTrialActive(user: User): boolean {
  if (user.subscriptionStatus === "trialing") {
    // If trialEndsAt is set, verify it hasn't passed
    if (user.trialEndsAt) {
      return new Date() < new Date(user.trialEndsAt);
    }
    // If no trialEndsAt (legacy), trust the Stripe status
    return true;
  }
  return false;
}

/**
 * Get trial end date for a user (from Stripe-backed trialEndsAt or fallback)
 */
export function getTrialEndDate(user: User): Date | null {
  if (user.trialEndsAt) {
    return new Date(user.trialEndsAt);
  }
  return null;
}

/**
 * Get days remaining in trial (0 if expired or no trial)
 */
export function getTrialDaysRemaining(user: User): number {
  const trialEnd = getTrialEndDate(user);
  if (!trialEnd) return 0;
  const now = new Date();
  const msRemaining = trialEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
}

/**
 * Check if user has a paid active subscription
 */
export function hasActiveSubscription(user: User): boolean {
  return user.subscriptionStatus === "active";
}

/**
 * Check if user is on a Stripe trial
 */
export function isOnTrial(user: User): boolean {
  return isTrialActive(user);
}

/**
 * Get the effective subscription tier for a user.
 * Trial users always get Authority-level access regardless of their stored tier.
 */
export function getEffectiveTier(user: User): SubscriptionTier {
  // Trial users get full Authority access
  if (isTrialActive(user)) {
    return "authority";
  }
  return (user.subscriptionTier as SubscriptionTier) || "starter";
}

/**
 * Check if user has access to the platform at all.
 * Access is granted if:
 *   1. User is an admin
 *   2. User has an active paid subscription
 *   3. User is within their Stripe 14-day trial window
 */
export function hasPlatformAccess(user: User): boolean {
  if (user.role === "admin") return true;
  if (hasActiveSubscription(user)) return true;
  if (isTrialActive(user)) return true;
  return false;
}

/**
 * Enforce platform access — throws PAYMENT_REQUIRED if user has no access.
 * Call this at the top of any protected procedure.
 */
export function requirePlatformAccess(user: User): void {
  if (!areTierRestrictionsEnabled()) return;
  if (!hasPlatformAccess(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `SUBSCRIPTION_REQUIRED:Your free trial has ended. Please subscribe to continue using Amped Agent.`,
    });
  }
}

/**
 * Check if user has access to a feature (uses effective tier — trial = authority)
 */
export function hasFeatureAccess(
  user: User,
  feature: keyof TierFeatures
): boolean {
  const tier = getEffectiveTier(user);
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
  if (TIER_FEATURES.authority[feature] && !TIER_FEATURES.pro[feature]) {
    return "Authority";
  }
  return "Starter";
}

/**
 * Get user's effective tier features (trial users get Authority features)
 */
export function getUserFeatures(user: User): TierFeatures {
  const tier = getEffectiveTier(user);
  return TIER_FEATURES[tier];
}

/**
 * Environment flag to enable/disable tier restrictions
 */
export function areTierRestrictionsEnabled(): boolean {
  return process.env.ENABLE_TIER_RESTRICTIONS === "true";
}
