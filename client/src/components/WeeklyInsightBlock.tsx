import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { AlertCircle, TrendingUp, CheckCircle2, Zap, RefreshCw, ChevronRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiagnosisItem {
  label: string;
  action: string;
  href?: string;
}

interface Diagnosis {
  criticalIssue: DiagnosisItem;
  missedOpportunities: DiagnosisItem[];
  priorityActions: DiagnosisItem[];
  headline: string;
}

export default function WeeklyInsightBlock() {
  const [, setLocation] = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, refetch } = trpc.coach.weeklyDiagnosis.useQuery(
    undefined,
    {
      staleTime: 30 * 60 * 1000, // 30 min cache
      retry: false,
    }
  );

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Header skeleton */}
        <div className="bg-[#0f172a] px-6 py-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
            <div className="h-5 w-64 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
        </div>
        {/* Body skeleton */}
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

  // Fallback if no data
  const diagnosis: Diagnosis = data?.diagnosis ?? {
    headline: "Here's what to focus on this week",
    criticalIssue: {
      label: "No content published this week",
      action: "Post at least 3 times this week to stay top-of-mind with your audience.",
      href: "/generate",
    },
    missedOpportunities: [
      {
        label: "Blog posts drive 3× more inbound leads",
        action: "You haven't published a blog post yet. One post can rank for months.",
        href: "/blog-builder",
      },
      {
        label: "Video builds trust faster than text",
        action: "Create one avatar video this week to introduce yourself to new prospects.",
        href: "/full-avatar-video",
      },
    ],
    priorityActions: [
      {
        label: "Complete your Authority Profile",
        action: "Agents with complete profiles convert 40% more leads.",
        href: "/authority-profile",
      },
      {
        label: "Generate your first AI post",
        action: "Use the Authority Post Builder to create a market insight post in 60 seconds.",
        href: "/generate",
      },
      {
        label: "Set up your AI Avatar",
        action: "Your avatar can create videos while you focus on clients.",
        href: "/full-avatar-video",
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Navy header */}
      <div className="bg-[#0f172a] px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Weekly Diagnosis · Based on your activity
          </p>
          <h2 className="text-lg font-bold text-white leading-snug">
            {diagnosis.headline}
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors shrink-0 mt-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Three-column diagnosis grid */}
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Critical Issue */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100">
              <AlertCircle className="h-3 w-3 text-red-600" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">
              Critical Issue
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            {diagnosis.criticalIssue.label}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            {diagnosis.criticalIssue.action}
          </p>
          {diagnosis.criticalIssue.href && (
            <button
              onClick={() => setLocation(diagnosis.criticalIssue.href!)}
              className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              Fix it now <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Missed Opportunities */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100">
              <Lightbulb className="h-3 w-3 text-amber-600" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
              Missed Opportunities
            </span>
          </div>
          <div className="space-y-3">
            {diagnosis.missedOpportunities.map((opp, i) => (
              <div key={i} className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{opp.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{opp.action}</p>
                {opp.href && (
                  <button
                    onClick={() => setLocation(opp.href!)}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Take action <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Priority Actions */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">
              Priority Actions
            </span>
          </div>
          <div className="space-y-3">
            {diagnosis.priorityActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0f172a] text-white text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-800 leading-snug">{action.label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{action.action}</p>
                  {action.href && (
                    <button
                      onClick={() => setLocation(action.href!)}
                      className="flex items-center gap-1 text-xs font-semibold text-[#0f172a] hover:text-slate-600 transition-colors"
                    >
                      Do this now <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
