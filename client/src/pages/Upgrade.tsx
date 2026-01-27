import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";

type Tier = "starter" | "professional" | "agency";

interface PricingTier {
  name: string;
  tier: Tier;
  price: number;
  description: string;
  icon: any;
  popular?: boolean;
  features: string[];
}

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    tier: "starter",
    price: 79,
    description: "Perfect for individual agents getting started",
    icon: Sparkles,
    features: [
      "AI content generation (all 6 formats)",
      "30-day content calendar",
      "Trending news posts",
      "Market stats posts",
      "Video conversion",
      "Direct posting to FB/IG/LinkedIn",
      "100 posts per month",
      "50 AI images per month",
    ],
  },
  {
    name: "Professional",
    tier: "professional",
    price: 197,
    description: "Complete marketing system with CRM & funnels",
    icon: Zap,
    popular: true,
    features: [
      "Everything in Starter, plus:",
      "GoHighLevel CRM included",
      "Auto-generate landing pages",
      "Lead capture & tracking",
      "Email/SMS automation",
      "Content performance analytics",
      "A/B testing",
      "500 posts per month",
      "250 AI images per month",
    ],
  },
  {
    name: "Agency",
    tier: "agency",
    price: 497,
    description: "White label solution for brokerages & teams",
    icon: Crown,
    features: [
      "Everything in Professional, plus:",
      "Unlimited sub-accounts",
      "White label branding",
      "Custom domain",
      "Priority support",
      "Unlimited posts",
      "Unlimited AI images",
      "Agency dashboard",
    ],
  },
];

export default function Upgrade() {
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      alert(`Error: ${error.message}`);
      setLoadingTier(null);
    },
  });

  const handleUpgrade = async (tier: Tier) => {
    setLoadingTier(tier);
    await createCheckoutMutation.mutateAsync({
      tier,
      successUrl: `${window.location.origin}/?upgrade=success`,
      cancelUrl: `${window.location.origin}/upgrade?canceled=true`,
    });
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start with a 14-day free trial. Cancel anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {pricingTiers.map((tier) => {
          const Icon = tier.icon;
          const isLoading = loadingTier === tier.tier;

          return (
            <Card
              key={tier.tier}
              className={`relative ${
                tier.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${tier.popular ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-6 w-6 ${tier.popular ? "text-primary" : "text-foreground"}`} />
                  </div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                </div>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    14-day free trial included
                  </p>
                </div>
              </CardHeader>

              <CardContent>
                <Button
                  onClick={() => handleUpgrade(tier.tier)}
                  disabled={isLoading}
                  className={`w-full mb-6 ${
                    tier.popular
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                  size="lg"
                >
                  {isLoading ? (
                    "Loading..."
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Why Authority Content?</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-8">
          <div>
            <div className="text-4xl mb-2">🚀</div>
            <h3 className="font-semibold mb-2">Save 10+ Hours/Week</h3>
            <p className="text-sm text-muted-foreground">
              Generate 30 days of content in 60 seconds
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">📈</div>
            <h3 className="font-semibold mb-2">Increase Engagement</h3>
            <p className="text-sm text-muted-foreground">
              AI-optimized content that drives results
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">💰</div>
            <h3 className="font-semibold mb-2">Generate More Leads</h3>
            <p className="text-sm text-muted-foreground">
              Auto-funnels capture leads from every post
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
