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
  Rocket,
  QrCode,
  MessageSquareQuote,
  GitBranch,
} from "lucide-react";
import { startDashboardTour, shouldShowTour } from "@/lib/productTour";
import UsageCounter from "@/components/UsageCounter";
import VideoPreviewGallery from "@/components/VideoPreviewGallery";
import AuthorityScore from "@/components/AuthorityScore";
import ReferralCard from "@/components/ReferralCard";
import WeeklyInsightBlock from "@/components/WeeklyInsightBlock";
import MarketIntelligenceStrip from "@/components/MarketIntelligenceStrip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, MessageSquare } from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
// bg: #F9FAFB  card: #FFFFFF  border: #E5E7EB
// title: #111111  secondary: #6B7280  accent: #FF6A00
// card radius: rounded-xl (12px)  shadow: shadow-sm
// hover: hover:-translate-y-0.5 hover:shadow-md transition-all duration-200
// section gap: space-y-12 (48px)  card gap: gap-8 (32px)  card padding: p-6/p-7
// ─────────────────────────────────────────────────────────────────────────────

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
  const { data: zapierHooks } = trpc.zapierWebhooks.getAll.useQuery(
    undefined,
    { enabled: !!user, retry: false }
  );
  const openHouseZapierActive = (zapierHooks as Array<{ eventType: string; configured: boolean; isEnabled: boolean }> | undefined)
    ?.some((w) => w.eventType === "open_house_lead" && w.configured && w.isEnabled) ?? false;
  const { data: crmIntegrationsList } = trpc.crmIntegrations.getAll.useQuery(
    undefined,
    { enabled: !!user, retry: false }
  );
  const crmConnected = (crmIntegrationsList as Array<{ hasApiKey: boolean; isEnabled: boolean }> | undefined)
    ?.some((c) => c.hasApiKey && c.isEnabled) ?? false;

  // Auto-start tour for first-time users — only after WelcomeScreen has been dismissed
  useEffect(() => {
    const welcomeSeen = localStorage.getItem('ampedagent_welcome_seen_v1');
    if (shouldShowTour() && welcomeSeen) {
      setTimeout(() => {
        startDashboardTour();
      }, 1500);
    }
  }, []);

  // Get current hour for time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Profile completion score
  const profileFields = [
    { label: "Agent name", done: !!persona?.agentName, href: "/authority-profile" },
    { label: "Primary city & state", done: !!(persona?.primaryCity && persona?.primaryState), href: "/authority-profile" },
    { label: "Target audience", done: !!persona?.targetAudience, href: "/authority-profile" },
    { label: "Brand tagline", done: !!persona?.tagline, href: "/authority-profile" },
    { label: "Market context", done: !!persona?.marketContext, href: "/authority-profile" },
    { label: "Local highlights & amenities", done: (() => { try { return !!(persona?.localHighlights && JSON.parse(persona.localHighlights as string).length > 0); } catch { return false; } })(), href: "/authority-profile" },
    { label: "Target neighborhoods", done: (() => { try { return !!(persona?.targetNeighborhoods && JSON.parse(persona.targetNeighborhoods as string).length > 0); } catch { return false; } })(), href: "/authority-profile" },
    { label: "Headshot uploaded", done: !!persona?.headshotUrl, href: "/authority-profile" },
  ];
  const profileDoneCount = profileFields.filter((f) => f.done).length;
  const profilePct = Math.round((profileDoneCount / profileFields.length) * 100);
  const profileIncomplete = !personaLoading && profilePct < 100;
  const profileNudgeDismissKey = "ampd_profile_nudge_dismissed_v1";
  const [profileNudgeDismissed, setProfileNudgeDismissed] = useState(
    () => localStorage.getItem(profileNudgeDismissKey) === "1"
  );
  const dismissProfileNudge = () => {
    localStorage.setItem(profileNudgeDismissKey, "1");
    setProfileNudgeDismissed(true);
  };

  // Top Actions — hero section (3 cards, equal height, CTA pinned to bottom)
  const topActions = [
    {
      title: "Authority Post Builder",
      description: "Create AI-powered social posts that position you as the go-to local expert. One click, ready to publish.",
      icon: Sparkles,
      href: "/generate",
      cta: "Create a Post",
    },
    {
      title: "Property Tour Video",
      description: "Turn listing photos into a cinematic tour video in under 2 minutes. Stops the scroll every time.",
      icon: Building2,
      href: "/property-tours",
      cta: "Make a Video",
    },
    {
      title: "Open House Manager",
      description: "QR sign-in sheet, instant follow-up emails, and CRM sync — all automated from one link.",
      icon: QrCode,
      href: "/open-house",
      cta: "Set Up Open House",
    },
  ];

  return (
    <div className="space-y-12 pb-16">

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <div>
        {/* Welcome row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111111] leading-tight">
              {greeting}, {persona?.agentName || user?.name || "Agent"}
            </h1>
            <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">
              Here's your command center. Pick up where you left off.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startDashboardTour()}
            className="gap-2 hidden sm:flex border-[#E5E7EB] text-[#6B7280] hover:text-[#111111] hover:border-[#111111] transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Tour
          </Button>
        </div>

        {/* Beta Banner (dismissible) */}
        {!betaBannerDismissed && (
          <div className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 mb-4">
            <span className="text-[9px] font-bold tracking-widest uppercase bg-[#111111] text-white px-2 py-0.5 rounded shrink-0">
              BETA
            </span>
            <p className="text-sm text-[#6B7280] flex-1 leading-relaxed">
              You're in early beta — your feedback shapes the platform.{" "}
              <a href="mailto:ampedagent@gmail.com" className="font-semibold text-[#111111] underline hover:text-[#FF6A00] transition-colors">
                Share your thoughts
              </a>.
            </p>
            <button onClick={dismissBetaBanner} className="text-[#6B7280] hover:text-[#111111] transition-colors shrink-0" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Profile Completion Nudge (dismissible) */}
        {profileIncomplete && !profileNudgeDismissed && (
          <div className="relative flex items-start gap-4 rounded-xl border border-[#E5E7EB] bg-white px-5 py-4 shadow-sm">
            <div className="flex-shrink-0 mt-0.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF3E8]">
                <Zap className="h-4 w-4 text-[#FF6A00]" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111111] leading-snug">
                Profile {profilePct}% complete
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5 mb-2 leading-relaxed">
                A complete profile means better AI output — more relevant posts, better hooks, stronger positioning.
              </p>
              <Progress value={profilePct} className="h-1.5 mb-3 bg-[#F3F4F6] [&>div]:bg-[#FF6A00]" />
              <Button
                size="sm"
                className="bg-[#FF6A00] hover:bg-[#e05e00] text-white border-0 h-8 text-xs font-semibold px-4"
                onClick={() => setLocation("/authority-profile")}
              >
                Complete My Profile
              </Button>
            </div>
            <button onClick={dismissProfileNudge} className="absolute top-3 right-3 p-1 rounded-full text-[#6B7280] hover:text-[#111111] transition-colors" aria-label="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — TOP ACTIONS (hero section)
      ══════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Start Here</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.title}
                className="flex flex-col bg-white rounded-xl border border-[#E5E7EB] shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer p-6"
                onClick={() => setLocation(action.href)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3E8]">
                    <Icon className="h-5 w-5 text-[#FF6A00]" />
                  </div>
                  <h3 className="font-semibold text-[#111111] leading-snug">{action.title}</h3>
                </div>
                <p className="text-sm text-[#6B7280] leading-relaxed flex-1">{action.description}</p>
                <div className="mt-5">
                  <Button
                    size="sm"
                    className="w-full bg-[#FF6A00] hover:bg-[#e05e00] text-white font-semibold border-0 h-9"
                    onClick={(e) => { e.stopPropagation(); setLocation(action.href); }}
                  >
                    {action.cta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — PROGRESS + BLOCKER (2-col)
      ══════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Your Progress</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly Insight / Today's Priority */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <WeeklyInsightBlock />
          </div>

          {/* Authority Profile strip */}
          {!personaLoading && (
            <div
              className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              onClick={() => setLocation("/authority-profile")}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {persona?.headshotUrl ? (
                    <img src={persona.headshotUrl} alt={persona.agentName || "Agent"} className="w-14 h-14 rounded-full object-cover border-2 border-[#E5E7EB]" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#F9FAFB] border-2 border-dashed border-[#E5E7EB] flex items-center justify-center">
                      <UserCircle className="h-7 w-7 text-[#6B7280]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-[#111111]">{persona?.agentName || user?.name || "Complete your Authority Profile"}</span>
                    {persona?.brokerageName && <span className="text-xs text-[#6B7280]">&middot; {persona.brokerageName}</span>}
                    {(() => {
                      const cities = (() => { try { const raw = persona?.serviceCities; if (!raw) return null; const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(parsed) ? parsed : null; } catch { return null; } })();
                      if (cities && cities.length > 0) return cities.slice(0, 2).map((c: any, i: number) => { const label = typeof c === 'string' ? c : (c?.city ? `${c.city}${c.state ? ', ' + c.state : ''}` : ''); return label ? <Badge key={i} variant="outline" className="text-xs border-[#E5E7EB] text-[#6B7280]">{label}</Badge> : null; });
                      return persona?.primaryCity ? <Badge variant="outline" className="text-xs border-[#E5E7EB] text-[#6B7280]">{persona.primaryCity}</Badge> : null;
                    })()}
                  </div>
                  {persona?.tagline ? (
                    <p className="text-xs text-[#6B7280] truncate mt-0.5 italic leading-relaxed">&ldquo;{persona.tagline}&rdquo;</p>
                  ) : (
                    <p className="text-xs text-[#FF6A00] mt-0.5">Add your tagline &rarr;</p>
                  )}
                  {(() => {
                    const fields = [persona?.agentName, persona?.headshotUrl, persona?.tagline, persona?.bio, persona?.brokerageName, persona?.primaryCity];
                    const filled = fields.filter(Boolean).length;
                    const pct = Math.round((filled / fields.length) * 100);
                    return (
                      <div className="flex items-center gap-2 mt-3">
                        <Progress value={pct} className="h-1.5 flex-1 max-w-[140px] bg-[#F3F4F6] [&>div]:bg-[#FF6A00]" />
                        <span className="text-xs text-[#6B7280]">{pct}% complete</span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 text-xs text-[#6B7280] font-medium">
                  <span className="hidden sm:inline">Edit</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              {/* Profile field checklist (collapsed view) */}
              <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {profileFields.slice(0, 6).map((field) => (
                    <div key={field.label} className="flex items-center gap-1.5">
                      {field.done ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-[#E5E7EB] shrink-0" />
                      )}
                      <span className={`text-xs leading-tight ${field.done ? "text-[#6B7280]" : "text-[#111111]"}`}>{field.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — MARKET INTELLIGENCE + USAGE
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <MarketIntelligenceStrip />
        <UsageCounter />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — OPPORTUNITIES (Market Dominance Coach + CONVERT Platform)
      ══════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Opportunities</h2>
        </div>
        <div className="space-y-4">
          {/* Market Dominance Coach */}
          <div
            className="relative rounded-xl overflow-hidden cursor-pointer group"
            onClick={() => setLocation("/coach")}
          >
            <div className="absolute inset-0 bg-[#0F0F0F]" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6A00]/10 rounded-full blur-3xl" />
            <div className="relative px-7 py-6 flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 border border-white/20 shrink-0">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-[#FF6A00] uppercase tracking-wider">Market Dominance Coach</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                    <Zap className="h-2.5 w-2.5" />Authority
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1 leading-snug">This Week's Challenge</h3>
                <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                  Write a post that positions you as the go-to expert in your city. Lead with a bold market stat, share your take, and end with a call to action.
                </p>
              </div>
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

          {/* CONVERT Platform */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-[#0A1628]" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(225deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="absolute top-0 left-0 w-72 h-72 bg-[#FF6A00]/10 rounded-full blur-3xl" />
            <div className="relative px-7 py-6">
              <div className="flex flex-col md:flex-row md:items-start gap-5 mb-5">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#FF6A00]/20 border border-[#FF6A00]/30 shrink-0">
                  <Rocket className="h-6 w-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">CONVERT &mdash; Marketing Platform</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                      <FileCheck className="h-2.5 w-2.5" />4 Tools
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 leading-snug">Your Full Lead-to-Close Pipeline</h3>
                  <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                    Capture every lead at the door, keep them warm with automated follow-ups, manage your pipeline, and turn happy clients into social proof.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Rocket, label: "Listing Launch Kit", sub: "1 address → full marketing package", path: "/listing-launch-kit" },
                  { icon: QrCode, label: "Open House Manager", sub: "QR sign-in + auto follow-up", path: "/open-house" },
                  { icon: Users, label: "CRM Pipeline", sub: "5-stage lead kanban", path: "/crm" },
                  { icon: MessageSquareQuote, label: "Testimonial Engine", sub: "Reviews → social posts", path: "/testimonials" },
                ].map(({ icon: Icon, label, sub, path }) => (
                  <button
                    key={label}
                    onClick={() => setLocation(path)}
                    className="flex flex-col items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#FF6A00]/30 transition-all text-left"
                  >
                    <Icon className="h-5 w-5 text-orange-400" />
                    <div>
                      <div className="text-sm font-semibold text-white leading-snug">{label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{sub}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-orange-400/70" />
                  <span className="text-xs text-slate-400">Also in ENGAGE: <button onClick={() => setLocation('/drip-sequences')} className="text-orange-400 hover:text-orange-300 underline underline-offset-2">Email Drip Sequences</button></span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setLocation("/convert")}
                  className="bg-[#FF6A00] hover:bg-[#e05e00] text-white font-semibold gap-1.5 transition-all"
                >
                  See All CONVERT Tools
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — QUICK WINS (Video & Content Tools)
      ══════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Create a Video</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Property Tour */}
          <ToolCard
            title="Property Tour"
            sub="Cinematic tour video · 5 credits"
            badge="Listing"
            badgeColor="bg-white/20 text-white"
            bgColor="#0f172a"
            onClick={() => setLocation("/property-tours")}
            svg={
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <polygon points="60,15 90,38 30,38" fill="white" fillOpacity="0.9"/>
                <rect x="35" y="38" width="50" height="30" fill="white" fillOpacity="0.85"/>
                <rect x="52" y="52" width="16" height="16" rx="2" fill="#3b82f6" fillOpacity="0.7"/>
                <rect x="38" y="43" width="10" height="10" rx="1" fill="#bfdbfe" fillOpacity="0.9"/>
                <rect x="72" y="43" width="10" height="10" rx="1" fill="#bfdbfe" fillOpacity="0.9"/>
                <circle cx="18" cy="16" r="7" fill="#fbbf24" fillOpacity="0.7"/>
                <rect x="92" y="14" width="12" height="9" rx="1.5" fill="white" fillOpacity="0.8"/>
                <circle cx="98" cy="18.5" r="3" fill="#3b82f6" fillOpacity="0.8"/>
              </svg>
            }
          />
          {/* Live Tour */}
          <ToolCard
            title="Live Tour"
            sub="Record room-by-room · 8 credits"
            badge="New"
            badgeColor="bg-green-400/90 text-white"
            bgColor="#0f172a"
            onClick={() => setLocation("/live-tour")}
            svg={
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <rect x="42" y="10" width="36" height="60" rx="6" fill="white" fillOpacity="0.85"/>
                <rect x="46" y="16" width="28" height="44" rx="2" fill="#7c3aed" fillOpacity="0.3"/>
                <circle cx="60" cy="38" r="8" fill="#ef4444" fillOpacity="0.8"/>
                <circle cx="60" cy="38" r="4" fill="white" fillOpacity="0.9"/>
                <circle cx="60" cy="38" r="13" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" fill="none"/>
                <rect x="50" y="60" width="20" height="7" rx="3" fill="#ef4444" fillOpacity="0.8"/>
                <text x="60" y="65.5" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">LIVE</text>
              </svg>
            }
          />
          {/* AI Reels */}
          <ToolCard
            title="AI Reels"
            sub="Short avatar clips · 5 credits"
            badge="Social"
            badgeColor="bg-white/20 text-white"
            bgColor="#0f172a"
            onClick={() => setLocation("/autoreels")}
            svg={
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <rect x="45" y="8" width="30" height="64" rx="5" fill="white" fillOpacity="0.85"/>
                <rect x="49" y="14" width="22" height="48" rx="2" fill="#f43f5e" fillOpacity="0.25"/>
                <circle cx="60" cy="38" r="12" fill="white" fillOpacity="0.3"/>
                <polygon points="56,32 56,44 68,38" fill="white" fillOpacity="0.9"/>
                <text x="85" y="28" fill="white" fontSize="18" fillOpacity="0.7">♪</text>
                <text x="22" y="50" fill="white" fontSize="14" fillOpacity="0.5">♫</text>
              </svg>
            }
          />
          {/* Avatar Video */}
          <ToolCard
            title="Avatar Video"
            sub="Talking-head from script · 15 credits"
            badge="Social"
            badgeColor="bg-white/20 text-white"
            bgColor="#0f172a"
            onClick={() => setLocation("/full-avatar-video")}
            svg={
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <circle cx="60" cy="26" r="14" fill="white" fillOpacity="0.85"/>
                <ellipse cx="60" cy="62" rx="22" ry="16" fill="white" fillOpacity="0.75"/>
                <circle cx="55" cy="24" r="2" fill="#f97316" fillOpacity="0.8"/>
                <circle cx="65" cy="24" r="2" fill="#f97316" fillOpacity="0.8"/>
                <path d="M54 31 Q60 36 66 31" stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.8" fill="none" strokeLinecap="round"/>
                <rect x="97" y="30" width="8" height="14" rx="4" fill="white" fillOpacity="0.8"/>
                <path d="M93 40 Q93 50 101 50 Q109 50 109 40" stroke="white" strokeWidth="1.5" fill="none" strokeOpacity="0.7"/>
              </svg>
            }
          />
          {/* YouTube Builder */}
          <ToolCard
            title="YouTube Builder"
            sub="Long-form avatar video · 20 credits"
            badge="YouTube"
            badgeColor="bg-white/20 text-white"
            bgColor="#0f172a"
            onClick={() => setLocation("/youtube-video-builder")}
            svg={
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <rect x="15" y="18" width="90" height="50" rx="10" fill="white" fillOpacity="0.2"/>
                <rect x="25" y="25" width="70" height="36" rx="6" fill="white" fillOpacity="0.85"/>
                <circle cx="60" cy="43" r="14" fill="#ef4444" fillOpacity="0.8"/>
                <polygon points="55,37 55,49 69,43" fill="white"/>
              </svg>
            }
          />
          {/* Blog Builder */}
          <ToolCard
            title="Blog Builder"
            sub="SEO blog posts · 3 credits"
            badge="New"
            badgeColor="bg-green-400/90 text-white"
            bgColor="#0f172a"
            onClick={() => setLocation("/blog-builder")}
            svg={
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
            }
          />
        </div>
      </div>

      {/* Content & Outreach Tools */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Content & Outreach</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Letters & Emails */}
          <ToolCard
            title="Letters & Emails"
            sub="60+ templates · personalized"
            badge="New"
            badgeColor="bg-green-400/90 text-white"
            bgColor="#0f172a"
            onClick={() => setLocation("/letters-emails")}
            svg={
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
            }
          />
          {/* Podcast & Book Builder */}
          <ToolCard
            title="Podcast & Book Builder"
            sub="AI-narrated episodes & avatar videos"
            badge="New"
            badgeColor="bg-green-500 text-white"
            bgColor="#0f172a"
            onClick={() => setLocation("/podcast-builder")}
            svg={
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <rect x="50" y="12" width="20" height="32" rx="10" fill="white" fillOpacity="0.85"/>
                <rect x="54" y="16" width="12" height="24" rx="6" fill="#7c3aed" fillOpacity="0.3"/>
                <path d="M40 44 Q60 56 80 44" stroke="white" strokeWidth="2" strokeOpacity="0.7" fill="none"/>
                <line x1="60" y1="56" x2="60" y2="68" stroke="white" strokeWidth="2" strokeOpacity="0.7"/>
                <line x1="48" y1="68" x2="72" y2="68" stroke="white" strokeWidth="2" strokeOpacity="0.7"/>
                <path d="M30 30 Q25 40 30 50" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" fill="none"/>
                <path d="M22 26 Q15 40 22 54" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>
                <path d="M90 30 Q95 40 90 50" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" fill="none"/>
                <path d="M98 26 Q105 40 98 54" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>
              </svg>
            }
          />
          {/* Lead Magnet */}
          <ToolCard
            title="Lead Magnet"
            sub="Branded PDF for Facebook ads"
            badge="Authority"
            badgeColor="bg-white/20 text-white"
            bgColor="#0f172a"
            onClick={() => setLocation("/lead-magnet")}
            svg={
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
            }
          />
          {/* Authority Post Builder */}
          <ToolCard
            title="Authority Post Builder"
            sub="AI posts that convert · 1 credit"
            badge="AI"
            badgeColor="bg-white/20 text-white"
            bgColor="#0f172a"
            onClick={() => setLocation("/generate")}
            svg={
              <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" fill="none">
                <rect x="20" y="15" width="80" height="55" rx="8" fill="white" fillOpacity="0.1"/>
                <rect x="28" y="22" width="64" height="40" rx="4" fill="white" fillOpacity="0.85"/>
                <rect x="34" y="28" width="40" height="3" rx="1.5" fill="#6366f1" fillOpacity="0.6"/>
                <rect x="34" y="35" width="52" height="2.5" rx="1.5" fill="#94a3b8" fillOpacity="0.5"/>
                <rect x="34" y="41" width="44" height="2.5" rx="1.5" fill="#94a3b8" fillOpacity="0.5"/>
                <rect x="34" y="47" width="36" height="2.5" rx="1.5" fill="#94a3b8" fillOpacity="0.4"/>
                <text x="70" y="35" fill="white" fontSize="24" fillOpacity="0.5">✦</text>
                <text x="90" y="60" fill="white" fontSize="16" fillOpacity="0.4">✦</text>
                <circle cx="60" cy="40" r="20" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" fill="none"/>
                <circle cx="60" cy="40" r="12" stroke="white" strokeOpacity="0.2" strokeWidth="1" fill="none"/>
              </svg>
            }
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7 — RECENT ACTIVITY (Referral + YouTube)
      ══════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Recent Activity</h2>
        </div>
        <div className="space-y-4">
          {/* Referral Incentive Card */}
          <ReferralCard />
          {/* YouTube Channel Analytics */}
          <YouTubeAnalyticsWidget />
          {/* Video Preview Gallery */}
          <VideoPreviewGallery />
        </div>
      </div>

    </div>
  );
}

// ─── Reusable ToolCard component ─────────────────────────────────────────────
function ToolCard({
  title,
  sub,
  badge,
  badgeColor,
  bgColor,
  svg,
  onClick,
}: {
  title: string;
  sub: string;
  badge: string;
  badgeColor: string;
  bgColor: string;
  svg: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-[#E5E7EB] overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-white"
      onClick={onClick}
    >
      <div className="h-24 relative overflow-hidden" style={{ backgroundColor: bgColor }}>
        {svg}
        <span className={`absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${badgeColor}`}>{badge}</span>
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-[#111111] leading-snug">{title}</p>
        <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{sub}</p>
      </div>
    </div>
  );
}

// ─── YouTube Analytics Widget ─────────────────────────────────────────────────
function YouTubeAnalyticsWidget() {
  const [, setLocation] = useLocation();
  const { data: analytics, isLoading } = trpc.youtube.getChannelAnalytics.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return null;

  if (!analytics) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Youtube className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#111111]">YouTube Channel</p>
              <p className="text-xs text-[#6B7280] mt-0.5">Connect your channel to see analytics</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setLocation("/integrations")} className="gap-1.5 border-[#E5E7EB] text-[#6B7280] hover:text-[#111111]">
            <Link2 className="h-3.5 w-3.5" />
            Connect
          </Button>
        </div>
      </div>
    );
  }

  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <Youtube className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-[#111111]">{analytics.channelTitle}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">YouTube Channel</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-[#6B7280] hover:text-[#111111]"
          onClick={() => window.open(`https://studio.youtube.com`, "_blank")}>
          <ExternalLink className="h-3 w-3" /> Studio
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Eye, label: "Views", value: fmt(analytics.stats.views) },
          { icon: Users, label: "Subscribers", value: fmt(analytics.stats.subscribers) },
          { icon: Video, label: "Videos", value: fmt(analytics.stats.videos) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="text-center p-3 rounded-lg bg-[#F9FAFB] border border-[#F3F4F6]">
            <div className="flex items-center justify-center gap-1 text-[#6B7280] mb-1">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs">{label}</span>
            </div>
            <p className="text-xl font-bold text-[#111111]">{value}</p>
          </div>
        ))}
      </div>

      {analytics.recentVideos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Recent Videos</p>
          <div className="space-y-2">
            {analytics.recentVideos.slice(0, 3).map((v) => (
              <div key={v.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                onClick={() => window.open(`https://www.youtube.com/watch?v=${v.id}`, "_blank")}>
                {v.thumbnail && <img src={v.thumbnail} alt={v.title} className="w-16 h-9 rounded object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111111] truncate leading-snug">{v.title}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{new Date(v.publishedAt).toLocaleDateString()}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      <Button size="sm" className="w-full bg-[#FF6A00] hover:bg-[#e05e00] text-white font-semibold border-0" onClick={() => setLocation("/youtube-video-builder")}>
        <Youtube className="h-3.5 w-3.5 mr-1.5" /> Create YouTube Video
      </Button>
    </div>
  );
}
