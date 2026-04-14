import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Video, MapPin } from "lucide-react";

interface AuthorityMetric {
  label: string;
  value: number;
  icon: React.ElementType;
}

export default function AuthorityScore() {
  // TODO: Fetch real data from backend
  const dominanceScore = 72;

  const metrics: AuthorityMetric[] = [
    { label: "Weekly Content Consistency", value: 80, icon: TrendingUp },
    { label: "Market Niche Clarity", value: 65, icon: Target },
    { label: "Video Presence", value: 70, icon: Video },
    { label: "Local Market Mentions", value: 75, icon: MapPin },
  ];

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Dominating";
    if (score >= 60) return "Building Dominance";
    return "Getting Started";
  };

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm">
      {/* Navy header band */}
      <div className="bg-[#0f172a] px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Market Dominance Score</h2>
          <p className="text-xs text-slate-400 mt-0.5">Your market dominance rating</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-orange-400 leading-none">
            {dominanceScore}
            <span className="text-xl text-slate-400 font-normal">/100</span>
          </div>
          <p className="text-xs font-medium text-orange-300 mt-1">{getScoreLabel(dominanceScore)}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">
        {/* Overall bar */}
        <div className="space-y-1.5">
          <Progress value={dominanceScore} className="h-2.5" />
          <p className="text-xs text-muted-foreground text-center">
            Keep posting consistently to increase your score
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-4 pt-1">
          <h3 className="text-[10px] font-bold text-[#0f172a] uppercase tracking-widest">
            Score Breakdown
          </h3>
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-[#0f172a]/60" />
                    <span className="text-sm font-medium text-slate-700">{metric.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#0f172a]">{metric.value}%</span>
                </div>
                <Progress value={metric.value} className="h-1.5" />
              </div>
            );
          })}
        </div>

        {/* Pro tip */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs text-center text-muted-foreground">
            <span className="font-semibold text-[#0f172a]">Pro Tip:</span> Post 3× per week to reach 80+ score
          </p>
        </div>
      </div>
    </Card>
  );
}
