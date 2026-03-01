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
          <p className="text-xl text-muted-foreground mb-8">
            Start your {TRIAL_DAYS}-day free trial. No credit card required.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-secondary rounded-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Save 2 months
              </span>
            </button>
          </div>
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
                <CardDescription className="text-sm">
                  {tier.description}
                </CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">
                      ${billingCycle === "monthly" ? tier.monthlyPrice : tier.yearlyPrice}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ${(tier.yearlyPrice / 12).toFixed(0)}/month billed annually
                    </p>
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
          <p>✓ {TRIAL_DAYS}-day free trial • ✓ No credit card required • ✓ Cancel anytime</p>
          <p className="max-w-2xl mx-auto">
            All plans include access to AI-powered content generation, property tour videos, 
            social media scheduling, and analytics. Upgrade or downgrade at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
