import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Crown, ExternalLink } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function NewsletterBuilder() {
  const { user } = useAuth();
  const { data: ssoLink, isLoading, error } = trpc.newsletter.getSsoLink.useQuery();

  // Check if user has Premium tier access
  const hasPremiumAccess = user?.subscriptionTier === "authority";

  // Removed auto-redirect to prevent error loop
  // User must click button to open Newsletter Builder

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Premium tier gate
  if (!hasPremiumAccess) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Authority Feature</CardTitle>
            <CardDescription>
              Newsletter Builder is available exclusively on the Authority plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">Professional Newsletter Builder</h3>
                  <p className="text-sm text-muted-foreground">
                    Create stunning email newsletters with drag-and-drop editor
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">Email List Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage subscribers, segments, and automated campaigns
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">Analytics & Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Track opens, clicks, and engagement metrics
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription>
                Upgrade to Authority ($149/month) to unlock Newsletter Builder and all premium features
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <a href="/upgrade">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Authority
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard">Back to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Premium user with access
  return (
    <div className="container mx-auto py-8 max-w-4xl min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Newsletter Builder</h1>
        <p className="text-muted-foreground">
          Create professional email newsletters for your real estate business
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Launch Newsletter Pro
          </CardTitle>
          <CardDescription>
            Click below to open Newsletter Builder in a new tab with automatic login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              You have Authority access! Newsletter Builder will open in a new tab with automatic authentication.
            </AlertDescription>
          </Alert>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {error.message || "Failed to generate Newsletter Builder access link. Please try again or contact support."}
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                if (ssoLink?.url) {
                  window.open(ssoLink.url, "_blank");
                }
              }}
              disabled={!ssoLink?.url}
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Open Newsletter Builder
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Secure single sign-on • No additional login required • Opens in new tab
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
