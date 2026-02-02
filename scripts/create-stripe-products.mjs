#!/usr/bin/env node
/**
 * Create Stripe products and prices for Authority Content
 * Run once: node scripts/create-stripe-products.mjs
 */

import Stripe from "stripe";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = [
  {
    name: "Authority Content Starter",
    description: "Get started with AI content generation",
    tier: "starter",
    priceMonthly: 4900, // $49/month
    priceYearly: 47040, // $39.17/month ($470/year - 20% discount)
    trialDays: 14,
    metadata: {
      tier: "starter",
      aiVideos: "0",
      teamSeats: "1",
    },
  },
  {
    name: "Authority Content Pro",
    description: "The complete AI video marketing solution",
    tier: "pro",
    priceMonthly: 12900, // $129/month
    priceYearly: 123600, // $103/month ($1,236/year - 20% discount)
    trialDays: 14,
    metadata: {
      tier: "pro",
      aiVideos: "20",
      teamSeats: "1",
      recommended: "true",
    },
  },
  {
    name: "Authority Content Premium",
    description: "Unlimited video creation for top producers",
    tier: "premium",
    priceMonthly: 24900, // $249/month
    priceYearly: 238800, // $199/month ($2,388/year - 20% discount)
    trialDays: 14,
    metadata: {
      tier: "premium",
      aiVideos: "-1",
      teamSeats: "3",
    },
  },
];

async function createProducts() {
  console.log("🚀 Creating Stripe products for Authority Content...\n");

  const results = [];

  for (const productConfig of PRODUCTS) {
    console.log(`Creating product: ${productConfig.name}`);

    try {
      // Create product
      const product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: productConfig.metadata,
      });

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: productConfig.priceMonthly,
        currency: "usd",
        recurring: {
          interval: "month",
          trial_period_days: productConfig.trialDays,
        },
        metadata: {
          tier: productConfig.tier,
          billing_period: "monthly",
        },
      });

      // Create yearly price
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: productConfig.priceYearly,
        currency: "usd",
        recurring: {
          interval: "year",
          trial_period_days: productConfig.trialDays,
        },
        metadata: {
          tier: productConfig.tier,
          billing_period: "yearly",
        },
      });

      console.log(`✅ Created ${productConfig.name}`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Monthly Price ID: ${monthlyPrice.id}`);
      console.log(`   Yearly Price ID: ${yearlyPrice.id}`);
      console.log("");

      results.push({
        tier: productConfig.tier,
        productId: product.id,
        priceIdMonthly: monthlyPrice.id,
        priceIdYearly: yearlyPrice.id,
      });
    } catch (error) {
      console.error(`❌ Error creating ${productConfig.name}:`, error.message);
    }
  }

  console.log("\n🎉 All products created successfully!");
  console.log("\n📝 Add these IDs to your .env file or database:\n");
  console.log(JSON.stringify(results, null, 2));
}

createProducts().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
