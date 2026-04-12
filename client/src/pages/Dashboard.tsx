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
} from "lucide-react";
import { startDashboardTour, shouldShowTour } from "@/lib/productTour";
import UsageCounter from "@/components/UsageCounter";
import VideoPreviewGallery from "@/components/VideoPreviewGallery";
import AuthorityScore from "@/components/AuthorityScore";
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
            You're using an early beta of Amp'd Agent. Your feedback shapes the platform —{" "}
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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {greeting}, {persona?.agentName || user?.name || "Agent"}! 👋
            </h1>
            <p className="text-muted-foreground">
              Ready to dominate your local market?
            </p>
            <p className="text-sm text-primary/80 font-medium mt-1">
              This is your AmpedAgent command center.
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
                <Zap className="h-2.5 w-2.5" />Agency
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
          <Card
            className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group"
            onClick={() => setLocation("/property-tours")}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Listing</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Property Tour</p>
                <p className="text-xs text-muted-foreground">Cinematic tour video · 5 credits</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group"
            onClick={() => setLocation("/live-tour")}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Smartphone className="h-5 w-5 text-red-500" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-green-700 bg-green-50 px-1.5 py-0.5 rounded">New</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Live Tour</p>
                <p className="text-xs text-muted-foreground">Record room-by-room · 8 credits</p>
              </div>
            </div>
          </Card>
          <Card
            className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group"
            onClick={() => setLocation("/autoreels")}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Video className="h-5 w-5 text-pink-600" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Social</span>
              </div>
              <div>
                <p className="font-semibold text-sm">AI Reels</p>
                <p className="text-xs text-muted-foreground">Short avatar clips · 5 credits</p>
              </div>
            </div>
          </Card>
          <Card
            className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group"
            onClick={() => setLocation("/full-avatar-video")}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <UserCircle className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Social</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Avatar Video</p>
                <p className="text-xs text-muted-foreground">Talking-head from script · 15 credits</p>
              </div>
            </div>
          </Card>
          <Card
            className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group"
            onClick={() => setLocation("/youtube-video-builder")}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Youtube className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Social</span>
              </div>
              <div>
                <p className="font-semibold text-sm">YouTube Builder</p>
                <p className="text-xs text-muted-foreground">Long-form avatar video · 20 credits</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
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
