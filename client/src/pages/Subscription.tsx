import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CreditCard, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Subscription() {
  const { data: user } = trpc.auth.me.useQuery();
  const createCheckoutSession = trpc.stripe.createCheckoutSession.useMutation();

  const tierInfo = {
    essential: {
      name: "Essential",
      price: "$39/mo",
      yearlyPrice: "$390/yr",
      limits: { posts: 25, videos: 10, images: 50 },
      features: [
        "25 posts per month",
        "10 property tour videos",
        "50 AI-generated images",
        "3 social media connections",
        "Email support",
      ],
    },
    professional: {
      name: "Professional",
      price: "$79/mo",
      yearlyPrice: "$790/yr",
      limits: { posts: 100, videos: 50, images: 200 },
      features: [
        "100 posts per month",
        "50 property tour videos",
        "200 AI-generated images",
        "Unlimited social connections",
        "Priority support",
        "Advanced analytics",
      ],
    },
    enterprise: {
      name: "Enterprise",
      price: "$149/mo",
      yearlyPrice: "$1,490/yr",
      limits: { posts: Infinity, videos: Infinity, images: Infinity },
      features: [
        "Unlimited posts",
        "Unlimited property tours",
        "Unlimited AI images",
        "Unlimited social connections",
        "Priority support",
        "Advanced analytics",
        "White-label options",
        "API access",
      ],
    },
  };

  const currentTier = user?.subscriptionTier || "essential";
  const currentTierInfo = tierInfo[currentTier as keyof typeof tierInfo];

  const handleUpgrade = async (tier: string, billingPeriod: "monthly" | "annual") => {
    try {
      const { url } = await createCheckoutSession.mutateAsync({
        tier: tier as "essential" | "professional" | "enterprise",
        billingPeriod,
        successUrl: window.location.origin + "/subscription?success=true",
        cancelUrl: window.location.origin + "/subscription?canceled=true",
      });
      if (url) {
        window.open(url, "_blank");
        toast.info("Redirecting to checkout...");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create checkout session"
      );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Subscription & Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription, billing, and usage
        </p>
      </div>

      {/* Current Plan */}
      <Card className="p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold">{currentTierInfo.name} Plan</h2>
              <Badge variant="default" className="bg-primary">
                Current Plan
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {user?.subscriptionStatus === "trialing"
                ? "14-day free trial active"
                : user?.subscriptionStatus === "active"
                ? "Active subscription"
                : "No active subscription"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{currentTierInfo.price}</p>
            <p className="text-sm text-muted-foreground">
              or {currentTierInfo.yearlyPrice} (2 months free)
            </p>
          </div>
        </div>

        {/* Usage Stats - TODO: Implement usage tracking */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Posts</span>
              <span className="font-medium">
                0 /{" "}
                {currentTierInfo.limits.posts === Infinity
                  ? "∞"
                  : currentTierInfo.limits.posts}
              </span>
            </div>
            <Progress value={0} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Videos</span>
              <span className="font-medium">
                0 /{" "}
                {currentTierInfo.limits.videos === Infinity
                  ? "∞"
                  : currentTierInfo.limits.videos}
              </span>
            </div>
            <Progress value={0} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Images</span>
              <span className="font-medium">
                0 /{" "}
                {currentTierInfo.limits.images === Infinity
                  ? "∞"
                  : currentTierInfo.limits.images}
              </span>
            </div>
            <Progress value={0} />
          </div>
        </div>

        {/* Billing Info */}
        {user?.subscriptionStatus === "active" && (
          <div className="flex items-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Next billing date:</span>
              <span className="font-medium">
                {user?.subscriptionEndDate
                  ? new Date(user.subscriptionEndDate).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
            <Button variant="outline" size="sm">
              <CreditCard className="mr-2 h-4 w-4" />
              Update Payment Method
            </Button>
          </div>
        )}
      </Card>

      {/* Pricing Tiers */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(tierInfo) as Array<keyof typeof tierInfo>).map((tier) => {
            const info = tierInfo[tier];
            const isCurrent = tier === currentTier;

            return (
              <Card
                key={tier}
                className={`p-6 ${
                  isCurrent ? "border-primary border-2" : ""
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2">{info.name}</h3>
                  <div className="mb-4">
                    <p className="text-3xl font-bold">{info.price}</p>
                    <p className="text-sm text-muted-foreground">
                      or {info.yearlyPrice}
                    </p>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {info.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(tier, "monthly")}
                      disabled={createCheckoutSession.isPending}
                    >
                      {createCheckoutSession.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <TrendingUp className="mr-2 h-4 w-4" />
                      )}
                      Upgrade Monthly
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUpgrade(tier, "annual")}
                      disabled={createCheckoutSession.isPending}
                    >
                      Upgrade Yearly (Save 2 months)
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trial Info */}
      {user?.subscriptionStatus === "trialing" && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Free Trial Active</h3>
              <p className="text-sm text-muted-foreground">
                Your 14-day free trial is active. You won't be charged until{" "}
                {user?.subscriptionEndDate
                  ? new Date(user.subscriptionEndDate).toLocaleDateString()
                  : "the trial ends"}
                . Cancel anytime before then to avoid charges.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
