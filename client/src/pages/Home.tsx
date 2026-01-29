import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Calendar, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    brokerage: "",
    email: "",
    phone: "",
  });

  const submitBetaSignup = trpc.betaSignup.submit.useMutation({
    onSuccess: () => {
      toast.success("You're on the list!", {
        description: "We'll contact you soon with beta access details.",
      });
      setFormData({ name: "", brokerage: "", email: "", phone: "" });
    },
    onError: (error: any) => {
      toast.error("Submission failed", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill in required fields");
      return;
    }
    submitBetaSignup.mutate(formData);
  };

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Authority Content" className="h-10 object-contain" />
          </div>
          <Button asChild variant="outline" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Limited Beta Access - 10 Spots Only
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            Create Expert Real Estate Content
            <span className="block text-amber-500 mt-2">In Seconds, Not Hours</span>
          </h1>
          
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            AI-powered content generation for real estate agents. Professional posts, market insights, and property showcases—all branded with your headshot and contact info.
          </p>
        </div>
      </section>

      {/* Beta Signup Form */}
      <section className="container mx-auto px-4 pb-20">
        <Card className="max-w-2xl mx-auto bg-slate-800/50 border-slate-700">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Join the Beta</h2>
              <p className="text-slate-400">Be among the first 10 agents to access Authority Content</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Smith"
                    required
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brokerage" className="text-white">Brokerage</Label>
                  <Input
                    id="brokerage"
                    value={formData.brokerage}
                    onChange={(e) => setFormData({ ...formData, brokerage: e.target.value })}
                    placeholder="Your Realty Group"
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    required
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitBetaSignup.isPending}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-lg py-6"
              >
                {submitBetaSignup.isPending ? "Submitting..." : "Request Beta Access"}
              </Button>

              <p className="text-center text-sm text-slate-500">
                * Required fields. We'll contact you within 48 hours.
              </p>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 border-t border-slate-700/50">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Everything You Need to Stand Out</h2>
          <p className="text-xl text-slate-400">Professional content creation, simplified</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">AI-Powered Generation</h3>
              <p className="text-slate-400">Create professional posts in seconds with advanced AI</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Branded Templates</h3>
              <p className="text-slate-400">Your headshot, contact info, and branding on every post</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <Calendar className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Content Calendar</h3>
              <p className="text-slate-400">Plan and schedule posts across all platforms</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Save Hours Weekly</h3>
              <p className="text-slate-400">Focus on clients, not content creation</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sample Post Gallery */}
      <section className="container mx-auto px-4 py-20 bg-slate-900/30">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">See What You Can Create</h2>
          <p className="text-xl text-slate-400">Professional posts generated in seconds</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Sample Post 1 - First-Time Buyer Tips */}
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-amber-500/50 transition-colors">
            <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <div className="text-4xl">🏠</div>
                <h4 className="text-lg font-bold text-white">First-Time Buyer Tips</h4>
                <p className="text-sm text-slate-300">Expert advice for your first home purchase</p>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Static Post • Market Education</p>
            </CardContent>
          </Card>

          {/* Sample Post 2 - Luxury Market Trends */}
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-amber-500/50 transition-colors">
            <div className="aspect-square bg-gradient-to-br from-amber-900/20 to-slate-800 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <div className="text-4xl">📈</div>
                <h4 className="text-lg font-bold text-white">Luxury Market Trends</h4>
                <p className="text-sm text-slate-300">Q1 2026 market insights and analysis</p>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Static Post • Market Report</p>
            </CardContent>
          </Card>

          {/* Sample Post 3 - Neighborhood Spotlight */}
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-amber-500/50 transition-colors">
            <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <div className="text-4xl">🌆</div>
                <h4 className="text-lg font-bold text-white">Neighborhood Spotlight</h4>
                <p className="text-sm text-slate-300">Discover hidden gems in your area</p>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Carousel • Local Guide</p>
            </CardContent>
          </Card>

          {/* Sample Post 4 - Property Showcase */}
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-amber-500/50 transition-colors">
            <div className="aspect-square bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <div className="text-4xl">✨</div>
                <h4 className="text-lg font-bold text-white">Property Showcase</h4>
                <p className="text-sm text-slate-300">Stunning listing presentation</p>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Static Post • Listing</p>
            </CardContent>
          </Card>

          {/* Sample Post 5 - Seller Tips */}
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-amber-500/50 transition-colors">
            <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <div className="text-4xl">💡</div>
                <h4 className="text-lg font-bold text-white">Top Seller Tips</h4>
                <p className="text-sm text-slate-300">Maximize your home's value</p>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Reel Script • Expert Advice</p>
            </CardContent>
          </Card>

          {/* Sample Post 6 - Investment Insights */}
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-amber-500/50 transition-colors">
            <div className="aspect-square bg-gradient-to-br from-amber-900/20 to-slate-900 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <div className="text-4xl">💰</div>
                <h4 className="text-lg font-bold text-white">Investment Insights</h4>
                <p className="text-sm text-slate-300">Smart real estate investing strategies</p>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Static Post • Investment</p>
            </CardContent>
          </Card>

          {/* Sample Post 7 - Market Update */}
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-amber-500/50 transition-colors">
            <div className="aspect-square bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <div className="text-4xl">📊</div>
                <h4 className="text-lg font-bold text-white">Weekly Market Update</h4>
                <p className="text-sm text-slate-300">Latest trends and statistics</p>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Carousel • Market Data</p>
            </CardContent>
          </Card>

          {/* Sample Post 8 - Open House */}
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-amber-500/50 transition-colors">
            <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <div className="text-4xl">🚪</div>
                <h4 className="text-lg font-bold text-white">Open House Promo</h4>
                <p className="text-sm text-slate-300">Drive attendance with compelling posts</p>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Static Post • Event</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-400 mb-6">All posts include your branding, headshot, and contact information</p>
          <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
            <a href="#beta-signup">Request Beta Access</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>&copy; 2026 Authority Content. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
