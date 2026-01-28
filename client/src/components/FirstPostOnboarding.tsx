import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getFirstPost, formatPostForDisplay } from "@/lib/postFormatter";
import ComprehensiveTemplateSelector from "@/components/ComprehensiveTemplateSelector";
import type { Template, TemplateCategory } from "../../../shared/templates";

interface FirstPostOnboardingProps {
  onComplete: () => void;
}

export default function FirstPostOnboarding({ onComplete }: FirstPostOnboardingProps) {
  const [step, setStep] = useState(1);
  const [audience, setAudience] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [market, setMarket] = useState<string>("");
  const [generatedPost, setGeneratedPost] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePost = trpc.content.generate.useMutation();

  const { data: persona } = trpc.persona.get.useQuery();

  const handleGeneratePost = async () => {
    if (!audience || !market || !selectedTemplate) {
      toast.error("Please complete all steps");
      return;
    }

    setIsGenerating(true);
    try {
      // Generate post content
      const result = await generatePost.mutateAsync({
        topic: `${selectedTemplate.name} for ${audience}s in ${market}`,
        contentType: "market_report",
        format: "static_post",
        tone: "authoritative"
      });

      setGeneratedPost(result.content);

      // Generate template image
      const { renderTemplate } = await import("@/lib/templateRenderer");
      const imageUrl = await renderTemplate({
        template: selectedTemplate,
        postText: result.content,
        businessName: persona?.businessName || undefined,
        tagline: persona?.tagline || undefined,
        headshotUrl: persona?.headshotUrl || undefined,
        primaryColor: persona?.primaryColor || undefined,
        phone: persona?.phoneNumber || undefined,
        email: persona?.emailAddress || undefined,
        website: persona?.websiteUrl || undefined,
        agentName: persona?.agentName || undefined,
        licenseNumber: persona?.licenseNumber || undefined,
        brokerageName: persona?.brokerageName || undefined,
        brokerageDRE: persona?.brokerageDRE || undefined,
      });

      setGeneratedImage(imageUrl);
      setStep(4);
      toast.success("Your first expert post is ready!");
    } catch (error) {
      console.error("Generation error:", error);
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
            {step === 1 && "Step 1 of 3: Choose your target audience"}
            {step === 2 && "Step 2 of 3: Choose your template style"}
            {step === 3 && "Step 3 of 3: Enter your market"}
            {step === 4 && "Your publish-ready post is ready!"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Step 1: Audience Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Who are you creating content for?</Label>
              <RadioGroup value={audience} onValueChange={setAudience}>
                {/* BUYING SECTION */}
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2 mb-2">Buying</div>
                <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="buyer" id="buyer" />
                  <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Buyers</div>
                    <div className="text-sm text-muted-foreground">First-time buyers, move-up buyers, investors</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="luxury_buyer" id="luxury_buyer" />
                  <Label htmlFor="luxury_buyer" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Luxury Buyers</div>
                    <div className="text-sm text-muted-foreground">Affluent buyers seeking high-end properties</div>
                  </Label>
                </div>

                {/* SELLING SECTION */}
                <div className="border-t border-border my-4"></div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Selling</div>
                <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="seller" id="seller" />
                  <Label htmlFor="seller" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Sellers</div>
                    <div className="text-sm text-muted-foreground">Homeowners ready to list, downsizers, relocators</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="first_seller" id="first_seller" />
                  <Label htmlFor="first_seller" className="flex-1 cursor-pointer">
                    <div className="font-semibold">First-Time Sellers</div>
                    <div className="text-sm text-muted-foreground">New sellers who've never sold a home before</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="expired" id="expired" />
                  <Label htmlFor="expired" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Expired Listings</div>
                    <div className="text-sm text-muted-foreground">Sellers whose listings didn't sell, need fresh approach</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Urgent Sellers</div>
                    <div className="text-sm text-muted-foreground">Moving, divorce, job loss, foreclosure, medical needs</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="fsbo" id="fsbo" />
                  <Label htmlFor="fsbo" className="flex-1 cursor-pointer">
                    <div className="font-semibold">FSBOs (For Sale By Owner)</div>
                    <div className="text-sm text-muted-foreground">Homeowners selling without an agent, need guidance</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="luxury_seller" id="luxury_seller" />
                  <Label htmlFor="luxury_seller" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Luxury Sellers</div>
                    <div className="text-sm text-muted-foreground">High-end property owners ready to list</div>
                  </Label>
                </div>

                {/* INVESTING SECTION */}
                <div className="border-t border-border my-4"></div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Investing</div>
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

          {/* Step 2: Template Selection */}
          {step === 2 && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              <ComprehensiveTemplateSelector
                selectedTemplateId={selectedTemplate?.id || null}
                onSelectTemplate={(template) => setSelectedTemplate(template)}
                audienceFilter={
                  audience === "buyer" ? "buyers" : 
                  audience === "seller" ? "sellers" : 
                  audience === "investor" ? "investors" : 
                  audience === "expired" ? "expireds" : 
                  audience === "urgent" ? "urgent_sellers" : 
                  audience === "fsbo" ? "fsbos" : 
                  audience === "luxury_buyer" ? "luxury_buyers" : 
                  audience === "luxury_seller" ? "luxury_sellers" : 
                  audience === "first_seller" ? "first_time_sellers" : 
                  undefined
                }
              />
              <div className="flex gap-3 sticky bottom-0 bg-background pt-4 border-t">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  size="lg"
                  className="flex-1 text-lg h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!selectedTemplate}
                  size="lg"
                  className="flex-1 text-lg h-12"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Market Selection */}
          {step === 3 && (
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
                  onClick={() => setStep(2)}
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

          {/* Step 4: Generated Post */}
          {step === 4 && (
            <div className="space-y-4">
              {generatedImage && (
                <div className="space-y-2">
                  <img 
                    src={generatedImage} 
                    alt="Generated Post" 
                    className="w-full rounded-lg border-4 border-primary shadow-lg"
                  />
                </div>
              )}
              <div className="bg-muted/50 border-2 border-primary/20 rounded-lg p-6">
                <div className="text-sm font-semibold text-primary mb-3">
                  ✅ YOUR EXPERT POST TEXT
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {formatPostForDisplay(getFirstPost(generatedPost))}
                  </p>
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
