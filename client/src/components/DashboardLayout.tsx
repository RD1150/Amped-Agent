// nav-version: 2026-04-22-persona-brand
import { useAuth } from "@/_core/hooks/useAuth";
import { WelcomeModal } from "@/components/WelcomeModal";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Calendar,
  Upload,
  Link2,
  Mail,
  Settings,
  LogOut,
  PanelLeft,
  User,
  FileSpreadsheet,
  Sparkles,
  FileText,
  Zap,
  BarChart3,
  TrendingUp,
  Newspaper,
  Lightbulb,
  Home,
  Video,
  Youtube,
  Award,
  Building2,
  CreditCard,
  Shuffle,
  Film,
  BookOpen,
  Heart,
  Users,
  UserCircle,
  FileVideo2,
  Sun,
  Moon,
  Megaphone,
  Target,
  ListVideo,
  Share2,
  BarChart2,
  Smartphone,
  Images,
  Presentation,
  Clapperboard,
  Star,
  PlayCircle,
  FolderOpen,
  UserCheck,
  Gift,
  LayoutGrid,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Clock,
  X,
  AlertTriangle,
  Ticket,
  Mic,
  Rocket,
  MessageSquareQuote,
  MessageSquare,
  QrCode,
  GitBranch,
  Type,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { HeaderSearch } from "@/components/HeaderSearch";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Post-Trial Conversion Modal — shown once per session when a user's trial has expired
function PostTrialModal({
  user,
  setLocation,
}: {
  user: { subscriptionStatus?: string | null; trialEndsAt?: Date | string | null } | null;
  setLocation: (path: string) => void;
}) {
  const [open, setOpen] = useState(() => {
    if (!user) return false;
    if (user.subscriptionStatus !== "inactive") return false;
    if (!user.trialEndsAt) return false;
    const trialEnd = new Date(user.trialEndsAt as string);
    if (trialEnd > new Date()) return false;
    return sessionStorage.getItem("post-trial-modal-shown") !== "true";
  });

  if (!open) return null;

  const handleClose = () => {
    sessionStorage.setItem("post-trial-modal-shown", "true");
    setOpen(false);
  };

  const handleUpgrade = () => {
    sessionStorage.setItem("post-trial-modal-shown", "true");
    setOpen(false);
    setLocation("/upgrade");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Your Free Trial Has Ended
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your 14-day Authority Content trial has expired. Upgrade now to keep
            creating unlimited property tours, AI reels, avatar videos, and more.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {[
            "Unlimited Property Tour videos",
            "AI Reels & Avatar Videos",
            "Live Tour editing",
            "Blog Builder & Photo Library",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            size="lg"
          >
            Upgrade to Keep Access
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            className="w-full text-muted-foreground"
            size="sm"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Trial Countdown Banner Component
function TrialCountdownBanner({
  user,
  setLocation,
}: {
  user: { subscriptionStatus?: string | null; trialEndsAt?: Date | string | null } | null;
  setLocation: (path: string) => void;
}) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('trial-banner-dismissed') === 'true';
  });

  if (!user || user.subscriptionStatus !== 'trialing') return null;
  if (dismissed) return null;

  const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const now = new Date();
  const daysRemaining = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const isUrgent = daysRemaining !== null && daysRemaining <= 3;

  const handleDismiss = () => {
    localStorage.setItem('trial-banner-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
      isUrgent
        ? 'bg-red-900/40 border-b border-red-500/30 text-red-200'
        : 'bg-orange-900/30 border-b border-orange-500/20 text-orange-200'
    }`}>
      {isUrgent ? (
        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
      ) : (
        <Clock className="h-4 w-4 text-orange-400 shrink-0" />
      )}
      <span className="flex-1">
        {daysRemaining !== null ? (
          <>
            <span className="font-semibold">
              {daysRemaining === 0
                ? 'Your trial ends today'
                : daysRemaining === 1
                ? '1 day left in your Authority trial'
                : `${daysRemaining} days left in your Authority trial`}
            </span>
            {' — full access to all features. '}
            {trialEnd && (
              <span className="opacity-70">Ends {trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.</span>
            )}
          </>
        ) : (
          <span className="font-semibold">Authority trial active — full access to all features.</span>
        )}
      </span>
      <button
        onClick={() => setLocation('/subscription')}
        className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
          isUrgent
            ? 'bg-red-500 hover:bg-red-400 text-white'
            : 'bg-orange-500 hover:bg-orange-400 text-white'
        }`}
      >
        Subscribe Now
      </button>
      <button
        onClick={handleDismiss}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss trial banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Getting Started Checklist Component
function GettingStartedChecklist({
  user,
  setLocation,
}: {
  user: { subscriptionStatus?: string | null; hasCompletedOnboarding?: boolean } | null;
  setLocation: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { data: persona } = trpc.persona.get.useQuery(undefined, { enabled: !!user });
  const { data: fbConn } = trpc.facebook.getConnection.useQuery(undefined, { enabled: !!user });
  const { data: liConn } = trpc.linkedin.getConnection.useQuery(undefined, { enabled: !!user });
  const { data: ytConn } = trpc.youtube.getConnection.useQuery(undefined, { enabled: !!user });

  const hasProfile = !!(persona?.agentName && persona?.primaryCity);
  const hasSubscription = user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trialing";
  const hasSocial = !!(fbConn?.isConnected || liConn?.isConnected || ytConn?.connected);

  const steps = [
    { label: "Set up Authority Profile", done: hasProfile, path: "/authority-profile" },
    { label: "Activate subscription", done: hasSubscription, path: "/pricing" },
    { label: "Connect a social account", done: hasSocial, path: "/integrations" },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  // Hide once all done
  if (allDone) return null;

  return (
    <div className="mx-3 mb-2 rounded-lg border border-orange-500/20 bg-orange-500/5 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-orange-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">Get Started</span>
          <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full font-semibold">
            {completedCount}/{steps.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3 w-3 text-orange-400/60" />
        ) : (
          <ChevronDown className="h-3 w-3 text-orange-400/60" />
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1.5">
          {steps.map((step) => (
            <button
              key={step.label}
              onClick={() => setLocation(step.path)}
              className="w-full flex items-center gap-2 text-left group"
            >
              {step.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-sidebar-foreground/30 shrink-0" />
              )}
              <span
                className={`text-xs leading-tight ${
                  step.done
                    ? "text-sidebar-foreground/40 line-through"
                    : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                }`}
              >
                {step.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Monthly Video Pool Display Component
function VideoPoolDisplay() {
  const [, setLocation] = useLocation();
  const { data: pool } = trpc.credits.getVideoPoolStatus.useQuery();

  if (!pool) return null;
  if (pool.unlimited) return null; // Authority tier — no indicator needed

  const remaining = pool.slotsRemaining;
  const total = pool.poolSize;
  const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const isLow = remaining <= 2;
  const isExhausted = remaining <= 0;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          onClick={() => setLocation("/credits")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Video className="h-4 w-4 text-gray-500" />
          <span className={`text-sm font-medium ${
            isExhausted ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-gray-700'
          }`}>
            {isExhausted ? '0' : remaining}
          </span>
          <span className="text-xs text-gray-400 hidden sm:inline">video credits</span>
          {isExhausted && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0">Add Credits</Badge>
          )}
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 bg-[#1a1a1a] border-white/10 text-white p-3" side="bottom" align="end">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">Free Videos This Month</span>
            <span className="font-semibold">{remaining} / {total}</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isExhausted ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-white/50">
            {isExhausted
              ? 'Pool exhausted. Overage credits apply per video.'
              : `${remaining} slot${remaining === 1 ? '' : 's'} remaining. Resets in ~30 days.`}
          </p>
          <div className="text-xs text-white/40 space-y-0.5 pt-1 border-t border-white/10">
            <div className="flex justify-between"><span>Ken Burns / Market Update</span><span>1 slot</span></div>
            <div className="flex justify-between"><span>AI-Enhanced</span><span>2 slots</span></div>
            <div className="flex justify-between"><span>Full AI / YouTube</span><span>3 slots</span></div>
            <div className="flex justify-between"><span>Voice-overs</span><span className="text-emerald-400">Free</span></div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Credit Balance Display Component
function CreditBalanceDisplay() {
  const [, setLocation] = useLocation();
  const { data: balance } = trpc.credits.getBalance.useQuery();

  if (!balance) return null;

  const credits = balance.balance;
  const isOwner = credits >= 999999;
  const isLow = credits < 20 && !isOwner;

  return (
    <button
      onClick={() => setLocation("/credits")}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
    >
      <CreditCard className="h-4 w-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-700">
        {isOwner ? '∞' : credits}
      </span>
      <span className="text-xs text-gray-400 hidden sm:inline">AI credits</span>
      {isLow && (
        <Badge variant="destructive" className="text-xs px-1.5 py-0">Low</Badge>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNNEL-BASED NAVIGATION
// Attract → Convert → Listings → Publish → Grow
// Mirrors the agent's actual workflow, not the app's internal architecture.
// ─────────────────────────────────────────────────────────────────────────────
// LIFECYCLE-BASED NAVIGATION
// Attract → Engage → Convert → Scale → Dominate
// Every feature lives inside the stage of the agent's business it serves.
// ─────────────────────────────────────────────────────────────────────────────
const menuSections = [
  {
    title: "HOME",
    items: [
      {
        icon: Home,
        label: "Dashboard",
        path: "/dashboard",
        description: "Your Amped Agent command center",
      },
      {
        icon: PlayCircle,
        label: "Get Started",
        path: "/get-started",
        description: "Video walkthroughs for every feature",
      },
      {
        icon: User,
        label: "Authority Profile",
        path: "/authority-profile",
        description: "Your branding, bio, headshot — powers all content",
      },
      {
        icon: UserCircle,
        label: "Persona & Brand",
        path: "/persona",
        description: "Bio, brand voice, service cities, headshot",
      },
    ],
  },
  {
    title: "ATTRACT",
    subtitle: "Build your audience & get found",
    items: [
      {
        icon: Building2,
        label: "Property Tour",
        path: "/property-tours",
        description: "Cinematic listing videos that stop the scroll",
        hoverInfo: {
          tagline: "Turn property photos into a polished cinematic tour video in under 2 minutes.",
          details: [
            { label: "Style", value: "Ken Burns motion, Cinematic, or AI Motion" },
            { label: "Best for", value: "Any property — your listings or buyer searches" },
            { label: "Music", value: "Choose from 24 curated background tracks" },
            { label: "Time", value: "~2 minutes to generate" },
          ],
        },
      },
      {
        icon: Smartphone,
        label: "Live Tour",
        path: "/live-tour",
        description: "Record a guided room-by-room walkthrough from your phone",
        badge: "Authority",
        hoverInfo: {
          tagline: "Walk through the property room by room and record directly in your browser.",
          details: [
            { label: "Style", value: "Live video capture with guided narration prompts" },
            { label: "Best for", value: "Open houses, same-day listings, authentic walkthroughs" },
            { label: "Teleprompter", value: "Optional scrolling script for each room" },
          ],
        },
      },
      {
        icon: Video,
        label: "AI Reels",
        path: "/autoreels",
        description: "Short-form vertical video for Instagram, TikTok & Reels",
        hoverInfo: {
          tagline: "Vertical short-form videos with your AI avatar for Instagram, TikTok, and Facebook Reels.",
          details: [
            { label: "Style", value: "Vertical 9:16 with talking-head avatar overlay" },
            { label: "Best for", value: "Social media reels, market updates, quick tips" },
            { label: "Length", value: "15–60 seconds" },
          ],
        },
      },
      {
        icon: UserCircle,
        label: "Avatar Video",
        path: "/full-avatar-video",
        description: "Full talking-head video to introduce yourself to prospects",
        badge: "Authority",
        hoverInfo: {
          tagline: "A full-length talking-head video where your AI avatar delivers your custom script.",
          details: [
            { label: "Style", value: "Landscape talking-head with branded lower-third" },
            { label: "Best for", value: "Intro videos, market reports, testimonials" },
            { label: "Length", value: "Up to 3 minutes" },
          ],
        },
      },
      {
        icon: BookOpen,
        label: "Blog Builder",
        path: "/blog-builder",
        description: "Hyperlocal SEO blog posts that rank and drive organic traffic",
      },
      {
        icon: Images,
        label: "Photo Library",
        path: "/image-library",
        description: "Upload and manage property photos with AI hooks",
        hoverInfo: {
          tagline: "Upload property photos, tag by room, and generate AI hook text for social posts.",
          details: [
            { label: "Best for", value: "Organizing listing photos, creating social post assets" },
            { label: "AI Hook", value: "Generates a punchy 12-word caption for each photo" },
            { label: "Formats", value: "JPG, PNG, WEBP — drag-and-drop multi-upload" },
          ],
        },
      },
      {
        icon: Gift,
        label: "Lead Magnet",
        path: "/lead-magnet",
        description: "Branded PDF lead magnets for Facebook Lead Ads",
        badge: "Authority",
      },
    ],
  },
  {
    title: "ENGAGE",
    subtitle: "Stay top of mind with your market",
    items: [
      {
        icon: Sparkles,
        label: "Post Builder",
        path: "/generate",
        description: "AI social posts that position you as the local expert",
      },
      {
        icon: TrendingUp,
        label: "Market Insights",
        path: "/market-stats",
        description: "Hyperlocal market data and neighborhood trend reports",
      },
      {
        icon: Newspaper,
        label: "Trending News",
        path: "/trending-news",
        description: "Turn real estate news into engaging social posts",
      },
      {
        icon: Lightbulb,
        label: "Expert Hooks",
        path: "/hooks",
        description: "Proven hook formulas to stop the scroll",
      },
      {
        icon: Mail,
        label: "Newsletter",
        path: "/newsletter",
        description: "Email newsletters that nurture your database",
        badge: "Authority",
      },
      {
        icon: Calendar,
        label: "Content Calendar",
        path: "/calendar",
        description: "Schedule and publish all your content",
      },
      {
        icon: FileText,
        label: "Letters & Emails",
        path: "/letters-emails",
        description: "60+ pre-written drip series, holiday & prospecting templates — auto-personalized",
        badge: "Authority",
      },
      {
        icon: Mic,
        label: "Podcast & Book Builder",
        path: "/podcast-builder",
        description: "Turn your expertise into AI-narrated audio episodes and avatar videos",
        badge: "New",
      },
      {
        icon: Mic,
        label: "AI Interview Podcast",
        path: "/interview-podcast",
        description: "Generate interview-style podcast episodes with expert guest personas",
        badge: "New",
      },
      {
        icon: GitBranch,
        label: "Email Drip Sequences",
        path: "/drip-sequences",
        description: "Automated multi-step email sequences that nurture leads while you sleep",
        badge: "New",
        hoverInfo: {
          tagline: "Enroll any contact into a multi-step email sequence. Pre-built sequences for seller nurture, buyer nurture, and past client check-ins — or build your own.",
          details: [
            { label: "Starter sequences", value: "Seller Nurture (4 emails), Buyer Nurture (4 emails), Past Client (3 emails)" },
            { label: "Automation", value: "Emails send automatically on your schedule" },
            { label: "Enroll", value: "Paste a list of contacts — bulk or one at a time" },
          ],
        },
      },
    ],
  },
  {
    title: "CONVERT",
    subtitle: "Win listings and close buyers",
    items: [
      {
        icon: Presentation,
        label: "Listing Presentation",
        path: "/listing-presentation",
        description: "AI-generated listing appointment deck with CMA",
        hoverInfo: {
          tagline: "Generate a polished listing appointment presentation in minutes — powered by Gamma AI.",
          details: [
            { label: "Best for", value: "Listing appointments, seller consultations" },
            { label: "Output", value: "15-slide deck: property, comps, agent bio, marketing plan" },
            { label: "Share", value: "Branded link — sellers see your name, not Gamma" },
            { label: "Time", value: "1–3 minutes to generate" },
          ],
        },
      },
      {
        icon: UserCheck,
        label: "Buyer Presentation",
        path: "/buyer-presentation",
        description: "Branded buyer consultation deck for first meetings",
        hoverInfo: {
          tagline: "A polished buyer consultation deck that walks new clients through the buying process with your branding.",
          details: [
            { label: "Best for", value: "First buyer meetings, open house follow-ups" },
            { label: "Output", value: "12-slide deck: process, market, financing, why you" },
            { label: "Share", value: "Branded link — same as listing presentation" },
          ],
        },
      },
      {
        icon: BookOpen,
        label: "Guide Generator",
        path: "/guide-generator",
        description: "Branded Seller's Manual & Buyer's Guide — print-ready PDFs",
        hoverInfo: {
          tagline: "Generate a fully branded, print-ready Seller's Manual or Buyer's Guide in minutes — with your photo, logo, and brokerage on every page.",
          details: [
            { label: "Best for", value: "Listing appointments, buyer consultations" },
            { label: "Output", value: "17-page branded PDF — ready to print and hand to clients" },
            { label: "Includes", value: "Hyperlocal market data, optional CMA, custom action plan" },
            { label: "Time", value: "Under 2 minutes" },
          ],
        },
      },
      {
        icon: FolderOpen,
        label: "My Documents",
        path: "/my-documents",
        description: "Re-download your generated guides anytime",
      },
      {
        icon: Mail,
        label: "Prospecting Letters",
        path: "/prospecting-letters",
        description: "AI-crafted letters for every situation — FSBO, expired, pre-foreclosure, divorce, and more",
        hoverInfo: {
          tagline: "Generate empathetic, tone-aware prospecting letters for every situation — from FSBO and expired listings to pre-foreclosure and divorce. Personalized to your brand, editable before sending.",
          details: [
            { label: "Letter types", value: "14 types across 4 categories" },
            { label: "Tone", value: "Empathetic for distressed, confident for listings, warm for referrals" },
            { label: "Output", value: "Editable full letter — copy or download as .txt" },
            { label: "Personalized", value: "Auto-filled with your name, phone, email, and brokerage" },
          ],
        },
      },
      {
        icon: LayoutGrid,
        label: "Assets Hub",
        path: "/assets",
        description: "All your presentations and shareable assets in one place",
        hoverInfo: {
          tagline: "See all your presentations, lead magnets, and shareable content in one visual grid.",
          details: [
            { label: "Includes", value: "Listing & Buyer Presentations, Lead Magnets" },
            { label: "Features", value: "Share links, view counts, filter by type" },
          ],
        },
      },
      {
        icon: Rocket,
        label: "Listing Launch Kit",
        path: "/listing-launch-kit",
        description: "One address → social posts, email blast, and more in seconds",
        badge: "New",
        hoverInfo: {
          tagline: "Enter a listing address and instantly generate a complete marketing package — social posts, email blast draft, and more.",
          details: [
            { label: "Output", value: "5 social posts + email blast + listing presentation link" },
            { label: "Best for", value: "New listings, price reductions, just-sold announcements" },
            { label: "Time", value: "Under 60 seconds" },
          ],
        },
      },
      {
        icon: Megaphone,
        label: "Ad Generator",
        path: "/ad-generator",
        description: "Paste any URL + photos → AI generates a polished, ready-to-run ad",
        badge: "New",
        hoverInfo: {
          tagline: "Paste any URL — a listing, your book, a service, anything — upload 2 photos, and get a complete ad with headline, copy, CTA, and image.",
          details: [
            { label: "Output", value: "Headline + ad copy + CTA + generated ad image" },
            { label: "Formats", value: "Instagram Square, Story, Facebook Feed, Banner" },
            { label: "Time", value: "Under 60 seconds" },
          ],
        },
      },
      {
        icon: MessageSquareQuote,
        label: "Testimonial Engine",
        path: "/testimonials",
        description: "Request reviews and turn them into branded social posts automatically",
        badge: "New",
        hoverInfo: {
          tagline: "Send branded review requests to past clients, then turn their 5-star reviews into social posts and story graphics automatically.",
          details: [
            { label: "Request", value: "Branded email with Google, Zillow, and Realtor.com links" },
            { label: "Generate", value: "AI turns any review into a polished social post" },
            { label: "Best for", value: "Building social proof and Google ranking" },
          ],
        },
      },
      {
        icon: QrCode,
        label: "Open House Manager",
        path: "/open-house",
        description: "QR sign-in sheet + automated follow-up emails for every visitor",
        badge: "New",
        hoverInfo: {
          tagline: "Replace paper sign-in sheets with a QR code. Every visitor gets captured in your CRM and enrolled in an automated follow-up sequence.",
          details: [
            { label: "Sign-in", value: "Mobile-optimized form — visitors scan QR at the door" },
            { label: "Follow-up", value: "3 or 5-email automated sequence starts immediately" },
            { label: "CRM sync", value: "Every lead auto-added to your pipeline" },
            { label: "SMS", value: "Optional TCPA-compliant text follow-up" },
          ],
        },
      },
      {
        icon: Users,
        label: "CRM Pipeline",
        path: "/crm",
        description: "5-stage lead pipeline from first contact to closed deal",
        badge: "New",
        hoverInfo: {
          tagline: "A lightweight 5-stage kanban pipeline that keeps every lead moving from first contact to closed deal — with AI follow-up generation built in.",
          details: [
            { label: "Stages", value: "New → Contacted → Nurturing → Appointment Set → Closed" },
            { label: "Sources", value: "Open house, lead magnet, referral, social, manual" },
            { label: "AI assist", value: "One-click generate a personalized follow-up message" },
            { label: "Decision Engine", value: "Stale leads surface in your Weekly Diagnosis" },
          ],
        },
      },
    ],
  },
  {
    title: "SCALE",
    subtitle: "Multiply your output without the work",
    items: [
      {
        icon: Youtube,
        label: "YouTube Builder",
        path: "/youtube-video-builder",
        description: "Long-form avatar videos for YouTube — up to 15 min",
        hoverInfo: {
          tagline: "Generate long-form (5–15 min) avatar videos for YouTube, then auto-clip them into Reels and Shorts.",
          details: [
            { label: "Style", value: "16:9 landscape talking-head" },
            { label: "Best for", value: "YouTube channel, market updates, buyer/seller guides" },
            { label: "Length", value: "Up to 15 minutes" },
          ],
        },
      },
      {
        icon: Clapperboard,
        label: "Script Builder",
        path: "/video-script-builder",
        description: "Write two-column scripts with visual direction",
        hoverInfo: {
          tagline: "Write your spoken script and visual direction side-by-side — then generate the video.",
          details: [
            { label: "Format", value: "Two-column: spoken words + visual prompt per scene" },
            { label: "Best for", value: "Intro videos, market updates, testimonials, tips" },
            { label: "AI assist", value: "Auto-generate visual prompts or full scripts from a brief" },
          ],
        },
      },
      {
        icon: Youtube,
        label: "YouTube Thumbnails",
        path: "/thumbnails",
        description: "Generate click-worthy thumbnails for every video",
      },
      {
        icon: Shuffle,
        label: "Repurpose Engine",
        path: "/repurpose",
        description: "Write once, publish everywhere — 5 formats from 1 idea",
        badge: "Authority",
      },
      {
        icon: Upload,
        label: "Bulk Import",
        path: "/bulk-import",
        description: "Import content ideas from CSV in bulk",
      },
      {
        icon: Link2,
        label: "Integrations",
        path: "/integrations",
        description: "Connect Facebook, Instagram, LinkedIn, GBP",
      },
      {
        icon: GitBranch,
        label: "CRM Integrations",
        path: "/settings/crm",
        description: "Push leads to Lofty, Follow Up Boss, kvCORE",
      },
      {
        icon: Zap,
        label: "Zapier Webhooks",
        path: "/settings/zapier",
        description: "Trigger 6,000+ Zapier automations from lead events",
      },
    ],
  },
  {
    title: "DOMINATE",
    subtitle: "Own your market and build authority",
    items: [
      {
        icon: Heart,
        label: "Brand Story",
        path: "/brand-story",
        description: "Craft your authentic agent brand narrative",
      },
      {
        icon: TrendingUp,
        label: "Market Dominance",
        path: "/coach",
        description: "AI-generated market authority report for your farm area",
        badge: "Authority",
      },
      {
        icon: FileVideo2,
        label: "My Videos",
        path: "/my-videos",
        description: "Your complete video library",
      },
      {
        icon: Mic,
        label: "Video Voiceover",
        path: "/video-voiceover",
        description: "Add AI voiceover & captions to any video",
      },
      {
        icon: Type,
        label: "Teleprompter",
        path: "/teleprompter",
        description: "Film yourself while your script scrolls live",
      },
      {
        icon: Users,
        label: "Referrals",
        path: "/dashboard",
        description: "Invite agents and earn 25 credits each",
      },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      {
        icon: CreditCard,
        label: "Credits",
        path: "/credits",
        description: "View usage and upgrade",
      },
      {
        icon: Settings,
        label: "Settings",
        path: "/settings",
        description: "App preferences",
      },
    ],
  },
  {
    title: "ADMIN",
    adminOnly: true,
    items: [
      {
        icon: BarChart3,
        label: "Admin Analytics",
        path: "/admin/analytics",
        description: "Platform analytics",
      },
      {
        icon: BarChart3,
        label: "AI Spend",
        path: "/admin/spend",
        description: "AI cost tracking",
      },
      {
        icon: Users,
        label: "Users",
        path: "/admin/users",
        description: "Registered users",
      },
      {
        icon: Star,
        label: "Generation Quality",
        path: "/admin/generation-quality",
        description: "Agent ratings by tool",
      },
      {
        icon: Ticket,
        label: "Invite Codes",
        path: "/admin/invite-codes",
        description: "Beta invite management",
      },
      {
        icon: MessageSquare,
        label: "Agent Feedback",
        path: "/admin/feedback",
        description: "Review & approve testimonials",
      },
    ],
  },
];

// Flatten for backward compatibility
const menuItems = menuSections.flatMap((section) => section.items);

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

// Section color map for flyout header accents
const SECTION_COLORS: Record<string, string> = {
  ATTRACT: "from-sky-600 to-blue-700",
  ENGAGE: "from-green-600 to-emerald-700",
  CONVERT: "from-violet-600 to-purple-700",
  SCALE: "from-orange-500 to-amber-600",
  DOMINATE: "from-rose-600 to-red-700",
  HOME: "from-slate-600 to-slate-700",
  ACCOUNT: "from-slate-600 to-slate-700",
  ADMIN: "from-slate-600 to-slate-700",
};

type MenuSection = (typeof menuSections)[number];
type MenuItem = MenuSection["items"][number];

function CollapsibleNavSections({
  sections,
  userRole,
  location,
  setLocation,
  isCollapsed,
}: {
  sections: typeof menuSections;
  userRole?: string;
  location: string;
  setLocation: (path: string) => void;
  isCollapsed: boolean;
}) {
  // Track which sections are open; lifecycle sections start open if any child is active
  const lifecycleSections = ["ATTRACT", "ENGAGE", "CONVERT", "SCALE", "DOMINATE"];
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    sections.forEach((s) => {
      if (!lifecycleSections.includes(s.title)) {
        init[s.title] = true; // HOME, ACCOUNT, ADMIN always open
      } else {
        // Open the section whose child is currently active
        init[s.title] = s.items.some((item) => item.path === location);
      }
    });
    return init;
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const filtered = sections.filter(
    (s) => !s.adminOnly || userRole === "admin"
  );

  return (
    <>
      {filtered.map((section) => {
        const isLifecycle = lifecycleSections.includes(section.title);
        const isOpen = openSections[section.title] ?? true;
        const gradient = SECTION_COLORS[section.title] ?? "from-slate-600 to-slate-700";
        const hasActiveChild = section.items.some((i) => i.path === location);

        return (
          <div key={section.title} className="mb-0">
            {/* ── Section header ── */}
            {isLifecycle && !isCollapsed ? (
              // Lifecycle sections: clickable collapsible header + hover flyout
              <HoverCard openDelay={400} closeDelay={150}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={`w-full flex items-center gap-2 px-3 pt-5 pb-1 group/sec focus:outline-none`}
                  >
                    <ChevronDown
                      className={`h-3 w-3 text-sidebar-foreground/30 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                        hasActiveChild
                          ? "text-orange-500"
                          : "text-gray-400 group-hover/sec:text-gray-600"
                      }`}
                    >
                      {section.title}
                    </span>
                  </button>
                </HoverCardTrigger>
                {/* Flyout: all tools in this section */}
                <HoverCardContent
                  side="right"
                  align="start"
                  sideOffset={4}
                  className="w-64 p-0 shadow-2xl border border-border/60 rounded-xl overflow-hidden"
                >
                  <div className={`bg-gradient-to-r ${gradient} px-4 py-3`}>
                    <p className="text-xs font-bold text-white uppercase tracking-widest">{section.title}</p>
                    {"subtitle" in section && section.subtitle && (
                      <p className="text-[11px] text-white/70 mt-0.5">{section.subtitle}</p>
                    )}
                  </div>
                  <div className="py-1">
                    {section.items.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => setLocation(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent transition-colors ${
                          location === item.path ? "bg-orange-500/10" : ""
                        }`}
                      >
                        <item.icon
                          className={`h-3.5 w-3.5 shrink-0 ${
                            location === item.path ? "text-orange-500" : "text-muted-foreground"
                          }`}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-medium truncate ${
                              location === item.path ? "text-orange-500" : "text-foreground"
                            }`}
                          >
                            {item.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate leading-tight">
                            {item.description}
                          </p>
                        </div>
                        {"badge" in item && item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-[9px] px-1 py-0 h-3.5 shrink-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </HoverCardContent>
              </HoverCard>
            ) : (
              // Non-lifecycle sections (HOME, ACCOUNT, ADMIN): plain label, always open
              !isCollapsed && (
                <div className="px-3 pt-5 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    {section.title}
                  </span>
                </div>
              )
            )}

            {/* ── Items list (collapsible for lifecycle sections) ── */}
            {(isOpen || !isLifecycle || isCollapsed) && (
              <SidebarMenu className="px-2 mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location === item.path;
                  const hi = "hoverInfo" in item ? item.hoverInfo : null;

                  const menuBtn = (
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.description || item.label}
                      className={`h-9 transition-all duration-150 relative ${
                        isActive
                          ? "bg-[#FFF3E8] rounded-lg"
                          : "hover:bg-[#F9FAFB] rounded-lg"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#FF6A00] rounded-full" />
                      )}
                      <item.icon
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isActive ? "text-[#FF6A00]" : "text-[#6B7280]"
                        }`}
                      />
                      <span
                        className={`truncate text-[13px] leading-snug ${
                          isActive ? "text-[#FF6A00] font-semibold" : "text-[#374151] font-normal"
                        }`}
                      >
                        {item.label}
                      </span>
                      {"badge" in item && item.badge && (
                        <Badge
                          variant="secondary"
                          className={`ml-auto text-[9px] px-1.5 py-0 h-3.5 font-medium ${
                            item.badge === "New" ? "bg-green-500/15 text-green-600 border-0" :
                            item.badge === "Authority" ? "bg-gray-100 text-gray-600 border-0" :
                            ""
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  );

                  return (
                    <SidebarMenuItem key={item.path}>
                      {hi && !isCollapsed ? (
                        <HoverCard openDelay={300} closeDelay={100}>
                          <HoverCardTrigger asChild>{menuBtn}</HoverCardTrigger>
                          <HoverCardContent
                            side="right"
                            align="start"
                            sideOffset={8}
                            className="w-72 p-0 shadow-xl border border-border/60 rounded-xl overflow-hidden"
                          >
                            <div className="bg-gray-900 px-4 py-3 flex items-center gap-2">
                              <item.icon className="h-4 w-4 text-gray-500 shrink-0" />
                              <span className="text-sm font-semibold text-white">{item.label}</span>
                              {"badge" in item && item.badge && (
                                <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-white/20 text-white border-0">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <div className="px-4 py-3 space-y-3">
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {hi.tagline}
                              </p>
                              <div className="space-y-1.5">
                                {hi.details.map((d) => (
                                  <div key={d.label} className="flex items-start gap-2 text-xs">
                                    <span className="text-muted-foreground/70 shrink-0 w-20 font-medium">{d.label}</span>
                                    <span className="text-foreground/80">{d.value}</span>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => setLocation(item.path)}
                                className="w-full mt-1 text-xs font-medium text-primary hover:underline text-left"
                              >
                                Open {item.label} →
                              </button>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      ) : (
                        menuBtn
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </div>
        );
      })}
    </>
  );
}

function ThemeToggleMenuItem() {
  const { theme, toggleTheme } = useTheme();

  return (
    <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
      {theme === "dark" ? (
        <>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light mode</span>
        </>
      ) : (
        <>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark mode</span>
        </>
      )}
    </DropdownMenuItem>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: persona, isLoading: personaLoading } = trpc.persona.get.useQuery(
    undefined,
    { enabled: !!user }
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  // Paywall gate: redirect expired trial users to /upgrade
  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") return;
    if (user.subscriptionStatus === "active") return;
    // Stripe-backed trial: trialing status means they have full access
    if (user.subscriptionStatus === "trialing") return;
    const exemptPaths = ["/upgrade", "/credits", "/settings", "/help", "/faq", "/contact", "/pricing", "/subscription"];
    if (exemptPaths.some((p) => location.startsWith(p))) return;
    // No active subscription and not trialing — redirect to upgrade
    setLocation("/upgrade");
  }, [user, location, setLocation]);

  if (loading || personaLoading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center">
                <span className="text-xl font-bold text-white">A</span>
              </div>
              <span className="text-2xl font-bold text-gold-gradient">
                Amped Agent
              </span>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Premium real estate content creation and scheduling platform. Sign
              in to access your dashboard.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            Sign in to Amped Agent
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <WelcomeModal />
      <PostTrialModal user={user} setLocation={setLocation} />
      <SidebarProvider
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
          } as CSSProperties
        }
      >
        <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
          {children}
        </DashboardLayoutContent>
      </SidebarProvider>
    </>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find((item) => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" disableTransition={isResizing}>
          {/* ── Logo / Header ─────────────────────────────────────────── */}
          <SidebarHeader className="p-0 gap-0 border-b border-gray-100">
            {/* Expanded: full-width logo — white bg to match logo, height exactly matches h-12 top navbar */}
            {!isCollapsed ? (
              <div className="relative w-full h-12 flex items-center bg-white overflow-hidden">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/qseOVyhBAogPpalp.png"
                  alt="Amped Agent"
                  className="h-10 w-auto object-contain ml-3"
                />
                <span className="ml-2 text-[9px] font-bold tracking-widest uppercase bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full leading-none">
                  BETA
                </span>
                <button
                  onClick={toggleSidebar}
                  className="absolute right-2 h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  aria-label="Toggle navigation"
                >
                  <PanelLeft className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            ) : (
              /* Collapsed: icon + toggle stacked */
              <div className="flex flex-col items-center gap-2 py-3">
                <button
                  onClick={toggleSidebar}
                  className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  aria-label="Toggle navigation"
                >
                  <PanelLeft className="h-4 w-4 text-gray-400" />
                </button>
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">A</span>
                </div>
              </div>
            )}
          </SidebarHeader>

          {/* ── Nav Items ─────────────────────────────────────────────── */}
          <SidebarContent className="gap-0 py-2">
            <CollapsibleNavSections
              sections={menuSections}
              userRole={user?.role}
              location={location}
              setLocation={setLocation}
              isCollapsed={isCollapsed}
            />
          </SidebarContent>

          {/* ── Getting Started Checklist ─────────────────────────────── */}
          {!isCollapsed && (
            <GettingStartedChecklist user={user} setLocation={setLocation} />
          )}

          {/* ── Footer / User ─────────────────────────────────────────── */}
          <SidebarFooter className="p-3 border-t border-gray-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-sidebar-accent transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border border-border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-gray-200 text-gray-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/55 truncate mt-1">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <ThemeToggleMenuItem />
                <DropdownMenuItem
                  onClick={() => setLocation("/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-300 transition-colors ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <SidebarInset>
        {/* Top bar */}
        <div className="flex h-12 items-center gap-4 bg-white px-4 sticky top-0 z-40 border-b border-gray-100">
          <div className="flex items-center gap-2 shrink-0">
            {isMobile && (
              <SidebarTrigger className="h-8 w-8 rounded-lg" />
            )}
            {isMobile && (
              <span className="text-sm font-medium text-white">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            )}
          </div>
          {/* Search bar */}
          <HeaderSearch />
          <div className="flex items-center gap-3">
            <VideoPoolDisplay />
            <CreditBalanceDisplay />
            <button
              onClick={() => setLocation("/settings")}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Account
            </button>
            <button
              onClick={() => setLocation("/faq")}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => setLocation("/contact")}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => setLocation("/help")}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Help
            </button>
          </div>
        </div>

        {/* Trial countdown banner */}
        <TrialCountdownBanner user={user} setLocation={setLocation} />
        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 bg-[#F9FAFB] min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
