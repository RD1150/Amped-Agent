import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRecentTools, recordToolVisit } from "@/hooks/useRecentTools";
import type { LucideIcon } from "lucide-react";

export interface SectionTool {
  icon: LucideIcon;
  label: string;
  path: string;
  description: string;
  badge?: string;
  highlight?: boolean;
}

export interface SectionConfig {
  title: string;
  subtitle: string;
  tagline: string;
  color: string;
  tools: SectionTool[];
}

interface SectionOverviewProps {
  section: SectionConfig;
}

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; btn: string }> = {
  blue:   { bg: "bg-blue-500/8",   text: "text-blue-600",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",   btn: "bg-blue-600 hover:bg-blue-700" },
  green:  { bg: "bg-green-500/8",  text: "text-green-600",  border: "border-green-200",  badge: "bg-green-100 text-green-700",  btn: "bg-green-600 hover:bg-green-700" },
  orange: { bg: "bg-orange-500/8", text: "text-orange-600", border: "border-orange-200", badge: "bg-orange-100 text-orange-700", btn: "bg-orange-600 hover:bg-orange-700" },
  purple: { bg: "bg-purple-500/8", text: "text-purple-600", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", btn: "bg-purple-600 hover:bg-purple-700" },
  red:    { bg: "bg-red-500/8",    text: "text-red-600",    border: "border-red-200",    badge: "bg-red-100 text-red-700",    btn: "bg-red-600 hover:bg-red-700" },
};

// ── Per-tool visual config: gradient + inline SVG illustration ─────────────────
const toolVisuals: Record<string, { gradient: string; illustration: React.ReactNode }> = {
  "/property-tours": {
    gradient: "from-sky-500 via-blue-600 to-indigo-700",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Sky */}
        <rect width="120" height="80" fill="url(#sky)" rx="0"/>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0.1"/>
          </linearGradient>
        </defs>
        {/* House */}
        <polygon points="60,15 90,38 30,38" fill="white" fillOpacity="0.9"/>
        <rect x="35" y="38" width="50" height="30" fill="white" fillOpacity="0.85"/>
        {/* Door */}
        <rect x="52" y="52" width="16" height="16" rx="2" fill="#3b82f6" fillOpacity="0.7"/>
        {/* Windows */}
        <rect x="38" y="43" width="10" height="10" rx="1" fill="#bfdbfe" fillOpacity="0.9"/>
        <rect x="72" y="43" width="10" height="10" rx="1" fill="#bfdbfe" fillOpacity="0.9"/>
        {/* Camera icon */}
        <circle cx="98" cy="18" r="10" fill="white" fillOpacity="0.2"/>
        <rect x="92" y="14" width="12" height="9" rx="1.5" fill="white" fillOpacity="0.8"/>
        <circle cx="98" cy="18.5" r="3" fill="#3b82f6" fillOpacity="0.8"/>
        {/* Sun */}
        <circle cx="18" cy="16" r="7" fill="#fbbf24" fillOpacity="0.7"/>
      </svg>
    ),
  },
  "/live-tour": {
    gradient: "from-violet-500 via-purple-600 to-fuchsia-700",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Phone */}
        <rect x="42" y="10" width="36" height="60" rx="6" fill="white" fillOpacity="0.85"/>
        <rect x="46" y="16" width="28" height="44" rx="2" fill="#7c3aed" fillOpacity="0.3"/>
        {/* Live dot */}
        <circle cx="60" cy="38" r="8" fill="#ef4444" fillOpacity="0.8"/>
        <circle cx="60" cy="38" r="4" fill="white" fillOpacity="0.9"/>
        {/* Signal rings */}
        <circle cx="60" cy="38" r="13" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" fill="none"/>
        <circle cx="60" cy="38" r="18" stroke="white" strokeOpacity="0.2" strokeWidth="1" fill="none"/>
        {/* LIVE badge */}
        <rect x="50" y="60" width="20" height="7" rx="3" fill="#ef4444" fillOpacity="0.8"/>
        <text x="60" y="65.5" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">LIVE</text>
      </svg>
    ),
  },
  "/autoreels": {
    gradient: "from-pink-500 via-rose-500 to-orange-500",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Phone vertical */}
        <rect x="45" y="8" width="30" height="64" rx="5" fill="white" fillOpacity="0.85"/>
        <rect x="49" y="14" width="22" height="48" rx="2" fill="#f43f5e" fillOpacity="0.25"/>
        {/* Play button */}
        <circle cx="60" cy="38" r="12" fill="white" fillOpacity="0.3"/>
        <polygon points="56,32 56,44 68,38" fill="white" fillOpacity="0.9"/>
        {/* TikTok-style note */}
        <text x="85" y="28" fill="white" fontSize="18" fillOpacity="0.7">♪</text>
        <text x="22" y="50" fill="white" fontSize="14" fillOpacity="0.5">♫</text>
        {/* Stars */}
        <circle cx="95" cy="55" r="2" fill="#fbbf24" fillOpacity="0.8"/>
        <circle cx="25" cy="22" r="2" fill="#fbbf24" fillOpacity="0.8"/>
        <circle cx="100" cy="35" r="1.5" fill="white" fillOpacity="0.6"/>
      </svg>
    ),
  },
  "/full-avatar-video": {
    gradient: "from-amber-400 via-orange-500 to-red-500",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Person silhouette */}
        <circle cx="60" cy="26" r="14" fill="white" fillOpacity="0.85"/>
        <ellipse cx="60" cy="62" rx="22" ry="16" fill="white" fillOpacity="0.75"/>
        {/* Face */}
        <circle cx="55" cy="24" r="2" fill="#f97316" fillOpacity="0.8"/>
        <circle cx="65" cy="24" r="2" fill="#f97316" fillOpacity="0.8"/>
        <path d="M54 31 Q60 36 66 31" stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.8" fill="none" strokeLinecap="round"/>
        {/* Mic */}
        <rect x="97" y="30" width="8" height="14" rx="4" fill="white" fillOpacity="0.8"/>
        <path d="M93 40 Q93 50 101 50 Q109 50 109 40" stroke="white" strokeWidth="1.5" fill="none" strokeOpacity="0.7"/>
        <line x1="101" y1="50" x2="101" y2="56" stroke="white" strokeWidth="1.5" strokeOpacity="0.7"/>
        {/* Sparkles */}
        <text x="10" y="30" fill="white" fontSize="14" fillOpacity="0.6">✦</text>
        <text x="18" y="55" fill="white" fontSize="10" fillOpacity="0.4">✦</text>
      </svg>
    ),
  },
  "/blog-builder": {
    gradient: "from-teal-500 via-cyan-600 to-blue-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Document */}
        <rect x="30" y="10" width="50" height="60" rx="4" fill="white" fillOpacity="0.85"/>
        {/* Lines of text */}
        <rect x="38" y="22" width="34" height="3" rx="1.5" fill="#0891b2" fillOpacity="0.6"/>
        <rect x="38" y="30" width="28" height="2.5" rx="1.5" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="38" y="36" width="32" height="2.5" rx="1.5" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="38" y="42" width="25" height="2.5" rx="1.5" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="38" y="48" width="30" height="2.5" rx="1.5" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="38" y="54" width="20" height="2.5" rx="1.5" fill="#94a3b8" fillOpacity="0.4"/>
        {/* SEO magnifier */}
        <circle cx="88" cy="22" r="10" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.8"/>
        <line x1="95" y1="29" x2="103" y2="37" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8"/>
        <text x="83" y="25" fill="white" fontSize="8" fillOpacity="0.8">SEO</text>
      </svg>
    ),
  },
  "/image-library": {
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Photo frames */}
        <rect x="12" y="18" width="38" height="30" rx="3" fill="white" fillOpacity="0.85"/>
        <rect x="14" y="20" width="34" height="26" rx="2" fill="#10b981" fillOpacity="0.2"/>
        {/* Mountain in photo 1 */}
        <polygon points="20,42 31,26 42,42" fill="#10b981" fillOpacity="0.5"/>
        <circle cx="38" cy="27" r="4" fill="#fbbf24" fillOpacity="0.6"/>
        {/* Photo 2 */}
        <rect x="55" y="12" width="38" height="30" rx="3" fill="white" fillOpacity="0.85"/>
        <rect x="57" y="14" width="34" height="26" rx="2" fill="#10b981" fillOpacity="0.2"/>
        <polygon points="62,38 73,22 84,38" fill="#10b981" fillOpacity="0.5"/>
        {/* Photo 3 */}
        <rect x="30" y="50" width="38" height="22" rx="3" fill="white" fillOpacity="0.8"/>
        <rect x="32" y="52" width="34" height="18" rx="2" fill="#10b981" fillOpacity="0.2"/>
        <polygon points="37,68 48,56 59,68" fill="#10b981" fillOpacity="0.5"/>
        {/* AI sparkle */}
        <text x="90" y="58" fill="white" fontSize="16" fillOpacity="0.7">✦</text>
      </svg>
    ),
  },
  "/lead-magnet": {
    gradient: "from-indigo-500 via-blue-600 to-cyan-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* PDF document */}
        <rect x="35" y="10" width="42" height="55" rx="4" fill="white" fillOpacity="0.85"/>
        {/* PDF header bar */}
        <rect x="35" y="10" width="42" height="14" rx="4" fill="#4f46e5" fillOpacity="0.6"/>
        <text x="56" y="21" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">PDF</text>
        {/* Content lines */}
        <rect x="42" y="30" width="28" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.6"/>
        <rect x="42" y="36" width="22" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="42" y="42" width="26" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="42" y="48" width="18" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
        {/* Magnet */}
        <path d="M88 20 Q100 20 100 32 Q100 44 88 44" stroke="white" strokeWidth="4" fill="none" strokeOpacity="0.8" strokeLinecap="round"/>
        <line x1="88" y1="20" x2="88" y2="26" stroke="#ef4444" strokeWidth="4" strokeOpacity="0.8" strokeLinecap="round"/>
        <line x1="88" y1="38" x2="88" y2="44" stroke="#3b82f6" strokeWidth="4" strokeOpacity="0.8" strokeLinecap="round"/>
        {/* Arrow pointing to magnet */}
        <line x1="77" y1="32" x2="85" y2="32" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="2,2"/>
      </svg>
    ),
  },
  "/generate": {
    gradient: "from-violet-500 via-purple-600 to-pink-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        <text x="30" y="50" fill="white" fontSize="36" fillOpacity="0.7">✦</text>
        <text x="70" y="35" fill="white" fontSize="24" fillOpacity="0.5">✦</text>
        <text x="90" y="60" fill="white" fontSize="16" fillOpacity="0.4">✦</text>
        <circle cx="60" cy="40" r="20" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" fill="none"/>
        <circle cx="60" cy="40" r="12" stroke="white" strokeOpacity="0.2" strokeWidth="1" fill="none"/>
      </svg>
    ),
  },
  "/listing-presentation": {
    gradient: "from-slate-600 via-gray-700 to-zinc-800",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Slide deck */}
        <rect x="20" y="15" width="65" height="45" rx="4" fill="white" fillOpacity="0.85"/>
        <rect x="20" y="15" width="65" height="12" rx="4" fill="#475569" fillOpacity="0.5"/>
        <rect x="26" y="34" width="25" height="20" rx="2" fill="#94a3b8" fillOpacity="0.3"/>
        <rect x="55" y="34" width="24" height="8" rx="1.5" fill="#94a3b8" fillOpacity="0.3"/>
        <rect x="55" y="46" width="18" height="4" rx="1" fill="#94a3b8" fillOpacity="0.2"/>
        {/* Star rating */}
        <text x="88" y="35" fill="#fbbf24" fontSize="14" fillOpacity="0.8">★</text>
        <text x="88" y="50" fill="#fbbf24" fontSize="14" fillOpacity="0.6">★</text>
        <text x="88" y="65" fill="#fbbf24" fontSize="14" fillOpacity="0.4">★</text>
      </svg>
    ),
  },
  "/buyer-presentation": {
    gradient: "from-cyan-500 via-teal-600 to-emerald-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* House with key */}
        <polygon points="60,12 90,35 30,35" fill="white" fillOpacity="0.85"/>
        <rect x="35" y="35" width="50" height="32" fill="white" fillOpacity="0.8"/>
        <rect x="52" y="50" width="16" height="17" rx="2" fill="#0891b2" fillOpacity="0.5"/>
        {/* Key */}
        <circle cx="95" cy="25" r="7" stroke="white" strokeWidth="2.5" fill="none" strokeOpacity="0.85"/>
        <line x1="100" y1="30" x2="110" y2="40" stroke="white" strokeWidth="2.5" strokeOpacity="0.85" strokeLinecap="round"/>
        <line x1="107" y1="37" x2="110" y2="34" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round"/>
        <line x1="109" y1="39" x2="112" y2="36" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round"/>
      </svg>
    ),
  },
  "/content-templates": {
    gradient: "from-fuchsia-500 via-purple-500 to-violet-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Grid of template cards */}
        <rect x="10" y="12" width="28" height="22" rx="3" fill="white" fillOpacity="0.8"/>
        <rect x="46" y="12" width="28" height="22" rx="3" fill="white" fillOpacity="0.8"/>
        <rect x="82" y="12" width="28" height="22" rx="3" fill="white" fillOpacity="0.8"/>
        <rect x="10" y="42" width="28" height="22" rx="3" fill="white" fillOpacity="0.7"/>
        <rect x="46" y="42" width="28" height="22" rx="3" fill="white" fillOpacity="0.7"/>
        <rect x="82" y="42" width="28" height="22" rx="3" fill="white" fillOpacity="0.7"/>
        {/* Color bars on each card */}
        <rect x="10" y="12" width="28" height="6" rx="3" fill="#a855f7" fillOpacity="0.6"/>
        <rect x="46" y="12" width="28" height="6" rx="3" fill="#ec4899" fillOpacity="0.6"/>
        <rect x="82" y="12" width="28" height="6" rx="3" fill="#8b5cf6" fillOpacity="0.6"/>
        <rect x="10" y="42" width="28" height="6" rx="3" fill="#f59e0b" fillOpacity="0.6"/>
        <rect x="46" y="42" width="28" height="6" rx="3" fill="#10b981" fillOpacity="0.6"/>
        <rect x="82" y="42" width="28" height="6" rx="3" fill="#3b82f6" fillOpacity="0.6"/>
      </svg>
    ),
  },
  "/coach": {
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Trophy */}
        <path d="M45 15 L75 15 L75 42 Q75 58 60 62 Q45 58 45 42 Z" fill="white" fillOpacity="0.85"/>
        <rect x="55" y="62" width="10" height="8" fill="white" fillOpacity="0.75"/>
        <rect x="48" y="70" width="24" height="4" rx="2" fill="white" fillOpacity="0.75"/>
        {/* Handles */}
        <path d="M45 22 Q35 22 35 32 Q35 42 45 42" stroke="white" strokeWidth="3" fill="none" strokeOpacity="0.7"/>
        <path d="M75 22 Q85 22 85 32 Q85 42 75 42" stroke="white" strokeWidth="3" fill="none" strokeOpacity="0.7"/>
        {/* Star */}
        <text x="53" y="44" fill="#f59e0b" fontSize="18" fillOpacity="0.8">★</text>
        {/* Chart bars */}
        <rect x="92" y="50" width="6" height="18" rx="1" fill="white" fillOpacity="0.5"/>
        <rect x="101" y="42" width="6" height="26" rx="1" fill="white" fillOpacity="0.6"/>
        <rect x="110" y="35" width="6" height="33" rx="1" fill="white" fillOpacity="0.7"/>
      </svg>
    ),
  },
  "/newsletter": {
    gradient: "from-blue-500 via-indigo-600 to-violet-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Envelope */}
        <rect x="15" y="20" width="90" height="55" rx="5" fill="white" fillOpacity="0.85"/>
        <polyline points="15,20 60,52 105,20" stroke="#4f46e5" strokeWidth="2" strokeOpacity="0.6" fill="none"/>
        <line x1="15" y1="75" x2="45" y2="48" stroke="#4f46e5" strokeWidth="1.5" strokeOpacity="0.4"/>
        <line x1="105" y1="75" x2="75" y2="48" stroke="#4f46e5" strokeWidth="1.5" strokeOpacity="0.4"/>
        {/* @ symbol */}
        <circle cx="60" cy="38" r="8" stroke="#4f46e5" strokeWidth="2" fill="none" strokeOpacity="0.4"/>
        <circle cx="60" cy="38" r="3" fill="#4f46e5" fillOpacity="0.4"/>
      </svg>
    ),
  },
  "/repurpose": {
    gradient: "from-green-500 via-emerald-600 to-teal-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Recycle/repurpose arrows */}
        <path d="M60 15 L80 35 L65 35 Q65 55 45 55 Q55 35 45 35 L60 35 Z" fill="white" fillOpacity="0.7"/>
        <path d="M60 65 L40 45 L55 45 Q55 25 75 25 Q65 45 75 45 L60 45 Z" fill="white" fillOpacity="0.7"/>
        {/* Content icons */}
        <rect x="88" y="15" width="20" height="14" rx="2" fill="white" fillOpacity="0.6"/>
        <text x="93" y="25" fill="#10b981" fontSize="8" fillOpacity="0.8">▶</text>
        <rect x="88" y="35" width="20" height="14" rx="2" fill="white" fillOpacity="0.6"/>
        <rect x="91" y="39" width="14" height="2" rx="1" fill="#10b981" fillOpacity="0.6"/>
        <rect x="91" y="43" width="10" height="2" rx="1" fill="#10b981" fillOpacity="0.4"/>
        <rect x="88" y="55" width="20" height="14" rx="2" fill="white" fillOpacity="0.6"/>
        <text x="93" y="65" fill="#10b981" fontSize="8" fillOpacity="0.8">📷</text>
      </svg>
    ),
  },
  "/prospecting-letters": {
    gradient: "from-rose-500 via-pink-600 to-fuchsia-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Letter stack */}
        <rect x="22" y="25" width="55" height="40" rx="3" fill="white" fillOpacity="0.6" transform="rotate(-5,49,45)"/>
        <rect x="25" y="20" width="55" height="40" rx="3" fill="white" fillOpacity="0.75" transform="rotate(-2,52,40)"/>
        <rect x="28" y="15" width="55" height="40" rx="3" fill="white" fillOpacity="0.9"/>
        {/* Lines on top letter */}
        <rect x="35" y="22" width="35" height="2.5" rx="1" fill="#f43f5e" fillOpacity="0.5"/>
        <rect x="35" y="28" width="28" height="2" rx="1" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="35" y="33" width="32" height="2" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
        <rect x="35" y="38" width="24" height="2" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
        {/* Pen */}
        <line x1="85" y1="15" x2="105" y2="55" stroke="white" strokeWidth="3" strokeOpacity="0.8" strokeLinecap="round"/>
        <polygon points="85,15 88,22 82,22" fill="#fbbf24" fillOpacity="0.8"/>
        <line x1="103" y1="52" x2="107" y2="58" stroke="white" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  "/letters-emails": {
    gradient: "from-sky-500 via-blue-500 to-indigo-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Open envelope */}
        <rect x="20" y="25" width="70" height="45" rx="4" fill="white" fillOpacity="0.85"/>
        <polyline points="20,25 55,50 90,25" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.5" fill="none"/>
        {/* Flap open */}
        <polygon points="20,25 55,10 90,25" fill="white" fillOpacity="0.6"/>
        {/* Letter peeking out */}
        <rect x="33" y="18" width="44" height="30" rx="2" fill="white" fillOpacity="0.9"/>
        <rect x="38" y="23" width="30" height="2.5" rx="1" fill="#3b82f6" fillOpacity="0.5"/>
        <rect x="38" y="28" width="24" height="2" rx="1" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="38" y="33" width="28" height="2" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
        {/* Heart */}
        <text x="88" y="22" fill="#ef4444" fontSize="14" fillOpacity="0.7">♥</text>
      </svg>
    ),
  },
  "/podcast-builder": {
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Microphone */}
        <rect x="50" y="12" width="20" height="32" rx="10" fill="white" fillOpacity="0.85"/>
        <rect x="54" y="16" width="12" height="24" rx="6" fill="#7c3aed" fillOpacity="0.3"/>
        {/* Mic stand */}
        <path d="M40 44 Q60 56 80 44" stroke="white" strokeWidth="2" strokeOpacity="0.7" fill="none"/>
        <line x1="60" y1="56" x2="60" y2="68" stroke="white" strokeWidth="2" strokeOpacity="0.7"/>
        <line x1="48" y1="68" x2="72" y2="68" stroke="white" strokeWidth="2" strokeOpacity="0.7"/>
        {/* Sound waves */}
        <path d="M30 30 Q25 40 30 50" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" fill="none"/>
        <path d="M22 26 Q15 40 22 54" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>
        <path d="M90 30 Q95 40 90 50" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" fill="none"/>
        <path d="M98 26 Q105 40 98 54" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>
        {/* Book pages hint */}
        <rect x="5" y="55" width="22" height="16" rx="2" fill="white" fillOpacity="0.4"/>
        <rect x="8" y="59" width="14" height="1.5" rx="0.5" fill="#7c3aed" fillOpacity="0.5"/>
        <rect x="8" y="63" width="10" height="1.5" rx="0.5" fill="#94a3b8" fillOpacity="0.4"/>
        <rect x="8" y="67" width="12" height="1.5" rx="0.5" fill="#94a3b8" fillOpacity="0.3"/>
      </svg>
    ),
  },
  "/guide-generator": {
    gradient: "from-amber-500 via-orange-500 to-red-500",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Book */}
        <rect x="25" y="12" width="45" height="58" rx="3" fill="white" fillOpacity="0.85"/>
        <rect x="25" y="12" width="8" height="58" rx="3" fill="#f97316" fillOpacity="0.4"/>
        {/* Pages */}
        <rect x="37" y="22" width="26" height="2.5" rx="1" fill="#f97316" fillOpacity="0.5"/>
        <rect x="37" y="28" width="20" height="2" rx="1" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="37" y="33" width="24" height="2" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
        <rect x="37" y="38" width="18" height="2" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
        <rect x="37" y="43" width="22" height="2" rx="1" fill="#94a3b8" fillOpacity="0.3"/>
        {/* Lightbulb */}
        <circle cx="88" cy="30" r="12" fill="white" fillOpacity="0.3"/>
        <circle cx="88" cy="28" r="7" fill="#fbbf24" fillOpacity="0.7"/>
        <rect x="85" y="35" width="6" height="3" rx="1" fill="#fbbf24" fillOpacity="0.6"/>
        <rect x="86" y="38" width="4" height="2" rx="1" fill="#fbbf24" fillOpacity="0.5"/>
        {/* Rays */}
        <line x1="88" y1="16" x2="88" y2="13" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.6"/>
        <line x1="96" y1="20" x2="98" y2="18" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.6"/>
        <line x1="100" y1="28" x2="103" y2="28" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.6"/>
        <line x1="80" y1="20" x2="78" y2="18" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.6"/>
        <line x1="76" y1="28" x2="73" y2="28" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.6"/>
      </svg>
    ),
  },
  "/brand-story": {
    gradient: "from-purple-600 via-violet-600 to-indigo-700",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Speech bubble */}
        <rect x="15" y="12" width="65" height="42" rx="8" fill="white" fillOpacity="0.85"/>
        <polygon points="30,54 25,68 45,54" fill="white" fillOpacity="0.85"/>
        {/* Quote marks */}
        <text x="24" y="32" fill="#7c3aed" fontSize="20" fillOpacity="0.5">"</text>
        <text x="60" y="50" fill="#7c3aed" fontSize="20" fillOpacity="0.5">"</text>
        {/* Lines */}
        <rect x="36" y="28" width="32" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="36" y="34" width="26" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
        <rect x="36" y="40" width="28" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
        {/* Star */}
        <text x="88" y="35" fill="#fbbf24" fontSize="22" fillOpacity="0.7">★</text>
      </svg>
    ),
  },
  "/market-stats": {
    gradient: "from-blue-600 via-indigo-600 to-purple-700",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Chart */}
        <rect x="15" y="15" width="90" height="55" rx="4" fill="white" fillOpacity="0.15"/>
        {/* Bars */}
        <rect x="25" y="45" width="12" height="20" rx="2" fill="white" fillOpacity="0.6"/>
        <rect x="42" y="35" width="12" height="30" rx="2" fill="white" fillOpacity="0.7"/>
        <rect x="59" y="25" width="12" height="40" rx="2" fill="white" fillOpacity="0.8"/>
        <rect x="76" y="30" width="12" height="35" rx="2" fill="white" fillOpacity="0.75"/>
        <rect x="93" y="20" width="12" height="45" rx="2" fill="white" fillOpacity="0.9"/>
        {/* Trend line */}
        <polyline points="31,42 48,32 65,22 82,27 99,17" stroke="#fbbf24" strokeWidth="2" fill="none" strokeOpacity="0.8"/>
        <circle cx="99" cy="17" r="3" fill="#fbbf24" fillOpacity="0.9"/>
        {/* Up arrow */}
        <text x="10" y="30" fill="#4ade80" fontSize="16" fillOpacity="0.7">↑</text>
      </svg>
    ),
  },
  "/video-script-builder": {
    gradient: "from-red-500 via-rose-600 to-pink-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Clapperboard */}
        <rect x="20" y="22" width="70" height="48" rx="4" fill="white" fillOpacity="0.85"/>
        <rect x="20" y="22" width="70" height="16" rx="4" fill="#1e293b" fillOpacity="0.7"/>
        {/* Clapper stripes */}
        <line x1="35" y1="22" x2="28" y2="38" stroke="white" strokeWidth="3" strokeOpacity="0.6"/>
        <line x1="50" y1="22" x2="43" y2="38" stroke="white" strokeWidth="3" strokeOpacity="0.6"/>
        <line x1="65" y1="22" x2="58" y2="38" stroke="white" strokeWidth="3" strokeOpacity="0.6"/>
        <line x1="80" y1="22" x2="73" y2="38" stroke="white" strokeWidth="3" strokeOpacity="0.6"/>
        {/* Script lines */}
        <rect x="28" y="46" width="45" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.6"/>
        <rect x="28" y="52" width="36" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="28" y="58" width="40" height="2.5" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
        {/* Play button */}
        <circle cx="100" cy="30" r="10" fill="white" fillOpacity="0.2"/>
        <polygon points="97,25 97,35 107,30" fill="white" fillOpacity="0.8"/>
      </svg>
    ),
  },
  "/thumbnails": {
    gradient: "from-yellow-400 via-amber-500 to-orange-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Large thumbnail frame */}
        <rect x="15" y="15" width="70" height="50" rx="4" fill="white" fillOpacity="0.85"/>
        {/* Gradient fill inside */}
        <rect x="19" y="19" width="62" height="42" rx="2" fill="#f59e0b" fillOpacity="0.2"/>
        {/* Bold text lines */}
        <rect x="22" y="28" width="50" height="8" rx="2" fill="#f59e0b" fillOpacity="0.5"/>
        <rect x="22" y="40" width="38" height="5" rx="1.5" fill="#94a3b8" fillOpacity="0.4"/>
        <rect x="22" y="48" width="44" height="5" rx="1.5" fill="#94a3b8" fillOpacity="0.3"/>
        {/* Sparkle */}
        <text x="82" y="35" fill="white" fontSize="22" fillOpacity="0.7">✦</text>
        <text x="88" y="55" fill="white" fontSize="14" fillOpacity="0.5">✦</text>
        <text x="10" y="55" fill="white" fontSize="12" fillOpacity="0.4">✦</text>
      </svg>
    ),
  },
  "/cinematic-walkthrough": {
    gradient: "from-slate-700 via-gray-800 to-zinc-900",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Film strip */}
        <rect x="10" y="20" width="100" height="40" rx="3" fill="white" fillOpacity="0.15"/>
        {/* Sprocket holes */}
        {[15, 28, 41, 54, 67, 80, 93, 106].map((x, i) => (
          <rect key={i} x={x} y="22" width="8" height="6" rx="1" fill="white" fillOpacity="0.4"/>
        ))}
        {[15, 28, 41, 54, 67, 80, 93, 106].map((x, i) => (
          <rect key={i} x={x} y="52" width="8" height="6" rx="1" fill="white" fillOpacity="0.4"/>
        ))}
        {/* Frames */}
        <rect x="15" y="32" width="22" height="16" rx="1" fill="white" fillOpacity="0.3"/>
        <rect x="42" y="32" width="22" height="16" rx="1" fill="white" fillOpacity="0.5"/>
        <rect x="69" y="32" width="22" height="16" rx="1" fill="white" fillOpacity="0.7"/>
        {/* Play in center frame */}
        <polygon points="74,36 74,46 84,41" fill="white" fillOpacity="0.9"/>
      </svg>
    ),
  },
  "/script-to-reel": {
    gradient: "from-pink-500 via-fuchsia-600 to-purple-700",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Script → Reel arrow */}
        {/* Script */}
        <rect x="8" y="20" width="38" height="42" rx="3" fill="white" fillOpacity="0.85"/>
        <rect x="14" y="28" width="26" height="2.5" rx="1" fill="#a855f7" fillOpacity="0.5"/>
        <rect x="14" y="34" width="20" height="2" rx="1" fill="#94a3b8" fillOpacity="0.5"/>
        <rect x="14" y="39" width="24" height="2" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
        <rect x="14" y="44" width="18" height="2" rx="1" fill="#94a3b8" fillOpacity="0.4"/>
        {/* Arrow */}
        <line x1="50" y1="41" x2="68" y2="41" stroke="white" strokeWidth="2.5" strokeOpacity="0.8"/>
        <polygon points="66,37 74,41 66,45" fill="white" fillOpacity="0.8"/>
        {/* Reel/phone */}
        <rect x="74" y="15" width="38" height="52" rx="5" fill="white" fillOpacity="0.85"/>
        <rect x="78" y="21" width="30" height="40" rx="2" fill="#a855f7" fillOpacity="0.2"/>
        <circle cx="93" cy="41" r="10" stroke="#a855f7" strokeWidth="2" fill="none" strokeOpacity="0.5"/>
        <polygon points="90,36 90,46 100,41" fill="#a855f7" fillOpacity="0.6"/>
      </svg>
    ),
  },
  "/bulk-import": {
    gradient: "from-teal-500 via-cyan-600 to-blue-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* CSV/spreadsheet */}
        <rect x="20" y="12" width="55" height="58" rx="3" fill="white" fillOpacity="0.85"/>
        {/* Header row */}
        <rect x="20" y="12" width="55" height="10" rx="3" fill="#0891b2" fillOpacity="0.4"/>
        {/* Grid lines */}
        <line x1="38" y1="12" x2="38" y2="70" stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.4"/>
        <line x1="56" y1="12" x2="56" y2="70" stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.4"/>
        <line x1="20" y1="32" x2="75" y2="32" stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.3"/>
        <line x1="20" y1="44" x2="75" y2="44" stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.3"/>
        <line x1="20" y1="56" x2="75" y2="56" stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.3"/>
        {/* Upload arrow */}
        <circle cx="95" cy="40" r="16" fill="white" fillOpacity="0.2"/>
        <line x1="95" y1="50" x2="95" y2="30" stroke="white" strokeWidth="2.5" strokeOpacity="0.8" strokeLinecap="round"/>
        <polygon points="89,36 95,28 101,36" fill="white" fillOpacity="0.8"/>
      </svg>
    ),
  },
  "/youtube-video-builder": {
    gradient: "from-red-600 via-rose-600 to-red-700",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* YouTube play button */}
        <rect x="15" y="18" width="90" height="50" rx="10" fill="white" fillOpacity="0.2"/>
        <rect x="25" y="25" width="70" height="36" rx="6" fill="white" fillOpacity="0.85"/>
        <circle cx="60" cy="43" r="14" fill="#ef4444" fillOpacity="0.8"/>
        <polygon points="55,37 55,49 69,43" fill="white"/>
        {/* Subscription bell */}
        <text x="88" y="20" fill="white" fontSize="14" fillOpacity="0.7">🔔</text>
      </svg>
    ),
  },
  "/authority-profile": {
    gradient: "from-amber-500 via-yellow-500 to-orange-500",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Shield */}
        <path d="M60 10 L90 22 L90 48 Q90 65 60 72 Q30 65 30 48 L30 22 Z" fill="white" fillOpacity="0.85"/>
        {/* Star in shield */}
        <text x="50" y="52" fill="#f59e0b" fontSize="24" fillOpacity="0.8">★</text>
        {/* Check */}
        <path d="M46 42 L55 52 L74 32" stroke="#f59e0b" strokeWidth="3" fill="none" strokeOpacity="0.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  "/hooks": {
    gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
    illustration: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        {/* Hook/fishing metaphor */}
        <path d="M60 15 Q80 15 80 35 Q80 55 60 55 Q40 55 40 45" stroke="white" strokeWidth="3" fill="none" strokeOpacity="0.8" strokeLinecap="round"/>
        <polygon points="36,40 40,50 44,40" fill="white" fillOpacity="0.8"/>
        {/* Sparkle text */}
        <text x="15" y="30" fill="white" fontSize="13" fillOpacity="0.6">✦</text>
        <text x="85" y="22" fill="white" fontSize="10" fillOpacity="0.5">✦</text>
        <text x="95" y="55" fill="white" fontSize="16" fillOpacity="0.4">✦</text>
        {/* Exclamation */}
        <circle cx="60" cy="35" r="12" fill="white" fillOpacity="0.2"/>
        <text x="55" y="41" fill="white" fontSize="16" fontWeight="bold" fillOpacity="0.7">!</text>
      </svg>
    ),
  },
};

// Fallback visual for any tool not in the map
function FallbackIllustration({ color }: { color: string }) {
  const gradients: Record<string, string> = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-green-500 to-teal-600",
    orange: "from-orange-500 to-red-500",
    purple: "from-purple-500 to-fuchsia-600",
    red: "from-red-500 to-rose-600",
  };
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradients[color] || gradients.blue} flex items-center justify-center`}>
      <svg viewBox="0 0 60 40" className="w-16 h-10 opacity-40" fill="none">
        <circle cx="30" cy="20" r="14" stroke="white" strokeWidth="2"/>
        <text x="22" y="25" fill="white" fontSize="14">✦</text>
      </svg>
    </div>
  );
}

export function SectionOverview({ section }: SectionOverviewProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAuthority = user?.subscriptionTier === "authority" || user?.subscriptionTier === "pro";
  const c = colorMap[section.color] ?? colorMap.blue;
  const { entries: recentEntries } = useRecentTools();

  const sectionPaths = new Set(section.tools.map((t) => t.path));
  const recentInSection = recentEntries
    .filter((e) => sectionPaths.has(e.path))
    .slice(0, 3);

  const handleOpen = (tool: SectionTool, isLocked: boolean) => {
    if (isLocked) return;
    recordToolVisit(tool.path, tool.label);
    setLocation(tool.path);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className={`rounded-2xl p-6 ${c.bg} border ${c.border}`}>
        <p className={`text-xs font-bold uppercase tracking-widest ${c.text} mb-1`}>
          {section.title}
        </p>
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          {section.subtitle}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          {section.tagline}
        </p>
      </div>

      {/* Recently Used */}
      {recentInSection.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Recently Used
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentInSection.map((entry) => {
              const tool = section.tools.find((t) => t.path === entry.path);
              if (!tool) return null;
              const Icon = tool.icon;
              const isLocked = tool.badge === "Authority" && !isAuthority;
              return (
                <button
                  key={entry.path}
                  onClick={() => handleOpen(tool, isLocked)}
                  disabled={isLocked}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                    ${isLocked
                      ? "opacity-50 cursor-not-allowed border-border bg-muted text-muted-foreground"
                      : `${c.bg} ${c.border} ${c.text} hover:shadow-sm hover:scale-[1.02]`
                    }`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  {tool.label}
                  {isLocked && <Lock className="h-3 w-3 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tool grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {section.tools.map((tool) => {
          const isLocked = tool.badge === "Authority" && !isAuthority;
          const visual = toolVisuals[tool.path];

          return (
            <Card
              key={tool.path}
              className={`group relative cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border overflow-hidden ${
                tool.highlight ? `${c.border} shadow-sm` : "border-border"
              } ${isLocked ? "opacity-80" : ""}`}
              onClick={() => handleOpen(tool, isLocked)}
            >
              {/* Visual header banner */}
              <div className={`relative h-28 overflow-hidden bg-gradient-to-br ${visual?.gradient || "from-gray-500 to-gray-700"}`}>
                {visual ? (
                  <div className="absolute inset-0 p-2">
                    {visual.illustration}
                  </div>
                ) : (
                  <FallbackIllustration color={section.color} />
                )}
                {/* Badges overlaid on banner */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  {tool.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 bg-white/20 text-white border-white/30 backdrop-blur-sm"
                    >
                      {tool.badge}
                    </Badge>
                  )}
                  {isLocked && (
                    <div className="w-5 h-5 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                      <Lock className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                {/* Highlight stripe */}
                {tool.highlight && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40" />
                )}
              </div>

              <CardContent className="p-4 flex flex-col gap-3">
                <div>
                  <p className="font-semibold text-sm text-foreground leading-tight">
                    {tool.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <div className="mt-auto">
                  {isLocked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs gap-1.5"
                      onClick={(e) => { e.stopPropagation(); setLocation("/upgrade"); }}
                    >
                      <Lock className="h-3 w-3" />
                      Upgrade to unlock
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className={`w-full text-xs gap-1.5 text-white ${c.btn} group-hover:gap-2 transition-all`}
                      onClick={(e) => { e.stopPropagation(); handleOpen(tool, false); }}
                    >
                      Open {tool.label}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
