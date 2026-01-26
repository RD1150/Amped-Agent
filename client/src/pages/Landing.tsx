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
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      setLocation("/generate");
    }
  }, [user, loading, setLocation]);
  const features = [
    {
    icon: Sparkles,
    title: "Expert Content Generation",
    description: "Generate 30 days of professional real estate content in 60 seconds"
    },
    {
      icon: Calendar,
      title: "Content Calendar",
      description: "Visual calendar with drag-and-drop scheduling and bulk generation"
    },
    {
      icon: TrendingUp,
      title: "101 Proven Content Hooks",
      description: "Start with battle-tested hooks that grab attention and drive engagement"
    },
    {
      icon: Home,
      title: "Real Market Insights",
      description: "Post real market insights—not generic real estate advice. Data-driven content that positions you as the local authority."
    },
    {
    icon: Image,
    title: "Professional Image Creation",
    description: "Create stunning visuals for your posts automatically"
    },
    {
      icon: Zap,
      title: "GoHighLevel Integration",
      description: "Auto-post to all social platforms through your GHL account"
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
      name: "S.J.",
      role: "Luxury Real Estate Agent",
      content: "I finally feel confident posting consistently. My content sounds knowledgeable and credible—like I actually know my market inside and out. Clients are reaching out because they see me as the local expert.",
      rating: 5
    },
    {
      name: "M.C.",
      role: "Real Estate Team Leader",
      content: "The market data makes me look like I have my finger on the pulse. I'm not guessing what to say anymore—I'm posting with authority, and my audience can tell the difference.",
      rating: 5
    },
    {
      name: "J.M.",
      role: "Top Producer",
      content: "I used to stress about sounding professional. Now I post every day without second-guessing myself. The consistency alone has doubled my visibility, and the content actually builds trust.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/rca-logo.png" alt="Realty Content Agent" className="h-12 object-contain" />
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
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Sound Like the Market Expert Your Clients Expect — <span className="text-primary">Automatically</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Realty Content Agent creates authority-driven, market-smart content that builds trust, attracts buyers and sellers, and keeps you consistently visible without planning, writing, or second-guessing what to post.
          </p>

          <p className="text-lg font-semibold text-primary mb-8">
            Generate 30 days of expert real estate content in 60 seconds.
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
              Create My First Expert Post
            </Button>
            <Button
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline"
              size="lg"
              className="text-lg h-14 px-8"
            >
              See How It Works (2min demo)
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to expert-level content
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Choose your audience</h3>
            <p className="text-muted-foreground">Select buyer, seller, or investor</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Select your market</h3>
            <p className="text-muted-foreground">Enter your city or neighborhood</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Generate expert content instantly</h3>
            <p className="text-muted-foreground">Get publish-ready posts in seconds</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">4</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Schedule or auto-publish</h3>
            <p className="text-muted-foreground">Post now or schedule for later</p>
          </div>
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

      {/* Proof Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why This Works for Real Estate Agents
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See the difference between amateur posts and authority-driven content
          </p>
        </div>

        {/* Before/After Examples */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Example 1 */}
          <div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-4">
              <div className="text-sm font-semibold text-red-600 mb-2">❌ BEFORE: Generic Post</div>
              <p className="text-muted-foreground italic">
                "Just listed! Beautiful 3BR/2BA home in great neighborhood. DM me for details! 🏡 #realestate #justlisted"
              </p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="text-sm font-semibold text-green-600 mb-2">✅ AFTER: Authority-Driven</div>
              <p className="text-foreground">
                "Homes in Riverside are selling 23% faster than last year. Here's what buyers in this market are prioritizing: open floor plans, home offices, and walkability to downtown. If you're thinking of selling, now is the time to position your home strategically."
              </p>
            </div>
          </div>

          {/* Example 2 */}
          <div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-4">
              <div className="text-sm font-semibold text-red-600 mb-2">❌ BEFORE: Sales Pitch</div>
              <p className="text-muted-foreground italic">
                "Ready to buy or sell? I'm here to help! Call me today for a free consultation! 📞 #realtor #realestate"
              </p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="text-sm font-semibold text-green-600 mb-2">✅ AFTER: Market Insight</div>
              <p className="text-foreground">
                "Inventory in our area just dropped to 2.1 months—the lowest I've seen in 18 months. For buyers, this means competition is heating up. For sellers, it means your home will likely receive multiple offers if priced correctly. Here's what the data tells us..."
              </p>
            </div>
          </div>
        </div>

        {/* Authority Proof Bullets */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Real Data Builds Credibility</h3>
              <p className="text-sm text-muted-foreground">Market stats and local insights position you as the expert</p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Home className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Real Estate Language</h3>
              <p className="text-sm text-muted-foreground">Not generic business advice—actual real estate terminology</p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Local Insight</h3>
              <p className="text-sm text-muted-foreground">Demonstrates neighborhood expertise that attracts clients</p>
            </div>
          </div>
        </div>

        {/* Rewritten Testimonials */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-4">
                "I went from posting sporadically to showing up every day with content that actually positions me as the local expert. My followers started asking ME about market trends instead of the other way around."
              </p>
              <div>
                <p className="font-semibold">Sarah Johnson</p>
                <p className="text-sm text-muted-foreground">Luxury Real Estate Agent</p>
              </div>
            </CardContent>
          </Card>


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
                  <span>Generic tools that sound robotic</span>
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
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg line-through text-muted-foreground">Normally $149/month</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$79</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  or $699/year (2 months free)
                </p>
                <p className="text-sm font-medium text-primary mt-3">
                  🏆 One listing pays for this for years
                </p>
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
                  <span>Market-smart content that sounds like you</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                  <span>GoHighLevel + Facebook integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                  <span>Professional image creation</span>
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
                Content Disclaimer
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
