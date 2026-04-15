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

// Authority price ID for the trial checkout (monthly Authority plan)
const AUTHORITY_PRICE_ID_MONTHLY = 'price_1SwEl1Ig7t2mT914iDGqGZ40';

export const stripeRouter = router({
  // Create checkout session for credit purchase
  createCreditCheckout: authOnlyProcedure
    .input(
      z.object({
        packageKey: z.enum(['starter', 'pro', 'authority']),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const userEmail = ctx.user.email;
      const { packageKey } = input;

      const product = getCreditProduct(packageKey);
      if (!product) {
        throw new Error(`Credit product not found: ${packageKey}`);
      }

      const totalCredits = 'totalCredits' in product ? product.totalCredits : product.credits;

      try {
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
                  description: `${totalCredits} credits for Amped Agent`,
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

        return { sessionId: session.id, url: session.url };
      } catch (error: any) {
        console.error('[Stripe] Failed to create credit checkout session:', error);
        throw new Error(`Failed to create checkout session: ${error.message}`);
      }
    }),

  // Create checkout session for a specific subscription tier
  createCheckoutSession: authOnlyProcedure
    .input(
      z.object({
        tier: z.enum(['starter', 'pro', 'authority', 'agent', 'top-producer', 'market-leader', 'team', 'brokerage']),
        billingPeriod: z.enum(['monthly', 'annual']).default('monthly'),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const userEmail = ctx.user.email;
      const { billingPeriod } = input;
      // Normalize legacy tier names to new IDs
      const tierMap: Record<string, 'agent' | 'top-producer' | 'market-leader' | 'team' | 'brokerage'> = {
        starter: 'agent', pro: 'top-producer', authority: 'market-leader',
        agent: 'agent', 'top-producer': 'top-producer', 'market-leader': 'market-leader',
        team: 'team', brokerage: 'brokerage',
      };
      const tier = tierMap[input.tier] ?? 'agent';

      const product = getProductByTier(tier);
      if (!product) {
        throw new Error(`Product not found for tier: ${tier}`);
      }

      const priceId = billingPeriod === 'annual' ? product.priceIdYearly : product.priceIdMonthly;
      if (!priceId) {
        throw new Error(`Price ID not found for tier: ${tier}, period: ${billingPeriod}`);
      }

      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          customer_email: userEmail || undefined,
          client_reference_id: userId.toString(),
          line_items: [{ price: priceId, quantity: 1 }],
          subscription_data: {
            trial_period_days: product.trialDays,
            metadata: {
              userId: userId.toString(),
              tier,
              billingPeriod,
            },
          },
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          metadata: { userId: userId.toString() },
        });

        return { sessionId: session.id, url: session.url };
      } catch (error: any) {
        throw new Error(`Failed to create checkout session: ${error.message}`);
      }
    }),

  /**
   * Create a 14-day Authority trial checkout session.
   * Card is required upfront. User gets full Authority access during trial.
   * If no paid subscription after trial, Stripe cancels and we downgrade to Starter.
   */
  createTrialCheckout: authOnlyProcedure
    .input(
      z.object({
        successUrl: z.string(),
        cancelUrl: z.string(),
        trialSource: z.string().max(50).optional(), // Acquisition channel: 'organic', 'referral', 'ad', 'social', 'email', etc.
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const userEmail = ctx.user.email;
      const trialSource = input.trialSource ?? 'organic';

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user?.subscriptionStatus === 'active') {
        throw new Error('You already have an active subscription.');
      }
      if (user?.subscriptionStatus === 'trialing') {
        throw new Error('You already have an active trial.');
      }

      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          customer_email: userEmail || undefined,
          client_reference_id: userId.toString(),
          line_items: [{ price: AUTHORITY_PRICE_ID_MONTHLY, quantity: 1 }],
          subscription_data: {
            trial_period_days: 14,
            metadata: {
              userId: userId.toString(),
              tier: 'authority',
              billingPeriod: 'monthly',
              trialCheckout: 'true',
            },
          },
          // Always collect payment method even during trial
          payment_method_collection: 'always',
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          metadata: {
            userId: userId.toString(),
            type: 'trial_start',
            trialSource: input.trialSource ?? 'organic',
          },
        });

        return { sessionId: session.id, url: session.url };
      } catch (error: any) {
        console.error('[Stripe] Failed to create trial checkout session:', error);
        throw new Error(`Failed to create trial checkout session: ${error.message}`);
      }
    }),

  // Create billing portal session
  createBillingPortalSession: authOnlyProcedure
    .input(z.object({ returnUrl: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user?.stripeCustomerId) {
        throw new Error('No Stripe customer found');
      }

      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: input.returnUrl,
        });
        return { url: session.url };
      } catch (error: any) {
        throw new Error(`Failed to create billing portal session: ${error.message}`);
      }
    }),

  // Get subscription status (includes trial info)
  getSubscriptionStatus: authOnlyProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error('User not found');

    const isTrialing = user.subscriptionStatus === 'trialing';
    const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    const now = new Date();
    const trialDaysRemaining = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      subscriptionStatus: user.subscriptionStatus || 'inactive',
      subscriptionTier: user.subscriptionTier || 'starter',
      // During trial, effective tier is always authority
      effectiveTier: isTrialing ? 'authority' : (user.subscriptionTier || 'starter'),
      subscriptionId: user.stripeSubscriptionId || null,
      customerId: user.stripeCustomerId || null,
      currentPeriodEnd: user.subscriptionEndDate || null,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd || false,
      isTrialing,
      trialEndsAt,
      trialDaysRemaining: isTrialing ? trialDaysRemaining : 0,
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
      if (!webhookSecret) throw new Error('Webhook secret not configured');

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(input.body, input.signature, webhookSecret);
      } catch (error: any) {
        throw new Error(`Webhook signature verification failed: ${error.message}`);
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

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

          // Handle subscription / trial start
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (userId && customerId && subscriptionId) {
            // Fetch the subscription to get trial_end and status
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const tier = (subscription.metadata?.tier as 'starter' | 'pro' | 'authority') || 'authority';
            const trialEnd = subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null;

            const sessionTrialSource = session.metadata?.trialSource || null;
            await db
              .update(users)
              .set({
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionStatus: subscription.status as any,
                subscriptionTier: tier,
                trialEndsAt: trialEnd,
                subscriptionEndDate: new Date((subscription.items?.data?.[0]?.current_period_end ?? subscription.billing_cycle_anchor) * 1000),
                ...(sessionTrialSource ? { trialSource: sessionTrialSource } : {}),
              })
              .where(eq(users.id, userId));
            console.log(`[Stripe] Trial/subscription started for user ${userId}: tier=${tier}, status=${subscription.status}, trialEnd=${trialEnd}, trialSource=${sessionTrialSource}`);;
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const tier = subscription.metadata?.tier as 'starter' | 'pro' | 'authority' | undefined;

          const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);

          if (user) {
            const trialEnd = subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null;

            const updateData: any = {
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status as any,
              subscriptionEndDate: new Date((subscription.items?.data?.[0]?.current_period_end ?? subscription.billing_cycle_anchor) * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              trialEndsAt: trialEnd,
            };

            if (tier) {
              updateData.subscriptionTier = tier;
            }

            // Trial converted to paid — keep authority tier
            if (subscription.status === 'active' && user.subscriptionStatus === 'trialing') {
              console.log(`[Stripe] Trial converted to paid subscription for user ${user.id}`);
              if (!tier) {
                updateData.subscriptionTier = user.subscriptionTier || 'authority';
              }
            }

            await db.update(users).set(updateData).where(eq(users.id, user.id));
            console.log(`[Stripe] Subscription updated for user ${user.id}: status=${subscription.status}`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);

          if (user) {
            const wasTrialing = user.subscriptionStatus === 'trialing';

            await db
              .update(users)
              .set({
                subscriptionStatus: 'canceled',
                cancelAtPeriodEnd: false,
                // Auto-downgrade to Starter when trial expires without conversion
                subscriptionTier: wasTrialing ? 'starter' : user.subscriptionTier,
                trialEndsAt: null,
              })
              .where(eq(users.id, user.id));

            if (wasTrialing) {
              console.log(`[Stripe] Trial expired for user ${user.id} — downgraded to Starter`);
              await notifyOwner({
                title: `Trial Expired: ${user.name || user.email}`,
                content: `User ${user.name || user.email} (ID: ${user.id}) did not convert after their 14-day trial. They have been downgraded to the Starter plan.`,
              }).catch((err) => console.error('[Stripe] Failed to send trial-expired notification:', err));
            }
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
            await notifyOwner({
              title: `Trial Ending Soon: ${user.name || user.email}`,
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
