import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

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
  const [isConnecting, setIsConnecting] = useState(false);
  const utils = trpc.useUtils();

  // Get Facebook connection status
  const { data: facebookConnection, isLoading: fbLoading } = trpc.facebook.getConnection.useQuery();
  
  // Get all integrations (for other platforms)
  const { data: integrations = [], isLoading } = trpc.integrations.list.useQuery();

  // Facebook OAuth mutations
  const getAuthUrl = trpc.facebook.getAuthUrl.useMutation();
  const handleCallback = trpc.facebook.handleCallback.useMutation({
    onSuccess: (data) => {
      toast.success(`Connected to Facebook as ${data.accountName}`);
      utils.facebook.getConnection.invalidate();
      setIsConnecting(false);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    },
    onError: (error) => {
      toast.error(`Failed to connect Facebook: ${error.message}`);
      setIsConnecting(false);
    },
  });

  const disconnectFacebook = trpc.facebook.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Disconnected from Facebook");
      utils.facebook.getConnection.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  const testConnection = trpc.facebook.testConnection.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Connection verified: ${data.accountName}`);
      } else {
        toast.error(`Connection failed: ${data.error}`);
      }
    },
  });

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
      toast.error(`Facebook OAuth error: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && state) {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      handleCallback.mutate({ code, state, redirectUri });
    }
  }, []);

  const upsertIntegration = trpc.integrations.upsert.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
    },
  });

  const getIntegration = (platformId: string) => {
    return integrations.find(i => i.platform === platformId);
  };

  const handleConnectFacebook = async () => {
    try {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const result = await getAuthUrl.mutateAsync({ redirectUri });
      
      // Redirect to Facebook OAuth
      window.location.href = result.authUrl;
    } catch (error: any) {
      toast.error(`Failed to start OAuth: ${error.message}`);
      setIsConnecting(false);
    }
  };

  const handleDisconnectFacebook = () => {
    if (confirm("Are you sure you want to disconnect your Facebook account?")) {
      disconnectFacebook.mutate();
    }
  };

  const handleConnect = (platformId: "facebook" | "instagram" | "linkedin" | "twitter") => {
    if (platformId === "facebook") {
      handleConnectFacebook();
      return;
    }

    // For other platforms, show coming soon message
    toast.info("This integration is coming soon! Facebook is available now.");
    
    // For demo purposes, toggle connection status
    const existing = getIntegration(platformId);
    upsertIntegration.mutate({
      platform: platformId,
      isConnected: !existing?.isConnected,
      accountName: existing?.isConnected ? undefined : `Demo ${platformId} Account`,
    });
  };

  const handleRefresh = (platformId: string) => {
    if (platformId === "facebook") {
      testConnection.mutate();
    } else {
      toast.info(`Refreshing ${platformId} connection...`);
    }
  };

  if (isLoading || fbLoading) {
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
          // Use real Facebook connection data
          const integration = platform.id === "facebook" 
            ? facebookConnection 
            : getIntegration(platform.id);
          const isConnected = integration?.isConnected;
          const isExpired = platform.id === "facebook" && facebookConnection?.isExpired;

          return (
            <Card key={platform.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{platform.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      {isConnected && !isExpired && (
                        <Badge variant="outline" className="mt-1 bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge variant="outline" className="mt-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          Token Expired
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isConnected && !isExpired && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRefresh(platform.id)}
                      disabled={testConnection.isPending}
                    >
                      <RefreshCw className={`w-4 h-4 ${testConnection.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {platform.description}
                </p>

                {isConnected && integration?.accountName && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-foreground">
                      Connected as: {integration.accountName}
                    </p>
                    {integration.connectedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Connected on {new Date(integration.connectedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {!isConnected || isExpired ? (
                    <Button
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting || getAuthUrl.isPending}
                      className="flex-1"
                    >
                      {(isConnecting || getAuthUrl.isPending) && platform.id === "facebook" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>Connect {platform.name}</>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (platform.id === "facebook") {
                            handleDisconnectFacebook();
                          } else {
                            handleConnect(platform.id);
                          }
                        }}
                        disabled={disconnectFacebook.isPending}
                        className="flex-1"
                      >
                        {disconnectFacebook.isPending && platform.id === "facebook" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          <>Disconnect</>
                        )}
                      </Button>
                      {platform.id === "facebook" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open("https://www.facebook.com/settings?tab=business_tools", "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {platform.id === "facebook" && !isConnected && (
                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
                    <p className="font-medium">Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Facebook Business Page (not personal profile)</li>
                      <li>Admin access to the page</li>
                      <li>Page must be published</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Facebook & Instagram:</strong> Requires a Facebook Business Page and Instagram Business Account. 
            Personal profiles cannot be connected due to Meta's API restrictions.
          </p>
          <p>
            <strong className="text-foreground">Permissions:</strong> You'll be asked to grant permissions to manage posts and read engagement metrics. 
            We never access your personal messages or private information.
          </p>
          <p>
            <strong className="text-foreground">Troubleshooting:</strong> If you encounter issues, try disconnecting and reconnecting your account. 
            Make sure you're logged into the correct Facebook account before connecting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
