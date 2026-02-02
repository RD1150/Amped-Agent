/**
 * Stripe Product Configuration for Authority Content
 * Defines the 3 subscription tiers with pricing and features
 */

export interface StripeProduct {
  name: string;
  description: string;
  tier: "starter" | "pro" | "premium";
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
    name: "Authority Content Starter",
    description: "Get started with AI content generation",
    tier: "starter",
    priceMonthly: 7900, // $79/month
    priceYearly: 75840, // $63.20/month ($758.40/year - 20% discount)
    priceIdMonthly: "price_1SwC2yIg7t2mT914iB80LQlI",
    priceIdYearly: "price_1SwC2zIg7t2mT914eIrD3l44",
    productId: "prod_TtznMGK13Zoyme",
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
    name: "Authority Content Pro",
    description: "The complete AI video marketing solution",
    tier: "pro",
    priceMonthly: 12900, // $129/month
    priceYearly: 123600, // $103/month ($1,236/year - 20% discount)
    priceIdMonthly: "price_1SwBnvIg7t2mT914zxuO0i95",
    priceIdYearly: "price_1SwBnvIg7t2mT914v9Qcoq7q",
    productId: "prod_TtznGoscDqVLgz",
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
    name: "Authority Content Premium",
    description: "Unlimited video creation for top producers",
    tier: "premium",
    priceMonthly: 24900, // $249/month
    priceYearly: 238800, // $199/month ($2,388/year - 20% discount)
    priceIdMonthly: "price_1SwBnxIg7t2mT914OPewQ6Zc",
    priceIdYearly: "price_1SwBnyIg7t2mT91430HPTw99",
    productId: "prod_Ttzn0tnRDWBdzS",
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
export function getProductByTier(tier: "starter" | "pro" | "premium"): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find((p) => p.tier === tier);
}

/**
 * Get tier by price ID
 */
export function getTierByPriceId(priceId: string): "starter" | "pro" | "premium" | undefined {
  const product = STRIPE_PRODUCTS.find(
    (p) => p.priceIdMonthly === priceId || p.priceIdYearly === priceId
  );
  return product?.tier;
}

/**
 * Check if user has access to a feature based on their tier
 */
export function hasFeatureAccess(
  userTier: "starter" | "pro" | "premium",
  feature: keyof StripeProduct["features"]
): boolean {
  const product = getProductByTier(userTier);
  if (!product) return false;
  return Boolean(product.features[feature]);
}

/**
 * Get video limit for a tier
 */
export function getVideoLimit(tier: "starter" | "pro" | "premium"): number {
  const product = getProductByTier(tier);
  if (!product) return 0;
  return product.features.aiVideos;
}

/**
 * Create Stripe products and prices
 * Run this script once: npx tsx server/stripe-products.ts
 */
export async function createStripeProducts() {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
