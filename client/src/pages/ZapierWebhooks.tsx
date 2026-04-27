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
  Trash2,
  FlaskConical,
  Zap,
  Users,
  Download,
  UserPlus,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type EventType = "open_house_lead" | "lead_magnet_download" | "new_crm_lead";

const EVENT_CONFIG: Record<
  EventType,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
    sampleFields: string[];
  }
> = {
  open_house_lead: {
    label: "Open House Lead",
    description: "Fires when a visitor signs in at your open house via the QR sign-in sheet.",
    icon: <Users className="h-5 w-5" />,
    sampleFields: ["firstName", "lastName", "email", "phone", "propertyAddress", "source"],
  },
  lead_magnet_download: {
    label: "Lead Magnet Download",
    description: "Fires when someone enters their email to download one of your lead magnets.",
    icon: <Download className="h-5 w-5" />,
    sampleFields: ["firstName", "lastName", "email", "magnetTitle", "source"],
  },
  new_crm_lead: {
    label: "New CRM Lead",
    description: "Fires when a new lead is added to your CRM pipeline (manually or via import).",
    icon: <UserPlus className="h-5 w-5" />,
    sampleFields: ["firstName", "lastName", "email", "phone", "source"],
  },
};

type WebhookRow = {
  id: number;
  eventType: EventType;
  webhookUrl: string;
  isEnabled: boolean;
  lastFiredAt: Date | null;
  lastFireStatus: string | null;
};

function WebhookCard({ eventType, row }: { eventType: EventType; row: WebhookRow | undefined }) {
  const config = EVENT_CONFIG[eventType];
  const utils = trpc.useUtils();

  const [url, setUrl] = useState("");
  const [editing, setEditing] = useState(!row?.webhookUrl);

  const saveMutation = trpc.zapierWebhooks.save.useMutation({
    onSuccess: () => {
      toast.success(`Webhook saved for "${config.label}"`);
      setUrl("");
      setEditing(false);
      utils.zapierWebhooks.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.zapierWebhooks.toggle.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Webhook ${vars.isEnabled ? "enabled" : "paused"}`);
      utils.zapierWebhooks.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.zapierWebhooks.remove.useMutation({
    onSuccess: () => {
      toast.success("Webhook removed");
      setEditing(true);
      utils.zapierWebhooks.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const testMutation = trpc.zapierWebhooks.test.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Test payload sent! Check your Zapier history.");
      } else {
        toast.error(`Test failed: ${result.message}`);
      }
      utils.zapierWebhooks.getAll.invalidate();
    },
    onError: (err) => toast.error(`Test failed: ${err.message}`),
  });

  const isConfigured = !!row?.webhookUrl;
  const isEnabled = row?.isEnabled ?? false;

  // Mask the URL for display
  const maskedUrl = row?.webhookUrl
    ? row.webhookUrl.replace(/\/[^/]{8,}$/, "/••••••••")
    : null;

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {config.label}
                {isConfigured && (
                  <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                    {isEnabled ? "Active" : "Paused"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm mt-0.5">{config.description}</CardDescription>
            </div>
          </div>
          {isConfigured && (
            <Switch
              checked={isEnabled}
              onCheckedChange={(val) => toggleMutation.mutate({ eventType, isEnabled: val })}
              disabled={toggleMutation.isPending}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Last fire status */}
        {row?.lastFiredAt && (
          <div className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 ${
            row.lastFireStatus === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {row.lastFireStatus === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            <span>
              Last fired: {row.lastFireStatus === "success" ? "Success" : "Failed"}
              {" · "}
              {new Date(row.lastFiredAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Webhook URL */}
        {isConfigured && !editing ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-sm font-mono text-muted-foreground truncate">
              {maskedUrl}
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Update URL
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`url-${eventType}`}>Zapier Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id={`url-${eventType}`}
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => saveMutation.mutate({ eventType, webhookUrl: url })}
                disabled={!url.trim() || saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              {isConfigured && (
                <Button variant="ghost" size="icon" onClick={() => { setEditing(false); setUrl(""); }}>
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              In Zapier, create a new Zap → Trigger: Webhooks by Zapier → Event: Catch Hook → copy the URL here.
            </p>
          </div>
        )}

        {/* Payload preview */}
        <div className="rounded-md bg-muted/60 border border-border px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Payload fields sent</p>
          <div className="flex flex-wrap gap-1.5">
            {config.sampleFields.map((f) => (
              <code key={f} className="text-xs bg-background border border-border rounded px-1.5 py-0.5 text-foreground">
                {f}
              </code>
            ))}
            <code className="text-xs bg-background border border-border rounded px-1.5 py-0.5 text-foreground">
              timestamp
            </code>
          </div>
        </div>

        {/* Actions */}
        {isConfigured && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => testMutation.mutate({ eventType })}
              disabled={testMutation.isPending || !isEnabled}
            >
              {testMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FlaskConical className="h-3.5 w-3.5" />
              )}
              Send Test Payload
            </Button>

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
                    <AlertDialogTitle>Remove "{config.label}" webhook?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete the webhook URL. Events will no longer be sent to Zapier for this trigger. You can reconnect at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => removeMutation.mutate({ eventType })}
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
      </CardContent>
    </Card>
  );
}

export default function ZapierWebhooks() {
  const { data: webhooks, isLoading } = trpc.zapierWebhooks.getAll.useQuery();

  const rowByEvent = (eventType: EventType): WebhookRow | undefined =>
    (webhooks as WebhookRow[] | undefined)?.find((r) => r.eventType === eventType);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-orange-100 text-orange-600 mt-0.5">
          <Zap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zapier Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Connect Amped Agent events to 6,000+ apps via Zapier. Each trigger fires a webhook with the lead's contact info so you can route it anywhere — Google Sheets, Slack, email, your CRM, and more.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
        <Zap className="h-4 w-4 shrink-0" />
        <span>
          Don't have a Zapier account?{" "}
          <a
            href="https://zapier.com/sign-up"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2 inline-flex items-center gap-1"
          >
            Sign up free
            <ExternalLink className="h-3 w-3" />
          </a>
          {" "}— the free plan supports up to 100 tasks/month.
        </span>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {(["open_house_lead", "lead_magnet_download", "new_crm_lead"] as EventType[]).map((eventType) => (
            <WebhookCard key={eventType} eventType={eventType} row={rowByEvent(eventType)} />
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Quick setup guide</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>In Zapier, click <strong>Create Zap</strong></li>
          <li>Choose <strong>Webhooks by Zapier</strong> as the trigger → <strong>Catch Hook</strong></li>
          <li>Copy the webhook URL Zapier gives you and paste it above</li>
          <li>Click <strong>Send Test Payload</strong> to verify the connection</li>
          <li>Set up your action (Google Sheets, email, Slack, etc.) and turn on the Zap</li>
        </ol>
      </div>
    </div>
  );
}
