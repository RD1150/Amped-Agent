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

// Monthly Video Pool Display Component
function VideoPoolDisplay() {
  const [, setLocation] = useLocation();
  const { data: pool } = trpc.credits.getVideoPoolStatus.useQuery();

  if (!pool) return null;
  if (pool.unlimited) return null; // Agency tier — no indicator needed

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
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Video className="h-4 w-4 text-white" />
          <span className={`text-sm font-medium ${
            isExhausted ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'
          }`}>
            {isExhausted ? '0' : remaining} free
          </span>
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
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
    >
      <CreditCard className="h-4 w-4 text-white" />
      <span className="text-sm font-medium text-white">
        {isOwner ? '∞ Unlimited' : credits}
      </span>
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
    ],
  },
  {
    title: "MY BRAND STORY",
    items: [
      {
        icon: User,
        label: "Authority Profile",
        path: "/authority-profile",
        description: "Your branding, bio, headshot — powers all content",
      },
      {
        icon: Heart,
        label: "My Brand Story",
        path: "/brand-story",
        description: "Craft your authentic agent brand story",
      },
    ],
  },
  {
    title: "VIDEOS",
    items: [
      {
        icon: Building2,
        label: "Property Tour",
        path: "/property-tours",
        description: "Cinematic property tour video for any home",
        hoverInfo: {
          tagline: "Turn property photos into a polished cinematic tour video in under 2 minutes.",
          details: [
            { label: "Style", value: "Smooth Ken Burns motion — zoom, pan, cross-fade" },
            { label: "Best for", value: "Any property — your listings or buyer searches" },
            { label: "Music", value: "Choose from 8 curated background tracks" },
            { label: "Credits", value: "5 credits per video" },
            { label: "Time", value: "~2 minutes to generate" },
          ],
        },
      },
      {
        icon: Smartphone,
        label: "Live Tour",
        path: "/live-tour",
        description: "Record a guided room-by-room walkthrough from your phone",
        hoverInfo: {
          tagline: "Walk through the property room by room and record directly in your browser.",
          details: [
            { label: "Style", value: "Live video capture with guided narration prompts" },
            { label: "Best for", value: "Open houses, same-day listings, authentic walkthroughs" },
            { label: "Teleprompter", value: "Optional scrolling script for each room" },
            { label: "Auto-stop", value: "Each room clip auto-stops at 15 seconds" },
            { label: "Credits", value: "8 credits per assembled tour" },
          ],
        },
      },
      {
        icon: Video,
        label: "AI Reels",
        path: "/autoreels",
        description: "Short avatar clips for Instagram, TikTok & Reels (15–60 sec)",
        hoverInfo: {
          tagline: "Vertical short-form videos with your AI avatar for Instagram, TikTok, and Facebook Reels.",
          details: [
            { label: "Style", value: "Vertical 9:16 with talking-head avatar overlay" },
            { label: "Best for", value: "Social media reels, market updates, quick tips" },
            { label: "Length", value: "15–60 seconds" },
            { label: "Credits", value: "5 credits per reel" },
            { label: "Time", value: "~3 minutes to generate" },
          ],
        },
      },
      {
        icon: UserCircle,
        label: "Avatar Video",
        path: "/full-avatar-video",
        description: "Full talking-head video from your script",
        hoverInfo: {
          tagline: "A full-length talking-head video where your AI avatar delivers your custom script.",
          details: [
            { label: "Style", value: "Landscape talking-head with branded lower-third" },
            { label: "Best for", value: "Market reports, testimonials, long-form content" },
            { label: "Length", value: "Up to 3 minutes" },
            { label: "Credits", value: "15 credits per video" },
            { label: "Time", value: "~5 minutes to generate" },
          ],
        },
      },
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
            { label: "Credits", value: "20 credits per video" },
            { label: "Time", value: "5–20 minutes to generate" },
            { label: "Includes", value: "Script templates, SEO metadata, Reels clips, Publish to YouTube" },
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
            { label: "Export", value: "Use with Avatar Video or YouTube Builder" },
          ],
        },
      },
      {
        icon: Youtube,
        label: "YouTube Thumbnails",
        path: "/thumbnails",
        description: "Generate click-worthy thumbnails",
      },
      {
        icon: FileVideo2,
        label: "My Videos",
        path: "/my-videos",
        description: "All your generated videos in one place",
      },
    ],
  },
  {
    title: "CONTENT",
    items: [
      {
        icon: Sparkles,
        label: "Post Builder",
        path: "/generate",
        description: "AI-generated social posts that position you as the local expert",
      },
      {
        icon: BookOpen,
        label: "Blog Builder",
        path: "/blog-builder",
        description: "Hyperlocal SEO blog posts that rank and attract organic traffic",
      },
      {
        icon: TrendingUp,
        label: "Market Insights",
        path: "/market-stats",
        description: "Hyperlocal market data and neighborhood trend reports",
      },
      {
        icon: Lightbulb,
        label: "Expert Hooks",
        path: "/hooks",
        description: "Proven hook formulas to stop the scroll",
      },
    ],
  },
  {
    title: "PRESENTATIONS",
    items: [
      {
        icon: LayoutGrid,
        label: "Assets Hub",
        path: "/assets",
        description: "All your presentations and shareable content in one place",
        hoverInfo: {
          tagline: "See all your presentations, lead magnets, and shareable content in one visual grid.",
          details: [
            { label: "Includes", value: "Listing & Buyer Presentations, Lead Magnets" },
            { label: "Features", value: "Share links, view counts, filter by type" },
          ],
        },
      },
      {
        icon: Presentation,
        label: "Listing Presentation",
        path: "/listing-presentation",
        description: "AI-generated listing appointment deck for sellers",
        hoverInfo: {
          tagline: "Generate a polished listing appointment presentation in minutes — powered by Gamma AI.",
          details: [
            { label: "Best for", value: "Listing appointments, seller consultations" },
            { label: "Output", value: "15-slide deck: property, comps, agent bio, marketing plan" },
            { label: "Share", value: "Branded link hides Gamma — sellers see your name" },
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
        icon: Gift,
        label: "Lead Magnet",
        path: "/lead-magnet",
        description: "Branded PDF lead magnets for Facebook Lead Ads",
        badge: "Agency",
      },
    ],
  },
  {
    title: "AUTHORITY",
    items: [
      {
        icon: Mail,
        label: "Newsletter",
        path: "/newsletter",
        description: "Email newsletters that nurture your list",
        badge: "Agency",
      },
      {
        icon: TrendingUp,
        label: "Market Dominance Report",
        path: "/coach",
        description: "AI-generated market authority report for your farm area",
        badge: "Agency",
      },
    ],
  },
  {
    title: "LIBRARY",
    items: [
      {
        icon: Images,
        label: "Photo Library",
        path: "/image-library",
        description: "Upload and manage property photos with AI hooks",
        hoverInfo: {
          tagline: "Upload property photos, tag by room, and generate AI hook text for social posts — all in one place.",
          details: [
            { label: "Best for", value: "Organizing listing photos, creating social post assets" },
            { label: "AI Hook", value: "Generates a punchy 12-word caption for each photo" },
            { label: "Formats", value: "JPG, PNG, WEBP — drag-and-drop multi-upload" },
            { label: "Features", value: "Room tagging, property address, tag filtering" },
          ],
        },
      },
    ],
  },
  {
    title: "PUBLISH",
    items: [
      {
        icon: Calendar,
        label: "Content Calendar",
        path: "/calendar",
        description: "Schedule and manage all posts",
      },
      {
        icon: Upload,
        label: "Bulk Import",
        path: "/bulk-import",
        description: "Import content ideas from CSV in bulk",
      },
      {
        icon: Shuffle,
        label: "Repurpose Engine",
        path: "/repurpose",
        description: "Write once, publish everywhere — 5 formats from 1 idea",
        badge: "Agency",
      },
      {
        icon: Link2,
        label: "Integrations",
        path: "/integrations",
        description: "Connect Facebook, Instagram, LinkedIn, GBP",
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
    ],
  },
];

// Flatten for backward compatibility
const menuItems = menuSections.flatMap((section) => section.items);

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

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
    const exemptPaths = ["/upgrade", "/credits", "/settings", "/help", "/faq", "/contact"];
    if (exemptPaths.some((p) => location.startsWith(p))) return;
    const trialEnd = new Date(user.createdAt);
    trialEnd.setDate(trialEnd.getDate() + 7);
    const trialExpired = new Date() > trialEnd;
    if (trialExpired) {
      setLocation("/upgrade");
    }
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
              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
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
          <SidebarHeader className="p-0 gap-0 border-b border-white/10">
            {/* Expanded: full-width logo — white bg to match logo, height exactly matches h-12 top navbar */}
            {!isCollapsed ? (
              <div className="relative w-full h-12 flex items-center bg-white overflow-hidden">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/qseOVyhBAogPpalp.png"
                  alt="Amped Agent"
                  className="h-10 w-auto object-contain ml-3"
                />
                <span className="ml-2 text-[9px] font-bold tracking-widest uppercase bg-orange-100 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full leading-none">
                  BETA
                </span>
                <button
                  onClick={toggleSidebar}
                  className="absolute right-2 h-7 w-7 flex items-center justify-center hover:bg-black/10 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  aria-label="Toggle navigation"
                >
                  <PanelLeft className="h-4 w-4 text-black/30" />
                </button>
              </div>
            ) : (
              /* Collapsed: icon + toggle stacked */
              <div className="flex flex-col items-center gap-2 py-3">
                <button
                  onClick={toggleSidebar}
                  className="h-8 w-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  aria-label="Toggle navigation"
                >
                  <PanelLeft className="h-4 w-4 text-white/60" />
                </button>
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">A</span>
                </div>
              </div>
            )}
          </SidebarHeader>

          {/* ── Nav Items ─────────────────────────────────────────────── */}
          <SidebarContent className="gap-0 py-1">
            {menuSections
              .filter(
                (section) =>
                  !section.adminOnly || user?.role === "admin"
              )
              .map((section) => (
                <div key={section.title} className="mb-0">
                  {/* Section label */}
                  <div className="px-4 pt-4 pb-1">
                    <h3 className="text-[11px] font-bold text-sidebar-foreground/75 uppercase tracking-[0.1em]">
                      {section.title}
                    </h3>
                  </div>

                  {/* Items */}
                  <SidebarMenu className="px-2">
                    {section.items.map((item) => {
                      const isActive = location === item.path;
                      const hi = "hoverInfo" in item ? item.hoverInfo : null;

                      const menuBtn = (
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.description || item.label}
                          className={`h-9 transition-all font-normal ${
                            isActive
                              ? "bg-orange-500/15 text-orange-500 rounded-md"
                              : "hover:bg-sidebar-accent/70"
                          }`}
                        >
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive
                                ? "text-orange-500"
                                : "text-sidebar-foreground/55"
                            }`}
                          />
                          <span
                            className={`truncate text-sm ${
                              isActive
                                ? "text-orange-500 font-medium"
                                : "text-sidebar-foreground/80"
                            }`}
                          >
                            {item.label}
                          </span>
                          {"badge" in item && item.badge && (
                            <Badge
                              variant="secondary"
                              className="ml-auto text-[10px] px-1.5 py-0 h-4"
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
                              <HoverCardTrigger asChild>
                                {menuBtn}
                              </HoverCardTrigger>
                              <HoverCardContent
                                side="right"
                                align="start"
                                sideOffset={8}
                                className="w-72 p-0 shadow-xl border border-border/60 rounded-xl overflow-hidden"
                              >
                                {/* Header */}
                                <div className="bg-[#0F0F0F] px-4 py-3 flex items-center gap-2">
                                  <item.icon className="h-4 w-4 text-orange-400 shrink-0" />
                                  <span className="text-sm font-semibold text-white">{item.label}</span>
                                  {"badge" in item && item.badge && (
                                    <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-white/20 text-white border-0">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                                {/* Body */}
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
                </div>
              ))}
          </SidebarContent>

          {/* ── Footer / User ─────────────────────────────────────────── */}
          <SidebarFooter className="p-3 border-t border-sidebar-border/60">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-sidebar-accent transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border border-border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-orange-500/20 text-orange-400">
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
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-orange-500/30 transition-colors ${
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
        <div className="flex h-12 items-center gap-4 bg-[#0F0F0F] px-4 sticky top-0 z-40 border-b border-white/10">
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
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Account
            </button>
            <button
              onClick={() => setLocation("/faq")}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => setLocation("/contact")}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => setLocation("/help")}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Help
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-3 md:p-5">{children}</main>
      </SidebarInset>
    </>
  );
}
