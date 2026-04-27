import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Cpu, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeyGenCreditsWidget() {
  const { data, isLoading, error, refetch, isRefetching } =
    trpc.admin.getHeyGenCredits.useQuery(undefined, {
      retry: false,
      staleTime: 5 * 60 * 1000, // cache for 5 minutes
    });

  const credits = data?.credits ?? null;
  const fetchError = error || data?.error;

  // Determine color based on credit level
  const creditColor =
    credits === null
      ? "text-muted-foreground"
      : credits <= 50
      ? "text-red-500"
      : credits <= 150
      ? "text-amber-500"
      : "text-green-600";

  const bgColor =
    credits === null
      ? "bg-slate-50"
      : credits <= 50
      ? "bg-red-50 border-red-200"
      : credits <= 150
      ? "bg-amber-50 border-amber-200"
      : "bg-green-50 border-green-200";

  return (
    <Card className={`p-4 border ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-800 text-white shrink-0">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              HeyGen API Credits
            </p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
            ) : fetchError ? (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-sm text-amber-600">Unable to fetch — check API key</p>
              </div>
            ) : (
              <p className={`text-2xl font-bold ${creditColor}`}>
                {credits?.toLocaleString() ?? "—"}
                <span className="text-sm font-normal text-muted-foreground ml-1">remaining</span>
              </p>
            )}
            {credits !== null && credits <= 50 && (
              <p className="text-xs text-red-600 font-medium mt-0.5">
                ⚠ Low credits — top up your HeyGen account soon
              </p>
            )}
            {credits !== null && credits > 50 && credits <= 150 && (
              <p className="text-xs text-amber-600 font-medium mt-0.5">
                Credits running low — consider topping up
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-8 w-8 p-0"
            title="Refresh credit balance"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
          <a
            href="https://app.heygen.com/settings?tab=billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Manage →
          </a>
        </div>
      </div>
    </Card>
  );
}
