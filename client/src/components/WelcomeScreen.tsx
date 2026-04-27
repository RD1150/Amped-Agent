import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  MapPin,
  Users,
  BarChart3,
  Zap,
  ArrowRight,
  X,
} from "lucide-react";

const WELCOME_SEEN_KEY = "ampedagent_welcome_seen_v1";

interface WelcomeScreenProps {
  userName?: string;
}

export default function WelcomeScreen({ userName }: WelcomeScreenProps) {
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(WELCOME_SEEN_KEY);
    if (!seen) {
      setVisible(true);
      // Slight delay so the animation is visible on mount
      setTimeout(() => setAnimateIn(true), 50);
    }
  }, []);

  const dismiss = () => {
    setAnimateIn(false);
    setTimeout(() => {
      localStorage.setItem(WELCOME_SEEN_KEY, "1");
      setVisible(false);
    }, 350);
  };

  const goToProfile = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, "1");
    setVisible(false);
    navigate("/authority-profile");
  };

  if (!visible) return null;

  const firstName = userName?.split(" ")[0] || "there";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-350 ${
        animateIn ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        className={`relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden transition-all duration-350 ${
          animateIn ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        {/* Header gradient band */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-8 pt-10 pb-8 text-white overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome to AmpedAgent
            </div>
            <h1 className="text-3xl font-bold leading-tight mb-2">
              Hey {firstName} 👋
            </h1>
            <p className="text-white/85 text-base leading-relaxed max-w-lg">
              You're in. AmpedAgent is your AI-powered marketing engine — built
              specifically for real estate agents who want to dominate their
              market.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-7 space-y-6">
          {/* The one thing */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-primary mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Before you do anything else
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              <strong>Fill out your Authority Profile in detail.</strong> Every
              AI tool in this platform — your reels, posts, scripts, market
              reports, and coaching — gets smarter the more it knows about you,
              your market, and your clients. A complete profile is the
              difference between generic content and content that sounds exactly
              like you.
            </p>
          </div>

          {/* What the profile powers */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Your profile powers all of this
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: MapPin,
                  label: "Hyperlocal content",
                  desc: "Reels & posts that name your neighborhoods, schools, and amenities",
                },
                {
                  icon: Users,
                  label: "Audience targeting",
                  desc: "Scripts written for your exact client type — not a generic buyer",
                },
                {
                  icon: BarChart3,
                  label: "Market intelligence",
                  desc: "Weekly AI diagnosis based on your specific market conditions",
                },
                {
                  icon: Sparkles,
                  label: "Brand voice",
                  desc: "Every output matches your tone, style, and positioning",
                },
              ].map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-lg bg-muted/40 p-3"
                >
                  <div className="mt-0.5 flex-shrink-0 rounded-md bg-primary/10 p-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={goToProfile}
              size="lg"
              className="flex-1 gap-2 font-semibold"
            >
              Set Up My Authority Profile
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={dismiss}
              className="text-muted-foreground"
            >
              I'll do it later
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground -mt-2">
            Takes about 5 minutes. You can always update it later.
          </p>
        </div>
      </div>
    </div>
  );
}
