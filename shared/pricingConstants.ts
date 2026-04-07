/**
 * Shared Pricing Constants
 * Safe to import from both client and server code.
 * Does NOT use process.env (would break in browser).
 */

export type SubscriptionTier = 'starter' | 'pro' | 'agency';

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  tagline?: string;
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
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Show Up Consistently',
    description: 'For agents ready to stop winging their content and start showing up like a pro.',
    monthlyPrice: 59,
    yearlyPrice: 590,
    features: [
      '25 AI-generated posts per month',
      'Property tour slideshow videos',
      'AI Reels for social media',
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
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Dominate Your Market',
    description: 'For agents who want to be the name everyone in their city thinks of first.',
    monthlyPrice: 99,
    yearlyPrice: 990,
    popular: true,
    features: [
      '100 AI-generated posts per month',
      'Unlimited property tour videos',
      'Unlimited AI Reels',
      'Full Avatar Video (talking-head from script)',
      'Content calendar & scheduling',
      'Unlimited social media connections',
      'Market Dominance Score tracker',
      'Performance analytics',
      'Priority email support',
      'Custom branding on all content',
    ],
    limits: {
      postsPerMonth: 100,
      socialConnections: 'unlimited',
      videoGenerations: 'unlimited',
    },
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    tagline: 'Own the Entire Conversation',
    description: 'The complete authority marketing suite. Write once, publish everywhere, and never run out of content.',
    monthlyPrice: 149,
    yearlyPrice: 1490,
    features: [
      'Everything in Pro, plus:',
      'Auto-Repurpose Engine — 1 idea → 5 formats',
      'Lead Magnet Generator (Buyer Guide, Neighborhood Report, Market Update)',
      '30 Script-to-Reel videos per month',
      'Newsletter Builder (full access)',
      'Email list management & campaigns',
      'Voice cloning (1 custom voice)',
      'Multiple avatar looks (3 styles)',
      'YouTube Video Builder (long-form)',
      'Priority support (4-hour response)',
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
    return 'starter';
  }
  return (subscription.tier as SubscriptionTier) || 'starter';

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
