import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { STRIPE_PRODUCTS, getProductByTier, getTierByPriceId } from '../stripe-products';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export const stripeRouter = router({
  // Create checkout session for subscription
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        tier: z.enum(['starter', 'professional', 'agency']),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const userEmail = ctx.user.email;
      const { tier } = input;

      // Get product configuration
      const product = getProductByTier(tier);
      if (!product || !product.priceId) {
        throw new Error(`Product not found for tier: ${tier}`);
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
              price: product.priceId,
              quantity: 1,
            },
          ],
          subscription_data: {
            trial_period_days: product.trialDays,
            metadata: {
              userId: userId.toString(),
              tier: tier,
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
  createBillingPortalSession: protectedProcedure
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
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
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
          const tier = session.metadata?.tier as 'starter' | 'professional' | 'agency' | undefined;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (userId && customerId && tier) {
            await db
              .update(users)
              .set({
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionStatus: 'trialing',
                subscriptionTier: tier,
              })
              .where(eq(users.id, userId));
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const tier = subscription.metadata?.tier as 'starter' | 'professional' | 'agency' | undefined;

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

          const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);

          // TODO: Send email notification about trial ending
          console.log(`Trial ending for user ${user?.id}`);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    }),
});
