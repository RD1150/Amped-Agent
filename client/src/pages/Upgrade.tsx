import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Tier = "starter" | "pro" | "authority";
type BillingPeriod = "monthly" | "annual";

interface PricingTier {
  name: string;
  tier: Tier;
  priceMonthly: number;
  priceAnnual: number;
  savings: number;
  description: string;
  icon: any;
  popular?: boolean;
  features: string[];
}

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    tier: "starter",
    priceMonthly: 59,
    priceAnnual: 590,
    savings: 158,
    description: "Get started with AI content generation",
    icon: Sparkles,
    features: [
      "Unlimited text & image posts",
      "5 AI avatar videos per month",
      "Listing photo to video conversion",
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
    name: "Pro",
    tier: "pro",
    priceMonthly: 99,
    priceAnnual: 990,
    savings: 158,
    description: "The complete AI video marketing solution",
    icon: Zap,
    popular: true,
    features: [
      "Everything in Starter, plus:",
      "20 AI avatar videos per month",
      "Listing photo to video conversion",
      "3 hook options per video",
      "AI script generation",
      "Auto-generated captions with CTA",
      "Smooth transitions & effects",
      "Background music",
      "No watermarks",
      "Priority support (24hr)",
    ],
  },
  {
    name: "Authority",
    tier: "authority",
    priceMonthly: 149,
    priceAnnual: 1490,
    savings: 298,
    description: "Complete marketing suite with Newsletter Builder",
    icon: Crown,
    features: [
      "Everything in Professional, plus:",
      "30 Script-to-Reel videos per month",
      "📧 Newsletter Builder (Full Access)",
      "Email list management",
      "Newsletter templates",
      "Email analytics & tracking",
      "Automated email campaigns",
      "Voice cloning (1 custom voice)",
      "Multiple avatar looks (3 styles)",
      "Custom branding overlays",
      "Priority support (4hr)",
    ],
  },
];

export default function Upgrade() {
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

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
      billingPeriod,
      successUrl: `${window.location.origin}/?upgrade=success`,
      cancelUrl: `${window.location.origin}/upgrade?canceled=true`,
    });
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Start with a 7-day free trial. Cancel anytime.
        </p>

        {/* Billing Period Toggle */}
        <div className="inline-flex items-center gap-3 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingPeriod === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("annual")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              billingPeriod === "annual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">
              Save up to $498
            </Badge>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {pricingTiers.map((tier) => {
          const Icon = tier.icon;
          const isLoading = loadingTier === tier.tier;
          const displayPrice = billingPeriod === "monthly" ? tier.priceMonthly : tier.priceAnnual;
          const effectiveMonthly = billingPeriod === "annual" ? (tier.priceAnnual / 12).toFixed(2) : tier.priceMonthly;

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
                    <span className="text-4xl font-bold">${displayPrice}</span>
                    <span className="text-muted-foreground">
                      {billingPeriod === "monthly" ? "/month" : "/year"}
                    </span>
                  </div>
                  {billingPeriod === "annual" && (
                    <div className="mt-2 space-y-1">
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">
                        Save ${tier.savings}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        ${effectiveMonthly}/month (billed annually)
                      </p>
                    </div>
                  )}
                  {billingPeriod === "monthly" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      14-day free trial included
                    </p>
                  )}
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
        <h2 className="text-2xl font-bold mb-4">Why Amped Agent?</h2>
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
