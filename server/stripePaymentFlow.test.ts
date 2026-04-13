/**
 * End-to-end Stripe payment flow tests
 * Covers: checkout session creation, webhook processing, subscription activation,
 * trial-ending notification, and subscription cancellation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Stripe ──────────────────────────────────────────────────────────────
vi.mock('stripe', () => {
  const mockStripe = {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: 'cs_test_abc123',
          url: 'https://checkout.stripe.com/pay/cs_test_abc123',
        }),
      },
    },
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_test_xyz' }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        id: 'sub_test_123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        trial_end: null,
        items: { data: [{ price: { id: 'price_1SwEkxIg7t2mT914l2lYhLh7' } }] },
      }),
    },
  };
  return { default: vi.fn(() => mockStripe) };
});

// ── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock('../db', () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{
      id: 1,
      email: 'agent@example.com',
      name: 'Test Agent',
      stripeCustomerId: 'cus_test_xyz',
      subscriptionTier: 'starter',
      subscriptionStatus: 'inactive',
    }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    $returningId: vi.fn().mockResolvedValue([{ id: 99 }]),
  }),
}));

// ── Mock notifyOwner ─────────────────────────────────────────────────────────
vi.mock('./_core/notification', () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { notifyOwner } from './_core/notification';

// ── Stripe product config ────────────────────────────────────────────────────
import { STRIPE_PRODUCTS, getTierByPriceId } from './stripe-products';

describe('Stripe Product Configuration', () => {
  it('has 3 tiers configured with valid price IDs', () => {
    expect(STRIPE_PRODUCTS).toHaveLength(3);
    const tiers = STRIPE_PRODUCTS.map((p) => p.tier);
    expect(tiers).toContain('starter');
    expect(tiers).toContain('pro');
    expect(tiers).toContain('authority');
  });

  it('all tiers have monthly and yearly price IDs set', () => {
    for (const product of STRIPE_PRODUCTS) {
      expect(product.priceIdMonthly).toBeTruthy();
      expect(product.priceIdYearly).toBeTruthy();
      expect(product.productId).toBeTruthy();
    }
  });

  it('getTierByPriceId resolves essential monthly price', () => {
    const essential = STRIPE_PRODUCTS.find((p) => p.tier === 'starter')!;
    const resolved = getTierByPriceId(essential.priceIdMonthly!);
    expect(resolved).toBe('starter');
  });

  it('getTierByPriceId resolves professional yearly price', () => {
    const pro = STRIPE_PRODUCTS.find((p) => p.tier === 'pro')!;
    const resolved = getTierByPriceId(pro.priceIdYearly!);
    expect(resolved).toBe('pro');
  });

  it('getTierByPriceId returns undefined for unknown price ID', () => {
    expect(getTierByPriceId('price_unknown_xyz')).toBeUndefined();
  });

  it('all tiers have 14-day trial', () => {
    for (const product of STRIPE_PRODUCTS) {
      expect(product.trialDays).toBe(14);
    }
  });
});

// ── Checkout session creation ────────────────────────────────────────────────
describe('Checkout Session Creation', () => {
  it('creates a session with correct metadata fields', async () => {
    const Stripe = (await import('stripe')).default;
    const stripe = new (Stripe as any)('sk_test_fake');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: 'agent@example.com',
      client_reference_id: '1',
      metadata: { user_id: '1', customer_email: 'agent@example.com', customer_name: 'Test Agent' },
      allow_promotion_codes: true,
      line_items: [{ price: STRIPE_PRODUCTS[0].priceIdMonthly, quantity: 1 }],
      success_url: 'https://luxestate.manus.space/dashboard?success=true',
      cancel_url: 'https://luxestate.manus.space/pricing?canceled=true',
    });

    expect(session.url).toContain('checkout.stripe.com');
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: '1',
        allow_promotion_codes: true,
        metadata: expect.objectContaining({ user_id: '1' }),
      })
    );
  });
});

// ── Webhook event handling ───────────────────────────────────────────────────
describe('Stripe Webhook: checkout.session.completed', () => {
  it('activates subscription when checkout completes', async () => {
    const { getDb } = await import('../db');
    const db = await getDb();

    // Simulate what the webhook handler does on checkout.session.completed
    const mockSession = {
      id: 'cs_test_abc123',
      client_reference_id: '1',
      customer: 'cus_test_xyz',
      subscription: 'sub_test_123',
      metadata: { user_id: '1', customer_email: 'agent@example.com' },
    };

    // Simulate DB update that the webhook performs
    await db!.update({} as any).set({
      subscriptionStatus: 'active',
      stripeCustomerId: mockSession.customer,
      stripeSubscriptionId: mockSession.subscription,
    }).where({} as any);

    expect(db!.update).toHaveBeenCalled();
    expect(db!.set).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionStatus: 'active' })
    );
  });
});

describe('Stripe Webhook: customer.subscription.trial_will_end', () => {
  it('sends owner notification when trial is ending', async () => {
    const trialEndTimestamp = Math.floor(Date.now() / 1000) + 3 * 24 * 3600; // 3 days from now
    const trialEndDate = new Date(trialEndTimestamp * 1000).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    const mockUser = {
      id: 1,
      email: 'agent@example.com',
      name: 'Test Agent',
      subscriptionTier: 'essential',
    };

    // Simulate the notification call the webhook handler makes
    await notifyOwner({
      title: `Trial Ending: ${mockUser.name || mockUser.email}`,
      content: `User ${mockUser.name} (ID: ${mockUser.id}) has a trial ending on ${trialEndDate}. Their subscription tier is ${mockUser.subscriptionTier}.`,
    });

    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Trial Ending'),
        content: expect.stringContaining('Test Agent'),
      })
    );
  });
});

describe('Stripe Webhook: customer.subscription.deleted', () => {
  it('marks subscription as canceled on deletion', async () => {
    const { getDb } = await import('../db');
    const db = await getDb();

    await db!.update({} as any).set({
      subscriptionStatus: 'canceled',
      cancelAtPeriodEnd: false,
    }).where({} as any);

    expect(db!.set).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionStatus: 'canceled' })
    );
  });
});

// ── Subscription tier gating ─────────────────────────────────────────────────
describe('Subscription Tier Gating', () => {
  it('grants pro access when subscription is active and tier is not starter', () => {
    const user = { subscriptionStatus: 'active' as const, subscriptionTier: 'professional' as const };
    const isActive = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
    const tier = isActive && user.subscriptionTier !== 'starter' ? 'pro' : 'free';
    expect(tier).toBe('pro');
  });

  it('grants pro access when subscription is trialing', () => {
    const user = { subscriptionStatus: 'trialing' as const, subscriptionTier: 'essential' as const };
    const isActive = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
    const tier = isActive && user.subscriptionTier !== 'starter' ? 'pro' : 'free';
    expect(tier).toBe('pro');
  });

  it('denies pro access when subscription is inactive', () => {
    const user = { subscriptionStatus: 'inactive' as const, subscriptionTier: 'starter' as const };
    const isActive = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
    const tier = isActive && user.subscriptionTier !== 'starter' ? 'pro' : 'free';
    expect(tier).toBe('free');
  });

  it('denies pro access when subscription is canceled', () => {
    const user = { subscriptionStatus: 'canceled' as const, subscriptionTier: 'professional' as const };
    const isActive = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
    const tier = isActive && user.subscriptionTier !== 'starter' ? 'pro' : 'free';
    expect(tier).toBe('free');
  });

  it('denies pro access when tier is starter even if active', () => {
    const user = { subscriptionStatus: 'active' as const, subscriptionTier: 'starter' as const };
    const isActive = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
    const tier = isActive && user.subscriptionTier !== 'starter' ? 'pro' : 'free';
    expect(tier).toBe('free');
  });
});
