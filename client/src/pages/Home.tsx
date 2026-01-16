import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  
  const createSubAccountMutation = trpc.ghl.createSubAccount.useMutation({
    onSuccess: (data) => {
      toast.success("GHL Sub-Account Created!", {
        description: `Location ID: ${data.locationId}`,
      });
      console.log("Sub-account created:", data);
    },
    onError: (error) => {
      toast.error("Failed to create sub-account", {
        description: error.message,
      });
      console.error("Sub-account creation error:", error);
    },
  });

  const handleTestGHL = () => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    createSubAccountMutation.mutate({
      name: user.name || "Test User",
      email: user.email || "test@example.com",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>GHL Integration Test</CardTitle>
          <CardDescription>
            Test the GoHighLevel sub-account auto-provisioning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated ? (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>User:</strong> {user?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong> {user?.email}
                </p>
                {user?.ghlLocationId && (
                  <p className="text-sm text-green-600">
                    ✓ GHL Location ID: {user.ghlLocationId}
                  </p>
                )}
              </div>

              <Button
                onClick={handleTestGHL}
                disabled={createSubAccountMutation.isPending}
                className="w-full"
              >
                {createSubAccountMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Sub-Account...
                  </>
                ) : (
                  "Test: Create GHL Sub-Account"
                )}
              </Button>

              {createSubAccountMutation.isSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Success!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Location ID: {createSubAccountMutation.data.locationId}
                  </p>
                  <p className="text-xs text-green-600">
                    SaaS Enabled: {createSubAccountMutation.data.saasEnabled ? "Yes" : "No"}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Please log in to test GHL integration
              </p>
              <Button asChild>
                <a href={getLoginUrl()}>Log In</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
