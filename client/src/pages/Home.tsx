import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Calendar, TrendingUp, Clock, CheckCircle2, Palette, Share2, Home, BarChart3, Star } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Authority Content" className="h-16 object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="text-slate-300 hover:text-white">
              <a href="#features">Features</a>
            </Button>
            <Button asChild variant="ghost" className="text-slate-300 hover:text-white">
              <a href="#testimonials">Testimonials</a>
            </Button>
            <Button asChild variant="outline" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
              <a href={getLoginUrl()}>Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            We Make Social Media Easy For
            <span className="block text-amber-500 mt-2">Real Estate Agents</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Put your social media on autopilot and grow your brand online with content that builds trust and saves you hours every week.
          </p>

          {/* Agent Headshots Row */}
          <div className="flex justify-center items-center gap-3 py-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-slate-700 border-2 border-slate-800 flex items-center justify-center text-white font-semibold">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
          </div>
          <p className="text-slate-400 font-medium">
            The <span className="text-amber-500 font-bold">fastest</span> growing AI marketing tool for real estate professionals
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-lg px-8 py-6">
              <a href={getLoginUrl()}>
                <Sparkles className="mr-2 h-5 w-5" />
                Start Creating with AI
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 text-lg px-8 py-6">
              <a href="#features">Explore Features</a>
            </Button>
          </div>
        </div>
      </section>

      {/* What Is It Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">What is AuthorityContent.co?</h2>
          <p className="text-xl text-slate-300 leading-relaxed">
            AuthorityContent.co is a powerful tool that helps you create, design, and schedule social media content with minimal effort, so you can focus on selling homes.
          </p>
        </div>
      </section>

      {/* 4 Core Benefits Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Benefit 1 */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-white">Content That Sounds Like You</h3>
            <p className="text-slate-300 leading-relaxed">
              Generate market updates, homebuyer tips, and listing promos in your unique voice. Our AI adapts to your style—so every post sounds like it came from you.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Palette className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-white">Professional Designs Without the Design Skills</h3>
            <p className="text-slate-300 leading-relaxed">
              Choose from hundreds of real estate–ready templates, personalized with your branding. Add your headshot, logo, and colors in seconds.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Calendar className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-white">Set It and Forget It Scheduling</h3>
            <p className="text-slate-300 leading-relaxed">
              Plan weeks of content across Facebook, Instagram, LinkedIn, and X—without logging into each one. Just approve and let it auto-post at the right time.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Home className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-white">Turn Listings Into Engaging Social Content</h3>
            <p className="text-slate-300 leading-relaxed">
              Instantly turn your property listings into eye-catching social posts with just a few clicks.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container mx-auto px-4 py-20 bg-slate-900/30">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">See What Our Clients Say!</h2>
          <p className="text-xl text-amber-500 font-semibold">Over 10,000+ posts generated by hundreds of agents</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Testimonial 1 */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed">
                "My experience with AuthorityContent.co has been amazing. I don't have a ton of time to create social media content, to have relevant topics generated for me has helped me stand out in my niche."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-slate-700 flex items-center justify-center text-white font-semibold">
                  ES
                </div>
                <div>
                  <p className="text-white font-semibold">Eric Sabatini</p>
                  <p className="text-slate-400 text-sm">Owner, Sabatini Mortgages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 2 */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed">
                "I would definitely recommend AuthorityContent.co to agents looking to create and maintain an online presence, without spending a ton of extra time on social media."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-slate-700 flex items-center justify-center text-white font-semibold">
                  AY
                </div>
                <div>
                  <p className="text-white font-semibold">Amy Youngren</p>
                  <p className="text-slate-400 text-sm">Founder, North Group</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 3 */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed">
                "We are loving using AuthorityContent.co. Social media used to be a huge headache for us. We've been able to save time and 5x our output with the content calendar."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-slate-700 flex items-center justify-center text-white font-semibold">
                  MF
                </div>
                <div>
                  <p className="text-white font-semibold">Matthew Fierling</p>
                  <p className="text-slate-400 text-sm">Owner, Flux Realty</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Powerful Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful Features Designed<br />for Real Estate Agents
          </h2>
          <p className="text-xl text-slate-400">
            Everything included to help you plan, create, and publish high-performing content in minutes.
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-20">
          {/* Feature 01 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="text-amber-500 font-bold text-lg">01</div>
              <h3 className="text-3xl font-bold text-white">AI-Assisted Content Generation</h3>
              <p className="text-slate-300 leading-relaxed">
                Generate posts with one click — no writing blocks, no guesswork. Quickly create market updates, homebuyer tips, and listing promos that sound like you.
              </p>
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Key Benefits:</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Trending real estate topics tailored to your niche</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Captions written in your personal style</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Instantly create Reels or turn images into video slideshows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Educational content that positions you as an expert</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                <a href={getLoginUrl()}>Start Creating With AI</a>
              </Button>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 border border-slate-700">
              <div className="aspect-square flex items-center justify-center">
                <Sparkles className="h-32 w-32 text-amber-500/30" />
              </div>
            </div>
          </div>

          {/* Feature 02 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 border border-slate-700 order-2 md:order-1">
              <div className="aspect-square flex items-center justify-center">
                <Palette className="h-32 w-32 text-amber-500/30" />
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div className="text-amber-500 font-bold text-lg">02</div>
              <h3 className="text-3xl font-bold text-white">Design Tools + Templates</h3>
              <p className="text-slate-300 leading-relaxed">
                Customize beautiful templates with your branding, headshot, brokerage, and contact information. Make every post instantly recognizable as yours.
              </p>
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Key Benefits:</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Hundreds of real estate-specific templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Easy personalization with your colors and logo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Save templates for consistent branding across all posts</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                <a href={getLoginUrl()}>Explore the Design Tools</a>
              </Button>
            </div>
          </div>

          {/* Feature 03 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="text-amber-500 font-bold text-lg">03</div>
              <h3 className="text-3xl font-bold text-white">Scheduler and Auto Posting</h3>
              <p className="text-slate-300 leading-relaxed">
                Schedule weeks of content across Facebook, Instagram, LinkedIn, and X in minutes. Autopost at optimal times without logging into multiple platforms.
              </p>
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Key Benefits:</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Manage all of your social media accounts from one spot</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Schedule up to 60 days of content in advance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Auto posting means you can set it, and forget it</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                <a href={getLoginUrl()}>Start Scheduling</a>
              </Button>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 border border-slate-700">
              <div className="aspect-square flex items-center justify-center">
                <Calendar className="h-32 w-32 text-amber-500/30" />
              </div>
            </div>
          </div>

          {/* Feature 04 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 border border-slate-700 order-2 md:order-1">
              <div className="aspect-square flex items-center justify-center">
                <Home className="h-32 w-32 text-amber-500/30" />
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div className="text-amber-500 font-bold text-lg">04</div>
              <h3 className="text-3xl font-bold text-white">Turn Listings Into Social Content</h3>
              <p className="text-slate-300 leading-relaxed">
                Instantly create multiple social posts from a single listing URL. The easiest way to announce new listings, and promote open houses on social media.
              </p>
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Key Benefits:</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Copy listing URL and automatically convert to a social media post</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Easily promote as "Just Listed, Open House, Re-Listed, Just Sold", etc.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Automatically highlight key selling points for social media captions</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                <a href={getLoginUrl()}>Generate Listing Posts</a>
              </Button>
            </div>
          </div>

          {/* Feature 05 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="text-amber-500 font-bold text-lg">05</div>
              <h3 className="text-3xl font-bold text-white">Market Report Posts For Your Specific Audience</h3>
              <p className="text-slate-300 leading-relaxed">
                Post beautifully designed, data-driven market updates to your social media in just a few clicks — no extra tools, no extra cost. Instantly show your expertise and stay top of mind with professional, scroll-stopping content.
              </p>
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Key Benefits:</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Consistent, valuable, professional-looking updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>AI-generated commentary tailored to your voice and brand</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>Engaging, relevant context that enhances your market data</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                <a href={getLoginUrl()}>Create Posts for Your Market</a>
              </Button>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 border border-slate-700">
              <div className="aspect-square flex items-center justify-center">
                <BarChart3 className="h-32 w-32 text-amber-500/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simplicity Message */}
      <section className="container mx-auto px-4 py-20 bg-slate-900/30">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Not tech savvy? Not a problem.
          </h2>
          <p className="text-2xl text-slate-300">
            AuthorityContent.co is simple to use.
          </p>
          <p className="text-xl text-slate-400">
            If you can click a button, you can create professional real estate content.
          </p>
          <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-lg px-8 py-6">
            <a href={getLoginUrl()}>
              <Sparkles className="mr-2 h-5 w-5" />
              Start Creating With AI
            </a>
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-amber-500/10 to-slate-800/50 border-amber-500/30">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-4xl font-bold text-white">Ready to Transform Your Social Media?</h2>
            <p className="text-xl text-slate-300">
              Join hundreds of agents who are saving hours every week and growing their brand online.
            </p>
            <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-lg px-8 py-6">
              <a href={getLoginUrl()}>
                Get Started Today
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <img src="/logo.png" alt="Authority Content" className="h-12 object-contain mx-auto md:mx-0 mb-4" />
              <p className="text-slate-400 text-sm">
                AI-powered social media content for real estate professionals.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-slate-400 hover:text-white transition-colors">Features</a>
                <a href="#testimonials" className="block text-slate-400 hover:text-white transition-colors">Testimonials</a>
                <a href={getLoginUrl()} className="block text-slate-400 hover:text-white transition-colors">Sign In</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <a href="mailto:support@authoritycontent.co" className="block text-slate-400 hover:text-white transition-colors">
                  support@authoritycontent.co
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700/50 mt-8 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 AuthorityContent.co. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
