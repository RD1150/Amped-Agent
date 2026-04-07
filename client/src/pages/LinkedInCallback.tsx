import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LinkedInCallback() {
  const [currentPath, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const handleCallbackMutation = trpc.linkedin.handleCallback.useMutation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse URL parameters
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        const error = params.get("error");
        const errorDescription = params.get("error_description");

        // Check for OAuth errors
        if (error) {
          setStatus("error");
          setErrorMessage(errorDescription || error);
          return;
        }

        if (!code || !state) {
          setStatus("error");
          setErrorMessage("Missing authorization code or state parameter");
          return;
        }

        // Verify state matches what we stored
        const storedState = sessionStorage.getItem("linkedin_oauth_state");
        const storedRedirect = sessionStorage.getItem("linkedin_oauth_redirect");

        if (!storedState || state !== storedState) {
          setStatus("error");
          setErrorMessage("Invalid state parameter - possible CSRF attack");
          return;
        }

        if (!storedRedirect) {
          setStatus("error");
          setErrorMessage("Missing redirect URI");
          return;
        }

        // Exchange code for access token
        await handleCallbackMutation.mutateAsync({
          code,
          state,
          redirectUri: storedRedirect,
        });

        // Clean up session storage
        sessionStorage.removeItem("linkedin_oauth_state");
        sessionStorage.removeItem("linkedin_oauth_redirect");

        setStatus("success");

        // Redirect to integrations page after 2 seconds
        setTimeout(() => {
          setLocation("/integrations");
        }, 2000);
      } catch (error: any) {
        console.error("LinkedIn OAuth callback error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Failed to connect LinkedIn account");
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === "success" && <CheckCircle2 className="h-5 w-5 text-primary" />}
            {status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
            {status === "loading" && "Connecting LinkedIn..."}
            {status === "success" && "LinkedIn Connected!"}
            {status === "error" && "Connection Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we connect your LinkedIn account"}
            {status === "success" && "Your LinkedIn account has been successfully connected"}
            {status === "error" && "There was a problem connecting your LinkedIn account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary dark:text-green-400">
                  You can now post directly to your LinkedIn profile from AmpedAgent!
                </p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Redirecting to integrations page...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">
                  Error Details:
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errorMessage}
                </p>
              </div>
              <Button
                onClick={() => setLocation("/integrations")}
                variant="outline"
                className="w-full"
              >
                Back to Integrations
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
