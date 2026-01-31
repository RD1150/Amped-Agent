import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle2, AlertCircle, Facebook, Instagram, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Integrations() {
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Get Facebook connection status
  const { data: facebookConnection, refetch: refetchFacebook } = trpc.facebook.getConnection.useQuery();
  const { data: instagramConnection, refetch: refetchInstagram } = trpc.facebook.getInstagramConnection.useQuery();
  
  // Get LinkedIn connection status
  const { data: linkedinConnection, refetch: refetchLinkedIn } = trpc.linkedin.getConnection.useQuery();
  
  // Get GHL connection status
  const { data: ghlSettings } = trpc.ghl.getSettings.useQuery();
  const isGHLConnected = ghlSettings?.isConnected && ghlSettings?.apiKey && ghlSettings?.locationId;

  const getAuthUrlMutation = trpc.facebook.getAuthUrl.useMutation();
  const disconnectFacebookMutation = trpc.facebook.disconnect.useMutation();
  const disconnectInstagramMutation = trpc.facebook.disconnectInstagram.useMutation();
  
  const getLinkedInAuthUrlMutation = trpc.linkedin.getAuthUrl.useMutation();
  const disconnectLinkedInMutation = trpc.linkedin.disconnect.useMutation();

  const handleConnectFacebook = async () => {
    try {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}/integrations/facebook/callback`;
      const result = await getAuthUrlMutation.mutateAsync({ redirectUri });
      
      // Store state in sessionStorage for verification
      sessionStorage.setItem("facebook_oauth_state", result.state);
      sessionStorage.setItem("facebook_oauth_redirect", redirectUri);
      
      // Redirect to Facebook OAuth
      window.location.href = result.authUrl;
    } catch (error) {
      toast.error("Failed to start Facebook connection");
      console.error(error);
      setIsConnecting(false);
    }
  };

  const handleDisconnectFacebook = async () => {
    try {
      await disconnectFacebookMutation.mutateAsync();
      await refetchFacebook();
      await refetchInstagram();
      toast.success("Facebook disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Facebook");
      console.error(error);
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      await disconnectInstagramMutation.mutateAsync();
      await refetchInstagram();
      toast.success("Instagram disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Instagram");
      console.error(error);
    }
  };

  const handleConnectLinkedIn = async () => {
    try {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}/integrations/linkedin/callback`;
      const result = await getLinkedInAuthUrlMutation.mutateAsync({ redirectUri });
      
      // Store state in sessionStorage for verification
      sessionStorage.setItem("linkedin_oauth_state", result.state);
      sessionStorage.setItem("linkedin_oauth_redirect", redirectUri);
      
      // Redirect to LinkedIn OAuth
      window.location.href = result.authUrl;
    } catch (error) {
      toast.error("Failed to start LinkedIn connection");
      console.error(error);
      setIsConnecting(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    try {
      await disconnectLinkedInMutation.mutateAsync();
      await refetchLinkedIn();
      toast.success("LinkedIn disconnected");
    } catch (error) {
      toast.error("Failed to disconnect LinkedIn");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Social Media Accounts</h1>
        <p className="text-muted-foreground mt-1">
          Connect your social media accounts to automatically publish your generated content.
        </p>
      </div>

      {/* Facebook Card */}
      <Card className="border-2 border-blue-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Facebook className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle>Facebook</CardTitle>
                <CardDescription>
                  Post directly to your Facebook Page
                </CardDescription>
              </div>
            </div>
            {facebookConnection?.isConnected ? (
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {facebookConnection?.isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{facebookConnection.accountName || "Facebook Account"}</p>
                  <p className="text-xs text-muted-foreground">
                    Connected {facebookConnection.connectedAt ? new Date(facebookConnection.connectedAt).toLocaleDateString() : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectFacebook}
                  disabled={disconnectFacebookMutation.isPending}
                >
                  Disconnect
                </Button>
              </div>
              {facebookConnection.isExpired && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Your Facebook token has expired. Please reconnect to continue posting.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Connect Your Facebook Page</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Post directly to your Facebook Page</li>
                  <li>No middleman required</li>
                  <li>Secure OAuth 2.0 authentication</li>
                </ul>
              </div>
              <Button
                onClick={handleConnectFacebook}
                disabled={isConnecting || getAuthUrlMutation.isPending}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                <Facebook className="h-4 w-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect Facebook"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instagram Card */}
      <Card className="border-2 border-pink-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Instagram className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Instagram</CardTitle>
                <CardDescription>
                  Post directly to your Instagram Business or Creator Account
                </CardDescription>
              </div>
            </div>
            {instagramConnection?.isConnected ? (
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {instagramConnection?.isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">@{instagramConnection.instagramUsername}</p>
                  <p className="text-xs text-muted-foreground">
                    Connected via Facebook Page
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectInstagram}
                  disabled={disconnectInstagramMutation.isPending}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Connect Instagram Account</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Requires Facebook Page connection first</li>
                  <li>Supports Business & Creator accounts</li>
                  <li>Post images and captions directly</li>
                  <li>Schedule posts and manage content</li>
                </ul>
              </div>
              {!facebookConnection?.isConnected ? (
                <p className="text-sm text-muted-foreground">
                  Connect Facebook first to enable Instagram posting
                </p>
              ) : (
                <Button
                  onClick={() => {
                    window.location.href = "/integrations/instagram/setup";
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  Connect Instagram
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* LinkedIn Card */}
      <Card className="border-2 border-blue-600/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <Linkedin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>LinkedIn</CardTitle>
                <CardDescription>
                  Post directly to your LinkedIn profile
                </CardDescription>
              </div>
            </div>
            {linkedinConnection?.isConnected ? (
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkedinConnection?.isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{linkedinConnection.accountName || "LinkedIn Account"}</p>
                  <p className="text-xs text-muted-foreground">
                    Connected {linkedinConnection.connectedAt ? new Date(linkedinConnection.connectedAt).toLocaleDateString() : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectLinkedIn}
                  disabled={disconnectLinkedInMutation.isPending}
                >
                  Disconnect
                </Button>
              </div>
              {linkedinConnection.isExpired && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Your LinkedIn token has expired. Please reconnect to continue posting.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Connect Your LinkedIn Profile</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Post directly to your LinkedIn profile</li>
                  <li>No middleman required</li>
                  <li>Secure OAuth 2.0 authentication</li>
                </ul>
              </div>
              <Button
                onClick={handleConnectLinkedIn}
                disabled={isConnecting || getLinkedInAuthUrlMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect LinkedIn"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GHL Card (Optional) */}
      {isGHLConnected && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                  📱
                </div>
                <div>
                  <CardTitle>GoHighLevel</CardTitle>
                  <CardDescription>
                    Post to multiple platforms via GHL Social Planner
                  </CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-xs text-muted-foreground">{ghlSettings?.locationId || "Not set"}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = "/ghl";
                  }}
                >
                  Manage
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Posts to LinkedIn, Twitter, TikTok, YouTube, and more through GHL
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Social Media Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Direct Posting</p>
            <p className="text-xs text-muted-foreground">
              Facebook and Instagram use direct OAuth connections for reliable posting without third-party services
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Coming Soon</p>
            <p className="text-xs text-muted-foreground">
              Twitter/X, TikTok, and YouTube integrations are in development
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">GoHighLevel Option</p>
            <p className="text-xs text-muted-foreground">
              If you have GHL, you can post to all platforms through their Social Planner
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
