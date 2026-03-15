import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Video } from "lucide-react";
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

  const { tier, standardUsed, standardLimit } = usage;
  const isUnlimited = standardLimit === -1;
  const percentage = isUnlimited ? 0 : (standardUsed / standardLimit) * 100;

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Video className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium">Property Tour Videos</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {isUnlimited ? (
              <span className="font-medium text-green-600">∞ Unlimited</span>
            ) : (
              <>{standardUsed}/{standardLimit} used</>
            )}
          </span>
        </div>
        {!isUnlimited && (
          <Progress value={percentage} className="h-2" />
        )}
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
