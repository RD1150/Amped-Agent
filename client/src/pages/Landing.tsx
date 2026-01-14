import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, 
  Calendar, 
  Zap, 
  TrendingUp, 
  Home, 
  Image, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Star
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Landing() {
  const features = [
    {
      icon: Sparkles,
      title: "AI Content Generation",
      description: "Generate 30 days of professional real estate content in 60 seconds"
    },
    {
      icon: Calendar,
      title: "Content Calendar",
      description: "Visual calendar with drag-and-drop scheduling and bulk generation"
    },
    {
      icon: TrendingUp,
      title: "Trending News Posts",
      description: "Comment on real estate news to position yourself as the local expert"
    },
    {
      icon: Home,
      title: "Market Stats Reports",
      description: "Generate data-driven market updates for any location"
    },
    {
      icon: Image,
      title: "AI Image Generation",
      description: "Create stunning visuals for your posts automatically"
    },
    {
      icon: Zap,
      title: "GoHighLevel Integration",
      description: "Auto-post to Facebook and sync with your CRM"
    }
  ];

  const contentFormats = [
    "Static Posts",
    "Carousel Posts",
    "Reel Scripts",
    "Video Reels",
    "Story Posts",
    "Property Listings"
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Luxury Real Estate Agent",
      content: "This tool saved me 10+ hours per week. I went from struggling to post once a week to having a full month of content ready to go.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Team Leader, Keller Williams",
      content: "The market stats feature is a game-changer. My engagement doubled since I started posting data-driven insights.",
      rating: 5
    },
    {
      name: "Jessica Martinez",
      role: "Realtor, RE/MAX",
      content: "Finally, a tool that understands real estate content. The AI sounds like me, not a robot.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/rca-logo.png" alt="Realty Content Agent" className="h-8 object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              variant="outline"
              size="sm"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Content Creation</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Generate 30 Days of Real Estate Content in{" "}
            <span className="text-primary">60 Seconds</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop staring at blank screens. Realty Content Agent creates professional social media content 
            that positions you as the local market expert.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              size="lg"
              className="text-lg h-14 px-8 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
            >
              <Zap className="h-5 w-5 mr-2" />
              Start 14-Day Free Trial
            </Button>
            <Button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline"
              size="lg"
              className="text-lg h-14 px-8"
            >
              See How It Works
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Dominate Social Media
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From content generation to scheduling and posting, we've got you covered
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Content Formats */}
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-6">6 Content Formats</h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {contentFormats.map((format, index) => (
              <div key={index} className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">{format}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            One plan. All features. No hidden fees.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Competitor Comparison */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Other Tools</CardTitle>
              <CardDescription>What you'd typically pay</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold line-through text-muted-foreground">$99</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Limited content formats</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>No market stats or trending news</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Generic AI that sounds robotic</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>No GoHighLevel integration</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Our Pricing */}
          <Card className="border-2 border-primary shadow-xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
              Best Value
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Realty Content Agent Pro</CardTitle>
              <CardDescription>Everything you need to succeed</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$79</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  14-day free trial • Cancel anytime
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                  <span>6 content formats (posts, carousels, reels, stories)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                  <span>Trending news & market stats posts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                  <span>Real estate-trained AI (sounds like you)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                  <span>GoHighLevel + Facebook integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                  <span>AI image generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                  <span>Unlimited content generation</span>
                </li>
              </ul>

              <Button
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
                size="lg"
                className="w-full text-lg h-12 bg-primary hover:bg-primary/90"
              >
                <Zap className="h-5 w-5 mr-2" />
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Loved by Real Estate Agents
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of agents saving 10+ hours per week
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border">
              <CardHeader>
                <div className="flex gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <CardDescription className="text-base">
                  "{testimonial.content}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Content Strategy?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="text-lg h-14 px-8 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            <Zap className="h-5 w-5 mr-2" />
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/rca-logo.png" alt="Realty Content Agent" className="h-6 object-contain" />
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="/ai-disclaimer" className="hover:text-foreground transition-colors">
                AI Disclaimer
              </a>
              <a href="/fair-housing" className="hover:text-foreground transition-colors">
                Fair Housing
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Realty Content Agent. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
