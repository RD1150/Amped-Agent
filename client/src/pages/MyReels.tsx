import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Calendar, Clock, Video, AlertCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MyReels() {
  const utils = trpc.useUtils();
  const { data: reels, isLoading } = trpc.autoreels.getReels.useQuery();

  const deleteReelMutation = trpc.reels.deleteReel.useMutation({
    onSuccess: () => {
      utils.autoreels.getReels.invalidate();
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getExpirationBadge = (daysUntilExpiration: number) => {
    if (daysUntilExpiration <= 7) {
      return <Badge variant="destructive">Expires in {daysUntilExpiration} days</Badge>;
    } else if (daysUntilExpiration <= 30) {
      return <Badge variant="secondary">Expires in {daysUntilExpiration} days</Badge>;
    } else {
      return <Badge variant="outline">Expires in {daysUntilExpiration} days</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Reels</h1>
        <p className="text-muted-foreground">
          Your generated talking avatar videos (stored for 90 days)
        </p>
      </div>

      <Alert className="mb-6">
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Videos are automatically deleted after 90 days. Download any reels you want to keep permanently.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !reels || reels.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reels yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first talking avatar reel to see it here
              </p>
              <Button asChild>
                <a href="/script-to-reel">Create Reel</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reels.map((reel) => {
            const daysUntilExpiration = Math.ceil((new Date(reel.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
            <Card key={reel.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">
                    {reel.title || `Reel #${reel.id}`}
                  </CardTitle>
                  {getExpirationBadge(daysUntilExpiration)}
                </div>
                <CardDescription className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3" />
                  {formatDate(reel.createdAt.toString())}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video Preview */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <video
                    src={reel.shotstackRenderUrl || reel.s3Url || reel.didVideoUrl || undefined}
                    controls
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                </div>

                {/* Script Preview */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {reel.script}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={reel.shotstackRenderUrl || reel.s3Url || reel.didVideoUrl || undefined}
                      download={`reel-${reel.id}.mp4`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const videoUrl = reel.shotstackRenderUrl || reel.s3Url || reel.didVideoUrl || '';
                      if (navigator.share && videoUrl) {
                        navigator.share({
                          title: reel.title || `Reel #${reel.id}`,
                          text: reel.script.substring(0, 100),
                          url: videoUrl,
                        });
                      } else if (videoUrl) {
                        navigator.clipboard.writeText(videoUrl);
                        alert("Link copied to clipboard!");
                      }
                    }}
                  >
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={deleteReelMutation.isPending}
                    onClick={() => {
                      if (confirm("Delete this reel? This cannot be undone.")) {
                        deleteReelMutation.mutate({ reelId: reel.id });
                      }
                    }}
                  >
                    {deleteReelMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Expiration Warning */}
                {daysUntilExpiration <= 7 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Download soon! This reel will be deleted in {daysUntilExpiration} days.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}
    </div>
  );
}
