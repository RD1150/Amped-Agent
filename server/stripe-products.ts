/**
 * Stripe Product Configuration for AmpedAgent
 * Defines the 3 subscription tiers with pricing and features
 */

export interface StripeProduct {
  name: string;
  description: string;
  tier: "essential" | "professional" | "premium";
  priceMonthly: number; // in cents
  priceYearly: number; // in cents (with 20% discount)
  priceIdMonthly?: string; // Will be set after creating in Stripe
  priceIdYearly?: string; // Will be set after creating in Stripe
  productId?: string; // Will be set after creating in Stripe
  trialDays: number;
  features: {
    contentGeneration: boolean;
    templates: number;
    scheduling: boolean;
    facebookIntegration: boolean;
    instagramIntegration: boolean;
    aiVideos: number; // -1 = unlimited
    listingPhotoVideos: boolean;
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
    name: "AmpedAgent Essential",
    description: "Perfect for agents getting started with content marketing",
    tier: "essential",
    priceMonthly: 3900, // $39/month
    priceYearly: 39000, // $32.50/month ($390/year - 2 months free)
    priceIdMonthly: "price_1SwEkxIg7t2mT914l2lYhLh7",
    priceIdYearly: "price_1SwEkxIg7t2mT914U85UGQZQ",
    productId: "prod_Tu2qUnne3JxuKt",
    trialDays: 14,
    features: {
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
    featureList: [
      "Unlimited text & image posts",
      "5 AI avatar videos/month",
      "Listing photo → video conversion",
      "50+ professional templates",
      "AI-powered content ideas",
      "Post scheduling",
      "Facebook & Instagram integration",
      "Content calendar view",
      "Stock image library",
      "Basic branding",
      "Email support (48hr)",
    ],
  },
  {
    name: "AmpedAgent Professional",
    description: "For active agents who post consistently",
    tier: "professional",
    priceMonthly: 7900, // $79/month
    priceYearly: 79000, // $65.83/month ($790/year - 2 months free)
    priceIdMonthly: "price_1SwEkzIg7t2mT914CiNdZgkd",
    priceIdYearly: "price_1SwEkzIg7t2mT914ZibEMRwS",
    productId: "prod_Tu2qEpQy3NGNdY",
    trialDays: 14,
    recommended: true,
    features: {
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
    featureList: [
      "Everything in Starter, plus:",
      "20 AI avatar videos per month",
      "Listing photo to video conversion",
      "3 hook options per video",
      "AI script generation (7-30 seconds)",
      "Auto-generated captions with CTA",
      "Smooth transitions & effects",
      "Background music",
      "No watermarks",
      "Priority support (24hr)",
    ],
  },
  {
    name: "AmpedAgent Enterprise",
    description: "For top producers and teams",
    tier: "premium",
    priceMonthly: 14900, // $149/month
    priceYearly: 149000, // $124.17/month ($1,490/year - 2 months free)
    priceIdMonthly: "price_1SwEl1Ig7t2mT914iDGqGZ40",
    priceIdYearly: "price_1SwEl2Ig7t2mT914uAb8Wm9i",
    productId: "prod_Tu2qRnlGJmcZu8",
    trialDays: 14,
    features: {
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
    featureList: [
      "Everything in Pro, plus:",
      "UNLIMITED AI avatar videos",
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
export function getProductByTier(tier: "essential" | "professional" | "premium"): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find((p) => p.tier === tier);
}

/**
 * Get tier by price ID
 */
export function getTierByPriceId(priceId: string): "essential" | "professional" | "premium" | undefined {
  const product = STRIPE_PRODUCTS.find(
    (p) => p.priceIdMonthly === priceId || p.priceIdYearly === priceId
  );
  return product?.tier;
}

/**
 * Check if user has access to a feature based on their tier
 */
export function hasFeatureAccess(
  userTier: "essential" | "professional" | "premium",
  feature: keyof StripeProduct["features"]
): boolean {
  const product = getProductByTier(userTier);
  if (!product) return false;
  return Boolean(product.features[feature]);
}

/**
 * Get video limit for a tier
 */
export function getVideoLimit(tier: "essential" | "professional" | "premium"): number {
  const product = getProductByTier(tier);
  if (!product) return 0;
  return product.features.aiVideos;
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
