import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Zap, Crown } from "lucide-react";

export default function Upgrade() {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      alert(`Error: ${error.message}`);
      setIsLoading(false);
    },
  });

  const handleUpgrade = async () => {
    setIsLoading(true);
    await createCheckoutMutation.mutateAsync({
      successUrl: `${window.location.origin}/?upgrade=success`,
      cancelUrl: `${window.location.origin}/upgrade?canceled=true`,
    });
  };

  const features = [
    "Unlimited AI-generated content",
    "6 content formats (posts, carousels, reels, stories)",
    "30-day content calendar generation",
    "GoHighLevel integration",
    "Facebook auto-posting",
    "Trending real estate news posts",
    "Market stats reports by location",
    "Property listing templates",
    "AI image generation",
    "Content scheduling & automation",
    "Brand persona customization",
    "Priority support",
  ];

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
          <Crown className="h-4 w-4" />
          <span className="text-sm font-medium">Upgrade to Pro</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Transform Your Real Estate Content
        </h1>
        <p className="text-xl text-muted-foreground">
          Generate 30 days of professional content in 60 seconds
        </p>
      </div>

      <Card className="border-2 border-primary shadow-xl">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">Realty Content Agent Pro</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Everything you need to dominate social media
          </CardDescription>
          <div className="mt-6">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold">$79</span>
              <span className="text-xl text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              14-day free trial • Cancel anytime
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              size="lg"
              className="w-full text-lg h-14 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? (
                "Redirecting to checkout..."
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Start 14-Day Free Trial
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              No credit card required for trial • Secure payment by Stripe
            </p>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Why Realty Content Agent?</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Save 10+ hours per week:</strong> Stop staring at blank screens. Generate a full month of content in minutes.
              </p>
              <p>
                <strong className="text-foreground">Stay relevant:</strong> Comment on trending news and market stats to position yourself as the local expert.
              </p>
              <p>
                <strong className="text-foreground">Consistent presence:</strong> Never miss a post. Automated scheduling keeps you top-of-mind.
              </p>
              <p>
                <strong className="text-foreground">Professional quality:</strong> AI-generated content that sounds like you, not a robot.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>
          Questions? Email us at{" "}
          <a href="mailto:support@realtycontentagent.com" className="text-primary hover:underline">
            support@realtycontentagent.com
          </a>
        </p>
      </div>
    </div>
  );
}
