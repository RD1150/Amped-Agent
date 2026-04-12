import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Check,
  CreditCard,
  Sparkles,
  Video,
  Zap,
  Infinity,
} from "lucide-react";
import { toast } from "sonner";

// ─── Pool usage widget ────────────────────────────────────────────────────────
function VideoPoolWidget() {
  const { data: pool, isLoading } = trpc.credits.getVideoPoolStatus.useQuery();

  if (isLoading) {
    return (
      <Card className="bg-[#1a1a1a] border-white/10">
        <CardContent className="pt-6 flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </CardContent>
      </Card>
    );
  }

  if (!pool) return null;

  const { unlimited, poolSize, slotsUsed, slotsRemaining, resetAt, tier } = pool;

  // Days until reset
  let daysUntilReset: number | null = null;
  if (resetAt) {
    const resetDate = new Date(resetAt);
    const nextReset = new Date(resetDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    daysUntilReset = Math.max(
      0,
      Math.ceil((nextReset.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
  }

  const pct = unlimited || poolSize <= 0 ? 100 : Math.round(((poolSize - slotsUsed) / poolSize) * 100);
  const isLow = !unlimited && slotsRemaining <= 2;
  const isExhausted = !unlimited && slotsRemaining <= 0;

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <Card className="bg-[#1a1a1a] border-white/10 text-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-lg text-white">Monthly Free Videos</CardTitle>
          </div>
          <Badge
            variant="outline"
            className="border-amber-400/40 text-amber-400 text-xs"
          >
            {tierLabel} Plan
          </Badge>
        </div>
        <CardDescription className="text-white/50">
          Free video slots included with your subscription — resets every 30 days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {unlimited ? (
          <div className="flex items-center gap-3 py-4">
            <Infinity className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-emerald-400">Unlimited</p>
              <p className="text-sm text-white/50">Agency plan — no monthly cap</p>
            </div>
          </div>
        ) : (
          <>
            {/* Usage bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Slots used this month</span>
                <span className={`font-semibold ${isExhausted ? "text-red-400" : isLow ? "text-amber-400" : "text-white"}`}>
                  {slotsUsed} / {poolSize}
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isExhausted
                      ? "bg-red-500"
                      : isLow
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${100 - pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/40">
                <span>
                  {isExhausted
                    ? "Pool exhausted — overage credits apply"
                    : `${slotsRemaining} slot${slotsRemaining === 1 ? "" : "s"} remaining`}
                </span>
                {daysUntilReset !== null && (
                  <span>Resets in {daysUntilReset} day{daysUntilReset === 1 ? "" : "s"}</span>
                )}
              </div>
            </div>

            {/* Slot weight table */}
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left px-3 py-2 text-white/60 font-medium">Video Type</th>
                    <th className="text-center px-3 py-2 text-white/60 font-medium">Slots</th>
                    <th className="text-center px-3 py-2 text-white/60 font-medium">Overage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="px-3 py-2 text-white/80">Ken Burns Property Tour</td>
                    <td className="px-3 py-2 text-center text-white">1 slot</td>
                    <td className="px-3 py-2 text-center text-amber-400">2 credits</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-white/80">Market Update Video</td>
                    <td className="px-3 py-2 text-center text-white">1 slot</td>
                    <td className="px-3 py-2 text-center text-amber-400">2 credits</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-white/80">AI-Enhanced Property Tour</td>
                    <td className="px-3 py-2 text-center text-white">2 slots</td>
                    <td className="px-3 py-2 text-center text-amber-400">5 credits</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-white/80">Full AI Cinematic Tour</td>
                    <td className="px-3 py-2 text-center text-white">3 slots</td>
                    <td className="px-3 py-2 text-center text-amber-400">8 credits</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-white/80">YouTube Avatar Video</td>
                    <td className="px-3 py-2 text-center text-white">3 slots</td>
                    <td className="px-3 py-2 text-center text-amber-400">3 credits</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-white/80">AutoReels</td>
                    <td className="px-3 py-2 text-center text-white">1 slot</td>
                    <td className="px-3 py-2 text-center text-amber-400">2 credits</td>
                  </tr>
                  <tr className="bg-emerald-500/5">
                    <td className="px-3 py-2 text-white/80">Voice-over Narration</td>
                    <td className="px-3 py-2 text-center text-emerald-400 font-medium">Free</td>
                    <td className="px-3 py-2 text-center text-emerald-400 font-medium">Always free</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {isExhausted && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                Your free video pool is exhausted for this month. Credits will be deducted automatically for each video, or you can purchase a credit pack below.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Credits page ────────────────────────────────────────────────────────
export default function Credits() {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const { data: balance, isLoading: balanceLoading } = trpc.credits.getBalance.useQuery();
  const { data: packages, isLoading: packagesLoading } = trpc.credits.getPackages.useQuery();
  const { data: history, isLoading: historyLoading } = trpc.credits.getHistory.useQuery({ limit: 10 });

  const createCheckout = trpc.stripe.createCreditCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecting to checkout...");
      }
    },
    onError: (error) => {
      toast.error(`Failed to create checkout: ${error.message}`);
    },
    onSettled: () => {
      setPurchasing(null);
    },
  });

  const handlePurchase = (packageKey: string) => {
    setPurchasing(packageKey);
    createCheckout.mutate({
      packageKey: packageKey as "starter" | "pro" | "agency",
      successUrl: `${window.location.origin}/credits?success=true`,
      cancelUrl: `${window.location.origin}/credits?canceled=true`,
    });
  };

  if (balanceLoading || packagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isOwner = (balance?.balance ?? 0) >= 999999;

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Credits & Usage</h1>
          <p className="text-muted-foreground mt-1">
            Your subscription includes free monthly videos. Credits are only used for overages.
          </p>
        </div>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="text-center px-4">
              <p className="text-sm text-muted-foreground">Credit Balance</p>
              <p className="text-4xl font-bold text-amber-400">
                {isOwner ? "∞" : balance?.balance ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isOwner ? "Unlimited (Owner)" : "overage credits"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly pool widget */}
      <VideoPoolWidget />

      {/* Credit Packages */}
      <div>
        <h2 className="text-2xl font-semibold mb-1">Purchase Overage Credits</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Credits are only charged when your monthly free pool is exhausted. They never expire.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {packages?.map((pkg) => {
            const isPurchasing = purchasing === pkg.id;
            const isPopular = pkg.id === "professional";

            return (
              <Card
                key={pkg.id}
                className={`relative ${
                  isPopular ? "border-amber-500/40 shadow-lg shadow-amber-500/10" : "border-white/10"
                } bg-[#1a1a1a]`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-500 text-black text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Best Value
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl text-white">{pkg.name}</CardTitle>
                  <CardDescription className="text-white/50">
                    {pkg.totalCredits} credits — never expire
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold text-white">{pkg.priceDisplay}</p>
                    <p className="text-sm text-white/40 mt-1">one-time payment</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-400" />
                      <span className="text-sm text-white/80">{pkg.credits} base credits</span>
                    </div>
                    {"bonus" in pkg && typeof pkg.bonus === "number" && pkg.bonus > 0 && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-400">
                          +{pkg.bonus} bonus credits
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <span className="text-sm text-white/80">
                        Total: {pkg.totalCredits} credits
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10 text-xs text-white/40 space-y-1">
                    <p>• Ken Burns / Market Update: 2 credits each</p>
                    <p>• AI-Enhanced Tour: 5 credits</p>
                    <p>• Full AI Cinematic: 8 credits</p>
                    <p>• YouTube Video: 3 credits</p>
                    <p className="text-emerald-400">• Voice-overs: always free</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full ${isPopular ? "bg-amber-500 hover:bg-amber-400 text-black" : ""}`}
                    size="lg"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Buy Credits
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
        <Card className="bg-[#1a1a1a] border-white/10">
          <CardContent className="p-0">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
              </div>
            ) : history && history.length > 0 ? (
              <div className="divide-y divide-white/5">
                {history.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="font-medium text-white">{transaction.description}</p>
                      <p className="text-sm text-white/40">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.amount > 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount} credits
                      </p>
                      <p className="text-sm text-white/40">
                        Balance: {transaction.balanceAfter}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                <p>No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
