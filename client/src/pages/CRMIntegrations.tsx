import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  FlaskConical,
  Building2,
  Users,
  Home,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type Platform = "lofty" | "followupboss" | "kvcore";

const PLATFORM_CONFIG: Record<
  Platform,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
    docsUrl: string;
    apiKeyLabel: string;
    apiKeyPlaceholder: string;
    color: string;
  }
> = {
  lofty: {
    label: "Lofty (Chime)",
    description: "Push open house leads and lead magnet contacts directly into your Lofty CRM pipeline.",
    icon: <Building2 className="h-5 w-5" />,
    docsUrl: "https://support.lofty.com/hc/en-us/articles/360057578553",
    apiKeyLabel: "Lofty API Key",
    apiKeyPlaceholder: "lofty_api_key_...",
    color: "text-blue-600",
  },
  followupboss: {
    label: "Follow Up Boss",
    description: "Automatically add new leads to Follow Up Boss and trigger your follow-up sequences.",
    icon: <Users className="h-5 w-5" />,
    docsUrl: "https://help.followupboss.com/hc/en-us/articles/360058111153",
    apiKeyLabel: "Follow Up Boss API Key",
    apiKeyPlaceholder: "fub_api_...",
    color: "text-green-600",
  },
  kvcore: {
    label: "kvCORE",
    description: "Sync leads from open houses and lead magnets into your kvCORE smart CRM.",
    icon: <Home className="h-5 w-5" />,
    docsUrl: "https://support.kvcore.com/hc/en-us",
    apiKeyLabel: "kvCORE API Key",
    apiKeyPlaceholder: "kvc_...",
    color: "text-purple-600",
  },
};

type CRMRow = {
  id: number;
  platform: Platform;
  apiKey: string | null;
  hasApiKey: boolean;
  isEnabled: boolean;
  lastTestedAt: Date | null;
  lastTestStatus: string | null;
  lastTestMessage: string | null;
};

function PlatformCard({ platform, row }: { platform: Platform; row: CRMRow | undefined }) {
  const config = PLATFORM_CONFIG[platform];
  const utils = trpc.useUtils();

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [editing, setEditing] = useState(!row?.hasApiKey);

  const saveMutation = trpc.crmIntegrations.save.useMutation({
    onSuccess: () => {
      toast.success(`${config.label} API key saved`);
      setApiKey("");
      setEditing(false);
      utils.crmIntegrations.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.crmIntegrations.toggle.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`${config.label} ${vars.isEnabled ? "enabled" : "disabled"}`);
      utils.crmIntegrations.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.crmIntegrations.remove.useMutation({
    onSuccess: () => {
      toast.success(`${config.label} API key removed`);
      setEditing(true);
      utils.crmIntegrations.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const testMutation = trpc.crmIntegrations.test.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Test lead sent to ${config.label} successfully!`);
      } else {
        toast.error(`Test failed: ${result.message}`);
      }
      utils.crmIntegrations.getAll.invalidate();
    },
    onError: (err) => toast.error(`Test failed: ${err.message}`),
  });

  const isConnected = row?.hasApiKey;
  const isEnabled = row?.isEnabled ?? false;

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {config.label}
                {isConnected && (
                  <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                    {isEnabled ? "Active" : "Paused"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm mt-0.5">{config.description}</CardDescription>
            </div>
          </div>
          {isConnected && (
            <Switch
              checked={isEnabled}
              onCheckedChange={(val) => toggleMutation.mutate({ platform, isEnabled: val })}
              disabled={toggleMutation.isPending}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Last test status */}
        {row?.lastTestedAt && (
          <div className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 ${
            row.lastTestStatus === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {row.lastTestStatus === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            <span>
              Last test: {row.lastTestStatus === "success" ? "Passed" : "Failed"}
              {row.lastTestMessage ? ` — ${row.lastTestMessage}` : ""}
              {" · "}
              {new Date(row.lastTestedAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* API Key section */}
        {isConnected && !editing ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-sm font-mono text-muted-foreground">
              {row?.apiKey ?? "••••••••••••"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Update Key
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`apikey-${platform}`}>{config.apiKeyLabel}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id={`apikey-${platform}`}
                  type={showKey ? "text" : "password"}
                  placeholder={config.apiKeyPlaceholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                onClick={() => saveMutation.mutate({ platform, apiKey, isEnabled: true })}
                disabled={!apiKey.trim() || saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              {isConnected && (
                <Button variant="ghost" size="icon" onClick={() => { setEditing(false); setApiKey(""); }}>
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {isConnected && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => testMutation.mutate({ platform })}
              disabled={testMutation.isPending || !isEnabled}
            >
              {testMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FlaskConical className="h-3.5 w-3.5" />
              )}
              Test Connection
            </Button>

            <a
              href={config.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              How to find your API key
            </a>

            <div className="ml-auto">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {config.label} integration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete your saved API key. Leads will no longer be pushed to {config.label}. You can reconnect at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => removeMutation.mutate({ platform })}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {!isConnected && (
          <p className="text-xs text-muted-foreground">
            <a
              href={config.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors underline underline-offset-2"
            >
              <ExternalLink className="h-3 w-3" />
              How to find your {config.label} API key
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function CRMIntegrations() {
  const { data: integrations, isLoading } = trpc.crmIntegrations.getAll.useQuery();

  const rowByPlatform = (platform: Platform): CRMRow | undefined =>
    (integrations as CRMRow[] | undefined)?.find((r) => r.platform === platform);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CRM Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Connect your CRM so every open house lead, lead magnet download, and new contact is automatically pushed into your pipeline — no copy-pasting required.
        </p>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {(["lofty", "followupboss", "kvcore"] as Platform[]).map((platform) => (
            <PlatformCard key={platform} platform={platform} row={rowByPlatform(platform)} />
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How it works</p>
        <p>
          When a visitor signs in at your open house, downloads a lead magnet, or is added to your CRM pipeline, Amped Agent automatically sends their contact info to your connected CRM. Each platform uses its own API key — your credentials are encrypted and never shared.
        </p>
      </div>
    </div>
  );
}
