/**
 * Stripe Product Configuration
 * Defines the 3 subscription tiers with pricing
 */

export interface StripeProduct {
  name: string;
  description: string;
  tier: "starter" | "professional" | "agency";
  priceAmount: number; // in cents
  priceId?: string; // Will be set after creating in Stripe
  productId?: string; // Will be set after creating in Stripe
  trialDays: number;
  features: string[];
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    name: "Realty Content Agent - Starter",
    description: "AI-powered content generation with direct social posting",
    tier: "starter",
    priceAmount: 7900, // $79/month
    trialDays: 14,
    features: [
      "AI content generation (all 6 formats)",
      "30-day content calendar",
      "Trending news posts",
      "Market stats posts",
      "Video conversion",
      "Direct posting to Facebook, Instagram, LinkedIn",
      "100 posts per month",
      "50 AI images per month",
    ],
  },
  {
    name: "Realty Content Agent - Professional",
    description: "Complete marketing system with CRM, funnels, and analytics",
    tier: "professional",
    priceAmount: 19700, // $197/month
    trialDays: 14,
    features: [
      "Everything in Starter, plus:",
      "GoHighLevel CRM included (white labeled)",
      "Auto-generate landing pages & funnels",
      "Lead capture & tracking",
      "Email/SMS automation",
      "Content performance analytics",
      "A/B testing",
      "500 posts per month",
      "250 AI images per month",
    ],
  },
  {
    name: "Realty Content Agent - Agency",
    description: "White label solution for brokerages and teams",
    tier: "agency",
    priceAmount: 49700, // $497/month
    trialDays: 14,
    features: [
      "Everything in Professional, plus:",
      "Unlimited sub-accounts",
      "White label branding",
      "Custom domain",
      "Priority support",
      "Unlimited posts",
      "Unlimited AI images",
      "Agency dashboard",
    ],
  },
];

/**
 * Get product by tier
 */
export function getProductByTier(tier: "starter" | "professional" | "agency"): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(p => p.tier === tier);
}

/**
 * Get tier by price ID
 */
export function getTierByPriceId(priceId: string): "starter" | "professional" | "agency" | undefined {
  const product = STRIPE_PRODUCTS.find(p => p.priceId === priceId);
  return product?.tier;
}
