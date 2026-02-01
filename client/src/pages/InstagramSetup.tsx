import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function InstagramSetup() {
  const [, setLocation] = useLocation();
  const [selectedPage, setSelectedPage] = useState<any>(null);

  const { data: pages, isLoading: loadingPages } = trpc.facebook.getPages.useQuery();
  const connectInstagramMutation = trpc.facebook.connectInstagram.useMutation();

  const handleConnectInstagram = async (page: any) => {
    if (!page.instagram_business_account) {
      toast.error("This page doesn't have an Instagram account connected");
      return;
    }

    try {
      setSelectedPage(page);
      
      // Get Instagram account details
      const igAccountId = page.instagram_business_account.id;
      
      // Fetch Instagram username
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}?fields=username&access_token=${page.access_token}`
      );
      const igData = await response.json();

      if (igData.error) {
        throw new Error(igData.error.message);
      }

      await connectInstagramMutation.mutateAsync({
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        instagramId: igAccountId,
        instagramUsername: igData.username,
      });

      toast.success(`Connected @${igData.username}!`);
      
      setTimeout(() => {
        setLocation("/integrations");
      }, 1500);
    } catch (error: any) {
      console.error("Instagram connection error:", error);
      toast.error(error.message || "Failed to connect Instagram");
      setSelectedPage(null);
    }
  };

  if (loadingPages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pagesWithInstagram = pages?.pages?.filter((p: any) => p.instagram_business_account) || [];
  const pagesWithoutInstagram = pages?.pages?.filter((p: any) => !p.instagram_business_account) || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Instagram className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Connect Instagram Account</CardTitle>
              <CardDescription>
                Select a Facebook Page that has an Instagram Business or Creator Account connected
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pagesWithInstagram.length === 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    No Instagram Accounts Found
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    None of your Facebook Pages have an Instagram Business or Creator Account connected.
                  </p>
                </div>
              </div>
              <div className="space-y-2 pl-7">
                <p className="text-sm font-medium">To connect Instagram:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Convert your Instagram to a Business or Creator Account</li>
                  <li>Connect it to a Facebook Page in Instagram settings</li>
                  <li>Make sure you granted all permissions during Facebook login</li>
                  <li>Come back here and refresh</li>
                </ol>
              </div>
              <div className="flex gap-2 pl-7">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://help.instagram.com/502981923235522", "_blank")}
                >
                  Learn How
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </div>
            </div>
          )}

          {pagesWithInstagram.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Select a Page to Connect:</p>
              <div className="space-y-2">
                {pagesWithInstagram.map((page: any) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{page.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Facebook Page with Instagram Account
                      </p>
                    </div>
                    <Button
                      onClick={() => handleConnectInstagram(page)}
                      disabled={connectInstagramMutation.isPending && selectedPage?.id === page.id}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {connectInstagramMutation.isPending && selectedPage?.id === page.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pagesWithoutInstagram.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Pages without Instagram ({pagesWithoutInstagram.length}):
              </p>
              <div className="space-y-1">
                {pagesWithoutInstagram.map((page: any) => (
                  <div
                    key={page.id}
                    className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg"
                  >
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{page.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/integrations")}
              className="flex-1"
            >
              Back to Integrations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
