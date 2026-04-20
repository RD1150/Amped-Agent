import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Target,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ListChecks,
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
      <div className="p-5 animate-pulse space-y-4">
        <div className="h-3 w-24 bg-[#F3F4F6] rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-16 bg-[#F3F4F6] rounded" />
              <div className="h-4 w-4/5 bg-[#F3F4F6] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Extract and rank the logic output (INTERNAL LOGIC UNCHANGED) ──────────
  const raw = data as any;

  // Priority Focus → highest-ranked priority action (rank 1)
  const priorityActions: any[] = raw?.priorityActions ?? [];
  const topAction = [...priorityActions].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))[0] ?? {
    action: "Complete your Authority Profile to improve conversions",
    tool: "Authority Profile",
    href: "/authority-profile",
    rank: 1,
  };
  const priorityDest = resolveHref(topAction.href, topAction.tool);

  // Momentum → derive from missedOpportunities[0].action phrased positively,
  // or fall back to leverageInsight if no missed opportunities
  const missedOpps: any[] = raw?.missedOpportunities ?? [];
  const momentumText: string = (() => {
    if (raw?.leverageInsight) return raw.leverageInsight;
    return "You have content assets ready — now is the time to distribute them consistently.";
  })();

  // Key Blocker → criticalIssue (single highest-impact blocker)
  const criticalIssue = raw?.criticalIssue;
  const blockerText: string = criticalIssue?.title
    ? criticalIssue.title
    : "Your profile is incomplete — this limits AI output quality";

  // Opportunity → first missed opportunity (highest-leverage untapped action)
  const opportunityText: string = missedOpps[0]?.action
    ?? "Activate email drip sequences to keep leads warm automatically";
  const opportunityDest = resolveHref(missedOpps[0]?.href, missedOpps[0]?.title);

  // Execution Plan → top 3 priority actions as steps
  const steps = priorityActions
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, 3)
    .map((a) => ({
      text: a.action,
      href: resolveHref(a.href, a.tool),
    }));

  // Pad to 3 steps if fewer returned
  const defaultSteps = [
    { text: "Complete your Authority Profile", href: "/authority-profile" },
    { text: "Create a post using the Post Builder", href: "/generate" },
    { text: "Set up your first Open House", href: "/open-house" },
  ];
  while (steps.length < 3) {
    steps.push(defaultSteps[steps.length]);
  }

  return (
    <div className="p-5 space-y-0">
      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
          Your Coach Says
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh"
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB] transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 gap-1 border-[#E5E7EB] text-[#6B7280] hover:text-[#111111]"
            onClick={() => setLocation("/coach")}
          >
            Full Analysis
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* ── 4 Coached Directives ───────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* 1. Priority Focus */}
        <DirectiveRow
          icon={Target}
          iconColor="text-[#FF6A00]"
          iconBg="bg-[#FFF3E8]"
          label="Priority Focus"
          text={topAction.action}
          cta={priorityDest ? "Do this now" : undefined}
          onCta={priorityDest ? () => setLocation(priorityDest) : undefined}
        />

        {/* Divider */}
        <div className="border-t border-[#F3F4F6]" />

        {/* 2. Momentum */}
        <DirectiveRow
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          label="Momentum"
          text={momentumText}
        />

        {/* Divider */}
        <div className="border-t border-[#F3F4F6]" />

        {/* 3. Key Blocker */}
        <DirectiveRow
          icon={AlertCircle}
          iconColor="text-rose-500"
          iconBg="bg-rose-50"
          label="Key Blocker"
          text={blockerText}
        />

        {/* Divider */}
        <div className="border-t border-[#F3F4F6]" />

        {/* 4. Opportunity */}
        <DirectiveRow
          icon={Lightbulb}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          label="Opportunity"
          text={opportunityText}
          cta={opportunityDest ? "Activate now" : undefined}
          onCta={opportunityDest ? () => setLocation(opportunityDest) : undefined}
        />

        {/* Divider */}
        <div className="border-t border-[#F3F4F6]" />

        {/* 5. Execution Plan */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 bg-[#F9FAFB] border border-[#E5E7EB]">
            <ListChecks className="h-4 w-4 text-[#6B7280]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-[#6B7280]">
              This Week's Plan
            </p>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <StepRow
                  key={i}
                  number={i + 1}
                  text={step.text}
                  href={step.href}
                  onNavigate={setLocation}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
