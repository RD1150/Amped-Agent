/**
 * Shared Pricing Constants
 * Safe to import from both client and server code.
 * Does NOT use process.env (would break in browser).
 */

export type SubscriptionTier = 'essential' | 'professional' | 'premium';

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    postsPerMonth: number | 'unlimited';
    socialConnections: number | 'unlimited';
    videoGenerations: number | 'unlimited';
  };
  popular?: boolean;
}

export const PRICING_TIERS: Record<SubscriptionTier, PricingTier> = {
  essential: {
    id: 'essential',
    name: 'Essential',
    description: 'Perfect for agents getting started with content marketing',
    monthlyPrice: 39,
    yearlyPrice: 390,
    features: [
      '25 AI-generated posts per month',
      'Property tour videos',
      'AutoReels for social media',
      'YouTube thumbnail generator',
      'Content calendar',
      '3 social media connections',
      'Email support',
    ],
    limits: {
      postsPerMonth: 25,
      socialConnections: 3,
      videoGenerations: 25,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For active agents who post consistently',
    monthlyPrice: 79,
    yearlyPrice: 790,
    popular: true,
    features: [
      '100 AI-generated posts per month',
      'Unlimited property tour videos',
      'Unlimited AutoReels',
      'YouTube thumbnail generator',
      'Content calendar & scheduling',
      'Unlimited social media connections',
      'Performance analytics',
      'Priority email support',
      'Custom branding options',
    ],
    limits: {
      postsPerMonth: 100,
      socialConnections: 'unlimited',
      videoGenerations: 'unlimited',
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Complete marketing suite with Newsletter Builder',
    monthlyPrice: 149,
    yearlyPrice: 1490,
    features: [
      'Everything in Professional, plus:',
      '30 Script-to-Reel videos per month',
      '📧 Newsletter Builder (Full Access)',
      'Email list management',
      'Newsletter templates',
      'Email analytics & tracking',
      'Automated email campaigns',
      'Voice cloning (1 custom voice)',
      'Multiple avatar looks (3 styles)',
      'Custom branding overlays',
      'Priority support (4hr)',
    ],
    limits: {
      postsPerMonth: 'unlimited',
      socialConnections: 'unlimited',
      videoGenerations: 30,
    },
  },
};

export const TRIAL_DAYS = 7;

export function getUserTier(subscription: any): SubscriptionTier {
  if (!subscription || subscription.status !== 'active') {
    return 'essential';
  }
  return (subscription.tier as SubscriptionTier) || 'essential';
}

export function hasExceededLimit(
  tier: SubscriptionTier,
  usageType: 'posts' | 'videos',
  currentUsage: number
): boolean {
  const limits = PRICING_TIERS[tier].limits;

  if (usageType === 'posts') {
    return limits.postsPerMonth !== 'unlimited' && currentUsage >= limits.postsPerMonth;
  }

  if (usageType === 'videos') {
    return limits.videoGenerations !== 'unlimited' && currentUsage >= limits.videoGenerations;
  }

  return false;
}
