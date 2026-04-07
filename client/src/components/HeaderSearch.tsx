import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import {
  Sparkles, BookOpen, TrendingUp, Lightbulb, FileText, Mail, Award,
  Building2, Film, Video, UserCircle, FileVideo2, Calendar, Upload,
  Link2, Shuffle, Heart, Youtube, User, CreditCard, Settings,
  Home, BarChart3, Users,
} from "lucide-react";

const ALL_PAGES = [
  { icon: Home,        label: "Dashboard",              path: "/dashboard",            section: "HOME",    description: "Your AmpedAgent command center" },
  { icon: Sparkles,    label: "Post Builder",            path: "/generate",             section: "ATTRACT", description: "AI-generated social posts" },
  { icon: BookOpen,    label: "Blog Builder",            path: "/blog-builder",         section: "ATTRACT", description: "SEO blog posts that rank" },
  { icon: TrendingUp,  label: "Market Insights",         path: "/market-stats",         section: "ATTRACT", description: "Real estate market data and trends" },
  { icon: Lightbulb,   label: "Expert Hooks",            path: "/hooks",                section: "ATTRACT", description: "Proven hook formulas to stop the scroll" },
  { icon: FileText,    label: "Lead Magnet",             path: "/lead-magnet",          section: "CONVERT", description: "Branded PDF lead magnets" },
  { icon: Mail,        label: "Newsletter",              path: "/newsletter",           section: "CONVERT", description: "Email newsletters for your list" },
  { icon: Award,       label: "Market Dominance Coach",  path: "/coach",                section: "CONVERT", description: "AI coaching for market leadership" },
  { icon: Building2,   label: "Property Slideshow",           path: "/property-tours",       section: "LISTINGS", description: "Ken Burns video for any listing" },
  { icon: Film,        label: "AI Motion Tour",          path: "/cinematic-walkthrough",section: "LISTINGS", description: "AI-animated cinematic property tour" },
  { icon: Video,       label: "AI Reels",                path: "/autoreels",            section: "LISTINGS", description: "Short avatar intro clips" },
  { icon: UserCircle,  label: "Full Avatar Video",       path: "/full-avatar-video",    section: "LISTINGS", description: "Talking-head video from your script" },
  { icon: FileVideo2,  label: "My Videos",               path: "/my-videos",            section: "LISTINGS", description: "All your generated videos" },
  { icon: Calendar,    label: "Content Calendar",        path: "/calendar",             section: "PUBLISH", description: "Schedule and manage all posts" },
  { icon: Upload,      label: "Bulk Import",             path: "/bulk-import",          section: "PUBLISH", description: "Import content ideas from CSV" },
  { icon: Link2,       label: "Integrations",            path: "/integrations",         section: "PUBLISH", description: "Connect Facebook, Instagram, LinkedIn" },
  { icon: Shuffle,     label: "Repurpose Engine",        path: "/repurpose",            section: "GROW",    description: "Write once, publish everywhere" },
  { icon: Heart,       label: "Brand Story",             path: "/brand-story",          section: "GROW",    description: "Craft your authentic brand story" },
  { icon: Youtube,     label: "YouTube Thumbnails",      path: "/thumbnails",           section: "GROW",    description: "Generate click-worthy thumbnails" },
  { icon: User,        label: "Authority Profile",       path: "/authority-profile",    section: "ACCOUNT", description: "Your branding, bio, headshot" },
  { icon: CreditCard,  label: "Credits",                 path: "/credits",              section: "ACCOUNT", description: "View usage and upgrade" },
  { icon: Settings,    label: "Settings",                path: "/settings",             section: "ACCOUNT", description: "App preferences" },
  { icon: BarChart3,   label: "Admin Analytics",         path: "/admin/analytics",      section: "ADMIN",   description: "Platform analytics" },
  { icon: Users,       label: "Users",                   path: "/admin/users",          section: "ADMIN",   description: "Registered users" },
];

export function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? ALL_PAGES.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.label.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.section.toLowerCase().includes(q)
        );
      })
    : [];

  const navigate = useCallback(
    (path: string) => {
      setLocation(path);
      setQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [setLocation]
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[highlighted]) navigate(filtered[highlighted].path);
      } else if (e.key === "Escape") {
        setQuery("");
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, filtered, highlighted, navigate]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Global shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-sm">
      {/* Input */}
      <div className="flex items-center gap-2 bg-white/15 hover:bg-white/20 focus-within:bg-white/25 rounded-lg px-3 h-8 transition-colors">
        <Search className="h-3.5 w-3.5 text-primary-foreground/60 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search pages… (⌘K)"
          className="flex-1 bg-transparent text-sm text-primary-foreground placeholder:text-primary-foreground/50 outline-none min-w-0"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="text-primary-foreground/50 hover:text-primary-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!query && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-primary-foreground/40 font-mono">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-border/50 overflow-hidden z-50 max-h-80 overflow-y-auto">
          {filtered.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onMouseDown={() => navigate(item.path)}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === highlighted ? "bg-primary/8" : "hover:bg-muted/50"
                }`}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  i === highlighted ? "bg-primary/15" : "bg-muted"
                }`}>
                  <Icon className={`h-3.5 w-3.5 ${i === highlighted ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${i === highlighted ? "text-primary" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide shrink-0">
                  {item.section}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* No results */}
      {isOpen && query.trim() && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-border/50 px-4 py-3 z-50">
          <p className="text-sm text-muted-foreground">No pages found for "<span className="text-foreground font-medium">{query}</span>"</p>
        </div>
      )}
    </div>
  );
}
