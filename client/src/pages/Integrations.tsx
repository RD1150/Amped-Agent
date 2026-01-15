import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Integrations() {
  // Get GHL connection status
  const { data: ghlSettings, isLoading } = trpc.ghl.getSettings.useQuery();
  const isConnected = ghlSettings?.isConnected && ghlSettings?.apiKey && ghlSettings?.locationId;

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
          Connect GoHighLevel to automatically post your content to all your social media platforms.
        </p>
      </div>

      {/* GoHighLevel Integration Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                🚀
              </div>
              <div>
                <CardTitle>GoHighLevel</CardTitle>
                <CardDescription>
                  Post to Facebook, Instagram, LinkedIn, and more through your GHL account
                </CardDescription>
              </div>
            </div>
            {isConnected ? (
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
          {isConnected ? (
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
                Your content will be posted through GoHighLevel to all connected social media accounts in your GHL location.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Why GoHighLevel?</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Post to all platforms (Facebook, Instagram, LinkedIn, Twitter) from one place</li>
                  <li>No token expiration issues - 98%+ reliability</li>
                  <li>Avoid $5,000+ Facebook API authorization costs</li>
                  <li>Manage all your social accounts in GHL</li>
                </ul>
              </div>
              <Button
                onClick={() => {
                  window.location.href = "/ghl";
                }}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect GoHighLevel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Connect Your GHL Account</p>
            <p className="text-xs text-muted-foreground">
              Enter your GoHighLevel API key and select your location
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">2. Connect Social Accounts in GHL</p>
            <p className="text-xs text-muted-foreground">
              Use GoHighLevel's Social Planner to connect Facebook, Instagram, LinkedIn, and other platforms
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">3. Post Automatically</p>
            <p className="text-xs text-muted-foreground">
              Schedule posts from Realty Content Agent and they'll be published through GHL to all your connected platforms
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
