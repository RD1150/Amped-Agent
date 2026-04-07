/**
 * Stripe Products and Pricing Configuration (server-side only)
 * 
 * Shared pricing tiers are in shared/pricingConstants.ts
 * This file only contains server-specific config that uses process.env
 */

// Re-export shared types and constants for server-side code
export type { SubscriptionTier, PricingTier } from '../shared/pricingConstants';
export { PRICING_TIERS, TRIAL_DAYS, getUserTier, hasExceededLimit } from '../shared/pricingConstants';

/**
 * Credit-Based Pricing (Alternative to Subscriptions)
 * One-time credit purchases for pay-as-you-go model
 */

export const CREDIT_PRODUCTS = {
  starter: {
    name: "Starter Credit Package",
    description: "100 credits for property tour videos",
    credits: 100,
    price: 4900, // $49.00 in cents
    priceDisplay: "$49",
    stripePriceId: process.env.STRIPE_PRICE_STARTER_CREDITS || "",
  },
  pro: {
    name: "Professional Credit Package",
    description: "350 credits + 50 bonus credits (400 total)",
    credits: 350,
    bonusCredits: 50,
    totalCredits: 400,
    price: 14900, // $149.00 in cents
    priceDisplay: "$149",
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL_CREDITS || "",
    popular: true,
  },
  agency: {
    name: "Agency Credit Package",
    description: "1000 credits + 200 bonus credits (1200 total)",
    credits: 1000,
    bonusCredits: 200,
    totalCredits: 1200,
    price: 39900, // $399.00 in cents
    priceDisplay: "$399",
    stripePriceId: process.env.STRIPE_PRICE_AGENCY_CREDITS || "",
  },
} as const;

export function getCreditProduct(packageKey: keyof typeof CREDIT_PRODUCTS) {
  return CREDIT_PRODUCTS[packageKey];
}

export function getAllCreditProducts() {
  return Object.entries(CREDIT_PRODUCTS).map(([key, product]) => ({
    id: key,
    ...product,
  }));
}
