import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";

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

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header with Balance */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credits</h1>
          <p className="text-muted-foreground mt-1">
            Purchase credits to generate property tour videos with AI
          </p>
        </div>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-4xl font-bold text-primary">{balance?.balance || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">credits</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Packages */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Purchase Credits</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {packages?.map((pkg) => {
            const isPurchasing = purchasing === pkg.id;
            const isPopular = 'popular' in pkg && pkg.popular;

            return (
              <Card key={pkg.id} className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
                {isPopular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                ) : null}
                <CardHeader>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <CardDescription>
                    {'description' in pkg && typeof pkg.description === 'string'
                      ? pkg.description
                      : `${pkg.totalCredits} credits for property tour videos`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold">{pkg.priceDisplay}</p>
                    <p className="text-sm text-muted-foreground mt-1">one-time payment</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{pkg.credits} base credits</span>
                    </div>
                    {'bonusCredits' in pkg && typeof pkg.bonusCredits === 'number' && pkg.bonusCredits > 0 && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          +{pkg.bonusCredits} bonus credits
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        Total: {pkg.totalCredits} credits
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                    <p>• Property Tour video: 5 credits</p>
                    <p>• AI Reel: 15 credits</p>
                    <p>• Voiceover add-on: +5 credits</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
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
                        Purchase Credits
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
        <Card>
          <CardContent className="p-0">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history && history.length > 0 ? (
              <div className="divide-y">
                {history.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.amount > 0 ? "text-primary" : "text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount} credits
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance: {transaction.balanceAfter}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
