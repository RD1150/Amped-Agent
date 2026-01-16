import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";

function TestSubAccountButton() {
  const { user } = useAuth();
  const createSubAccountMutation = trpc.ghl.createSubAccount.useMutation({
    onSuccess: (data) => {
      toast.success("GHL Sub-Account Created!", {
        description: `Location ID: ${data.locationId}`,
      });
    },
    onError: (error) => {
      toast.error("Failed to create sub-account", {
        description: error.message,
      });
    },
  });

  const handleTest = () => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }
    createSubAccountMutation.mutate({
      name: user.name || "Test User",
      email: user.email || "test@example.com",
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-lg border">
        <p className="text-sm text-muted-foreground mb-2">
          <strong>User:</strong> {user?.name}
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Email:</strong> {user?.email}
        </p>
        {user?.ghlLocationId && (
          <p className="text-sm text-green-600">
            ✓ GHL Location ID: {user.ghlLocationId}
          </p>
        )}
      </div>

      <Button
        onClick={handleTest}
        disabled={createSubAccountMutation.isPending}
        className="w-full"
        variant="default"
      >
        {createSubAccountMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Sub-Account...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" />
            Test: Create GHL Sub-Account
          </>
        )}
      </Button>

      {createSubAccountMutation.isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800 font-medium">✓ Sub-Account Created!</p>
          <p className="text-xs text-green-600 mt-1">
            Location ID: {createSubAccountMutation.data.locationId}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            💡 To enable SaaS mode, go to your GHL dashboard and assign a plan to this location.
          </p>
        </div>
      )}

      {createSubAccountMutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">✗ Error</p>
          <p className="text-xs text-red-600 mt-1">
            {createSubAccountMutation.error.message}
          </p>
        </div>
      )}
    </div>
  );
}

export default function GHLSettings() {
  const [apiKey, setApiKey] = useState("");
  const [locationId, setLocationId] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const { data: settings, isLoading } = trpc.ghl.getSettings.useQuery();
  const utils = trpc.useUtils();

  const saveSettings = trpc.ghl.saveSettings.useMutation({
    onSuccess: () => {
      utils.ghl.getSettings.invalidate();
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  const testConnection = trpc.ghl.testConnection.useMutation({
    onSuccess: (result) => {
      setIsTesting(false);
      if (result.success) {
        toast.success(`Connected to ${result.locationName || "GoHighLevel"}!`);
        setIsConnected(true);
        saveSettings.mutate({ apiKey, locationId, agencyId, isConnected: true });
      } else {
        toast.error(result.error || "Connection failed");
        setIsConnected(false);
      }
    },
    onError: (error) => {
      setIsTesting(false);
      toast.error("Connection test failed: " + error.message);
      setIsConnected(false);
    },
  });

  useEffect(() => {
    if (settings) {
      setApiKey(settings.apiKey || "");
      setLocationId(settings.locationId || "");
      setAgencyId(settings.agencyId || "");
      setIsConnected(settings.isConnected || false);
    }
  }, [settings]);

  const handleTestConnection = () => {
    if (!apiKey.trim() || !locationId.trim()) {
      toast.error("Please enter API Key and Location ID");
      return;
    }
    setIsTesting(true);
    testConnection.mutate({ apiKey, locationId });
  };

  const handleSave = () => {
    if (!apiKey.trim() || !locationId.trim()) {
      toast.error("Please enter API Key and Location ID");
      return;
    }
    saveSettings.mutate({ apiKey, locationId, agencyId, isConnected });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GoHighLevel Integration</h1>
          <p className="text-muted-foreground mt-2">
            Connect your GoHighLevel account to push content directly to your social planner
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>
                  Manage your GoHighLevel API credentials
                </CardDescription>
              </div>
              {isConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Not Connected</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your GoHighLevel API key"
                />
                <p className="text-sm text-muted-foreground">
                  Find your API key in GoHighLevel Settings → API Keys
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationId">Location ID</Label>
                <Input
                  id="locationId"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  placeholder="Enter your Location ID"
                />
                <p className="text-sm text-muted-foreground">
                  Your Location ID can be found in the GHL dashboard URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencyId">Agency ID (Optional)</Label>
                <Input
                  id="agencyId"
                  value={agencyId}
                  onChange={(e) => setAgencyId(e.target.value)}
                  placeholder="Enter your Agency ID (if applicable)"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleTestConnection}
                disabled={isTesting || !apiKey || !locationId}
                variant="outline"
                className="flex-1"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveSettings.isPending || !apiKey || !locationId}
                className="flex-1"
              >
                {saveSettings.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Get Your API Credentials</CardTitle>
            <CardDescription>
              Follow these steps to connect your GoHighLevel account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                Log in to your GoHighLevel account
              </li>
              <li>
                Navigate to Settings → Integrations → API Keys
              </li>
              <li>
                Create a new API key with Social Media Posting permissions
              </li>
              <li>
                Copy the API key and paste it above
              </li>
              <li>
                Find your Location ID in the dashboard URL
              </li>
              <li>
                Click Test Connection to verify your credentials
              </li>
            </ol>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("https://help.gohighlevel.com/support/solutions/articles/48000982066", "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View GoHighLevel API Documentation
            </Button>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Test Sub-Account Creation
            </CardTitle>
            <CardDescription>
              Test the automatic GHL sub-account provisioning (for debugging)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TestSubAccountButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              What you can do with GoHighLevel integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Push generated content directly to GHL Social Planner</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Schedule posts across multiple platforms</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Sync your content calendar with GHL</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Automatically attach generated images to posts</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
