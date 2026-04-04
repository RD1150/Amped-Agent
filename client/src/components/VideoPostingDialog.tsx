import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Facebook, Instagram, Linkedin, CalendarIcon, Send, Loader2, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface VideoPostingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  defaultCaption?: string;
  videoTitle?: string;
  onSuccess?: () => void;
}

export function VideoPostingDialog({
  open,
  onOpenChange,
  videoUrl,
  defaultCaption = "",
  videoTitle = "Property Video",
  onSuccess,
}: VideoPostingDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [caption, setCaption] = useState(defaultCaption);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [isPosting, setIsPosting] = useState(false);

  // Get connected integrations
  const { data: facebookConnection } = trpc.facebook.getConnection.useQuery();
  const { data: instagramConnection } = trpc.facebook.getInstagramConnection.useQuery();
  const { data: linkedinConnection } = trpc.linkedin.getConnection.useQuery();

  const postVideoMutation = trpc.socialPosting.postVideo.useMutation();
  const scheduleVideoMutation = trpc.socialPosting.scheduleVideo.useMutation();

  const platforms = [
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      connected: facebookConnection?.isConnected,
      color: "text-blue-600",
      note: "Posts as a Facebook video",
    },
    {
      id: "instagram",
      name: "Instagram Reels",
      icon: Instagram,
      connected: instagramConnection?.isConnected,
      color: "text-pink-600",
      note: "Posts as an Instagram Reel",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      connected: linkedinConnection?.isConnected,
      color: "text-blue-700",
      note: "Posts as a LinkedIn video",
    },
  ];

  const connectedPlatforms = platforms.filter((p) => p.connected);
  const hasConnectedPlatforms = connectedPlatforms.length > 0;

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePost = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }
    if (!caption.trim()) {
      toast.error("Please add a caption for your video");
      return;
    }

    setIsPosting(true);
    try {
      if (scheduleMode && scheduledDate) {
        await scheduleVideoMutation.mutateAsync({
          videoUrl,
          caption,
          platforms: selectedPlatforms as any[],
          scheduledAt: scheduledDate,
          title: videoTitle,
        });
        toast.success(`Video scheduled for ${format(scheduledDate, "PPP")}`);
      } else {
        const result = await postVideoMutation.mutateAsync({
          videoUrl,
          caption,
          platforms: selectedPlatforms as any[],
          title: videoTitle,
        });

        const succeeded = result.results.filter((r: any) => r.success).map((r: any) => r.platform);
        const failed = result.results.filter((r: any) => !r.success).map((r: any) => r.platform);

        if (succeeded.length > 0) {
          toast.success(`Video posted to: ${succeeded.join(", ")}`);
        }
        if (failed.length > 0) {
          const errors = result.results
            .filter((r: any) => !r.success)
            .map((r: any) => `${r.platform}: ${r.error}`)
            .join("; ");
          toast.error(`Failed to post to: ${failed.join(", ")}. ${errors}`);
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to post video");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Post Video to Social Media
          </DialogTitle>
          <DialogDescription>
            {hasConnectedPlatforms
              ? "Select platforms and add a caption to publish your video"
              : "Connect your social media accounts to start posting videos"}
          </DialogDescription>
        </DialogHeader>

        {!hasConnectedPlatforms ? (
          <div className="py-8 text-center">
            <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No social media accounts connected yet
            </p>
            <Button onClick={() => { window.location.href = "/integrations"; }}>
              Connect Accounts
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Caption */}
            <div className="space-y-2">
              <Label>Caption</Label>
              <Textarea
                placeholder="Write a caption for your video... Add hashtags, emojis, and a call to action."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{caption.length} characters</p>
            </div>

            {/* Platform Selection */}
            <div className="space-y-3">
              <Label>Select Platforms</Label>
              {connectedPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div key={platform.id} className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={platform.id}
                        className="flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Icon className={cn("h-4 w-4", platform.color)} />
                        {platform.name}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{platform.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Schedule Toggle */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="schedule"
                checked={scheduleMode}
                onCheckedChange={(checked) => setScheduleMode(checked as boolean)}
              />
              <Label htmlFor="schedule" className="cursor-pointer">
                Schedule for later
              </Label>
            </div>

            {/* Date Picker */}
            {scheduleMode && (
              <div className="space-y-2">
                <Label>Schedule Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Instagram note */}
            {selectedPlatforms.includes("instagram") && (
              <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3 text-xs text-pink-300">
                <strong>Instagram note:</strong> Video will be posted as a Reel. Processing may take 30–60 seconds after posting while Instagram encodes the video.
              </div>
            )}
          </div>
        )}

        {hasConnectedPlatforms && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePost} disabled={isPosting || selectedPlatforms.length === 0}>
              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {scheduleMode ? "Scheduling..." : "Posting..."}
                </>
              ) : scheduleMode ? (
                <>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule Video
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post Video Now
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
