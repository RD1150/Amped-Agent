import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FirstPostOnboardingProps {
  onComplete: () => void;
}

export default function FirstPostOnboarding({ onComplete }: FirstPostOnboardingProps) {
  const [step, setStep] = useState(1);
  const [audience, setAudience] = useState<string>("");
  const [market, setMarket] = useState<string>("");
  const [generatedPost, setGeneratedPost] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePost = trpc.content.generate.useMutation();

  const handleGeneratePost = async () => {
    if (!audience || !market) {
      toast.error("Please select audience and market");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generatePost.mutateAsync({
        topic: `Market insights for ${audience}s in ${market}`,
        contentType: "market_report",
        format: "static_post",
        tone: "authoritative"
      });

      setGeneratedPost(result.content);
      setStep(3);
      toast.success("Your first expert post is ready!");
    } catch (error) {
      toast.error("Failed to generate post. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as complete
    localStorage.setItem("rca_onboarding_complete", "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-primary shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">Create Your First Expert Post</CardTitle>
          </div>
          <CardDescription className="text-base">
            {step === 1 && "Step 1 of 2: Choose your target audience"}
            {step === 2 && "Step 2 of 2: Select your market"}
            {step === 3 && "Your publish-ready post is ready!"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Audience Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Who are you creating content for?</Label>
              <RadioGroup value={audience} onValueChange={setAudience}>
                <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="buyer" id="buyer" />
                  <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Buyers</div>
                    <div className="text-sm text-muted-foreground">First-time buyers, move-up buyers, investors</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="seller" id="seller" />
                  <Label htmlFor="seller" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Sellers</div>
                    <div className="text-sm text-muted-foreground">Homeowners ready to list, downsizers, relocators</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="investor" id="investor" />
                  <Label htmlFor="investor" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Investors</div>
                    <div className="text-sm text-muted-foreground">Buy-and-hold, fix-and-flip, commercial investors</div>
                  </Label>
                </div>
              </RadioGroup>
              <Button
                onClick={() => setStep(2)}
                disabled={!audience}
                size="lg"
                className="w-full text-lg h-12"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Market Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="market" className="text-lg font-semibold">What's your primary market?</Label>
                <Input
                  id="market"
                  placeholder="e.g., Austin, TX or Downtown Seattle"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  className="text-lg h-12"
                />
                <p className="text-sm text-muted-foreground">
                  Enter your city, neighborhood, or region
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  size="lg"
                  className="flex-1 text-lg h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGeneratePost}
                  disabled={!market || isGenerating}
                  size="lg"
                  className="flex-1 text-lg h-12"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate My First Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Generated Post */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-muted/50 border-2 border-primary/20 rounded-lg p-6">
                <div className="text-sm font-semibold text-primary mb-3">
                  ✅ YOUR EXPERT POST IS READY
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-foreground">{generatedPost}</p>
                </div>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium">
                  🎉 That took less than 90 seconds! This post is ready to publish or schedule. You can edit it, generate more, or explore the full platform.
                </p>
              </div>
              <Button
                onClick={handleComplete}
                size="lg"
                className="w-full text-lg h-12"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
