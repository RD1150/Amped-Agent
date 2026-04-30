import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Calendar, TrendingUp, Clock, CheckCircle2, Palette, Share2, Home, BarChart3, Star, Video, Zap } from "lucide-react";
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
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/fsjGKfiVhGcAEGxr.png" alt="Amped Agent" className="h-16 object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="text-slate-300 hover:text-white">
              <a href="#features">Features</a>
            </Button>
            <Button asChild variant="ghost" className="text-slate-300 hover:text-white">
              <a href="#pricing">Pricing</a>
            </Button>
            <Button asChild variant="ghost" className="text-slate-300 hover:text-white">
              <a href="#faq">FAQ</a>
            </Button>
            <Button asChild variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
            <Button asChild className="bg-muted0 hover:bg-primary text-slate-900 font-semibold">
              <a href={getLoginUrl()}>Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            This Platform Runs
            <span className="block text-primary mt-2">Your Entire Real Estate Business.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            From your next Instagram reel to your next listing appointment &mdash; Amped Agent is the complete marketing platform built exclusively for real estate agents.
          </p>

          {/* Lifecycle Pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {[
              { label: "ATTRACT", desc: "Build your audience" },
              { label: "ENGAGE", desc: "Stay top of mind" },
              { label: "CONVERT", desc: "Win listings" },
              { label: "SCALE", desc: "Multiply output" },
              { label: "DOMINATE", desc: "Own your market" },
            ].map((s, i) => (
              <span key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-wider text-white/80">
                {i > 0 && <span className="text-primary/50 mr-0.5">&rarr;</span>}
                {s.label}
                <span className="font-normal text-white/40 hidden sm:inline">&nbsp;{s.desc}</span>
              </span>
            ))}
          </div>

          {/* Social Proof - 8000+ Users */}
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-slate-700 border-2 border-slate-800 flex items-center justify-center text-white font-semibold text-sm">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 font-semibold">
                Trusted by <span className="text-primary/80 font-bold">8,000+</span> members on the platform
              </p>
            </div>
          </div>
          <p className="text-slate-400 font-medium">
            Turn content into closings. Not just another AI post generator.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild size="lg" className="bg-muted0 hover:bg-primary text-slate-900 font-semibold text-lg px-8 py-6">
              <a href={getLoginUrl()}>
                <Sparkles className="mr-2 h-5 w-5" />
                Dominate Your Market
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 text-lg px-8 py-6">
              <a href="#features">Explore Features</a>
            </Button>
          </div>
        </div>
      </section>

      {/* All-in-One Value Proposition Section */}
      <section className="container mx-auto px-4 py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Stop Stitching Together 5 Different Tools
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Amped Agent is the <span className="text-primary font-semibold">only complete marketing platform</span> that covers every stage of an agent's business &mdash; from content creation and video production to listing presentations and market authority.
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Without Amped Agent */}
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-8 space-y-6">
                <h3 className="text-2xl font-bold text-white text-center mb-6">Without Amped Agent</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <span className="text-slate-300">Social Media Content</span>
                    <span className="text-slate-400 font-semibold">$99/mo</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <span className="text-slate-300">Video Creation Tool</span>
                    <span className="text-slate-400 font-semibold">$29-99/mo</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <span className="text-slate-300">AI Avatar Videos</span>
                    <span className="text-slate-400 font-semibold">$16/mo</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <span className="text-slate-300">Content Scheduling</span>
                    <span className="text-slate-400 font-semibold">$20-99/mo</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t-2 border-slate-600">
                    <span className="text-white font-bold text-lg">Total Monthly Cost</span>
                    <span className="text-red-400 font-bold text-2xl">$164-313</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* With Amped Agent */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-border relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-muted0 text-slate-900 px-3 py-1 rounded-full text-sm font-bold">
                BEST VALUE
              </div>
              <CardContent className="p-8 space-y-6">
                <h3 className="text-2xl font-bold text-white text-center mb-6">With Amped Agent</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-200">Social Media Content</span>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-200">AI Video Generation</span>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-200">AI Avatar Videos</span>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-200">Content Calendar & Scheduling</span>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-200">Faceless Vertical Videos</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t-2 border-white/10">
                    <span className="text-white font-bold text-lg">Total Monthly Cost</span>
                    <span className="text-primary font-bold text-2xl">$59-149</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Button asChild className="w-full bg-muted0 hover:bg-primary text-slate-900 font-semibold">
                    <a href="/upgrade">
                      <Zap className="mr-2 h-5 w-5" />
                      Get Started Now
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Savings Highlight */}
          <div className="text-center bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-border rounded-lg p-8">
            <p className="text-2xl md:text-3xl font-bold text-white mb-2">
              Save up to <span className="text-primary">$105-$164/month</span>
            </p>
            <p className="text-slate-300 text-lg">
              Get everything you need in one platform, at a fraction of the cost
            </p>
          </div>
        </div>
      </section>

      {/* What Is It Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">What is Amped Agent.co?</h2>
          <p className="text-xl text-slate-300 leading-relaxed">
            Amped Agent is the AI-powered marketing platform built exclusively for real estate agents. We don't just generate posts — we create cinematic property videos, market authority posts, and a digital presence that makes you the obvious choice in your market.
          </p>
        </div>
      </section>

      {/* 4 Core Benefits Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Benefit 1 */}
          <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-white">Content That Sounds Like You</h3>
            <p className="text-slate-300 leading-relaxed">
              Generate market updates, homebuyer tips, and listing promos in your unique voice. Our AI adapts to your style—so every post sounds like it came from you.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Palette className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-white">Professional Designs Without the Design Skills</h3>
            <p className="text-slate-300 leading-relaxed">
              Choose from hundreds of real estate–ready templates, personalized with your branding. Add your headshot, logo, and colors in seconds.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-white">Set It and Forget It Scheduling</h3>
            <p className="text-slate-300 leading-relaxed">
              Plan weeks of content across Facebook, Instagram, LinkedIn, and X—without logging into each one. Just approve and let it auto-post at the right time.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-white">AI-Powered Video Creation</h3>
            <p className="text-slate-300 leading-relaxed">
              Create scroll-stopping vertical videos with AI avatars and faceless reels in under 60 seconds. No video editing skills required.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container mx-auto px-4 py-20 bg-slate-900/30">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Real Results From Real Agents</h2>
          <p className="text-xl text-muted-foreground font-semibold">Join hundreds of agents who've transformed their social media presence</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Testimonial 1 */}
          <Card className="bg-slate-800/50 border-slate-700 hover:border-primary/20 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed italic">
                "My experience with Amped Agent.co has been amazing. I don't have a ton of time to create social media content, to have relevant topics generated for me has helped me stand out in my niche."
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
          <Card className="bg-slate-800/50 border-slate-700 hover:border-primary/20 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed italic">
                "I would definitely recommend Amped Agent.co to agents looking to create and maintain an online presence, without spending a ton of extra time on social media."
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
          <Card className="bg-slate-800/50 border-slate-700 hover:border-primary/20 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed italic">
                "We are loving using Amped Agent.co. Social media used to be a huge headache for us. We've been able to save time and 5x our output with the content calendar."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-slate-700 flex items-center justify-center text-white font-semibold">
                  JM
                </div>
                <div>
                  <p className="text-white font-semibold">Jessica Martinez</p>
                  <p className="text-slate-400 text-sm">Team Lead, Martinez Realty</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Testimonial CTA */}
        <div className="mt-12 text-center space-y-4">
          <div className="bg-muted border border-border rounded-lg p-6 max-w-3xl mx-auto">
            <p className="text-foreground font-semibold mb-2">📝 TODO: Replace with Real Testimonials</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              The testimonials above are examples. Replace them with real customer testimonials once you have beta users or early customers. 
              Collect testimonials by:
            </p>
            <ul className="text-slate-300 text-sm text-left mt-3 space-y-1 max-w-xl mx-auto">
              <li>• Asking satisfied customers for feedback after 30 days</li>
              <li>• Using tools like Testimonial.to or Google Forms</li>
              <li>• Offering a discount or free month for video testimonials</li>
              <li>• Highlighting specific results (e.g., "5x my output", "saved 10 hours/week")</li>
            </ul>
          </div>
          <p className="text-slate-400 text-sm italic">
            Want to add your success story? <a href="mailto:hello@authoritycontent.co" className="text-primary hover:underline">Contact us</a>
          </p>
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
              <div className="text-muted-foreground font-bold text-lg">01</div>
              <h3 className="text-3xl font-bold text-white">AI-Assisted Content Generation</h3>
              <p className="text-slate-300 leading-relaxed">
                Generate posts with one click — no writing blocks, no guesswork. Quickly create market updates, homebuyer tips, and listing promos that sound like you.
              </p>
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Key Benefits:</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Trending real estate topics tailored to your niche</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Captions written in your personal style</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Instantly create Reels or turn images into video slideshows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Educational content that positions you as an expert</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="bg-muted0 hover:bg-primary text-slate-900 font-semibold">
                <a href={getLoginUrl()}>Start Creating With AI</a>
              </Button>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 border border-slate-700">
              <div className="aspect-square flex items-center justify-center">
                <Sparkles className="h-32 w-32 text-primary/30" />
              </div>
            </div>
          </div>

          {/* Feature 02 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 border border-slate-700 order-2 md:order-1">
              <div className="aspect-square flex items-center justify-center">
                <Palette className="h-32 w-32 text-primary/30" />
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div className="text-muted-foreground font-bold text-lg">02</div>
              <h3 className="text-3xl font-bold text-white">Design Tools + Templates</h3>
              <p className="text-slate-300 leading-relaxed">
                Customize beautiful templates with your branding, headshot, brokerage, and contact information. Make every post instantly recognizable as yours.
              </p>
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Key Benefits:</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Hundreds of real estate-specific templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Easy personalization with your colors and logo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Save templates for consistent branding across all posts</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="bg-muted0 hover:bg-primary text-slate-900 font-semibold">
                <a href={getLoginUrl()}>Explore the Design Tools</a>
              </Button>
            </div>
          </div>

          {/* Feature 03 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="text-muted-foreground font-bold text-lg">03</div>
              <h3 className="text-3xl font-bold text-white">Scheduler and Auto Posting</h3>
              <p className="text-slate-300 leading-relaxed">
                Schedule weeks of content across Facebook, Instagram, LinkedIn, and X in minutes. Autopost at optimal times without logging into multiple platforms.
              </p>
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Key Benefits:</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Manage all of your social media accounts from one spot</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Schedule up to 60 days of content in advance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Auto posting means you can set it, and forget it</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="bg-muted0 hover:bg-primary text-slate-900 font-semibold">
                <a href={getLoginUrl()}>Start Scheduling</a>
              </Button>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 border border-slate-700">
              <div className="aspect-square flex items-center justify-center">
                <Calendar className="h-32 w-32 text-primary/30" />
              </div>
            </div>
          </div>

          {/* Feature 04 - AutoReels */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 border border-slate-700 order-2 md:order-1">
              <div className="aspect-square flex items-center justify-center">
                <Video className="h-32 w-32 text-primary/30" />
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div className="text-muted-foreground font-bold text-lg">04</div>
              <h3 className="text-3xl font-bold text-white">AutoReels - AI Video Generation</h3>
              <p className="text-slate-300 leading-relaxed">
                Create scroll-stopping vertical videos with AI avatars and faceless reels in under 60 seconds. Perfect for Instagram Reels, TikTok, and YouTube Shorts.
              </p>
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Key Benefits:</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>AI-powered script generation and video rendering</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>AI avatar intros with your personalized headshot</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Faceless vertical videos with auto-captions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>No video editing skills required</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="bg-muted0 hover:bg-primary text-slate-900 font-semibold">
                <a href={getLoginUrl()}>Create Your First Reel</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-400">Everything you need to know about Amped Agent</p>
          </div>

          <div className="space-y-6">
            {/* FAQ 1 */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-3">How does Amped Agent compare to other tools?</h3>
                <p className="text-slate-300 leading-relaxed">
                  Amped Agent is the only all-in-one platform that combines social media content generation, AI video creation with avatars, faceless vertical videos, and content scheduling. Instead of paying $164-313/month for 3+ separate tools, you get everything in one platform for $59-149/month.
                </p>
              </CardContent>
            </Card>

            {/* FAQ 2 */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-3">What are AI avatar videos?</h3>
                <p className="text-slate-300 leading-relaxed">
                  AI avatar videos use your headshot to create a realistic digital version of yourself that can introduce your vertical videos (Reels, TikTok, Shorts). Upload your photo once, and your AI avatar can deliver personalized intros for all your content—no camera or video editing required.
                </p>
              </CardContent>
            </Card>

            {/* FAQ 3 */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-3">Can I cancel my subscription anytime?</h3>
                <p className="text-slate-300 leading-relaxed">
                  Yes! You can cancel your subscription at any time from your account settings. If you're on an annual plan, you'll continue to have access until the end of your billing period. No hidden fees or cancellation charges.
                </p>
              </CardContent>
            </Card>

            {/* FAQ 4 */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-3">Do I still need my CRM?</h3>
                <p className="text-slate-300 leading-relaxed">
                  Yes. Amped Agent focuses on content creation and distribution, while your CRM handles lead management and client relationships. We integrate seamlessly with your existing workflow—you don't need to replace your CRM.
                </p>
              </CardContent>
            </Card>

            {/* FAQ 5 */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-3">What's the difference between the pricing tiers?</h3>
                <p className="text-slate-300 leading-relaxed">
                  All tiers include the core features (content generation, templates, scheduling). Higher tiers offer more monthly posts, videos, and AI avatar minutes. Starter is perfect for solo agents, Pro for active agents, and Authority for top producers who want the full platform.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Video Samples Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Property Tours - Quality Tiers
            </h2>
            <p className="text-xl text-slate-300 mb-4">
              Compare video quality across our 3 pricing tiers
            </p>
            <p className="text-sm text-primary/80">
              Same property, different production levels - you decide what's worth it
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Standard Tier (5 credits) */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden group hover:border-primary/30 transition-all">
              <div className="relative aspect-[9/16] bg-black">
                <div className="absolute top-2 left-2 z-10 bg-slate-900/90 px-3 py-1 rounded-full">
                  <span className="text-xs font-semibold text-white">5 Credits</span>
                </div>
                <video 
                  className="w-full h-full object-cover" 
                  controls
                  playsInline
                >
                  <source src="https://shotstack-api-v1-output.s3-ap-southeast-2.amazonaws.com/dv10cghii1/88e5764e-a748-42f9-95fb-05946c375f2e.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Standard</h3>
                <p className="text-sm text-slate-400 mb-3">Ken Burns effects • Crossfade dissolves • Music</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>✓ Smooth crossfade transitions</li>
                  <li>✓ Professional music library</li>
                  <li>✓ Add voiceover for +5 credits</li>
                </ul>
              </CardContent>
            </Card>

          </div>

          {/* Instructions for updating */}
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="bg-muted border border-border rounded-lg p-6">
              <p className="text-foreground font-semibold mb-2">📹 TODO: Replace with Real Sample Videos</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                Generate real Authority Reels videos using the Authority Reels Engine, then replace the placeholders above with actual video embeds or thumbnails.
              </p>
              <p className="text-slate-400 text-xs">
                To replace: Generate videos → Upload to YouTube/Vimeo → Update the video URLs in Home.tsx (search for "Sample video placeholder")
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="container mx-auto px-4 py-20 bg-slate-900/30">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">See Amped Agent in Action</h2>
          <p className="text-xl text-slate-300 mb-12">
            Watch how easy it is to create professional content in under 60 seconds
          </p>
          
          {/* Demo Video Embed */}
          {/* TODO: Replace with your demo video URL */}
          {/* For YouTube: Use https://www.youtube.com/embed/VIDEO_ID */}
          {/* For Vimeo: Use https://player.vimeo.com/video/VIDEO_ID */}
          {/* For Loom: Use https://www.loom.com/embed/VIDEO_ID */}
          <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            {/* Placeholder - Replace the entire div below with iframe when you have a video */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Video className="h-24 w-24 text-primary/30 mx-auto" />
                <p className="text-slate-400 text-lg">Demo video coming soon</p>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  Record a 60-second walkthrough and embed it here using an iframe.
                </p>
                <div className="bg-slate-800/50 rounded p-4 text-left text-xs font-mono text-slate-400 max-w-lg mx-auto mt-4">
                  <p className="mb-2">Example embed code:</p>
                  <code className="text-primary">
                    {`<iframe`}<br/>
                    {`  src="https://www.youtube.com/embed/YOUR_VIDEO_ID"`}<br/>
                    {`  className="w-full h-full"`}<br/>
                    {`  allow="autoplay; fullscreen"`}<br/>
                    {`  allowFullScreen`}<br/>
                    {`/>`}
                  </code>
                </div>
              </div>
            </div>
            {/* Uncomment and update when you have a video URL:
            <iframe
              src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            */}
          </div>
        </div>
      </section>

      {/* Pricing CTA Section */}
      <section id="pricing" className="container mx-auto px-4 py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ready to Transform Your Social Media?
          </h2>
          <p className="text-xl text-slate-300">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-muted0 hover:bg-primary text-slate-900 font-semibold text-lg px-8 py-6">
              <a href={getLoginUrl()}>
                <Sparkles className="mr-2 h-5 w-5" />
                Start Free Trial
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 text-lg px-8 py-6">
              <a href="/upgrade">View Pricing</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: copyright */}
            <div className="text-slate-400 text-center md:text-left">
              <p>&copy; 2026 Amped Agent.co. All rights reserved.</p>
              <p className="mt-1 text-sm">The all-in-one content platform for real estate professionals.</p>
            </div>
            {/* Right: QR code */}
            <div className="flex flex-col items-center gap-2">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/homebuyerfair_qrcode_7f4e3667.png"
                alt="Scan to visit HomeBuyerFair.org"
                className="w-24 h-24 rounded-lg border border-slate-600 bg-white p-1"
              />
              <p className="text-xs text-slate-500">HomeBuyerFair.org</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
