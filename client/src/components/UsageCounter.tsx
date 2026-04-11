import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Video, UserCircle2 } from "lucide-react";
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
  const { data: avatarUsage, isLoading: avatarLoading } = trpc.fullAvatarVideo.getMonthlyUsage.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading || avatarLoading || !usage) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-40 bg-muted rounded"></div>
      </Card>
    );
  }

  const { tier, standardUsed, standardLimit } = usage;
  const isUnlimited = standardLimit === -1;
  const percentage = isUnlimited ? 0 : (standardUsed / standardLimit) * 100;

  // Avatar video stats
  const avatarUsed = avatarUsage?.used ?? 0;
  const avatarUnlimited = (avatarUsage?.limit ?? 0) === -1;
  const isPremiumOrPro = avatarUsage?.tier === "Agency" || avatarUsage?.tier === "Pro" || avatarUsage?.tier === "Premium";

  // Month name for the header
  const monthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold">Monthly Usage</h3>
          <p className="text-xs text-muted-foreground">{monthName} {new Date().getFullYear()}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-muted-foreground cursor-help">
                Current Tier: <span className="font-medium text-foreground">{tier}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {tier === "Starter" && "Free trial with limited video generation. Upgrade for unlimited access."}
                {tier === "Professional" && "Unlimited videos per month. 350 credits included."}
                {tier === "Agency" && "Unlimited videos per month. 1000 credits included."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-4">
        {/* Property Tour Videos */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                <Video className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium">Property Tour Videos</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {isUnlimited ? (
                <span className="font-medium text-primary">∞ Unlimited</span>
              ) : (
                <span><span className="font-semibold text-foreground">{standardUsed}</span>/{standardLimit} used</span>
              )}
            </span>
          </div>
          {!isUnlimited && (
            <Progress value={percentage} className="h-1.5" />
          )}
        </div>

        {/* Avatar Videos */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                <UserCircle2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">Avatar Videos</span>
                {isPremiumOrPro && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                    {avatarUsage?.tier === "Agency" ? "Agency" : "Pro"}
                  </span>
                )}
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {isPremiumOrPro ? (
                avatarUnlimited ? (
                  <span className="font-medium text-primary">∞ Unlimited</span>
                ) : (
                  <span><span className="font-semibold text-foreground">{avatarUsed}</span> generated</span>
                )
              ) : (
                <span className="text-primary font-medium">Upgrade required</span>
              )}
            </span>
          </div>
          {/* Show count badge for premium users who have generated videos */}
          {isPremiumOrPro && avatarUsed > 0 && (
            <div className="flex items-center gap-1.5 pl-10">
              <span className="text-xs text-muted-foreground">
                {avatarUsed} video{avatarUsed !== 1 ? "s" : ""} generated this month
              </span>
            </div>
          )}
          {/* Nudge non-premium users */}
          {!isPremiumOrPro && (
            <div className="pl-10">
              <p className="text-xs text-muted-foreground">
                Unlock AI talking-head videos with an Agency plan
              </p>
            </div>
          )}
        </div>
      </div>

      {tier === "Starter" && (
        <div className="mt-5 p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            Upgrade to Professional or Agency for unlimited video generation and Avatar Videos
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
