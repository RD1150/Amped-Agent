/**
 * Shared Pricing Constants
 * Safe to import from both client and server code.
 * Does NOT use process.env (would break in browser).
 *
 * Pricing (updated Apr 2026):
 *   Starter  $79/mo  — 50 credits/mo included
 *   Pro      $149/mo — 150 credits/mo included
 *   Agency   $299/mo — 500 credits/mo included
 */

export type SubscriptionTier = 'starter' | 'pro' | 'agency';

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  tagline?: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyCredits: number; // AI credits included with subscription each month
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
    monthlyPrice: 79,
    yearlyPrice: 790,
    monthlyCredits: 50,
    features: [
      '50 AI credits included every month',
      'Unlimited text & image posts',
      'Property Tour videos',
      'AI Reels for social media',
      'Listing Presentation builder',
      'Post & Blog Builder with city rotation',
      'Market Insights with live stats',
      'Lead Magnet generator',
      'Content calendar & scheduling',
      '3 social media connections',
      'Email support (48hr)',
    ],
    limits: {
      postsPerMonth: 'unlimited',
      socialConnections: 3,
      videoGenerations: 5,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Dominate Your Market',
    description: 'For agents who want to be the name everyone in their city thinks of first.',
    monthlyPrice: 149,
    yearlyPrice: 1490,
    monthlyCredits: 150,
    popular: true,
    features: [
      'Everything in Starter, plus:',
      '150 AI credits included every month',
      '20 AI avatar videos per month',
      'AI-Enhanced Property Tours (Runway B-roll)',
      '3 hook options per reel',
      'AI script generation',
      'Batch Blog Builder (all cities at once)',
      'Auto-generated captions with CTA',
      'No watermarks',
      'Unlimited social media connections',
      'Performance analytics',
      'Priority email support (24hr)',
    ],
    limits: {
      postsPerMonth: 'unlimited',
      socialConnections: 'unlimited',
      videoGenerations: 20,
    },
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    tagline: 'Own the Entire Conversation',
    description: 'The complete authority marketing suite for top producers and teams.',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    monthlyCredits: 500,
    features: [
      'Everything in Pro, plus:',
      '500 AI credits included every month',
      'UNLIMITED AI avatar videos',
      'Full AI Cinematic Property Tours (Kling AI)',
      'Voice cloning (1 custom voice)',
      'Multiple avatar looks (3 styles)',
      'Custom branding overlays',
      '3 team member seats',
      'Shared content library',
      'White-label branding',
      'Custom domain',
      'API access',
      'Advanced analytics',
      'Priority rendering',
      'Phone support (4hr)',
      'Dedicated account manager',
    ],
    limits: {
      postsPerMonth: 'unlimited',
      socialConnections: 'unlimited',
      videoGenerations: -1, // unlimited
    },
  },
};

export const TRIAL_DAYS = 14;

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
    return limits.postsPerMonth !== 'unlimited' && currentUsage >= (limits.postsPerMonth as number);
  }

  if (usageType === 'videos') {
    if (limits.videoGenerations === 'unlimited' || limits.videoGenerations === -1) return false;
    return currentUsage >= (limits.videoGenerations as number);
  }

  return false;
}

/**
 * Get monthly credit allowance for a tier
 */
export function getMonthlyCredits(tier: SubscriptionTier): number {
  return PRICING_TIERS[tier].monthlyCredits;
}
