/**
 * Playbook — The Amped Agent 30-Day Authority Blueprint
 *
 * Gives agents a clear, structured plan for their first 30 days.
 * Includes:
 * - Business lifecycle flowchart (Attract → Engage → Convert → Scale → Dominate)
 * - Week-by-week 30-day action plan
 * - Quick-reference checklists for each phase
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone,
  MessageSquare,
  Handshake,
  TrendingUp,
  Crown,
  ChevronRight,
  CheckSquare,
  Square,
  Sparkles,
  Video,
  Users,
  Mail,
  BarChart3,
  Star,
  Zap,
  BookOpen,
  ArrowRight,
  Calendar,
  Target,
} from "lucide-react";

// ─── Lifecycle Phases ────────────────────────────────────────────────────────

const LIFECYCLE = [
  {
    id: "attract",
    label: "ATTRACT",
    icon: Megaphone,
    color: "bg-blue-600",
    lightColor: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
    description: "Get discovered by buyers and sellers in your market",
    tools: ["Authority Posts", "Property Tour Videos", "AI Reels", "Blog Builder", "YouTube Builder"],
    outcome: "More people know your name",
  },
  {
    id: "engage",
    label: "ENGAGE",
    icon: MessageSquare,
    color: "bg-purple-600",
    lightColor: "bg-purple-50 border-purple-200",
    textColor: "text-purple-700",
    description: "Build trust and stay top-of-mind with your audience",
    tools: ["Email Drip Sequences", "Newsletter", "Avatar Videos", "Market Updates", "Social Scheduling"],
    outcome: "Your audience trusts and follows you",
  },
  {
    id: "convert",
    label: "CONVERT",
    icon: Handshake,
    color: "bg-orange-600",
    lightColor: "bg-orange-50 border-orange-200",
    textColor: "text-orange-700",
    description: "Turn warm leads into signed clients",
    tools: ["Listing Presentation", "Buyer's Guide", "CRM Pipeline", "Lead Magnet", "Letters & Emails"],
    outcome: "More signed listings and buyer agreements",
  },
  {
    id: "scale",
    label: "SCALE",
    icon: TrendingUp,
    color: "bg-green-600",
    lightColor: "bg-green-50 border-green-200",
    textColor: "text-green-700",
    description: "Systematize your marketing so it runs without you",
    tools: ["Zapier Automations", "Drip Sequences", "CRM Automation", "Content Calendar", "Referral System"],
    outcome: "Your marketing runs on autopilot",
  },
  {
    id: "dominate",
    label: "DOMINATE",
    icon: Crown,
    color: "bg-slate-800",
    lightColor: "bg-slate-50 border-slate-300",
    textColor: "text-slate-800",
    description: "Become the undisputed authority in your market",
    tools: ["Market Dominance Coach", "Authority Score", "Brand Story", "Google Business Profile", "Testimonials"],
    outcome: "You own your market",
  },
];

// ─── 30-Day Blueprint ─────────────────────────────────────────────────────────

const WEEKS = [
  {
    week: 1,
    theme: "Foundation Week",
    subtitle: "Set up everything once. Then the machine runs.",
    color: "border-blue-400 bg-blue-50",
    badgeColor: "bg-blue-600",
    days: [
      { day: "Day 1–2", task: "Complete your Authority Profile (name, photo, market, brand voice)", tool: "Authority Profile", href: "/persona" },
      { day: "Day 2", task: "Generate your first 3 Authority Posts and save them as drafts", tool: "Post Builder", href: "/generate" },
      { day: "Day 3", task: "Create a Property Tour video for your best active listing", tool: "Property Tours", href: "/property-tours" },
      { day: "Day 4", task: "Set up your AI Avatar and record your first avatar video", tool: "Avatar Video", href: "/full-avatar-video" },
      { day: "Day 5", task: "Connect LinkedIn, Facebook, and Instagram", tool: "Integrations", href: "/integrations" },
      { day: "Day 7", task: "Schedule your first week of posts using the Content Calendar", tool: "Content Calendar", href: "/generate" },
    ],
  },
  {
    week: 2,
    theme: "Content Machine Week",
    subtitle: "Establish your posting rhythm and start building authority.",
    color: "border-purple-400 bg-purple-50",
    badgeColor: "bg-purple-600",
    days: [
      { day: "Day 8", task: "Write and publish your first SEO blog post about your market", tool: "Blog Builder", href: "/blog-builder" },
      { day: "Day 9", task: "Create 3 AI Reels (market tip, buyer tip, neighborhood highlight)", tool: "AI Reels", href: "/autoreels" },
      { day: "Day 10", task: "Set up your first email drip sequence for new leads", tool: "Drip Sequences", href: "/drip-sequences" },
      { day: "Day 11", task: "Add your first 10 contacts to the CRM pipeline", tool: "CRM Pipeline", href: "/crm" },
      { day: "Day 12", task: "Create a Lead Magnet (e.g., \"5 Things to Know Before Buying in [City]\")", tool: "Lead Magnet", href: "/lead-magnet" },
      { day: "Day 14", task: "Review your Authority Score and identify your top gap", tool: "Market Dominance", href: "/market-dominance" },
    ],
  },
  {
    week: 3,
    theme: "Conversion Week",
    subtitle: "Turn your growing audience into actual clients.",
    color: "border-orange-400 bg-orange-50",
    badgeColor: "bg-orange-600",
    days: [
      { day: "Day 15", task: "Build your Listing Presentation and Buyer's Guide", tool: "Listing Presentation", href: "/listing-presentation" },
      { day: "Day 16", task: "Send personalized follow-up letters to your top 10 prospects", tool: "Letters & Emails", href: "/letters-emails" },
      { day: "Day 17", task: "Create a YouTube video (market update or neighborhood tour)", tool: "YouTube Builder", href: "/youtube-video-builder" },
      { day: "Day 18", task: "Collect and publish 3 client testimonials", tool: "Testimonials", href: "/testimonials" },
      { day: "Day 19", task: "Set up Google Business Profile optimization", tool: "GBP", href: "/gbp" },
      { day: "Day 21", task: "Run your first Market Dominance Coach session", tool: "Market Dominance Coach", href: "/market-dominance" },
    ],
  },
  {
    week: 4,
    theme: "Automation Week",
    subtitle: "Make your marketing run without you showing up every day.",
    color: "border-green-400 bg-green-50",
    badgeColor: "bg-green-600",
    days: [
      { day: "Day 22", task: "Set up Zapier to auto-add new leads from your website to the CRM", tool: "Zapier", href: "/integrations" },
      { day: "Day 23", task: "Create your Brand Story video (your \"why\" as an agent)", tool: "Brand Story", href: "/brand-story" },
      { day: "Day 24", task: "Build a 30-day content calendar for next month", tool: "Content Calendar", href: "/generate" },
      { day: "Day 25", task: "Set up weekly email digest to monitor your authority score", tool: "Settings", href: "/settings" },
      { day: "Day 26", task: "Create an Open House follow-up sequence", tool: "Open House", href: "/open-house" },
      { day: "Day 30", task: "Review your month: Authority Score, leads generated, videos created", tool: "Dashboard", href: "/dashboard" },
    ],
  },
];

// ─── Quick Checklists ─────────────────────────────────────────────────────────

const CHECKLISTS = [
  {
    title: "Before Every Listing Appointment",
    icon: Target,
    items: [
      "Generate a Listing Presentation with your branding",
      "Create a Property Tour video from the listing photos",
      "Print or send a branded Seller's Manual",
      "Prepare a CMA using the market data tools",
      "Set up a post-appointment drip sequence",
    ],
  },
  {
    title: "Weekly Content Routine (30 min/week)",
    icon: Calendar,
    items: [
      "Generate 3 Authority Posts (Mon, Wed, Fri)",
      "Create 1 short video (AI Reel or Avatar Video)",
      "Check your Authority Score for the week",
      "Review CRM pipeline for follow-up actions",
      "Respond to any comments or messages",
    ],
  },
  {
    title: "Monthly Authority Audit",
    icon: BarChart3,
    items: [
      "Review Authority Score vs. last month",
      "Check YouTube channel analytics",
      "Update your Google Business Profile",
      "Add new testimonials to your profile",
      "Run Market Dominance Coach session",
      "Plan next month's content calendar",
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Playbook() {
  const [, setLocation] = useLocation();
  const [activeWeek, setActiveWeek] = useState(1);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activeWeekData = WEEKS.find(w => w.week === activeWeek) ?? WEEKS[0];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16">

      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="h-3.5 w-3.5" />
          Agent Playbook
        </div>
        <h1 className="text-3xl font-bold tracking-tight">The 30-Day Authority Blueprint</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          A step-by-step plan to go from "just signed up" to "the agent everyone in my market knows" — in 30 days.
        </p>
        <Button onClick={() => setLocation("/launch-pad")} variant="outline" className="gap-2 mt-2">
          <Zap className="h-4 w-4" />
          Back to Launch Pad
        </Button>
      </div>

      {/* ── Business Lifecycle Flowchart ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">How the Platform Works</h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Flowchart */}
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          {LIFECYCLE.map((phase, idx) => {
            const Icon = phase.icon;
            return (
              <div key={phase.id} className="flex flex-col md:flex-row items-center flex-1">
                {/* Phase Card */}
                <div className={`flex-1 rounded-xl border-2 p-4 space-y-3 ${phase.lightColor} w-full`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${phase.color} text-white shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest ${phase.textColor}`}>
                      {phase.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">{phase.description}</p>
                  <div className="space-y-1">
                    {phase.tools.slice(0, 3).map(tool => (
                      <div key={tool} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <div className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                        {tool}
                      </div>
                    ))}
                    {phase.tools.length > 3 && (
                      <div className="text-[11px] text-slate-400">+{phase.tools.length - 3} more</div>
                    )}
                  </div>
                  <div className={`text-[11px] font-semibold ${phase.textColor} pt-1`}>
                    → {phase.outcome}
                  </div>
                </div>

                {/* Arrow between phases */}
                {idx < LIFECYCLE.length - 1 && (
                  <div className="flex items-center justify-center md:px-1 py-1 md:py-0 shrink-0">
                    <ArrowRight className="h-4 w-4 text-slate-300 rotate-90 md:rotate-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 30-Day Blueprint ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">30-Day Action Plan</h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Week Selector */}
        <div className="grid grid-cols-4 gap-2">
          {WEEKS.map(week => (
            <button
              key={week.week}
              onClick={() => setActiveWeek(week.week)}
              className={`
                p-3 rounded-xl border-2 text-center transition-all
                ${activeWeek === week.week ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}
              `}
            >
              <div className={`text-xs font-black uppercase tracking-wide mb-0.5 ${activeWeek === week.week ? "text-primary" : "text-slate-500"}`}>
                Week {week.week}
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">{week.theme.replace(" Week", "")}</div>
            </button>
          ))}
        </div>

        {/* Active Week Detail */}
        <div className={`rounded-2xl border-2 p-6 space-y-4 ${activeWeekData.color}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${activeWeekData.badgeColor} text-white text-[10px] font-bold uppercase tracking-wide`}>
                Week {activeWeekData.week}
              </Badge>
              <h3 className="font-bold text-lg">{activeWeekData.theme}</h3>
            </div>
            <p className="text-sm text-slate-600">{activeWeekData.subtitle}</p>
          </div>

          <div className="space-y-2">
            {activeWeekData.days.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-white/70 rounded-xl border border-white/80 hover:bg-white/90 transition-colors cursor-pointer group"
                onClick={() => setLocation(item.href)}
              >
                <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-500">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-snug">{item.task}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.day} · {item.tool}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Checklists ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Quick-Reference Checklists</h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {CHECKLISTS.map((checklist, cIdx) => {
            const Icon = checklist.icon;
            return (
              <div key={cIdx} className="rounded-xl border p-5 space-y-4 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <h3 className="font-semibold text-sm leading-tight">{checklist.title}</h3>
                </div>
                <div className="space-y-2">
                  {checklist.items.map((item, iIdx) => {
                    const key = `${cIdx}-${iIdx}`;
                    const checked = checkedItems.has(key);
                    return (
                      <button
                        key={iIdx}
                        onClick={() => toggleCheck(key)}
                        className="flex items-start gap-2.5 w-full text-left group"
                      >
                        {checked
                          ? <CheckSquare className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          : <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-400 shrink-0 mt-0.5 transition-colors" />
                        }
                        <span className={`text-xs leading-snug transition-colors ${checked ? "line-through text-muted-foreground" : "text-slate-700"}`}>
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Checkboxes are for your reference during this session — they reset on refresh.
        </p>
      </section>

      {/* ── Pro Tips ── */}
      <section className="rounded-2xl bg-[#0f172a] p-8 space-y-5">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg font-bold text-white">The 3 Rules of Market Dominance</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { number: "01", rule: "Consistency beats perfection", detail: "3 posts a week for 6 months beats 10 posts one week and nothing the next. Set a schedule and protect it." },
            { number: "02", rule: "Video builds trust faster than text", detail: "Agents who post video content get recognized at open houses, at coffee shops, at the grocery store. Be on camera." },
            { number: "03", rule: "Local specificity wins", detail: "\"5 things buyers need to know about Thousand Oaks\" outperforms \"tips for home buyers\" every single time. Go hyperlocal." },
          ].map(tip => (
            <div key={tip.number} className="space-y-2">
              <div className="text-3xl font-black text-white/10">{tip.number}</div>
              <h3 className="font-bold text-white text-sm">{tip.rule}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{tip.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 pt-4 border-t text-center">
        <h3 className="font-bold text-lg">Ready to start your 30-day run?</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Go back to the Launch Pad and complete your first 5 setup steps. The whole system activates once you do.
        </p>
        <Button size="lg" className="gap-2 px-8" onClick={() => setLocation("/launch-pad")}>
          <Zap className="h-4 w-4" />
          Go to Launch Pad
        </Button>
      </div>
    </div>
  );
}
