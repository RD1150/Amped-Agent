import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";
import { Video, Save } from "lucide-react";

export default function AdminSettings() {
  const { user } = useAuth();
  const { data: currentUser, refetch } = trpc.auth.me.useQuery();
  const updateWelcomeVideo = trpc.admin.updateWelcomeVideo.useMutation({
    onSuccess: () => {
      toast.success("Welcome video updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update welcome video");
    },
  });

  const [videoUrl, setVideoUrl] = useState(currentUser?.avatarVideoUrl || "");

  // Redirect if not admin
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const handleSave = () => {
    updateWelcomeVideo.mutate({ videoUrl });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Settings</h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Welcome Video</h3>
              <p className="text-sm text-muted-foreground">
                This video plays first in the onboarding modal for new users
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://example.com/welcome-video.mp4"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter the direct URL to your welcome video (MP4, WebM, or hosted on YouTube/Vimeo)
              </p>
            </div>

            {videoUrl && (
              <div className="mt-4">
                <Label>Preview</Label>
                <div className="mt-2 aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={updateWelcomeVideo.isPending}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateWelcomeVideo.isPending ? "Saving..." : "Save Welcome Video"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Current Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Welcome Video Set:</span>
              <span className="font-medium">{currentUser?.avatarVideoUrl ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Users:</span>
              <span className="font-medium">View in Analytics</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Free Trial Credits:</span>
              <span className="font-medium">50 credits</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
