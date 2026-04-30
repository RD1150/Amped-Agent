import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Play,
  Video,
  Camera,
  Clapperboard,
  Smartphone,
  Star,
  ChevronRight,
  Zap,
  TrendingUp,
  Users,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  const products = [
    {
      icon: Clapperboard,
      name: "AI Reels",
      tagline: "30-second reels that stop the scroll",
      description:
        "Your face, your voice, your market. AI writes the script, generates the reel, adds captions. Ready to post to Instagram, TikTok, and Facebook in minutes.",
      badge: "Most Popular",
      badgeColor: "bg-primary text-primary-foreground",
    },
    {
      icon: Video,
      name: "Property Tour",
      tagline: "Cinematic listing videos for any property",
      description:
        "Upload listing photos and get a professionally produced cinematic property video — with your branding, music, and agent outro. Works on any listing, not just yours.",
      badge: "New",
      badgeColor: "bg-emerald-600 text-white",
    },
    {
      icon: Camera,
      name: "Avatar Video",
      tagline: "Your AI twin. Any script. Any time.",
      description:
        "Upload your photo once. Generate unlimited talking-head videos of yourself — market updates, buyer tips, listing announcements — without ever recording again.",
      badge: "Authority",
      badgeColor: "bg-amber-600 text-white",
    },
    {
      icon: Smartphone,
      name: "Live Tour",
      tagline: "Walk through. Record. Done.",
      description:
        "Record a room-by-room walkthrough on your phone. The app assembles it into a polished property walkthrough video with room labels and your branding automatically.",
      badge: "",
      badgeColor: "",
    },
  ];

  const stats = [
    { value: "4", label: "AI video tools in one platform" },
    { value: "30s", label: "Average time to generate a reel" },
    { value: "100%", label: "Your face, your brand, your voice" },
  ];

  // Testimonials removed — will be replaced with real beta user reviews

  const howItWorks = [
    {
      step: "01",
      title: "Set up your profile",
      description:
        "Add your headshot, market, brokerage, and brand voice. Takes 3 minutes. Done once.",
    },
    {
      step: "02",
      title: "Choose your content type",
      description:
        "AI Reel, Property Tour, Avatar Video, or Live Tour. Pick what you need for today.",
    },
    {
      step: "03",
      title: "Generate and post",
      description:
        "AI produces your content. You review, download, and post. Your audience sees a professional.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-border/40 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Amped Agent</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Pricing
            </a>
            <Button variant="outline" size="sm" asChild>
              <a href={getLoginUrl()}>Log in</a>
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <a href={getLoginUrl()}>
                Start Free
                <ChevronRight className="ml-1 w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <TrendingUp className="w-4 h-4" />
            The AI Marketing Platform Built for Real Estate Agents
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            You didn't become an agent to spend your day writing{" "}
            <span className="text-primary">posts, ads, and listing descriptions.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Amped Agent handles your real estate marketing — so you can focus on closing deals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button
              size="lg"
              className="text-lg px-10 py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              asChild
            >
              <a href={getLoginUrl()}>
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-10 py-6" asChild>
              <a href="/pricing">
                <Play className="mr-2 h-5 w-5" />
                See Plans & Pricing
              </a>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            14-day free trial &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-primary py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i}>
              <div className="text-3xl md:text-4xl font-extrabold text-primary-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-primary-foreground/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Products */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Four Tools. One Platform. Zero Excuses.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every video format a modern real estate agent needs — all powered by AI, all branded to you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {products.map((product, i) => {
              const Icon = product.icon;
              return (
                <Card
                  key={i}
                  className="border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200 group"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      {product.badge && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${product.badgeColor}`}>
                          {product.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                    <p className="text-primary font-medium text-sm mb-3">{product.tagline}</p>
                    <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gray-50 border-y">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Up and Running in Minutes</h2>
            <p className="text-xl text-muted-foreground">
              No production crew. No video editor. No social media manager.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-extrabold text-primary/20 mb-4">{step.step}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The Difference Is Immediate
            </h2>
            <p className="text-xl text-muted-foreground">
              Would you feel comfortable posting this under your name?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-red-200 bg-red-50/30">
              <CardContent className="p-8">
                <div className="text-red-600 font-semibold text-sm mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-xs">✕</span>
                  Generic AI Content
                </div>
                <div className="bg-white border border-red-100 rounded-lg p-5 text-sm space-y-2 mb-4">
                  <p className="font-medium">🏠 Looking to buy or sell a home?</p>
                  <p>As a real estate professional, I can help you navigate the market! 📈</p>
                  <p>DM me today to get started on your real estate journey! 🔑</p>
                  <p className="text-xs text-muted-foreground pt-2">
                    #RealEstate #HomeBuying #RealEstateAgent #DreamHome
                  </p>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  Robotic. Clearly AI. Zero local context. Ignored.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-8">
                <div className="text-primary font-semibold text-sm mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Amped Agent Content
                </div>
                <div className="bg-white border border-primary/20 rounded-lg p-5 text-sm space-y-2 mb-4">
                  <p className="font-medium">Beverly Hills inventory dropped 18% this quarter.</p>
                  <p>That means fewer options for buyers — and more leverage for sellers who list now.</p>
                  <p>If you've been waiting for the "right time" to sell, this is it. Low supply + steady demand = premium offers.</p>
                  <p className="text-xs text-muted-foreground pt-2">
                    DM me for a no-pressure market analysis of your property.
                  </p>
                </div>
                <p className="text-sm text-primary italic font-medium">
                  Professional. Market-aware. Sounds like a local expert.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Early Access Social Proof */}
      <section className="py-24 px-4 bg-gray-50 border-y">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-8">
            <Zap className="w-4 h-4" />
            Early Access — Limited Spots
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Join Agents Getting Early Access
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto">
            Amped Agent is in active beta. A growing group of real estate professionals are using it right now to create content, attract leads, and build their brand.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              { stat: "50+", label: "Agents in early access" },
              { stat: "Beta", label: "Active & improving daily" },
              { stat: "14 days", label: "Free trial — no commitment" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-6">
                <div className="text-3xl font-bold text-primary mb-1">{item.stat}</div>
                <div className="text-sm text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Real testimonials coming soon — we're collecting feedback from our first cohort of beta agents.
          </p>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Built for Every Agent</h2>
          <p className="text-xl text-muted-foreground mb-12">
            Whether you're a solo agent building your brand or a team lead managing multiple producers — Amped Agent scales with you.
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Solo Agents", desc: "Build a market presence that makes you the obvious choice before prospects even call." },
              { icon: TrendingUp, title: "Listing Agents", desc: "Impress every seller with cinematic property videos that justify your commission." },
              { icon: Zap, title: "Team Leaders", desc: "Give every agent on your team professional-grade content tools under your brand." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="border border-border text-left">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-4">
            Start Dominating Your Market Today
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10">
            Join real estate professionals using Amped Agent to build market-dominant brands — before their competition figures out what's happening.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button
              size="lg"
              className="text-lg px-10 py-6 bg-white text-primary hover:bg-white/90 shadow-lg font-bold"
              asChild
            >
              <a href={getLoginUrl()}>
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-6 border-white/40 text-white hover:bg-white/10"
              asChild
            >
              <a href="/pricing">View Pricing</a>
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/60">
            14-day free trial &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Amped Agent</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="/pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/fair-housing" className="hover:text-foreground transition-colors">Fair Housing</a>
          </div>
          <div>© {new Date().getFullYear()} Amped Agent. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
