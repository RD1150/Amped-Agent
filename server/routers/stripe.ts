import { z } from 'zod';
import { router, protectedProcedure, authOnlyProcedure, publicProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { STRIPE_PRODUCTS, getProductByTier, getTierByPriceId } from '../stripe-products';
import { getCreditProduct } from '../products';
import * as credits from '../credits';
import { notifyOwner } from '../_core/notification';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export const stripeRouter = router({
  // Create checkout session for credit purchase
  createCreditCheckout: authOnlyProcedure
    .input(
      z.object({
        packageKey: z.enum(['starter', 'professional', 'agency']),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const userEmail = ctx.user.email;
      const { packageKey } = input;

      // Get credit product configuration
      const product = getCreditProduct(packageKey);
      if (!product) {
        throw new Error(`Credit product not found: ${packageKey}`);
      }

      const totalCredits = 'totalCredits' in product ? product.totalCredits : product.credits;

      try {
        // Create Stripe checkout session for one-time payment
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          customer_email: userEmail || undefined,
          client_reference_id: userId.toString(),
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: product.name,
                  description: `${totalCredits} credits for Authority Content`,
                },
                unit_amount: product.price,
              },
              quantity: 1,
            },
          ],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          metadata: {
            userId: userId.toString(),
            packageKey,
            credits: totalCredits.toString(),
            type: 'credit_purchase',
          },
        });

        return {
          sessionId: session.id,
          url: session.url,
        };
      } catch (error: any) {
        console.error('[Stripe] Failed to create credit checkout session:', error);
        throw new Error(`Failed to create checkout session: ${error.message}`);
      }
    }),

  // Create checkout session for subscription
  createCheckoutSession: authOnlyProcedure
    .input(
      z.object({
        tier: z.enum(['essential', 'professional', 'premium']),
        billingPeriod: z.enum(['monthly', 'annual']).default('monthly'),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const userEmail = ctx.user.email;
      const { tier, billingPeriod } = input;

      // Get product configuration
      const product = getProductByTier(tier);
      if (!product) {
        throw new Error(`Product not found for tier: ${tier}`);
      }

      // Select price ID based on billing period
      const priceId = billingPeriod === 'annual' ? product.priceIdYearly : product.priceIdMonthly;
      if (!priceId) {
        throw new Error(`Price ID not found for tier: ${tier}, period: ${billingPeriod}`);
      }

      try {
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          customer_email: userEmail || undefined,
          client_reference_id: userId.toString(),
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          subscription_data: {
            trial_period_days: product.trialDays,
            metadata: {
              userId: userId.toString(),
              tier: tier,
              billingPeriod: billingPeriod,
            },
          },
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          metadata: {
            userId: userId.toString(),
          },
        });

        return {
          sessionId: session.id,
          url: session.url,
        };
      } catch (error: any) {
        throw new Error(`Failed to create checkout session: ${error.message}`);
      }
    }),

  // Create billing portal session
  createBillingPortalSession: authOnlyProcedure
    .input(
      z.object({
        returnUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Get user's Stripe customer ID
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!user?.stripeCustomerId) {
        throw new Error('No Stripe customer found');
      }

      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: input.returnUrl,
        });

        return {
          url: session.url,
        };
      } catch (error: any) {
        throw new Error(`Failed to create billing portal session: ${error.message}`);
      }
    }),

  // Get subscription status
  getSubscriptionStatus: authOnlyProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      subscriptionStatus: user.subscriptionStatus || 'inactive',
      subscriptionId: user.stripeSubscriptionId || null,
      customerId: user.stripeCustomerId || null,
      currentPeriodEnd: user.subscriptionEndDate || null,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd || false,
    };
  }),

  // Webhook handler (called by Stripe)
  handleWebhook: publicProcedure
    .input(
      z.object({
        signature: z.string(),
        body: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          input.body,
          input.signature,
          webhookSecret
        );
      } catch (error: any) {
        throw new Error(`Webhook signature verification failed: ${error.message}`);
      }

      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = parseInt(session.metadata?.userId || '0');
          const type = session.metadata?.type;

          // Handle credit purchase
          if (type === 'credit_purchase') {
            const packageKey = session.metadata?.packageKey;
            const creditsAmount = parseInt(session.metadata?.credits || '0');
            const paymentIntentId = session.payment_intent as string;

            if (userId && creditsAmount && packageKey) {
              const product = getCreditProduct(packageKey as any);
              await credits.addCredits({
                userId,
                amount: creditsAmount,
                type: 'purchase',
                description: `Purchased ${product.name}`,
                stripePaymentIntentId: paymentIntentId,
                packageName: product.name,
                amountPaid: product.price,
              });
              console.log(`[Stripe] Added ${creditsAmount} credits to user ${userId}`);
            }
            break;
          }

          // Handle subscription purchase
          const tier = session.metadata?.tier as 'essential' | 'professional' | 'premium' | undefined;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (userId && customerId && tier) {
            await db
              .update(users)
              .set({
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionStatus: 'trialing',
                subscriptionTier: tier as any,
              })
              .where(eq(users.id, userId));
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const tier = subscription.metadata?.tier as 'essential' | 'professional' | 'premium' | undefined;

          // Find user by customer ID
          const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);

          if (user) {
            const updateData: any = {
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status as any,
              subscriptionEndDate: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            };
            
            // Update tier if provided in metadata
            if (tier) {
              updateData.subscriptionTier = tier;
            }

            await db
              .update(users)
              .set(updateData)
              .where(eq(users.id, user.id));
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);

          if (user) {
            await db
              .update(users)
              .set({
                subscriptionStatus: 'canceled',
                cancelAtPeriodEnd: false,
              })
              .where(eq(users.id, user.id));
          }
          break;
        }

        case 'customer.subscription.trial_will_end': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const trialEndDate = subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : 'soon';

          const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);

          if (user) {
            console.log(`[Stripe] Trial ending for user ${user.id} (${user.email}) on ${trialEndDate}`);
            // Notify the platform owner so they can follow up if needed
            await notifyOwner({
              title: `Trial Ending: ${user.name || user.email}`,
              content: `User ${user.name || user.email} (ID: ${user.id}) has a trial ending on ${trialEndDate}. Their subscription tier is ${user.subscriptionTier}. Consider reaching out to ensure a smooth conversion.`,
            }).catch((err) => console.error('[Stripe] Failed to send trial-ending owner notification:', err));
          } else {
            console.warn(`[Stripe] trial_will_end: no user found for Stripe customer ${customerId}`);
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    }),
});
