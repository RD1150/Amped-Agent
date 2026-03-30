import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";
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
  Zap
} from "lucide-react";
import { startDashboardTour, shouldShowTour } from "@/lib/productTour";
import UsageCounter from "@/components/UsageCounter";
import VideoPreviewGallery from "@/components/VideoPreviewGallery";
import AuthorityScore from "@/components/AuthorityScore";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: persona, isLoading: personaLoading } = trpc.persona.get.useQuery(
    undefined,
    {
      enabled: !!user,
      retry: false,
    }
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
    }
  ];

  return (
    <div className="space-y-8">
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
              This is your Authority Operating System.
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

      {/* Usage Counter */}
      <UsageCounter />

      {/* Authority Score */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <AuthorityScore />
        </div>
        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative px-8 py-7 flex flex-col md:flex-row md:items-center gap-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[oklch(0.68_0.13_75)]/15 border border-[oklch(0.68_0.13_75)]/30 shrink-0">
            <Award className="h-7 w-7 text-[oklch(0.68_0.13_75)]" />
          </div>
          {/* Text */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">Market Dominance Coach</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[oklch(0.68_0.13_75)]/15 text-[oklch(0.68_0.13_75)] border border-[oklch(0.68_0.13_75)]/30">
                <Zap className="h-2.5 w-2.5" />Premium
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">This Week's Challenge</h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Write a post that positions you as the go-to expert in your city. Lead with a bold market stat, share your take, and end with a call to action. Then run it through the Coach to see your Authority Score.
            </p>
          </div>
          {/* CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-[oklch(0.68_0.13_75)] hover:bg-[oklch(0.72_0.13_75)] text-slate-900 font-semibold gap-1.5 group-hover:shadow-lg transition-all"
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

      {/* Video Preview Gallery */}
      <VideoPreviewGallery />
    </div>
  );
}
