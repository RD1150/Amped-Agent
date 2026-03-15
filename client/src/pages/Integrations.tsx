import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Facebook, Instagram, Linkedin, MapPin, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";

export default function Integrations() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedGbpAccount, setSelectedGbpAccount] = useState<string | null>(null);
  const [gbpAccounts, setGbpAccounts] = useState<Array<{id: string; name: string; type: string}>>([]);
  const [gbpLocations, setGbpLocations] = useState<Array<{id: string; name: string; address: string | null}>>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  
  // Get Facebook connection status
  const { data: facebookConnection, refetch: refetchFacebook } = trpc.facebook.getConnection.useQuery();
  const { data: instagramConnection, refetch: refetchInstagram } = trpc.facebook.getInstagramConnection.useQuery();
  
  // Get LinkedIn connection status
  const { data: linkedinConnection, refetch: refetchLinkedIn } = trpc.linkedin.getConnection.useQuery();

  const getAuthUrlMutation = trpc.facebook.getAuthUrl.useMutation();
  const disconnectFacebookMutation = trpc.facebook.disconnect.useMutation();
  const disconnectInstagramMutation = trpc.facebook.disconnectInstagram.useMutation();
  
  const getLinkedInAuthUrlMutation = trpc.linkedin.getAuthUrl.useMutation();

  // GBP
  const { data: gbpStatus, refetch: refetchGbp } = trpc.gbp.getStatus.useQuery();
  const getGbpAuthUrlMutation = trpc.gbp.getAuthUrl.useMutation();
  const [gbpAccountIdForQuery, setGbpAccountIdForQuery] = useState<string | null>(null);
  const { data: gbpLocationsData, isFetching: isFetchingLocations } = trpc.gbp.listLocations.useQuery(
    { accountId: gbpAccountIdForQuery ?? "" },
    { enabled: !!gbpAccountIdForQuery }
  );
  const saveGbpLocationMutation = trpc.gbp.saveLocation.useMutation();
  const disconnectGbpMutation = trpc.gbp.disconnect.useMutation();
  const disconnectLinkedInMutation = trpc.linkedin.disconnect.useMutation();

  const handleConnectFacebook = async () => {
    try {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}/integrations/facebook/callback`;
      const result = await getAuthUrlMutation.mutateAsync({ redirectUri });
      sessionStorage.setItem("facebook_oauth_state", result.state);
      sessionStorage.setItem("facebook_oauth_redirect", redirectUri);
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
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      await disconnectInstagramMutation.mutateAsync();
      await refetchInstagram();
      toast.success("Instagram disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Instagram");
    }
  };

  const handleConnectGbp = async () => {
    try {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}/integrations/google/callback`;
      const result = await getGbpAuthUrlMutation.mutateAsync({ redirectUri });
      sessionStorage.setItem("gbp_oauth_state", result.state);
      sessionStorage.setItem("gbp_oauth_redirect", redirectUri);
      window.location.href = result.authUrl;
    } catch (error) {
      toast.error("Failed to start Google connection");
      console.error(error);
      setIsConnecting(false);
    }
  };

  const handleLoadGbpLocations = (accountId: string) => {
    setGbpAccountIdForQuery(accountId);
    setShowLocationSelect(true);
  };

  const handleSaveGbpLocation = async (locationId: string) => {
    const loc = (gbpLocationsData ?? []).find((l) => l.id === locationId);
    if (!loc) return;
    try {
      await saveGbpLocationMutation.mutateAsync({
        locationId: loc.id,
        locationName: loc.name,
        address: loc.address ?? undefined,
        googleAccountId: selectedGbpAccount ?? undefined,
      });
      await refetchGbp();
      setShowLocationSelect(false);
      toast.success(`Connected to "${loc.name}"`);
    } catch (error) {
      toast.error("Failed to save location");
    }
  };

  const handleDisconnectGbp = async () => {
    try {
      await disconnectGbpMutation.mutateAsync();
      await refetchGbp();
      toast.success("Google Business Profile disconnected");
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  const handleConnectLinkedIn = async () => {
    try {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}/integrations/linkedin/callback`;
      const result = await getLinkedInAuthUrlMutation.mutateAsync({ redirectUri });
      sessionStorage.setItem("linkedin_oauth_state", result.state);
      sessionStorage.setItem("linkedin_oauth_redirect", redirectUri);
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
                <CardDescription>Post directly to your Facebook Page</CardDescription>
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
                  <li>No third-party service required</li>
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
                <CardDescription>Post directly to your Instagram Business or Creator Account</CardDescription>
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
                  <p className="text-xs text-muted-foreground">Connected via Facebook Page</p>
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
                  <li>Supports Business and Creator accounts</li>
                  <li>Post images and captions directly</li>
                </ul>
              </div>
              {!facebookConnection?.isConnected ? (
                <p className="text-sm text-muted-foreground italic">
                  Connect Facebook first to enable Instagram posting
                </p>
              ) : (
                <Button
                  onClick={() => { window.location.href = "/integrations/instagram/setup"; }}
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
                <CardDescription>Post directly to your LinkedIn profile</CardDescription>
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
                  <li>No third-party service required</li>
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

      {/* Google Business Profile Card */}
      <Card className="border-2 border-emerald-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle>Google Business Profile</CardTitle>
                <CardDescription>Post updates directly to your Google Business listing</CardDescription>
              </div>
            </div>
            {gbpStatus?.isConnected && gbpStatus?.locationId ? (
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
          {gbpStatus?.isConnected && gbpStatus?.locationId ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{gbpStatus.locationName || "Business Location"}</p>
                  <p className="text-xs text-muted-foreground">
                    {gbpStatus.address || gbpStatus.googleEmail || "Google Business Profile"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectGbp}
                  disabled={disconnectGbpMutation.isPending}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : gbpStatus?.isConnected && !gbpStatus?.locationId ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Google account connected as <strong>{gbpStatus.googleEmail}</strong>. Select your business location to finish setup.</p>
              {gbpAccounts.length > 0 && !showLocationSelect && (
                <Select onValueChange={(val) => { setSelectedGbpAccount(val); handleLoadGbpLocations(val); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Google Business account" />
                  </SelectTrigger>
                  <SelectContent>
                    {gbpAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {showLocationSelect && (gbpLocationsData ?? []).length > 0 && (
                <Select onValueChange={handleSaveGbpLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your business location" />
                  </SelectTrigger>
                  <SelectContent>
                    {(gbpLocationsData ?? []).map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}{loc.address ? ` — ${loc.address}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {showLocationSelect && !isFetchingLocations && (gbpLocationsData ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No business locations found for this account.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Connect Your Google Business Profile</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Post updates, listings, and open houses directly to Google Search</li>
                  <li>Reach buyers searching for homes in your area</li>
                  <li>Secure Google OAuth 2.0 — no third-party required</li>
                </ul>
              </div>
              <Button
                onClick={handleConnectGbp}
                disabled={isConnecting || getGbpAuthUrlMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect Google Business Profile"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Social Media Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Direct Posting</p>
            <p className="text-xs text-muted-foreground">
              Facebook, Instagram, and LinkedIn use direct OAuth connections — no third-party services required.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Coming Soon</p>
            <p className="text-xs text-muted-foreground">
              TikTok and Twitter/X integrations are on the roadmap.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
