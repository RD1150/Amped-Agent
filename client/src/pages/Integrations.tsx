import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const platforms = [
  {
    id: "facebook" as const,
    name: "Facebook",
    icon: "📘",
    description: "This feature directly integrates with your Facebook Business Page, not your personal profile. Meta does not allow for connections to personal profiles.",
    color: "bg-blue-500/20 text-blue-400",
  },
  {
    id: "instagram" as const,
    name: "Instagram",
    icon: "📸",
    description: "You must have a business or creator account on Instagram, this setting can be changed directly on your Instagram account.",
    color: "bg-pink-500/20 text-pink-400",
  },
  {
    id: "linkedin" as const,
    name: "LinkedIn",
    icon: "💼",
    description: "Connect your LinkedIn profile or company page to share professional content with your network.",
    color: "bg-blue-600/20 text-blue-300",
  },
  {
    id: "twitter" as const,
    name: "X (Twitter)",
    icon: "🐦",
    description: "Share updates and engage with your audience on X (formerly Twitter).",
    color: "bg-gray-500/20 text-gray-300",
  },
];

export default function Integrations() {
  const { data: integrations = [], isLoading } = trpc.integrations.list.useQuery();
  const utils = trpc.useUtils();

  const upsertIntegration = trpc.integrations.upsert.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
    },
  });

  const getIntegration = (platformId: string) => {
    return integrations.find(i => i.platform === platformId);
  };

  const handleConnect = (platformId: "facebook" | "instagram" | "linkedin" | "twitter") => {
    // In a real implementation, this would redirect to OAuth flow
    toast.info("Social media integration coming soon! This feature requires OAuth setup.");
    
    // For demo purposes, toggle connection status
    const existing = getIntegration(platformId);
    upsertIntegration.mutate({
      platform: platformId,
      isConnected: !existing?.isConnected,
      accountName: existing?.isConnected ? undefined : `Demo ${platformId} Account`,
    });
  };

  const handleRefresh = (platformId: string) => {
    toast.info(`Refreshing ${platformId} connection...`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Connect Your Socials and Let AI Handle Your Content Creation and Scheduling—Automatically.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {platforms.map((platform) => {
          const integration = getIntegration(platform.id);
          const isConnected = integration?.isConnected;

          return (
            <Card key={platform.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{platform.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      {isConnected && (
                        <Badge className="bg-green-500/20 text-green-400 mt-1">
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefresh(platform.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription>{platform.description}</CardDescription>

                {isConnected && integration?.accountName && (
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-sm font-medium">Connected Account:</p>
                    <p className="text-sm text-primary">{integration.accountName}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    variant={isConnected ? "outline" : "default"}
                    onClick={() => handleConnect(platform.id)}
                    className={isConnected ? "" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Need help?
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Tips */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Integration Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-secondary/50">
              <h4 className="font-medium mb-2">📘 Facebook Setup</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Must have a Facebook Business Page</li>
                <li>• Personal profiles are not supported</li>
                <li>• Admin access required for the page</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <h4 className="font-medium mb-2">📸 Instagram Setup</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Switch to Business or Creator account</li>
                <li>• Link to your Facebook Business Page</li>
                <li>• Enable third-party app access</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <h4 className="font-medium mb-2">💼 LinkedIn Setup</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Works with personal or company pages</li>
                <li>• Requires LinkedIn authorization</li>
                <li>• Best for B2B real estate content</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <h4 className="font-medium mb-2">🐦 X (Twitter) Setup</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Connect your X account</li>
                <li>• Great for quick market updates</li>
                <li>• Supports threads for longer content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
