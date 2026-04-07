import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Video, MapPin } from "lucide-react";

interface AuthorityMetric {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

export default function AuthorityScore() {
  // TODO: Fetch real data from backend
  const dominanceScore = 72;
  
  const metrics: AuthorityMetric[] = [
    {
      label: "Weekly Content Consistency",
      value: 80,
      icon: TrendingUp,
      color: "text-green-500"
    },
    {
      label: "Market Niche Clarity",
      value: 65,
      icon: Target,
      color: "text-primary"
    },
    {
      label: "Video Presence",
      value: 70,
      icon: Video,
      color: "text-primary/70"
    },
    {
      label: "Local Market Mentions",
      value: 75,
      icon: MapPin,
      color: "text-primary"
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-primary";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Dominating";
    if (score >= 60) return "Building Dominance";
    return "Getting Started";
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-500/5 to-orange-600/5 border-primary/20">
      <div className="space-y-6">
        {/* Market Dominance Score Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Market Dominance Score</h2>
            <p className="text-sm text-muted-foreground">
              Your market dominance rating
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(dominanceScore)}`}>
              {dominanceScore}
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <p className="text-sm font-medium text-primary">
              {getScoreLabel(dominanceScore)}
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <Progress value={dominanceScore} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            Keep posting consistently to increase your score
          </p>
        </div>

        {/* Metrics Breakdown */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Score Breakdown
          </h3>
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  <span className="text-sm font-semibold">{metric.value}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="pt-4 border-t">
          <p className="text-sm text-center text-muted-foreground">
            <span className="font-semibold text-primary">Pro Tip:</span> Post 3x per week to reach 80+ score
          </p>
        </div>
      </div>
    </Card>
  );
}
