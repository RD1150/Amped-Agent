/**
 * Stripe Product Configuration for Amped Agent
 * 5 subscription tiers (updated Apr 2026):
 *   Agent         $79/mo  — solo agents
 *   Top Producer  $149/mo — active agents scaling their brand
 *   Market Leader $249/mo — dominant solo agents, full suite
 *   Team          $399/mo — agent teams (2–5 seats)
 *   Brokerage     Custom  — 10+ agents, contact sales
 */

export interface StripeProduct {
  name: string;
  description: string;
  tier: "agent" | "top-producer" | "market-leader" | "team" | "brokerage";
  priceMonthly: number; // in cents
  priceYearly: number; // in cents (~20% off = 10× monthly)
  priceIdMonthly?: string;
  priceIdYearly?: string;
  productId?: string;
  trialDays: number;
  features: {
    kenBurnsVideos: boolean;       // Property Tour (Ken Burns) — all tiers
    aiReels: boolean;              // Short-form reels — all tiers
    avatarVideos: number;          // -1 = unlimited, 0 = none
    cinematicTours: boolean;       // Runway AI cinematic tours
    liveTour: boolean;             // Record + auto-edit walkthrough
    voiceCloning: boolean;         // Custom voice clone
    listingLaunchKit: boolean;     // One-click listing marketing package
    emailDrip: boolean;            // Drip sequences
    crmPipeline: boolean;          // Lead kanban
    openHouseQR: boolean;          // QR sign-in + follow-up
    testimonialEngine: boolean;    // Review requests + social post gen
    performanceCoach: boolean;     // Decision Engine / weekly diagnosis
    teamSeats: number;             // 1 = solo
    sharedContentLibrary: boolean;
    whiteLabel: boolean;
    apiAccess: boolean;
    support: string;
  };
  featureList: string[];
  recommended?: boolean;
  contactSales?: boolean;
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    name: "Agent",
    description: "Start showing up consistently and build your brand",
    tier: "agent",
    priceMonthly: 7900,   // $79/month
    priceYearly: 63200,   // $632/year (~$63/mo, save ~20%)
    priceIdMonthly: "price_1SwEkxIg7t2mT914l2lYhLh7",
    priceIdYearly: "price_1SwEkxIg7t2mT914U85UGQZQ",
    productId: "prod_Tu2qUnne3JxuKt",
    trialDays: 14,
    features: {
      kenBurnsVideos: true,
      aiReels: true,
      avatarVideos: 0,
      cinematicTours: false,
      liveTour: false,
      voiceCloning: false,
      listingLaunchKit: false,
      emailDrip: false,
      crmPipeline: false,
      openHouseQR: false,
      testimonialEngine: false,
      performanceCoach: false,
      teamSeats: 1,
      sharedContentLibrary: false,
      whiteLabel: false,
      apiAccess: false,
      support: "email-48hr",
    },
    featureList: [
      "Property Tour videos (Ken Burns style)",
      "Short-form reels for Instagram & TikTok",
      "Daily AI-written posts — market updates, tips, listings",
      "Listing Presentation builder",
      "Lead Magnet generator",
      "Market Insights with live stats",
      "Blog Builder with city rotation",
      "Content calendar & post scheduling",
      "3 social media connections",
      "Email support (48hr)",
    ],
  },
  {
    name: "Top Producer",
    description: "Dominate your market with video and advanced content tools",
    tier: "top-producer",
    priceMonthly: 14900,  // $149/month
    priceYearly: 119200,  // $1,192/year (~$119/mo, save ~20%)
    priceIdMonthly: "price_1SwEkzIg7t2mT914CiNdZgkd",
    priceIdYearly: "price_1SwEkzIg7t2mT914ZibEMRwS",
    productId: "prod_Tu2qEpQy3NGNdY",
    trialDays: 14,
    recommended: true,
    features: {
      kenBurnsVideos: true,
      aiReels: true,
      avatarVideos: 10,
      cinematicTours: true,
      liveTour: false,
      voiceCloning: false,
      listingLaunchKit: true,
      emailDrip: true,
      crmPipeline: true,
      openHouseQR: true,
      testimonialEngine: true,
      performanceCoach: true,
      teamSeats: 1,
      sharedContentLibrary: false,
      whiteLabel: false,
      apiAccess: false,
      support: "email-24hr",
    },
    featureList: [
      "Everything in Agent, plus:",
      "10 videos with your face per month — no camera needed",
      "Cinematic property tours with AI motion",
      "Listing Launch Kit — one address, full marketing package",
      "Email drip sequences — automated follow-up",
      "CRM pipeline — track leads from open house to close",
      "Open house QR sign-in with auto follow-up",
      "Testimonial engine — turn closings into social proof",
      "Performance Coach — weekly AI strategy briefing",
      "3 hook options per reel",
      "Auto-generated captions with CTA",
      "Unlimited social media connections",
      "Priority support (24hr)",
    ],
  },
  {
    name: "Market Leader",
    description: "The complete authority marketing suite — own your city",
    tier: "market-leader",
    priceMonthly: 24900,  // $249/month
    priceYearly: 199200,  // $1,992/year (~$199/mo, save ~20%)
    priceIdMonthly: "price_1SwEl1Ig7t2mT914iDGqGZ40",
    priceIdYearly: "price_1SwEl2Ig7t2mT914uAb8Wm9i",
    productId: "prod_Tu2qRnlGJmcZu8",
    trialDays: 14,
    features: {
      kenBurnsVideos: true,
      aiReels: true,
      avatarVideos: 20,
      cinematicTours: true,
      liveTour: true,
      voiceCloning: true,
      listingLaunchKit: true,
      emailDrip: true,
      crmPipeline: true,
      openHouseQR: true,
      testimonialEngine: true,
      performanceCoach: true,
      teamSeats: 1,
      sharedContentLibrary: false,
      whiteLabel: false,
      apiAccess: false,
      support: "priority-4hr",
    },
    featureList: [
      "Everything in Top Producer, plus:",
      "20 videos with your face per month",
      "Record a walkthrough — we edit it automatically",
      "Your voice, cloned — narrate any video without recording",
      "3 different looks for your digital twin",
      "Custom branding overlays on all content",
      "Advanced analytics & reporting",
      "Priority rendering",
      "Phone support (4hr response)",
    ],
  },
  {
    name: "Team",
    description: "One platform for your entire team — consistent brand, more deals",
    tier: "team",
    priceMonthly: 39900,  // $399/month
    priceYearly: 319200,  // $3,192/year (~$319/mo, save ~20%)
    trialDays: 14,
    features: {
      kenBurnsVideos: true,
      aiReels: true,
      avatarVideos: -1, // unlimited across team
      cinematicTours: true,
      liveTour: true,
      voiceCloning: true,
      listingLaunchKit: true,
      emailDrip: true,
      crmPipeline: true,
      openHouseQR: true,
      testimonialEngine: true,
      performanceCoach: true,
      teamSeats: 5,
      sharedContentLibrary: true,
      whiteLabel: false,
      apiAccess: false,
      support: "priority-same-day",
    },
    featureList: [
      "Everything in Market Leader, plus:",
      "Up to 5 agent seats — each with their own login",
      "Shared content library — team templates, one brand",
      "Team admin dashboard — see all agent activity",
      "Unlimited videos with your face across the team",
      "Bulk listing launch — multiple listings at once",
      "Same-day priority support",
      "Team onboarding call included",
    ],
  },
  {
    name: "Brokerage",
    description: "Custom platform for brokerages with 10+ agents",
    tier: "brokerage",
    priceMonthly: 0, // custom pricing
    priceYearly: 0,
    trialDays: 14,
    contactSales: true,
    features: {
      kenBurnsVideos: true,
      aiReels: true,
      avatarVideos: -1,
      cinematicTours: true,
      liveTour: true,
      voiceCloning: true,
      listingLaunchKit: true,
      emailDrip: true,
      crmPipeline: true,
      openHouseQR: true,
      testimonialEngine: true,
      performanceCoach: true,
      teamSeats: -1, // unlimited
      sharedContentLibrary: true,
      whiteLabel: true,
      apiAccess: true,
      support: "dedicated-account-manager",
    },
    featureList: [
      "Everything in Team, plus:",
      "Unlimited agent seats",
      "Brokerage-wide branding — every agent, one brand",
      "White-label option — your name, not ours",
      "Broker admin view — all agent activity in one dashboard",
      "Bulk listing launch across all agents",
      "API access for MLS & CRM integration",
      "Dedicated account manager",
      "Custom onboarding for all agents",
      "Custom pricing based on team size",
    ],
  },
];

/**
 * Get product by tier
 */
export function getProductByTier(
  tier: "agent" | "top-producer" | "market-leader" | "team" | "brokerage"
): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find((p) => p.tier === tier);
}

/**
 * Get tier by price ID
 */
export function getTierByPriceId(
  priceId: string
): "agent" | "top-producer" | "market-leader" | "team" | "brokerage" | undefined {
  const product = STRIPE_PRODUCTS.find(
    (p) => p.priceIdMonthly === priceId || p.priceIdYearly === priceId
  );
  return product?.tier;
}

/**
 * Check if user has access to a feature based on their tier
 */
export function hasFeatureAccess(
  userTier: string,
  feature: keyof StripeProduct["features"]
): boolean {
  const product = getProductByTier(userTier as any);
  if (!product) return false;
  const val = product.features[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  return false;
}

/**
 * Get avatar video limit for a tier (-1 = unlimited, 0 = none)
 */
export function getAvatarVideoLimit(tier: string): number {
  const product = getProductByTier(tier as any);
  if (!product) return 0;
  return product.features.avatarVideos;
}

/**
 * Create new Stripe products for Team tier
 * Run once: npx tsx server/stripe-products.ts
 */
export async function createTeamProduct() {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const teamProduct = STRIPE_PRODUCTS.find((p) => p.tier === "team")!;

  const stripeProduct = await stripe.products.create({
    name: teamProduct.name,
    description: teamProduct.description,
    metadata: { tier: teamProduct.tier, teamSeats: "5" },
  });

  const monthlyPrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: teamProduct.priceMonthly,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: teamProduct.tier, billing_period: "monthly" },
  });

  const yearlyPrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: teamProduct.priceYearly,
    currency: "usd",
    recurring: { interval: "year" },
    metadata: { tier: teamProduct.tier, billing_period: "yearly" },
  });

  console.log("✅ Team product created:");
  console.log(`   productId: "${stripeProduct.id}",`);
  console.log(`   priceIdMonthly: "${monthlyPrice.id}",`);
  console.log(`   priceIdYearly: "${yearlyPrice.id}",`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createTeamProduct().catch(console.error);
}
