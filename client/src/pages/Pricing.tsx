import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PRICING_TIERS, TRIAL_DAYS, type SubscriptionTier } from "@shared/pricingConstants";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const { data: user } = trpc.auth.me.useQuery();
  
  const createCheckout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const handleSubscribe = (tierId: SubscriptionTier) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      return;
    }

    createCheckout.mutate({
      tier: tierId,
      billingPeriod: billingCycle === "monthly" ? "monthly" : "annual",
      successUrl: `${window.location.origin}/dashboard`,
      cancelUrl: `${window.location.origin}/pricing`,
    });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-2">
            Your complete authority marketing platform — content, video, strategy, and distribution in one place.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Start your {TRIAL_DAYS}-day trial — then auto-billed. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-1 p-1 bg-secondary rounded-xl border border-border shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">
                2 months FREE
              </span>
            </button>
          </div>
          {billingCycle === "yearly" && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400 font-medium">
              Save up to $598/year compared to monthly billing
            </p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {(Object.values(PRICING_TIERS) as typeof PRICING_TIERS[SubscriptionTier][]).map((tier) => (
            <Card
              key={tier.id}
              className={`relative ${
                tier.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                {tier.tagline && (
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">{tier.tagline}</p>
                )}
                <CardDescription className="text-sm">
                  {tier.description}
                </CardDescription>
                <div className="mt-6">
                  {billingCycle === "yearly" && (
                    <p className="text-sm text-muted-foreground line-through mb-1">
                      ${tier.monthlyPrice}/mo
                    </p>
                  )}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">
                      ${billingCycle === "monthly" ? tier.monthlyPrice : (tier.yearlyPrice / 12).toFixed(0)}
                    </span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  {billingCycle === "yearly" && (
                    <>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${tier.yearlyPrice}/year billed annually
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                        Save ${(tier.monthlyPrice * 12 - tier.yearlyPrice).toLocaleString()}/year
                      </p>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {tier.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={createCheckout.isPending}
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                  size="lg"
                >
                  {createCheckout.isPending ? "Loading..." : `Start ${TRIAL_DAYS}-Day Trial`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ / Trust Signals */}
        <div className="mt-16 text-center text-sm text-muted-foreground space-y-2">
          <p>✓ {TRIAL_DAYS}-day trial, then auto-billed • ✓ Cancel anytime • ✓ Annual billing saves 2 months</p>
          <p className="max-w-2xl mx-auto">
            All plans include AI-powered content generation, video production, social media repurposing across 6 formats, market insights, and scheduling — built exclusively for real estate agents who want to attract, engage, and convert at scale.
          </p>
        </div>
      </div>
    </div>
  );
}
