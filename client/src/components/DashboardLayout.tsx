import { useAuth } from "@/_core/hooks/useAuth";
import { useAutoProvisionGHL } from "@/hooks/useAutoProvisionGHL";
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
  CreditCard
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
  const isLow = credits < 20;

  return (
    <button
      onClick={() => setLocation("/credits")}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
    >
      <CreditCard className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium text-primary">{credits}</span>
      {isLow && (
        <Badge variant="destructive" className="text-xs px-1.5 py-0">Low</Badge>
      )}
    </button>
  );
}
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import FirstPostOnboarding from "./FirstPostOnboarding";

// Organized menu structure
const menuItems = [
  // HOME
  { icon: Home, label: "Home", path: "/dashboard" },
  
  // CONTENT section
  { icon: Sparkles, label: "Generate Post", path: "/generate" },
  { icon: Video, label: "AutoReels", path: "/autoreels" },
  { icon: Building2, label: "Property Tours", path: "/property-tours" },
  { icon: Youtube, label: "YouTube Thumbnails", path: "/thumbnails" },
  { icon: Award, label: "Performance Coach", path: "/coach" },
  { icon: CreditCard, label: "Credits", path: "/credits" },
  { icon: User, label: "Authority Profile", path: "/authority-profile" },
  { icon: Calendar, label: "Content Calendar", path: "/calendar" },
  { icon: Upload, label: "Upload Content", path: "/uploads" },
  { icon: FileText, label: "Content Templates", path: "/content-templates" },
  
  // SCHEDULE section
  { icon: Clock, label: "Schedule Posts", path: "/schedules" },
  
  // AUTHORITY section
  { icon: TrendingUp, label: "Market Insights", path: "/market-stats" },
  { icon: Lightbulb, label: "Expert Hooks", path: "/hooks" },
  
  // SETTINGS section
  { icon: User, label: "Persona & Brand", path: "/persona" },
  { icon: Link2, label: "Integrations", path: "/integrations" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

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
  const [, setLocation] = useLocation();
  const { data: persona, isLoading: personaLoading } = trpc.persona.get.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Automatically create GHL sub-account on first login
  useAutoProvisionGHL();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  // Redirect to onboarding if persona is not completed
  useEffect(() => {
    if (user && persona && !persona.isCompleted) {
      setLocation("/onboarding");
    }
  }, [user, persona, setLocation]);

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
                  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/fsjGKfiVhGcAEGxr.png" alt="Authority Content" className="h-40 object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">RCA</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal ${isActive ? 'bg-sidebar-accent' : ''}`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : "text-sidebar-foreground/70"}`}
                      />
                      <span className={isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/70"}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
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
