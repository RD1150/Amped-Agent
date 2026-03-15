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
  HelpCircle, 
  LogOut, 
  PanelLeft,
  User,
  FileSpreadsheet,
  Sparkles,
  FileText,
  Zap,
  BarChart3,
  Clock,
  Sun,
  Moon,
  TrendingUp,
  Newspaper,
  Lightbulb,
  Home,
  Video,
  Youtube,
  Award,
  Building2,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Badge } from "@/components/ui/badge";

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
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
    >
      <CreditCard className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium text-primary">
        {isOwner ? '∞ Unlimited' : credits}
      </span>
      {isLow && (
        <Badge variant="destructive" className="text-xs px-1.5 py-0">Low</Badge>
      )}
    </button>
  );
}
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import FirstPostOnboarding from "./FirstPostOnboarding";

// Organized menu structure with categories
const menuSections = [
  {
    title: "HOME",
    items: [
      { icon: Home, label: "Dashboard", path: "/dashboard", description: "Dashboard overview" },
    ]
  },
  {
    title: "CREATE",
    items: [
      { icon: Sparkles, label: "Post Builder", path: "/generate", description: "Generate social media posts (text + images)" },
      { icon: Video, label: "Reels Engine", path: "/autoreels", description: "Create talking avatar videos (15-60 sec)" },
      { icon: Building2, label: "Property Tours", path: "/property-tours", description: "Generate property showcase videos with music" },
      { icon: Mail, label: "Newsletter Builder", path: "/newsletter", description: "Design email newsletters", badge: "Premium" },
    ]
  },
  {
    title: "PUBLISH",
    items: [
      { icon: Calendar, label: "Content Calendar", path: "/calendar", description: "Schedule and manage all posts" },
      { icon: Link2, label: "Integrations", path: "/integrations", description: "Connect Facebook, Instagram, LinkedIn, GBP" },
    ]
  },
  {
    title: "LIBRARY",
    items: [
      { icon: Video, label: "My Videos", path: "/my-videos", description: "All generated Property Tours, Reels & Market videos" },
      { icon: FileText, label: "Content Templates", path: "/content-templates", description: "Browse pre-made post templates" },
    ]
  },
  {
    title: "GROW",
    items: [
      { icon: TrendingUp, label: "Market Insights", path: "/market-stats", description: "Real estate market data and trends" },
      { icon: Youtube, label: "YouTube Thumbnails", path: "/thumbnails", description: "Generate click-worthy thumbnails" },
      { icon: Lightbulb, label: "Expert Hooks", path: "/hooks", description: "Browse proven hook formulas" },
      { icon: Award, label: "Market Dominance Coach", path: "/coach", description: "AI coaching for market leadership" },
    ]
  },
  {
    title: "ACCOUNT",
    items: [
      { icon: User, label: "Authority Profile", path: "/authority-profile", description: "Your branding, bio, headshot" },
      { icon: CreditCard, label: "Credits", path: "/credits", description: "View usage and upgrade" },
      { icon: Settings, label: "Settings", path: "/settings", description: "App preferences" },
    ]
  },
  {
    title: "ADMIN",
    adminOnly: true,
    items: [
      { icon: BarChart3, label: "Admin Analytics", path: "/admin/analytics", description: "Platform analytics" },
    ]
  }
];

// Flatten for backward compatibility
const menuItems = menuSections.flatMap(section => section.items);

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

function ThemeToggleMenuItem() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <DropdownMenuItem
      onClick={toggleTheme}
      className="cursor-pointer"
    >
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
  // Onboarding is controlled by persona.isCompleted, not localStorage
  const { loading, user } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: persona, isLoading: personaLoading } = trpc.persona.get.useQuery(undefined, {
    enabled: !!user,
  });
  

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  // Paywall gate: redirect expired trial users to /upgrade
  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") return;
    if (user.subscriptionStatus === "active") return;
    // Don't redirect if already on upgrade/billing pages
    const exemptPaths = ["/upgrade", "/credits", "/settings", "/help", "/faq", "/contact"];
    if (exemptPaths.some(p => location.startsWith(p))) return;
    // Check if trial has expired (7 days from createdAt)
    const trialEnd = new Date(user.createdAt);
    trialEnd.setDate(trialEnd.getDate() + 7);
    const trialExpired = new Date() > trialEnd;
    if (trialExpired) {
      setLocation("/upgrade");
    }
  }, [user, location, setLocation]);

  if (loading || personaLoading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">RCA</span>
              </div>
              <span className="text-2xl font-bold text-gold-gradient">Authority Content</span>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Premium real estate content creation and scheduling platform. Sign in to access your dashboard.
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

  // Onboarding is handled by redirect in useEffect above

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
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
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
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-sidebar-border"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-48 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/iBVTqXsNrcunoEnF.png" alt="Authority Content" className="h-32 object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">RCA</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            {menuSections.filter(section => !section.adminOnly || user?.role === 'admin').map((section) => (
              <div key={section.title} className="mb-4">
                {/* Section Header */}
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
                
                {/* Section Items */}
                <SidebarMenu className="px-2">
                  {section.items.map(item => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.description || item.label}
                          className={`h-10 transition-all font-normal ${isActive ? 'bg-sidebar-accent' : ''}`}
                        >
                          <item.icon
                            className={`h-4 w-4 ${isActive ? "text-primary" : "text-sidebar-foreground/70"}`}
                          />
                          <span className={isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/70"}>{item.label}</span>
                          {('badge' in item) && item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
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

          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border border-border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/20 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/70 truncate mt-1.5">
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
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top Navigation Bar */}
        <div className="flex border-b border-border h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />}
            {isMobile && (
              <span className="tracking-tight text-foreground">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <CreditBalanceDisplay />
            <button
              onClick={() => setLocation("/persona")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Account
            </button>
            <button
              onClick={() => setLocation("/faq")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => setLocation("/contact")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => setLocation("/help")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Help
            </button>
          </div>
        </div>
        <main className="flex-1 p-3 md:p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
