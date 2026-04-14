import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import type { LucideIcon } from "lucide-react";

export interface SectionTool {
  icon: LucideIcon;
  label: string;
  path: string;
  description: string;
  badge?: string;
  highlight?: boolean; // marks the flagship tool
}

export interface SectionConfig {
  title: string;
  subtitle: string;
  tagline: string;
  color: string;        // Tailwind accent color class e.g. "blue"
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

export function SectionOverview({ section }: SectionOverviewProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAuthority = user?.subscriptionTier === "authority" || user?.subscriptionTier === "pro";
  const c = colorMap[section.color] ?? colorMap.blue;

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

      {/* Tool grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {section.tools.map((tool) => {
          const isLocked = tool.badge === "Authority" && !isAuthority;
          return (
            <Card
              key={tool.path}
              className={`group relative cursor-pointer transition-all hover:shadow-md border ${
                tool.highlight ? `${c.border} shadow-sm` : "border-border"
              } ${isLocked ? "opacity-75" : ""}`}
              onClick={() => !isLocked && setLocation(tool.path)}
            >
              {tool.highlight && (
                <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${c.btn}`} />
              )}
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className={`p-2 rounded-lg ${c.bg}`}>
                    <tool.icon className={`h-5 w-5 ${c.text}`} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {tool.badge && (
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-4 ${c.badge}`}
                      >
                        {tool.badge}
                      </Badge>
                    )}
                    {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground leading-tight">
                    {tool.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <div className="mt-auto pt-1">
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
                      onClick={(e) => { e.stopPropagation(); setLocation(tool.path); }}
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
