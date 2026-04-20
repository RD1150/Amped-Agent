import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  AlertCircle,
  CheckCircle2,
  Zap,
  RefreshCw,
  ChevronRight,
  Lightbulb,
  Target,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Route map: tool name → app path ──────────────────────────────────────────
const TOOL_ROUTES: Record<string, string> = {
  "Authority Post Builder": "/generate",
  "Post Builder": "/generate",
  "Content Generator": "/generate",
  "Blog Builder": "/blog-builder",
  "Blog Post": "/blog-builder",
  "Lead Magnet": "/lead-magnet",
  "Lead Magnet Generator": "/lead-magnet",
  "Property Tour": "/property-tours",
  "Property Tours": "/property-tours",
  "Video": "/property-tours",
  "Avatar Video": "/full-avatar-video",
  "AI Avatar": "/full-avatar-video",
  "YouTube Builder": "/youtube-builder",
  "Listing Presentation": "/listing-presentation",
  "Buyer Presentation": "/buyer-presentation",
  "Authority Profile": "/authority-profile",
  "Persona": "/authority-profile",
  "Profile": "/authority-profile",
  "Podcast": "/podcast-builder",
  "Podcast Builder": "/podcast-builder",
  "Newsletter": "/newsletter",
  "Market Stats": "/market-stats",
  "Market Report": "/market-stats",
  "Listing Launch Kit": "/listing-launch-kit",
  "Testimonial": "/testimonial-engine",
  "Testimonials": "/testimonial-engine",
  "Open House": "/open-house-manager",
  "CRM": "/crm-pipeline",
  "Pipeline": "/crm-pipeline",
  "Drip": "/drip-sequences",
  "Email Drip": "/drip-sequences",
  "Content Calendar": "/calendar",
  "Calendar": "/calendar",
  "Social Posting": "/social-posting",
  "Prospecting Letters": "/prospecting-letters",
  "Coach": "/coach",
};

function resolveHref(href?: string, tool?: string): string | undefined {
  if (href && href.startsWith("/")) return href;
  if (tool) {
    for (const [key, path] of Object.entries(TOOL_ROUTES)) {
      if (tool.toLowerCase().includes(key.toLowerCase())) return path;
    }
  }
  return undefined;
}

export default function WeeklyInsightBlock() {
  const [, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch } = trpc.coach.weeklyDiagnosis.useQuery(
    undefined,
    {
      staleTime: 30 * 60 * 1000, // 30 min cache
      retry: false,
    }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Diagnosis refreshed");
    } catch {
      toast.error("Could not refresh — try again shortly");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="bg-[#0f172a] px-6 py-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
            <div className="h-5 w-64 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="p-6 grid md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Normalise server response into display shape
  const raw = data as any;
  const criticalIssue = raw?.criticalIssue ?? null;
  const missedOpportunities: any[] = raw?.missedOpportunities ?? [];
  const priorityActions: any[] = raw?.priorityActions ?? [];
  const leverageInsight: string | undefined = raw?.leverageInsight;
  const weeklyFocus: string | undefined = raw?.weeklyFocus;

  // Fallback when no data yet
  const fallbackCritical = {
    title: "No content published this week",
    whatIsHappening: "You haven't posted anything in the last 7 days.",
    consequence: "Agents who go dark for a week lose top-of-mind status with their audience.",
    action: "Post at least 3 times this week to stay visible.",
    href: "/generate",
  };
  const fallbackOpps = [
    {
      title: "Blog posts drive 3× more inbound leads",
      insight: "You haven't published a blog post yet.",
      action: "One post can rank for months and generate leads while you sleep.",
      href: "/blog-builder",
    },
    {
      title: "Video builds trust faster than text",
      insight: "No videos created yet.",
      action: "Create one avatar video this week to introduce yourself to new prospects.",
      href: "/full-avatar-video",
    },
  ];
  const fallbackActions = [
    { rank: 1, action: "Complete your Authority Profile", tool: "Authority Profile", href: "/authority-profile" },
    { rank: 2, action: "Generate your first AI post", tool: "Post Builder", href: "/generate" },
    { rank: 3, action: "Set up your AI Avatar", tool: "Avatar Video", href: "/full-avatar-video" },
  ];

  const displayCritical = criticalIssue ?? fallbackCritical;
  const displayOpps = missedOpportunities.length ? missedOpportunities : fallbackOpps;
  const displayActions = priorityActions.length ? priorityActions : fallbackActions;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Navy header */}
      <div className="bg-[#0f172a] px-6 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Weekly Diagnosis · Based on your activity
          </p>
          {weeklyFocus ? (
            <h2 className="text-lg font-bold text-white leading-snug">{weeklyFocus}</h2>
          ) : (
            <h2 className="text-lg font-bold text-white leading-snug">
              Here's what to focus on this week
            </h2>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors shrink-0 mt-1 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Three-column diagnosis grid */}
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
        {/* Critical Issue */}
        <div className="p-7 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100">
              <AlertCircle className="h-3 w-3 text-red-600" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">
              Critical Issue
            </span>
          </div>
          <p className="text-base font-semibold text-slate-800 leading-snug">
            {displayCritical.title}
          </p>
          {displayCritical.whatIsHappening && (
            <p className="text-sm text-slate-500 leading-relaxed">
              {displayCritical.whatIsHappening}
            </p>
          )}
          {displayCritical.consequence && (
            <p className="text-sm text-red-500 font-medium leading-relaxed">
              {displayCritical.consequence}
            </p>
          )}
          {displayCritical.action && (
            <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-red-300 pl-3 mt-2">
              {displayCritical.action}
            </p>
          )}
          {resolveHref(displayCritical.href, displayCritical.tool) && (
            <button
              onClick={() => setLocation(resolveHref(displayCritical.href, displayCritical.tool)!)}
              className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              Fix it now <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Missed Opportunities */}
        <div className="p-7 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100">
              <Lightbulb className="h-3 w-3 text-amber-600" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
              Missed Opportunities
            </span>
          </div>
          <div className="space-y-4">
            {displayOpps.map((opp: any, i: number) => (
              <div key={i} className="space-y-1">
                <p className="text-base font-semibold text-slate-800 leading-snug">{opp.title}</p>
                {opp.insight && (
                  <p className="text-sm text-slate-500 leading-relaxed mt-1">{opp.insight}</p>
                )}
                {opp.action && (
                  <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-amber-300 pl-3 mt-2">
                    {opp.action}
                  </p>
                )}
                {resolveHref(opp.href, opp.tool) && (
                  <button
                    onClick={() => setLocation(resolveHref(opp.href, opp.tool)!)}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Take action <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Priority Actions */}
        <div className="p-7 space-y-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">
              Priority Actions
            </span>
          </div>
          <div className="space-y-3">
            {displayActions.map((act: any, i: number) => {
              const dest = resolveHref(act.href, act.tool);
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0f172a] text-white text-[10px] font-bold shrink-0 mt-0.5">
                    {act.rank ?? i + 1}
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-base font-semibold text-slate-800 leading-snug">{act.action}</p>
                    {act.tool && (
                      <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">{act.tool}</p>
                    )}
                    {dest ? (
                      <button
                        onClick={() => setLocation(dest)}
                        className="flex items-center gap-1 text-xs font-semibold text-[#0f172a] hover:text-slate-600 transition-colors"
                      >
                        Do this now <ArrowRight className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leverage Insight bar */}
      {leverageInsight && (
        <div className="border-t border-amber-100 bg-amber-50 px-6 py-3 flex items-start gap-2">
          <Target className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Leverage Insight: </span>
            {leverageInsight}
          </p>
        </div>
      )}

      {/* Footer CTA */}
      <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>Powered by your activity data — updates as you use the platform</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 gap-1.5"
          onClick={() => setLocation("/coach")}
        >
          Open Full Coach
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
