/**
 * Stripe Product Configuration for AmpedAgent
 * Defines the 3 subscription tiers with pricing and features
 *
 * Pricing (updated Apr 2026):
 *   Starter  $79/mo  — solo agents, 50 credits/mo included
 *   Pro      $149/mo — active agents, 150 credits/mo included
 *   Agency   $299/mo — top producers & teams, 500 credits/mo included
 */

export interface StripeProduct {
  name: string;
  description: string;
  tier: "starter" | "pro" | "agency";
  priceMonthly: number; // in cents
  priceYearly: number; // in cents (2 months free = 10× monthly)
  priceIdMonthly?: string; // Will be set after creating in Stripe
  priceIdYearly?: string; // Will be set after creating in Stripe
  productId?: string; // Will be set after creating in Stripe
  trialDays: number;
  monthlyCredits: number; // Credits included with monthly subscription
  features: {
    contentGeneration: boolean;
    templates: number;
    scheduling: boolean;
    facebookIntegration: boolean;
    instagramIntegration: boolean;
    aiVideos: number; // -1 = unlimited
    listingPhotoVideos: boolean;
    listingPresentation: boolean;
    voiceCloning: boolean;
    teamSeats: number;
    whiteLabel: boolean;
    apiAccess: boolean;
    support: string;
  };
  featureList: string[]; // For display on pricing page
  recommended?: boolean;
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    name: "AmpedAgent Starter",
    description: "The complete AI content suite for solo agents ready to dominate their market",
    tier: "starter",
    priceMonthly: 7900, // $79/month
    priceYearly: 79000, // $790/year (2 months free)
    priceIdMonthly: "price_1SwEkxIg7t2mT914l2lYhLh7",
    priceIdYearly: "price_1SwEkxIg7t2mT914U85UGQZQ",
    productId: "prod_Tu2qUnne3JxuKt",
    trialDays: 14,
    monthlyCredits: 50,
    features: {
      contentGeneration: true,
      templates: 50,
      scheduling: true,
      facebookIntegration: true,
      instagramIntegration: true,
      aiVideos: 5,
      listingPhotoVideos: true,
      listingPresentation: true,
      voiceCloning: false,
      teamSeats: 1,
      whiteLabel: false,
      apiAccess: false,
      support: "email-48hr",
    },
    featureList: [
      "50 AI credits included every month",
      "Unlimited text & image posts",
      "5 AI avatar videos/month",
      "Property Tour videos",
      "Listing Presentation builder (Gamma AI)",
      "AI Reels & short-form video scripts",
      "50+ professional templates",
      "Post & Blog Builder with city rotation",
      "Market Insights with auto-populated stats",
      "Lead Magnet generator",
      "Post scheduling",
      "Facebook & Instagram integration",
      "Email support (48hr)",
    ],
  },
  {
    name: "AmpedAgent Pro",
    description: "For active agents who post consistently and want to be the authority in their market",
    tier: "pro",
    priceMonthly: 14900, // $149/month
    priceYearly: 149000, // $1,490/year (2 months free)
    priceIdMonthly: "price_1SwEkzIg7t2mT914CiNdZgkd",
    priceIdYearly: "price_1SwEkzIg7t2mT914ZibEMRwS",
    productId: "prod_Tu2qEpQy3NGNdY",
    trialDays: 14,
    recommended: true,
    monthlyCredits: 150,
    features: {
      contentGeneration: true,
      templates: 100,
      scheduling: true,
      facebookIntegration: true,
      instagramIntegration: true,
      aiVideos: 20,
      listingPhotoVideos: true,
      listingPresentation: true,
      voiceCloning: false,
      teamSeats: 1,
      whiteLabel: false,
      apiAccess: false,
      support: "email-24hr",
    },
    featureList: [
      "Everything in Starter, plus:",
      "150 AI credits included every month",
      "20 AI avatar videos per month",
      "AI-Enhanced Property Tours (Runway B-roll)",
      "3 hook options per reel",
      "AI script generation",
      "Auto-generated captions with CTA",
      "Smooth transitions & background music",
      "No watermarks",
      "Batch Blog Builder (all cities at once)",
      "Priority support (24hr)",
    ],
  },
  {
    name: "AmpedAgent Agency",
    description: "The complete authority marketing suite for top producers and teams",
    tier: "agency",
    priceMonthly: 29900, // $299/month
    priceYearly: 299000, // $2,990/year (2 months free)
    priceIdMonthly: "price_1SwEl1Ig7t2mT914iDGqGZ40",
    priceIdYearly: "price_1SwEl2Ig7t2mT914uAb8Wm9i",
    productId: "prod_Tu2qRnlGJmcZu8",
    trialDays: 14,
    monthlyCredits: 500,
    features: {
      contentGeneration: true,
      templates: 100,
      scheduling: true,
      facebookIntegration: true,
      instagramIntegration: true,
      aiVideos: -1, // unlimited
      listingPhotoVideos: true,
      listingPresentation: true,
      voiceCloning: true,
      teamSeats: 3,
      whiteLabel: true,
      apiAccess: true,
      support: "phone-4hr",
    },
    featureList: [
      "Everything in Pro, plus:",
      "500 AI credits included every month",
      "UNLIMITED AI avatar videos",
      "Full AI Cinematic Property Tours (Kling AI)",
      "Voice cloning (1 custom voice)",
      "Multiple avatar looks (3 styles)",
      "Custom branding overlays",
      "3 team member seats",
      "Shared content library",
      "Team approval workflow",
      "White-label branding",
      "Custom domain",
      "API access",
      "Advanced analytics",
      "Priority rendering",
      "Phone support (4hr)",
      "Dedicated account manager",
    ],
  },
];

/**
 * Get product by tier
 */
export function getProductByTier(tier: "starter" | "pro" | "agency"): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find((p) => p.tier === tier);
}

/**
 * Get tier by price ID
 */
export function getTierByPriceId(priceId: string): "starter" | "pro" | "agency" | undefined {
  const product = STRIPE_PRODUCTS.find(
    (p) => p.priceIdMonthly === priceId || p.priceIdYearly === priceId
  );
  return product?.tier;
}

/**
 * Check if user has access to a feature based on their tier
 */
export function hasFeatureAccess(
  userTier: "starter" | "pro" | "agency",
  feature: keyof StripeProduct["features"]
): boolean {
  const product = getProductByTier(userTier);
  if (!product) return false;
  return Boolean(product.features[feature]);
}

/**
 * Get video limit for a tier
 */
export function getVideoLimit(tier: "starter" | "pro" | "agency"): number {
  const product = getProductByTier(tier);
  if (!product) return 0;
  return product.features.aiVideos;
}

/**
 * Get monthly credit allowance for a tier
 */
export function getMonthlyCredits(tier: "starter" | "pro" | "agency"): number {
  const product = getProductByTier(tier);
  return product?.monthlyCredits ?? 0;
}

/**
 * Create Stripe products and prices
 * Run this script once: npx tsx server/stripe-products.ts
 */
export async function createStripeProducts() {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  for (const product of STRIPE_PRODUCTS) {
    console.log(`Creating product: ${product.name}`);

    // Create product
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: {
        tier: product.tier,
        aiVideos: product.features.aiVideos.toString(),
        teamSeats: product.features.teamSeats.toString(),
        monthlyCredits: product.monthlyCredits.toString(),
      },
    });

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.priceMonthly,
      currency: "usd",
      recurring: {
        interval: "month",
        trial_period_days: product.trialDays,
      },
      metadata: {
        tier: product.tier,
        billing_period: "monthly",
      },
    });

    // Create yearly price
    const yearlyPrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.priceYearly,
      currency: "usd",
      recurring: {
        interval: "year",
        trial_period_days: product.trialDays,
      },
      metadata: {
        tier: product.tier,
        billing_period: "yearly",
      },
    });

    console.log(`✅ Created ${product.name}`);
    console.log(`   Product ID: ${stripeProduct.id}`);
    console.log(`   Monthly Price ID: ${monthlyPrice.id}`);
    console.log(`   Yearly Price ID: ${yearlyPrice.id}`);
    console.log("");

    // Update the product object with IDs (you'll need to manually add these to the config)
    product.productId = stripeProduct.id;
    product.priceIdMonthly = monthlyPrice.id;
    product.priceIdYearly = yearlyPrice.id;
  }

  console.log("🎉 All products created successfully!");
  console.log("\n📝 Copy these IDs back into your stripe-products.ts file:");
  console.log(JSON.stringify(STRIPE_PRODUCTS, null, 2));
}

// Run if executed directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  createStripeProducts().catch(console.error);
}
