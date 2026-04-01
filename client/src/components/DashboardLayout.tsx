import { useAuth } from "@/_core/hooks/useAuth";
import { WelcomeModal } from "@/components/WelcomeModal";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { HeaderSearch } from "@/components/HeaderSearch";

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
      <CreditCard className="h-4 w-4 text-primary-foreground" />
      <span className="text-sm font-medium text-primary-foreground">
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
        description: "Your authority operating system",
      },
    ],
  },
  {
    // Stage 1 — Build an audience and attract leads
    title: "ATTRACT",
    items: [
      {
        icon: Sparkles,
        label: "Post Builder",
        path: "/generate",
        description: "AI-generated social posts that position you as the expert",
      },
      {
        icon: BookOpen,
        label: "Blog Builder",
        path: "/blog-builder",
        description: "SEO blog posts that rank and attract organic traffic",
      },
      {
        icon: TrendingUp,
        label: "Market Insights",
        path: "/market-stats",
        description: "Real estate market data and local trend reports",
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
    // Stage 2 — Convert attention into leads
    title: "CONVERT",
    items: [
      {
        icon: FileText,
        label: "Lead Magnet",
        path: "/lead-magnet",
        description: "Branded PDF lead magnets for Facebook Lead Ads",
        badge: "Premium",
      },
      {
        icon: Mail,
        label: "Newsletter",
        path: "/newsletter",
        description: "Email newsletters that nurture your list",
        badge: "Premium",
      },
      {
        icon: Award,
        label: "Market Dominance Coach",
        path: "/coach",
        description: "AI coaching for positioning and market leadership",
        badge: "Premium",
      },
    ],
  },
  {
    // Stage 3 — Showcase listings with premium video
    title: "LISTINGS",
    items: [
      {
        icon: Building2,
        label: "Property Slideshow",
        path: "/property-tours",
        description: "Quick Ken Burns video for any listing · 5 credits",
      },
      {
        icon: Film,
        label: "AI Motion Tour",
        path: "/cinematic-walkthrough",
        description: "AI-animated AI motion tour for premium listings",
        badge: "Premium",
      },
      {
        icon: Video,
        label: "AI Reels",
        path: "/autoreels",
        description: "Short avatar intro clips for social media (15–60 sec)",
      },
      {
        icon: UserCircle,
        label: "Full Avatar Video",
        path: "/full-avatar-video",
        description: "Full talking-head video from your script",
        badge: "New",
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
    // Stage 4 — Schedule and distribute content
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
        icon: Link2,
        label: "Integrations",
        path: "/integrations",
        description: "Connect Facebook, Instagram, LinkedIn, GBP",
      },
    ],
  },
  {
    // Stage 5 — Repurpose and grow reach
    title: "GROW",
    items: [
      {
        icon: Shuffle,
        label: "Repurpose Engine",
        path: "/repurpose",
        description: "Write once, publish everywhere — 5 formats from 1 idea",
        badge: "Premium",
      },
      {
        icon: Heart,
        label: "Brand Story",
        path: "/brand-story",
        description: "Craft your authentic agent brand story",
      },
      {
        icon: Youtube,
        label: "YouTube Thumbnails",
        path: "/thumbnails",
        description: "Generate click-worthy thumbnails",
      },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      {
        icon: User,
        label: "Authority Profile",
        path: "/authority-profile",
        description: "Your branding, bio, headshot",
      },
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
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">AC</span>
              </div>
              <span className="text-2xl font-bold text-gold-gradient">
                Authority Content
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
            Sign in to Authority Content
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
          <SidebarHeader className="px-3 py-4 bg-primary">
            <div className="flex items-center gap-2">
              {/* Collapse toggle */}
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-white/15 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-primary-foreground/70" />
              </button>

              {/* Logo — only visible when expanded */}
              {!isCollapsed && (
                <div className="flex items-center min-w-0 overflow-hidden">
                  <img
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/iBVTqXsNrcunoEnF.png"
                    alt="Authority Content"
                    className="h-32 w-auto object-contain"
                  />
                </div>
              )}

              {/* Collapsed state — monogram */}
              {isCollapsed && (
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">AC</span>
                </div>
              )}
            </div>
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
                    <h3 className="text-[9px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.14em]">
                      {section.title}
                    </h3>
                  </div>

                  {/* Items */}
                  <SidebarMenu className="px-2">
                    {section.items.map((item) => {
                      const isActive = location === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.description || item.label}
                            className={`h-9 transition-all font-normal ${
                              isActive
                                ? "bg-primary/15 text-primary rounded-md shadow-sm"
                                : "hover:bg-sidebar-accent/70"
                            }`}
                          >
                            <item.icon
                              className={`h-4 w-4 shrink-0 ${
                                isActive
                                  ? "text-primary"
                                  : "text-sidebar-foreground/55"
                              }`}
                            />
                            <span
                              className={`truncate text-sm ${
                                isActive
                                  ? "text-primary font-medium"
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
                    <AvatarFallback className="text-xs font-medium bg-primary/15 text-primary">
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
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${
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
        <div className="flex h-12 items-center gap-4 bg-primary px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2 shrink-0">
            {isMobile && (
              <SidebarTrigger className="h-8 w-8 rounded-lg" />
            )}
            {isMobile && (
              <span className="text-sm font-medium text-primary-foreground">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            )}
          </div>
          {/* Search bar */}
          <HeaderSearch />
          <div className="flex items-center gap-3">
            <CreditBalanceDisplay />
            <button
              onClick={() => setLocation("/authority-profile")}
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              Account
            </button>
            <button
              onClick={() => setLocation("/faq")}
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => setLocation("/contact")}
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => setLocation("/help")}
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
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
