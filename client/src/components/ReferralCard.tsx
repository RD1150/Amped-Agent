/**
 * ReferralCard.tsx
 * Shows the user's unique referral link, copy button, and stats.
 * Displayed on the Dashboard.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Gift, Copy, Check, Users } from "lucide-react";

export default function ReferralCard() {
  const [copied, setCopied] = useState(false);
  const { data, isLoading } = trpc.referral.getStats.useQuery();

  const referralLink = data?.referralCode
    ? `${window.location.origin}/join?ref=${data.referralCode}`
    : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please copy the link manually.");
    }
  };

  if (isLoading) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift size={18} className="text-primary" />
          Invite Agents - Earn 25 Credits Each
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your personal invite link. When a fellow agent signs up, you{" "}
          <strong className="text-foreground">both</strong> get 25 free credits - no limits on how many you can earn.
        </p>

        {/* Referral link copy row */}
        <div className="flex gap-2">
          <Input
            readOnly
            value={referralLink}
            className="font-mono text-xs bg-muted/50 cursor-pointer"
            onClick={handleCopy}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleCopy}
            className="shrink-0"
            title="Copy link"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 pt-1">
          <div className="flex items-center gap-2 text-sm">
            <Users size={15} className="text-muted-foreground" />
            <span className="text-muted-foreground">Agents joined:</span>
            <span className="font-semibold text-foreground">{data?.referralCount ?? 0}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Gift size={15} className="text-muted-foreground" />
            <span className="text-muted-foreground">Credits earned:</span>
            <span className="font-semibold text-primary">{data?.creditsEarned ?? 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
