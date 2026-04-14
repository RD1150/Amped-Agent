import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { 
  Sparkles, 
  Calendar, 
  Upload, 
  TrendingUp,
  FileText,
  Clock,
  HelpCircle,
  Award,
  ChevronRight,
  Zap,
  Youtube,
  Eye,
  Users,
  Video,
  ExternalLink,
  Link2,
  Building2,
  Smartphone,
  UserCircle,
  CheckCircle2,
  BookOpen,
  FileCheck,
} from "lucide-react";
import { startDashboardTour, shouldShowTour } from "@/lib/productTour";
import UsageCounter from "@/components/UsageCounter";
import VideoPreviewGallery from "@/components/VideoPreviewGallery";
import AuthorityScore from "@/components/AuthorityScore";
import ReferralCard from "@/components/ReferralCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, MessageSquare } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [betaBannerDismissed, setBetaBannerDismissed] = useState(
    () => localStorage.getItem("ampd_beta_banner_dismissed") === "1"
  );

  const dismissBetaBanner = () => {
    localStorage.setItem("ampd_beta_banner_dismissed", "1");
    setBetaBannerDismissed(true);
  };
  const { data: persona, isLoading: personaLoading } = trpc.persona.get.useQuery(
    undefined,
    {
      enabled: !!user,
      retry: false,
    }
  );
  const { data: twinStatus } = trpc.fullAvatarVideo.getCustomAvatarStatus.useQuery(
    undefined,
    { enabled: !!user, retry: false }
  );

  // Auto-start tour for first-time users
  useEffect(() => {
    if (shouldShowTour()) {
      // Delay to ensure DOM is ready
      setTimeout(() => {
        startDashboardTour();
      }, 1000);
    }
  }, []);

  // Get current hour for time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const quickActions = [
    {
      title: "Authority Post Builder",
      description: "Build positioning power that converts",
      icon: Sparkles,
      href: "/generate",
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Content Calendar",
      description: "View and manage your scheduled posts",
      icon: Calendar,
      href: "/",
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Upload Content",
      description: "Import property listings or images",
      icon: Upload,
      href: "/uploads",
      color: "bg-primary/10 text-primary"
    }
  ];

  const gettingStartedSteps = [
    {
      title: "Complete Your Profile",
      description: "Add your headshot, DRE info, and branding",
      completed: persona?.isCompleted,
      href: "/persona"
    },
    {
      title: "Connect Social Accounts",
      description: "Link LinkedIn, Facebook, and Instagram",
      completed: false, // TODO: Check if integrations are connected
      href: "/integrations"
    },
    {
      title: "Generate Your First Post",
      description: "Create professional content in minutes",
      completed: false, // TODO: Check if user has generated posts
      href: "/generate"
    },
    {
      title: "Set Up Your AI Avatar",
      description: "Upload your headshot to create your personal talking avatar",
      completed: twinStatus?.status === "ready",
      href: "/full-avatar-video"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Beta Banner */}
      {!betaBannerDismissed && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-orange-500 text-white px-2 py-0.5 rounded-full shrink-0">
            BETA
          </span>
          <p className="text-sm text-orange-800 flex-1">
            You're using an early beta of Amped Agent. Your feedback shapes the platform —{" "}
            <a
              href="mailto:feedback@ampedagent.app"
              className="font-semibold underline hover:text-orange-900"
            >
              share your thoughts
            </a>.
          </p>
          <button
            onClick={dismissBetaBanner}
            className="text-orange-400 hover:text-orange-600 transition-colors shrink-0"
            aria-label="Dismiss beta banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Welcome Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {greeting}, {persona?.agentName || user?.name || "Agent"}!
            </h1>
            <p className="text-muted-foreground mt-1">
              This platform runs your entire real estate business.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startDashboardTour()}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Start Tour
          </Button>
        </div>
        {/* Lifecycle Stage Pills */}
        <div className="flex flex-wrap gap-2">
          {([
            { label: "ATTRACT", sub: "Build your audience", color: "bg-blue-500/10 text-blue-600 border-blue-200", href: "/attract" },
            { label: "ENGAGE", sub: "Stay top of mind", color: "bg-green-500/10 text-green-600 border-green-200", href: "/engage" },
            { label: "CONVERT", sub: "Win listings", color: "bg-orange-500/10 text-orange-600 border-orange-200", href: "/convert" },
            { label: "SCALE", sub: "Multiply output", color: "bg-purple-500/10 text-purple-600 border-purple-200", href: "/scale" },
            { label: "DOMINATE", sub: "Own your market", color: "bg-red-500/10 text-red-600 border-red-200", href: "/dominate" },
          ] as const).map((stage) => (
            <button
              key={stage.label}
              onClick={() => setLocation(stage.href)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wider transition-all hover:scale-105 ${stage.color}`}
            >
              {stage.label}
              <span className="font-normal opacity-70 hidden sm:inline">· {stage.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Authority Profile Summary Strip */}
      {!personaLoading && (
        <Card
          className="p-4 cursor-pointer hover:border-primary/50 transition-colors border"
          onClick={() => setLocation("/authority-profile")}
        >
          <div className="flex items-center gap-4">
            {/* Headshot */}
            <div className="flex-shrink-0">
              {persona?.headshotUrl ? (
                <img
                  src={persona.headshotUrl}
                  alt={persona.agentName || "Agent"}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                  <UserCircle className="h-7 w-7 text-primary/50" />
                </div>
              )}
            </div>
            {/* Name + Tagline + Completion */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base">
                  {persona?.agentName || user?.name || "Complete your Authority Profile"}
                </span>
                {persona?.brokerageName && (
                  <span className="text-xs text-muted-foreground">&middot; {persona.brokerageName}</span>
                )}
{(() => {
                  const cities = (() => {
                    try { return persona?.serviceCities ? JSON.parse(persona.serviceCities as string) as string[] : null; } catch { return null; }
                  })();
                  if (cities && cities.length > 0) {
                    return cities.map((c: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                    ));
                  }
                  return persona?.primaryCity ? <Badge variant="outline" className="text-xs">{persona.primaryCity}</Badge> : null;
                })()}
              </div>
              {persona?.tagline ? (
                <p className="text-sm text-muted-foreground truncate mt-0.5 italic">&ldquo;{persona.tagline}&rdquo;</p>
              ) : (
                <p className="text-sm text-primary/70 mt-0.5">Add your tagline &rarr;</p>
              )}
              {(() => {
                const fields = [persona?.agentName, persona?.headshotUrl, persona?.tagline, persona?.bio, persona?.brokerageName, persona?.primaryCity];
                const filled = fields.filter(Boolean).length;
                const pct = Math.round((filled / fields.length) * 100);
                return (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Progress value={pct} className="h-1.5 flex-1 max-w-[140px]" />
                    <span className="text-xs text-muted-foreground">{pct}% profile complete</span>
                  </div>
                );
              })()}
            </div>
            {/* CTA arrow */}
            <div className="flex-shrink-0 flex items-center gap-1 text-xs text-primary font-medium">
              <span className="hidden sm:inline">Edit Profile</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </Card>
      )}

      {/* Usage Counter */}
      <UsageCounter />

      {/* Market Dominance Score */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <AuthorityScore />
        </div>
        <Card className="p-6 bg-[#0F0F0F] border-primary/20">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Market Dominance Tips</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">→</span>
                <span>Post 3x per week to stay top-of-mind</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">→</span>
                <span>Focus on local market insights</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">→</span>
                <span>Use video to build trust faster</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">→</span>
                <span>Share case studies and wins</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.title}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation(action.href)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Posts This Month</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled Posts</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reach</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Getting Started Guide */}
      {!persona?.isCompleted && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Getting Started</h2>
              <span className="text-sm text-muted-foreground">
                {gettingStartedSteps.filter(s => s.completed).length} of {gettingStartedSteps.length} completed
              </span>
            </div>

            <div className="space-y-3">
              {gettingStartedSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(step.href)}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.completed ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    {step.completed ? 'Review' : 'Start'} →
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Market Dominance Coach Featured Card */}
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer group"
        onClick={() => setLocation("/coach")}
      >
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-[#0F0F0F]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative px-8 py-7 flex flex-col md:flex-row md:items-center gap-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 border border-white/20 shrink-0">
            <Award className="h-7 w-7 text-white" />
          </div>
          {/* Text */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">Market Dominance Coach</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                <Zap className="h-2.5 w-2.5" />Authority
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">This Week's Challenge</h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Write a post that positions you as the go-to expert in your city. Lead with a bold market stat, share your take, and end with a call to action. Then run it through the Coach to see your Market Dominance Score.
            </p>
          </div>
          {/* CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-white hover:bg-white/90 text-black font-semibold gap-1.5 group-hover:shadow-lg transition-all"
            >
              Open Coach
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* CONVERT Featured Card - Listing Presentation Toolkit */}
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer group"
        onClick={() => setLocation("/listing-presentation")}
      >
        {/* Deep navy background */}
        <div className="absolute inset-0 bg-[#0A1628]" />
        {/* Subtle diagonal grid */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(225deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Orange glow accent */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative px-8 py-7 flex flex-col md:flex-row md:items-center gap-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-orange-500/20 border border-orange-500/30 shrink-0">
            <BookOpen className="h-7 w-7 text-orange-400" />
          </div>
          {/* Text */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-orange-400/90 uppercase tracking-wider">CONVERT &mdash; Listing Presentation Toolkit</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                <FileCheck className="h-2.5 w-2.5" />Print-Ready
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Win More Listing Appointments</h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Generate a fully branded Seller&apos;s Manual or Buyer&apos;s Guide in minutes &mdash; your name, photo, logo, and brokerage on every page. Print it before the appointment. Walk in looking like the most prepared agent in the room.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" /> Branded Seller&apos;s Manual
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" /> Branded Buyer&apos;s Guide
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" /> Hyperlocal Market Data
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" /> CMA Builder
              </span>
            </div>
          </div>
          {/* CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-400 text-white font-semibold gap-1.5 group-hover:shadow-lg group-hover:shadow-orange-500/20 transition-all"
            >
              Build Your Guide
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tips & Resources */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Pro Tip
          </h3>
          <p className="text-sm text-muted-foreground">
            Post consistently to build your brand! Aim for 3-5 posts per week across different platforms. 
            Use the Content Calendar to plan your content strategy and schedule posts in advance.
          </p>
        </div>
      </Card>

       {/* Video Tools */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Create a Video</h2>
          <p className="text-sm text-muted-foreground">Choose the right tool for your goal</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Property Tour */}
          <div
            className="rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            onClick={() => setLocation("/property-tours")}
          >
            <div className="h-24 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 relative overflow-hidden">
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <polygon points="60,15 90,38 30,38" fill="white" fillOpacity="0.9"/>
                <rect x="35" y="38" width="50" height="30" fill="white" fillOpacity="0.85"/>
                <rect x="52" y="52" width="16" height="16" rx="2" fill="#3b82f6" fillOpacity="0.7"/>
                <rect x="38" y="43" width="10" height="10" rx="1" fill="#bfdbfe" fillOpacity="0.9"/>
                <rect x="72" y="43" width="10" height="10" rx="1" fill="#bfdbfe" fillOpacity="0.9"/>
                <circle cx="18" cy="16" r="7" fill="#fbbf24" fillOpacity="0.7"/>
                <circle cx="98" cy="18" r="10" fill="white" fillOpacity="0.2"/>
                <rect x="92" y="14" width="12" height="9" rx="1.5" fill="white" fillOpacity="0.8"/>
                <circle cx="98" cy="18.5" r="3" fill="#3b82f6" fillOpacity="0.8"/>
              </svg>
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide bg-white/20 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">Listing</span>
            </div>
            <div className="p-3 bg-background">
              <p className="font-semibold text-sm">Property Tour</p>
              <p className="text-xs text-muted-foreground">Cinematic tour video · 5 credits</p>
            </div>
          </div>

          {/* Live Tour */}
          <div
            className="rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            onClick={() => setLocation("/live-tour")}
          >
            <div className="h-24 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700 relative overflow-hidden">
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <rect x="42" y="10" width="36" height="60" rx="6" fill="white" fillOpacity="0.85"/>
                <rect x="46" y="16" width="28" height="44" rx="2" fill="#7c3aed" fillOpacity="0.3"/>
                <circle cx="60" cy="38" r="8" fill="#ef4444" fillOpacity="0.8"/>
                <circle cx="60" cy="38" r="4" fill="white" fillOpacity="0.9"/>
                <circle cx="60" cy="38" r="13" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" fill="none"/>
                <circle cx="60" cy="38" r="18" stroke="white" strokeOpacity="0.2" strokeWidth="1" fill="none"/>
                <rect x="50" y="60" width="20" height="7" rx="3" fill="#ef4444" fillOpacity="0.8"/>
                <text x="60" y="65.5" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">LIVE</text>
              </svg>
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide bg-green-400/90 text-white px-1.5 py-0.5 rounded">New</span>
            </div>
            <div className="p-3 bg-background">
              <p className="font-semibold text-sm">Live Tour</p>
              <p className="text-xs text-muted-foreground">Record room-by-room · 8 credits</p>
            </div>
          </div>

          {/* AI Reels */}
          <div
            className="rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            onClick={() => setLocation("/autoreels")}
          >
            <div className="h-24 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 relative overflow-hidden">
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <rect x="45" y="8" width="30" height="64" rx="5" fill="white" fillOpacity="0.85"/>
                <rect x="49" y="14" width="22" height="48" rx="2" fill="#f43f5e" fillOpacity="0.25"/>
                <circle cx="60" cy="38" r="12" fill="white" fillOpacity="0.3"/>
                <polygon points="56,32 56,44 68,38" fill="white" fillOpacity="0.9"/>
                <text x="85" y="28" fill="white" fontSize="18" fillOpacity="0.7">♪</text>
                <text x="22" y="50" fill="white" fontSize="14" fillOpacity="0.5">♫</text>
              </svg>
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide bg-white/20 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">Social</span>
            </div>
            <div className="p-3 bg-background">
              <p className="font-semibold text-sm">AI Reels</p>
              <p className="text-xs text-muted-foreground">Short avatar clips · 5 credits</p>
            </div>
          </div>

          {/* Avatar Video */}
          <div
            className="rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            onClick={() => setLocation("/full-avatar-video")}
          >
            <div className="h-24 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 relative overflow-hidden">
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <circle cx="60" cy="26" r="14" fill="white" fillOpacity="0.85"/>
                <ellipse cx="60" cy="62" rx="22" ry="16" fill="white" fillOpacity="0.75"/>
                <circle cx="55" cy="24" r="2" fill="#f97316" fillOpacity="0.8"/>
                <circle cx="65" cy="24" r="2" fill="#f97316" fillOpacity="0.8"/>
                <path d="M54 31 Q60 36 66 31" stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.8" fill="none" strokeLinecap="round"/>
                <rect x="97" y="30" width="8" height="14" rx="4" fill="white" fillOpacity="0.8"/>
                <path d="M93 40 Q93 50 101 50 Q109 50 109 40" stroke="white" strokeWidth="1.5" fill="none" strokeOpacity="0.7"/>
                <text x="10" y="30" fill="white" fontSize="14" fillOpacity="0.6">✦</text>
              </svg>
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide bg-white/20 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">Social</span>
            </div>
            <div className="p-3 bg-background">
              <p className="font-semibold text-sm">Avatar Video</p>
              <p className="text-xs text-muted-foreground">Talking-head from script · 15 credits</p>
            </div>
          </div>

          {/* YouTube Builder */}
          <div
            className="rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            onClick={() => setLocation("/youtube-video-builder")}
          >
            <div className="h-24 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 relative overflow-hidden">
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <rect x="15" y="18" width="90" height="50" rx="10" fill="white" fillOpacity="0.2"/>
                <rect x="25" y="25" width="70" height="36" rx="6" fill="white" fillOpacity="0.85"/>
                <circle cx="60" cy="43" r="14" fill="#ef4444" fillOpacity="0.8"/>
                <polygon points="55,37 55,49 69,43" fill="white"/>
              </svg>
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide bg-white/20 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">YouTube</span>
            </div>
            <div className="p-3 bg-background">
              <p className="font-semibold text-sm">YouTube Builder</p>
              <p className="text-xs text-muted-foreground">Long-form avatar video · 20 credits</p>
            </div>
          </div>

          {/* Blog Builder — New */}
          <div
            className="rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            onClick={() => setLocation("/blog-builder")}
          >
            <div className="h-24 bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600 relative overflow-hidden">
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <rect x="30" y="10" width="50" height="60" rx="4" fill="white" fillOpacity="0.85"/>
                <rect x="38" y="22" width="34" height="3" rx="1.5" fill="#0891b2" fillOpacity="0.6"/>
                <rect x="38" y="30" width="28" height="2.5" rx="1.5" fill="#94a3b8" fillOpacity="0.5"/>
                <rect x="38" y="36" width="32" height="2.5" rx="1.5" fill="#94a3b8" fillOpacity="0.5"/>
                <rect x="38" y="42" width="25" height="2.5" rx="1.5" fill="#94a3b8" fillOpacity="0.5"/>
                <circle cx="88" cy="22" r="10" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.8"/>
                <line x1="95" y1="29" x2="103" y2="37" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8"/>
                <text x="83" y="25" fill="white" fontSize="8" fillOpacity="0.8">SEO</text>
              </svg>
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide bg-green-400/90 text-white px-1.5 py-0.5 rounded">New</span>
            </div>
            <div className="p-3 bg-background">
              <p className="font-semibold text-sm">Blog Builder</p>
              <p className="text-xs text-muted-foreground">SEO blog posts · 3 credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tools */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Content & Outreach</h2>
          <p className="text-sm text-muted-foreground">Build authority with every touchpoint</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Letters & Emails — New */}
          <div
            className="rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            onClick={() => setLocation("/letters-emails")}
          >
            <div className="h-24 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 relative overflow-hidden">
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <rect x="20" y="25" width="70" height="45" rx="4" fill="white" fillOpacity="0.85"/>
                <polyline points="20,25 55,50 90,25" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.5" fill="none"/>
                <polygon points="20,25 55,10 90,25" fill="white" fillOpacity="0.6"/>
                <rect x="33" y="18" width="44" height="30" rx="2" fill="white" fillOpacity="0.9"/>
                <rect x="38" y="23" width="30" height="2.5" rx="1" fill="#3b82f6" fillOpacity="0.5"/>
                <rect x="38" y="28" width="24" height="2" rx="1" fill="#94a3b8" fillOpacity="0.5"/>
                <rect x="38" y="33" width="28" height="2" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
                <text x="88" y="22" fill="#ef4444" fontSize="14" fillOpacity="0.7">♥</text>
              </svg>
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide bg-green-400/90 text-white px-1.5 py-0.5 rounded">New</span>
            </div>
            <div className="p-3 bg-background">
              <p className="font-semibold text-sm">Letters & Emails</p>
              <p className="text-xs text-muted-foreground">60+ templates · personalized</p>
            </div>
          </div>

          {/* Lead Magnet */}
          <div
            className="rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            onClick={() => setLocation("/lead-magnet")}
          >
            <div className="h-24 bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-600 relative overflow-hidden">
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <rect x="35" y="10" width="42" height="55" rx="4" fill="white" fillOpacity="0.85"/>
                <rect x="35" y="10" width="42" height="14" rx="4" fill="#4f46e5" fillOpacity="0.6"/>
                <text x="56" y="21" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">PDF</text>
                <rect x="42" y="30" width="28" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.6"/>
                <rect x="42" y="36" width="22" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.5"/>
                <rect x="42" y="42" width="26" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.5"/>
                <path d="M88 20 Q100 20 100 32 Q100 44 88 44" stroke="white" strokeWidth="4" fill="none" strokeOpacity="0.8" strokeLinecap="round"/>
                <line x1="88" y1="20" x2="88" y2="26" stroke="#ef4444" strokeWidth="4" strokeOpacity="0.8" strokeLinecap="round"/>
                <line x1="88" y1="38" x2="88" y2="44" stroke="#3b82f6" strokeWidth="4" strokeOpacity="0.8" strokeLinecap="round"/>
              </svg>
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide bg-white/20 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">Authority</span>
            </div>
            <div className="p-3 bg-background">
              <p className="font-semibold text-sm">Lead Magnet</p>
              <p className="text-xs text-muted-foreground">Branded PDF for Facebook ads</p>
            </div>
          </div>

          {/* Authority Post Builder */}
          <div
            className="rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            onClick={() => setLocation("/generate")}
          >
            <div className="h-24 bg-gradient-to-br from-violet-500 via-purple-600 to-pink-600 relative overflow-hidden">
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <text x="30" y="50" fill="white" fontSize="36" fillOpacity="0.7">✦</text>
                <text x="70" y="35" fill="white" fontSize="24" fillOpacity="0.5">✦</text>
                <text x="90" y="60" fill="white" fontSize="16" fillOpacity="0.4">✦</text>
                <circle cx="60" cy="40" r="20" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" fill="none"/>
                <circle cx="60" cy="40" r="12" stroke="white" strokeOpacity="0.2" strokeWidth="1" fill="none"/>
              </svg>
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide bg-white/20 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">AI</span>
            </div>
            <div className="p-3 bg-background">
              <p className="font-semibold text-sm">Authority Post Builder</p>
              <p className="text-xs text-muted-foreground">AI posts that convert · 1 credit</p>
            </div>
          </div>
        </div>
      </div>
      {/* Referral Incentive Card */}
      <ReferralCard />
      {/* YouTube Channel Analytics */}
      <YouTubeAnalyticsWidget />
      {/* Video Preview Gallery */}
      <VideoPreviewGallery />
    </div>
  );
}

function YouTubeAnalyticsWidget() {
  const [, setLocation] = useLocation();
  const { data: analytics, isLoading } = trpc.youtube.getChannelAnalytics.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return null;

  if (!analytics) {
    return (
      <Card className="p-6 border-dashed border-2 border-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Youtube className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">YouTube Channel</p>
              <p className="text-xs text-muted-foreground">Connect your channel to see analytics</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setLocation("/integrations")} className="gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Connect
          </Button>
        </div>
      </Card>
    );
  }

  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <Youtube className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="font-semibold">{analytics.channelTitle}</p>
            <p className="text-xs text-muted-foreground">YouTube Channel</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" className="gap-1.5 text-xs"
          onClick={() => window.open(`https://studio.youtube.com`, "_blank")}>
          <ExternalLink className="h-3 w-3" /> Studio
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Eye className="h-3.5 w-3.5" />
            <span className="text-xs">Views</span>
          </div>
          <p className="text-xl font-bold">{fmt(analytics.stats.views)}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs">Subscribers</span>
          </div>
          <p className="text-xl font-bold">{fmt(analytics.stats.subscribers)}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Video className="h-3.5 w-3.5" />
            <span className="text-xs">Videos</span>
          </div>
          <p className="text-xl font-bold">{fmt(analytics.stats.videos)}</p>
        </div>
      </div>

      {analytics.recentVideos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Videos</p>
          <div className="space-y-2">
            {analytics.recentVideos.slice(0, 3).map((v) => (
              <div key={v.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => window.open(`https://www.youtube.com/watch?v=${v.id}`, "_blank")}>
                {v.thumbnail && <img src={v.thumbnail} alt={v.title} className="w-16 h-9 rounded object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(v.publishedAt).toLocaleDateString()}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      <Button size="sm" className="w-full" variant="outline" onClick={() => setLocation("/youtube-video-builder")}>
        <Youtube className="h-3.5 w-3.5 mr-1.5" /> Create YouTube Video
      </Button>
    </Card>
  );
}
