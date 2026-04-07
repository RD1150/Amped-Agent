import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle2,
  ArrowRight,
  Shield,
  Edit3,
  Sliders,
  Ban
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";


export default function Landing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  const trustFactors = [
    {
      icon: Shield,
      title: "Content written for real estate",
      description: "Not generic industries. DRE-aware language and professional tone that protects your credibility."
    },
    {
      icon: Edit3,
      title: "Editable, customizable output",
      description: "Every post can be refined before publishing. You're always in control of your voice."
    },
    {
      icon: Sliders,
      title: "Brand voice control",
      description: "Choose your tone, add your branding, frame content for your local market."
    }
  ];

  const reliabilityPoints = [
    "No robotic phrasing",
    "No generic hooks",
    "No spammy CTA language",
    "No \"clearly AI\" tone"
  ];

  return (
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              The AI System for Real Estate Agents
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Become the Agent Everyone Already Trusts<br />
              <span className="text-primary">Before They Even Meet You.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AmpedAgent is the AI system that turns real estate agents into market-dominant brands — with cinematic property videos, authority content, and a presence that makes you the obvious choice in your market.
            </p>
            
            <p className="text-lg font-medium">
              Your competitors are still posting generic AI content. You won't be.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg" asChild>
                <a href={getLoginUrl()}>
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <a href="/pricing">
                  See Plans &amp; Pricing
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">7-day free trial &nbsp;&middot;&nbsp; No credit card required &nbsp;&middot;&nbsp; Cancel anytime</p>
          </div>
        </div>

        {/* Proof of Quality Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block w-16 h-1 bg-primary mb-6 rounded-full"></div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                See the Difference Instantly
              </h2>
              <p className="text-xl text-muted-foreground">
                Would you feel comfortable posting this under your name?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Generic AI Example */}
              <Card className="border-2 border-destructive/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <Ban className="h-5 w-5" />
                    Generic AI Post
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-medium">🏠 Looking to buy or sell a home?</p>
                    <p>As a real estate professional, I can help you navigate the market! 📈</p>
                    <p>DM me today to get started on your real estate journey! 🔑</p>
                    <p className="text-xs text-muted-foreground mt-4">
                      #RealEstate #HomeBuying #RealEstateAgent #DreamHome
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    Sounds robotic. Clearly AI-generated. Zero local context.
                  </p>
                </CardContent>
              </Card>

              {/* AmpedAgent Example */}
              <Card className="border-2 border-primary">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    AmpedAgent
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-medium">Beverly Hills inventory dropped 18% this quarter</p>
                    <p>That means fewer options for buyers—and more leverage for sellers who list now.</p>
                    <p>If you've been waiting for the "right time" to sell, this is it. Low supply + steady demand = premium offers.</p>
                    <p className="text-xs text-muted-foreground mt-4">
                      DM me for a no-pressure market analysis of your property.
                    </p>
                  </div>
                  <p className="text-sm text-primary italic">
                    Professional. Market-aware. Sounds like a local expert.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Why Agents Trust This */}
        <div className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-block w-16 h-1 bg-primary mb-6 rounded-full"></div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Why Agents Feel Confident Using This
                </h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {trustFactors.map((factor, index) => {
                  const Icon = factor.icon;
                  return (
                    <Card key={index}>
                      <CardContent className="p-6 space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">{factor.title}</h3>
                        <p className="text-muted-foreground">{factor.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Control & Customization */}
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-block w-16 h-1 bg-primary mb-6 rounded-full"></div>
              <h2 className="text-3xl md:text-4xl font-bold">
                You're Always in Control
              </h2>
            <p className="text-xl text-muted-foreground">
              The tool works for you — not the other way around.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 text-left mt-12">
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold text-lg">Choose Your Tone</h3>
                  <p className="text-muted-foreground">
                    Select from professional, conversational, authoritative, or friendly voices. Match your personal brand.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold text-lg">Edit Before Posting</h3>
                  <p className="text-muted-foreground">
                    Every piece of content is fully editable. Tweak, refine, or completely rewrite before it goes live.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold text-lg">Add Your Branding</h3>
                  <p className="text-muted-foreground">
                    Include your headshot, DRE number, brokerage info, and contact details on every graphic.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold text-lg">Local Market Framing</h3>
                  <p className="text-muted-foreground">
                    Content automatically adapts to your market. Beverly Hills sounds different from Austin.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Reliability Section */}
        <div className="py-20 bg-gray-50 border-y">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-block w-16 h-1 bg-primary mb-6 rounded-full"></div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Never Post Content That Makes You Cringe
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-4 mt-8">
                {reliabilityPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-3 bg-background p-4 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-medium">{point}</span>
                  </div>
                ))}
              </div>
              
              <p className="text-lg text-muted-foreground mt-8">
                Every post is designed to protect and enhance your professional credibility.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Become the Agent Everyone Already Knows?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join real estate professionals using AmpedAgent to build market-dominant brands — before their competition figures out what's happening.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg" asChild>
                <a href={getLoginUrl()}>
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <a href="/pricing">
                  View Pricing
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">7-day free trial &nbsp;&middot;&nbsp; No credit card required &nbsp;&middot;&nbsp; Cancel anytime</p>
          </div>
        </div>
      </div>
  );
}
