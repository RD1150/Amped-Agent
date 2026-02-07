import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Video, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function UsageCounter() {
  const { data: usage, isLoading } = trpc.propertyTours.getMonthlyUsage.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading || !usage) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-32 bg-muted rounded"></div>
      </Card>
    );
  }

  const { tier, standardUsed, aiEnhancedUsed, fullAiUsed, standardLimit, aiEnhancedLimit, fullAiLimit } = usage;

  const tiers = [
    {
      name: "Standard",
      icon: Video,
      used: standardUsed,
      limit: standardLimit,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      progressColor: "bg-blue-600",
    },
    {
      name: "AI-Enhanced",
      icon: TrendingUp,
      used: aiEnhancedUsed,
      limit: aiEnhancedLimit,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      progressColor: "bg-purple-600",
    },
    {
      name: "Full AI Cinematic",
      icon: Zap,
      used: fullAiUsed,
      limit: fullAiLimit,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900",
      progressColor: "bg-amber-600",
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Monthly Usage</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-muted-foreground cursor-help">
                Current Tier: <span className="font-medium text-foreground">{tier}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {tier === "Starter" && "Free trial with 10 videos/day limit. Upgrade for unlimited videos."}
                {tier === "Professional" && "Unlimited videos per month. 350 credits included."}
                {tier === "Agency" && "Unlimited videos per month. 1000 credits included."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-4">
        {tiers.map((tierInfo) => {
          const Icon = tierInfo.icon;
          const percentage = tierInfo.limit === -1 ? 0 : (tierInfo.used / tierInfo.limit) * 100;
          const isUnlimited = tierInfo.limit === -1;

          return (
            <div key={tierInfo.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${tierInfo.bgColor} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${tierInfo.color}`} />
                  </div>
                  <span className="text-sm font-medium">{tierInfo.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {isUnlimited ? (
                    <span className="font-medium text-green-600">∞ Unlimited</span>
                  ) : (
                    <>
                      {tierInfo.used}/{tierInfo.limit} used
                    </>
                  )}
                </span>
              </div>
              {!isUnlimited && (
                <Progress value={percentage} className="h-2" />
              )}
            </div>
          );
        })}
      </div>

      {tier === "Starter" && (
        <div className="mt-6 p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            Upgrade to Professional or Agency for unlimited video generation
          </p>
          <Button
            onClick={() => setLocation("/credits")}
            size="sm"
            className="w-full"
          >
            Upgrade Now
          </Button>
        </div>
      )}
    </Card>
  );
}
