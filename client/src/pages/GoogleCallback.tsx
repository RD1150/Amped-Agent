import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GoogleCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");

  const handleCallbackMutation = trpc.gbp.handleCallback.useMutation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        const error = params.get("error");
        const errorDescription = params.get("error_description");

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

        const storedState = sessionStorage.getItem("gbp_oauth_state");
        const storedRedirect = sessionStorage.getItem("gbp_oauth_redirect");

        if (!storedState || state !== storedState) {
          setStatus("error");
          setErrorMessage("Invalid state parameter — possible CSRF attack");
          return;
        }

        if (!storedRedirect) {
          setStatus("error");
          setErrorMessage("Missing redirect URI");
          return;
        }

        const result = await handleCallbackMutation.mutateAsync({
          code,
          state,
          redirectUri: storedRedirect,
        });

        sessionStorage.removeItem("gbp_oauth_state");
        sessionStorage.removeItem("gbp_oauth_redirect");

        setGoogleEmail(result.googleEmail ?? "");
        setStatus("success");

        // Redirect to integrations after 2 seconds so user can select location
        setTimeout(() => {
          setLocation("/integrations");
        }, 2000);
      } catch (error: any) {
        console.error("Google OAuth callback error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Failed to connect Google account");
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
            {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
            {status === "loading" && "Connecting Google Business Profile..."}
            {status === "success" && "Google Account Connected!"}
            {status === "error" && "Connection Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we connect your Google account"}
            {status === "success" && "Your Google account has been connected — select your business location next"}
            {status === "error" && "There was a problem connecting your Google account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {googleEmail ? `Signed in as ${googleEmail}` : "Google account connected"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Redirecting to Integrations to select your business location...
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">
                  Error Details:
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
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
