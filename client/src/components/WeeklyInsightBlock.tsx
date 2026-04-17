import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Zap,
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
  "Agent Profile Editor": "/authority-profile",
  "Blog Creator": "/blog-builder",
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

// ── Coached directive row ─────────────────────────────────────────────────────
function DirectiveRow({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  text,
  cta,
  onCta,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  text: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${iconColor}`}>{label}</p>
        <p className="text-sm font-medium text-[#111111] leading-snug">{text}</p>
        {cta && onCta && (
          <button
            onClick={onCta}
            className={`mt-1.5 flex items-center gap-1 text-xs font-semibold transition-colors ${iconColor} opacity-80 hover:opacity-100`}
          >
            {cta} <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Execution step row ────────────────────────────────────────────────────────
function StepRow({
  number,
  text,
  href,
  onNavigate,
}: {
  number: number;
  text: string;
  href?: string;
  onNavigate?: (path: string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FF6A00] flex items-center justify-center mt-0.5">
        <span className="text-[10px] font-bold text-white leading-none">{number}</span>
      </div>
      <p className="text-sm text-[#374151] leading-snug flex-1">
        {text}
        {href && onNavigate && (
          <button
            onClick={() => onNavigate(href)}
            className="ml-1.5 text-[#FF6A00] font-semibold hover:underline"
          >
            Do it now →
          </button>
        )}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WeeklyInsightBlock() {
  const [, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Data fetch (UNCHANGED — same query, same cache) ───────────────────────
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

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
        <div className="h-3 w-28 bg-slate-100 rounded mb-3" />
        <div className="h-5 w-2/3 bg-slate-100 rounded mb-2" />
        <div className="h-4 w-1/2 bg-slate-100 rounded" />
      </div>
    );
  }

  const raw = data as any;
  const priorityActions: any[] = raw?.priorityActions ?? [];
  const weeklyFocus: string | undefined = raw?.weeklyFocus;

  // Pick just the top action
  const topAction = priorityActions[0] ?? {
    action: "Complete your Authority Profile",
    tool: "Authority Profile",
    href: "/authority-profile",
  };
  const dest = resolveHref(topAction.href, topAction.tool);

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-0.5">
            Today's Top Priority
          </p>
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            {weeklyFocus || topAction.action}
          </p>
          {topAction.tool && weeklyFocus && (
            <p className="text-xs text-slate-500 mt-0.5">{topAction.action}</p>
          )}
          {dest && (
            <button
              onClick={() => setLocation(dest)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Do this now <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 gap-1 bg-white"
          onClick={() => setLocation("/coach")}
        >
          Full Analysis
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
