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

// Section accent colors — used only for small category tags and buttons
const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; btn: string; tag: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",   btn: "bg-blue-600 hover:bg-blue-700",   tag: "bg-blue-500" },
  green:  { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200",  badge: "bg-green-100 text-green-700",  btn: "bg-green-600 hover:bg-green-700",  tag: "bg-green-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", badge: "bg-orange-100 text-orange-700", btn: "bg-orange-600 hover:bg-orange-700", tag: "bg-orange-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", btn: "bg-purple-600 hover:bg-purple-700", tag: "bg-purple-500" },
  red:    { bg: "bg-red-50",    text: "text-red-600",    border: "border-red-200",    badge: "bg-red-100 text-red-700",    btn: "bg-red-600 hover:bg-red-700",    tag: "bg-red-500" },
};

// ── Per-tool white SVG illustrations on dark navy background ──────────────────
const toolIllustrations: Record<string, React.ReactNode> = {
  "/property-tours": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* House */}
      <polygon points="60,14 92,38 28,38" fill="white" fillOpacity="0.15"/>
      <polygon points="60,14 92,38 28,38" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" fill="none"/>
      <rect x="32" y="38" width="56" height="28" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      {/* Door */}
      <rect x="52" y="50" width="16" height="16" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.5" strokeWidth="1"/>
      {/* Windows */}
      <rect x="36" y="43" width="11" height="10" rx="1.5" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
      <rect x="73" y="43" width="11" height="10" rx="1.5" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
      {/* Camera */}
      <rect x="88" y="12" width="18" height="13" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.5" strokeWidth="1"/>
      <circle cx="97" cy="18.5" r="4" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" fill="none"/>
      <circle cx="97" cy="18.5" r="1.5" fill="white" fillOpacity="0.5"/>
      {/* Sun */}
      <circle cx="16" cy="16" r="6" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="white" fillOpacity="0.1"/>
    </svg>
  ),
  "/live-tour": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Phone */}
      <rect x="42" y="10" width="36" height="60" rx="6" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <rect x="46" y="16" width="28" height="44" rx="2" fill="white" fillOpacity="0.06"/>
      {/* Live dot */}
      <circle cx="60" cy="38" r="9" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
      <circle cx="60" cy="38" r="4" fill="white" fillOpacity="0.7"/>
      {/* Signal rings */}
      <circle cx="60" cy="38" r="14" stroke="white" strokeOpacity="0.25" strokeWidth="1.2" fill="none"/>
      <circle cx="60" cy="38" r="20" stroke="white" strokeOpacity="0.12" strokeWidth="1" fill="none"/>
      {/* LIVE label */}
      <rect x="50" y="59" width="20" height="7" rx="3" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.4" strokeWidth="0.8"/>
      <text x="60" y="64.5" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold" fillOpacity="0.8">LIVE</text>
    </svg>
  ),
  "/autoreels": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Phone vertical */}
      <rect x="45" y="8" width="30" height="64" rx="5" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <rect x="49" y="14" width="22" height="48" rx="2" fill="white" fillOpacity="0.06"/>
      {/* Play button */}
      <circle cx="60" cy="38" r="12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
      <polygon points="56,32 56,44 68,38" fill="white" fillOpacity="0.7"/>
      {/* Music notes */}
      <text x="83" y="28" fill="white" fontSize="18" fillOpacity="0.35">♪</text>
      <text x="20" y="50" fill="white" fontSize="14" fillOpacity="0.25">♫</text>
    </svg>
  ),
  "/full-avatar-video": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Person silhouette */}
      <circle cx="60" cy="26" r="14" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
      <ellipse cx="60" cy="62" rx="22" ry="14" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.3" strokeWidth="1.2"/>
      {/* Face dots */}
      <circle cx="55" cy="24" r="2" fill="white" fillOpacity="0.6"/>
      <circle cx="65" cy="24" r="2" fill="white" fillOpacity="0.6"/>
      <path d="M54 31 Q60 36 66 31" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" fill="none" strokeLinecap="round"/>
      {/* Mic */}
      <rect x="97" y="28" width="8" height="14" rx="4" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.5" strokeWidth="1"/>
      <path d="M93 40 Q93 50 101 50 Q109 50 109 40" stroke="white" strokeWidth="1.5" fill="none" strokeOpacity="0.5"/>
      <line x1="101" y1="50" x2="101" y2="56" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
      {/* Sparkle */}
      <text x="10" y="30" fill="white" fontSize="13" fillOpacity="0.3">✦</text>
    </svg>
  ),
  "/blog-builder": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Document */}
      <rect x="28" y="10" width="50" height="62" rx="4" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      {/* Text lines */}
      <rect x="36" y="22" width="34" height="3" rx="1.5" fill="white" fillOpacity="0.5"/>
      <rect x="36" y="30" width="28" height="2.5" rx="1.5" fill="white" fillOpacity="0.25"/>
      <rect x="36" y="36" width="32" height="2.5" rx="1.5" fill="white" fillOpacity="0.25"/>
      <rect x="36" y="42" width="25" height="2.5" rx="1.5" fill="white" fillOpacity="0.2"/>
      <rect x="36" y="48" width="30" height="2.5" rx="1.5" fill="white" fillOpacity="0.2"/>
      <rect x="36" y="54" width="20" height="2.5" rx="1.5" fill="white" fillOpacity="0.15"/>
      {/* SEO magnifier */}
      <circle cx="90" cy="22" r="10" stroke="white" strokeWidth="1.8" fill="none" strokeOpacity="0.6"/>
      <line x1="97" y1="29" x2="106" y2="38" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.6"/>
      <text x="85" y="25" fill="white" fontSize="7" fillOpacity="0.6">SEO</text>
    </svg>
  ),
  "/image-library": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Photo frames stacked */}
      <rect x="10" y="20" width="38" height="28" rx="3" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <polygon points="16,44 27,28 38,44" fill="white" fillOpacity="0.25"/>
      <circle cx="34" cy="28" r="4" stroke="white" strokeOpacity="0.4" strokeWidth="1" fill="white" fillOpacity="0.1"/>
      <rect x="54" y="14" width="38" height="28" rx="3" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <polygon points="60,38 71,22 82,38" fill="white" fillOpacity="0.25"/>
      <rect x="28" y="50" width="38" height="22" rx="3" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <polygon points="34,68 45,56 56,68" fill="white" fillOpacity="0.25"/>
      {/* Sparkle */}
      <text x="90" y="58" fill="white" fontSize="16" fillOpacity="0.3">✦</text>
    </svg>
  ),
  "/lead-magnet": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* PDF document */}
      <rect x="30" y="10" width="44" height="58" rx="4" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <rect x="30" y="10" width="44" height="14" rx="4" fill="white" fillOpacity="0.2"/>
      <text x="52" y="21" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fillOpacity="0.8">PDF</text>
      <rect x="38" y="30" width="28" height="2.5" rx="1" fill="white" fillOpacity="0.3"/>
      <rect x="38" y="36" width="22" height="2.5" rx="1" fill="white" fillOpacity="0.2"/>
      <rect x="38" y="42" width="26" height="2.5" rx="1" fill="white" fillOpacity="0.2"/>
      <rect x="38" y="48" width="18" height="2.5" rx="1" fill="white" fillOpacity="0.15"/>
      {/* Magnet */}
      <path d="M88 18 Q102 18 102 32 Q102 46 88 46" stroke="white" strokeWidth="3.5" fill="none" strokeOpacity="0.5" strokeLinecap="round"/>
      <line x1="88" y1="18" x2="88" y2="25" stroke="white" strokeWidth="3.5" strokeOpacity="0.6" strokeLinecap="round"/>
      <line x1="88" y1="39" x2="88" y2="46" stroke="white" strokeWidth="3.5" strokeOpacity="0.6" strokeLinecap="round"/>
    </svg>
  ),
  "/generate": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Sparkle burst */}
      <circle cx="60" cy="40" r="18" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.3" strokeWidth="1.5"/>
      <text x="46" y="48" fill="white" fontSize="22" fillOpacity="0.5">✦</text>
      <text x="20" y="28" fill="white" fontSize="14" fillOpacity="0.25">✦</text>
      <text x="86" y="60" fill="white" fontSize="10" fillOpacity="0.2">✦</text>
      <text x="90" y="25" fill="white" fontSize="16" fillOpacity="0.3">✦</text>
    </svg>
  ),
  "/authority-post-builder": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Social post card */}
      <rect x="20" y="14" width="80" height="52" rx="6" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <rect x="28" y="22" width="40" height="3" rx="1.5" fill="white" fillOpacity="0.5"/>
      <rect x="28" y="30" width="64" height="2.5" rx="1.5" fill="white" fillOpacity="0.2"/>
      <rect x="28" y="36" width="56" height="2.5" rx="1.5" fill="white" fillOpacity="0.2"/>
      <rect x="28" y="42" width="48" height="2.5" rx="1.5" fill="white" fillOpacity="0.15"/>
      {/* Like/share icons */}
      <text x="28" y="60" fill="white" fontSize="10" fillOpacity="0.4">♥</text>
      <text x="44" y="60" fill="white" fontSize="10" fillOpacity="0.3">↗</text>
      {/* Sparkle */}
      <text x="90" y="26" fill="white" fontSize="12" fillOpacity="0.35">✦</text>
    </svg>
  ),
  "/market-update": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Chart */}
      <polyline points="14,62 30,48 46,54 62,36 78,42 94,24 108,30" stroke="white" strokeWidth="2" strokeOpacity="0.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Area fill */}
      <polygon points="14,62 30,48 46,54 62,36 78,42 94,24 108,30 108,68 14,68" fill="white" fillOpacity="0.06"/>
      {/* Dots */}
      <circle cx="62" cy="36" r="3" fill="white" fillOpacity="0.6"/>
      <circle cx="94" cy="24" r="3" fill="white" fillOpacity="0.6"/>
      {/* Axes */}
      <line x1="14" y1="68" x2="108" y2="68" stroke="white" strokeOpacity="0.2" strokeWidth="1"/>
      <line x1="14" y1="14" x2="14" y2="68" stroke="white" strokeOpacity="0.2" strokeWidth="1"/>
    </svg>
  ),
  "/letters-emails": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Envelope */}
      <rect x="16" y="22" width="88" height="56" rx="5" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      {/* Flap */}
      <polyline points="16,22 60,50 104,22" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" fill="none"/>
      {/* Lines suggesting letter */}
      <rect x="36" y="58" width="48" height="2.5" rx="1" fill="white" fillOpacity="0.2"/>
      <rect x="36" y="64" width="36" height="2.5" rx="1" fill="white" fillOpacity="0.15"/>
    </svg>
  ),
  "/podcast-builder": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Mic */}
      <rect x="50" y="10" width="20" height="32" rx="10" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
      <path d="M36 38 Q36 60 60 60 Q84 60 84 38" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.5" strokeLinecap="round"/>
      <line x1="60" y1="60" x2="60" y2="70" stroke="white" strokeWidth="2" strokeOpacity="0.4"/>
      <line x1="48" y1="70" x2="72" y2="70" stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round"/>
      {/* Sound waves */}
      <path d="M24 32 Q20 40 24 48" stroke="white" strokeWidth="1.5" fill="none" strokeOpacity="0.35" strokeLinecap="round"/>
      <path d="M14 26 Q8 40 14 54" stroke="white" strokeWidth="1.2" fill="none" strokeOpacity="0.2" strokeLinecap="round"/>
      <path d="M96 32 Q100 40 96 48" stroke="white" strokeWidth="1.5" fill="none" strokeOpacity="0.35" strokeLinecap="round"/>
      <path d="M106 26 Q112 40 106 54" stroke="white" strokeWidth="1.2" fill="none" strokeOpacity="0.2" strokeLinecap="round"/>
    </svg>
  ),
  "/crm": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* People network */}
      <circle cx="60" cy="20" r="10" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
      <circle cx="24" cy="58" r="8" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.2"/>
      <circle cx="96" cy="58" r="8" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.2"/>
      <line x1="52" y1="28" x2="30" y2="50" stroke="white" strokeOpacity="0.3" strokeWidth="1.5"/>
      <line x1="68" y1="28" x2="90" y2="50" stroke="white" strokeOpacity="0.3" strokeWidth="1.5"/>
      <line x1="32" y1="58" x2="88" y2="58" stroke="white" strokeOpacity="0.2" strokeWidth="1.2" strokeDasharray="4,3"/>
    </svg>
  ),
  "/follow-up-sequences": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Flow arrows */}
      <circle cx="20" cy="40" r="10" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <circle cx="60" cy="40" r="10" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <circle cx="100" cy="40" r="10" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <line x1="30" y1="40" x2="48" y2="40" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <polygon points="46,36 50,40 46,44" fill="white" fillOpacity="0.5"/>
      <line x1="70" y1="40" x2="88" y2="40" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <polygon points="86,36 90,40 86,44" fill="white" fillOpacity="0.5"/>
      <text x="15" y="44" fill="white" fontSize="8" fillOpacity="0.6">1</text>
      <text x="55" y="44" fill="white" fontSize="8" fillOpacity="0.6">2</text>
      <text x="95" y="44" fill="white" fontSize="8" fillOpacity="0.6">3</text>
    </svg>
  ),
  "/listing-presentation": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Presentation slide */}
      <rect x="14" y="12" width="92" height="56" rx="5" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <rect x="22" y="20" width="50" height="4" rx="2" fill="white" fillOpacity="0.4"/>
      <rect x="22" y="30" width="76" height="2.5" rx="1" fill="white" fillOpacity="0.2"/>
      <rect x="22" y="36" width="60" height="2.5" rx="1" fill="white" fillOpacity="0.15"/>
      {/* Bar chart */}
      <rect x="22" y="44" width="12" height="16" rx="1" fill="white" fillOpacity="0.25"/>
      <rect x="38" y="38" width="12" height="22" rx="1" fill="white" fillOpacity="0.35"/>
      <rect x="54" y="50" width="12" height="10" rx="1" fill="white" fillOpacity="0.2"/>
      <rect x="70" y="42" width="12" height="18" rx="1" fill="white" fillOpacity="0.3"/>
    </svg>
  ),
  "/brand-story": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Book / story */}
      <rect x="18" y="14" width="84" height="54" rx="4" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <line x1="60" y1="14" x2="60" y2="68" stroke="white" strokeOpacity="0.3" strokeWidth="1"/>
      <rect x="26" y="22" width="26" height="3" rx="1.5" fill="white" fillOpacity="0.4"/>
      <rect x="26" y="30" width="22" height="2" rx="1" fill="white" fillOpacity="0.2"/>
      <rect x="26" y="35" width="26" height="2" rx="1" fill="white" fillOpacity="0.2"/>
      <rect x="26" y="40" width="18" height="2" rx="1" fill="white" fillOpacity="0.15"/>
      <rect x="68" y="22" width="26" height="3" rx="1.5" fill="white" fillOpacity="0.4"/>
      <rect x="68" y="30" width="22" height="2" rx="1" fill="white" fillOpacity="0.2"/>
      <rect x="68" y="35" width="26" height="2" rx="1" fill="white" fillOpacity="0.2"/>
      <text x="50" y="62" fill="white" fontSize="12" fillOpacity="0.3">✦</text>
    </svg>
  ),
  "/market-dominance": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Trophy */}
      <path d="M44 14 L76 14 L76 46 Q76 60 60 64 Q44 60 44 46 Z" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
      <line x1="60" y1="64" x2="60" y2="72" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
      <rect x="46" y="72" width="28" height="4" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.3" strokeWidth="1"/>
      {/* Handles */}
      <path d="M44 22 Q32 22 32 34 Q32 46 44 46" stroke="white" strokeOpacity="0.35" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M76 22 Q88 22 88 34 Q88 46 76 46" stroke="white" strokeOpacity="0.35" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Star */}
      <text x="50" y="46" fill="white" fontSize="18" fillOpacity="0.4">★</text>
    </svg>
  ),
  "/script-to-reel": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Script */}
      <rect x="8" y="18" width="38" height="44" rx="3" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <rect x="14" y="26" width="26" height="2.5" rx="1" fill="white" fillOpacity="0.4"/>
      <rect x="14" y="32" width="20" height="2" rx="1" fill="white" fillOpacity="0.2"/>
      <rect x="14" y="37" width="24" height="2" rx="1" fill="white" fillOpacity="0.2"/>
      <rect x="14" y="42" width="18" height="2" rx="1" fill="white" fillOpacity="0.15"/>
      {/* Arrow */}
      <line x1="50" y1="40" x2="68" y2="40" stroke="white" strokeWidth="2" strokeOpacity="0.5"/>
      <polygon points="65,36 73,40 65,44" fill="white" fillOpacity="0.6"/>
      {/* Reel/phone */}
      <rect x="74" y="14" width="38" height="52" rx="5" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <circle cx="93" cy="40" r="10" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" fill="none"/>
      <polygon points="89,35 89,45 99,40" fill="white" fillOpacity="0.5"/>
    </svg>
  ),
  "/bulk-import": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Spreadsheet */}
      <rect x="18" y="12" width="58" height="58" rx="3" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <rect x="18" y="12" width="58" height="10" rx="3" fill="white" fillOpacity="0.2"/>
      <line x1="38" y1="12" x2="38" y2="70" stroke="white" strokeOpacity="0.2" strokeWidth="0.8"/>
      <line x1="58" y1="12" x2="58" y2="70" stroke="white" strokeOpacity="0.2" strokeWidth="0.8"/>
      <line x1="18" y1="32" x2="76" y2="32" stroke="white" strokeOpacity="0.15" strokeWidth="0.8"/>
      <line x1="18" y1="44" x2="76" y2="44" stroke="white" strokeOpacity="0.15" strokeWidth="0.8"/>
      <line x1="18" y1="56" x2="76" y2="56" stroke="white" strokeOpacity="0.15" strokeWidth="0.8"/>
      {/* Upload arrow */}
      <circle cx="97" cy="40" r="16" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.3" strokeWidth="1.2"/>
      <line x1="97" y1="50" x2="97" y2="30" stroke="white" strokeWidth="2.5" strokeOpacity="0.6" strokeLinecap="round"/>
      <polygon points="91,36 97,28 103,36" fill="white" fillOpacity="0.6"/>
    </svg>
  ),
  "/youtube-video-builder": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Screen */}
      <rect x="14" y="16" width="92" height="52" rx="6" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      {/* Play button */}
      <circle cx="60" cy="42" r="16" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <polygon points="54,35 54,49 70,42" fill="white" fillOpacity="0.7"/>
    </svg>
  ),
  "/authority-profile": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Shield */}
      <path d="M60 10 L90 22 L90 48 Q90 65 60 72 Q30 65 30 48 L30 22 Z" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
      {/* Star */}
      <text x="48" y="52" fill="white" fontSize="22" fillOpacity="0.4">★</text>
      {/* Check */}
      <path d="M46 42 L55 52 L74 32" stroke="white" strokeWidth="2.5" fill="none" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/hooks": (
    <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
      {/* Hook */}
      <path d="M60 14 Q82 14 82 36 Q82 58 60 58 Q38 58 38 46" stroke="white" strokeWidth="2.5" fill="none" strokeOpacity="0.5" strokeLinecap="round"/>
      <polygon points="33,41 38,52 43,41" fill="white" fillOpacity="0.5"/>
      {/* Sparkles */}
      <text x="14" y="30" fill="white" fontSize="13" fillOpacity="0.25">✦</text>
      <text x="86" y="22" fill="white" fontSize="10" fillOpacity="0.2">✦</text>
      <text x="96" y="56" fill="white" fontSize="16" fillOpacity="0.15">✦</text>
    </svg>
  ),
};

// Fallback illustration
function FallbackIllustration() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 60 40" className="w-16 h-10 opacity-30" fill="none">
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
          const illustration = toolIllustrations[tool.path];

          return (
            <Card
              key={tool.path}
              className={`group relative cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border overflow-hidden ${
                tool.highlight ? `${c.border} shadow-sm` : "border-border"
              } ${isLocked ? "opacity-80" : ""}`}
              onClick={() => handleOpen(tool, isLocked)}
            >
              {/* Dark navy banner — consistent across all cards */}
              <div className="relative h-28 overflow-hidden bg-[#0f172a]">
                {/* Subtle noise texture overlay */}
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
                />
                {/* Illustration */}
                <div className="absolute inset-0 p-2">
                  {illustration ?? <FallbackIllustration />}
                </div>
                {/* Category color dot + section label */}
                <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${c.tag}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                    {section.title}
                  </span>
                </div>
                {/* Badges overlaid on banner */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  {tool.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 bg-white/15 text-white/80 border-white/20 backdrop-blur-sm"
                    >
                      {tool.badge}
                    </Badge>
                  )}
                  {isLocked && (
                    <div className="w-5 h-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Lock className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
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
