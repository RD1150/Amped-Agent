/**
 * Stripe Products and Pricing Configuration
 * 
 * Three-tier pricing structure with 14-day trials:
 * - Essential: $39/month or $390/year (25 posts/month)
 * - Professional: $79/month or $790/year (100 posts/month)
 * - Enterprise: $149/month or $1,490/year (Unlimited)
 */

export type SubscriptionTier = 'essential' | 'professional' | 'enterprise';

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
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
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For top producers and teams',
    monthlyPrice: 149,
    yearlyPrice: 1490,
    features: [
      'Unlimited AI-generated posts',
      'Unlimited property tour videos',
      'Unlimited AutoReels',
      'YouTube thumbnail generator',
      'Advanced content calendar',
      'Unlimited social media connections',
      'Advanced performance analytics',
      'Priority phone & email support',
      'White-label branding',
      'Team collaboration (coming soon)',
      'API access (coming soon)',
    ],
    limits: {
      postsPerMonth: 'unlimited',
      socialConnections: 'unlimited',
      videoGenerations: 'unlimited',
    },
  },
};

export const TRIAL_DAYS = 14;

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
