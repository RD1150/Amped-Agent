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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Facebook, Instagram, Linkedin, CalendarIcon, Send, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PostingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  imageUrl?: string | null;
  onSuccess?: () => void;
}

export function PostingDialog({
  open,
  onOpenChange,
  content,
  imageUrl,
  onSuccess,
}: PostingDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [isPosting, setIsPosting] = useState(false);

  // Get connected integrations
  const { data: facebookConnection } = trpc.facebook.getConnection.useQuery();
  const { data: instagramConnection } = trpc.facebook.getInstagramConnection.useQuery();
  const { data: linkedinConnection } = trpc.linkedin.getConnection.useQuery();
  const { data: gbpStatus } = trpc.gbp.getStatus.useQuery();
  const gbpPostMutation = trpc.gbp.createPost.useMutation();

  const postNowMutation = trpc.socialPosting.postNow.useMutation();
  const schedulePostMutation = trpc.socialPosting.schedulePost.useMutation();
  const createContentMutation = trpc.content.create.useMutation();

  const platforms = [
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      connected: facebookConnection?.isConnected,
      color: "text-blue-600",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      connected: instagramConnection?.isConnected,
      color: "text-pink-600",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      connected: linkedinConnection?.isConnected,
      color: "text-blue-700",
    },
    {
      id: "google_business",
      name: "Google Business Profile",
      icon: MapPin,
      connected: gbpStatus?.isConnected && !!gbpStatus?.locationId,
      color: "text-emerald-600",
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

    if (!content) {
      toast.error("No content to post");
      return;
    }

    try {
      setIsPosting(true);

      // First, create the content post in the database
      const contentPost = await createContentMutation.mutateAsync({
        content,
        imageUrl: imageUrl || undefined,
        status: scheduleMode ? "scheduled" : "draft",
        contentType: "custom",
      });

      // Handle GBP separately (direct post, not via socialPosting router)
      const gbpSelected = selectedPlatforms.includes("google_business");
      const otherPlatforms = selectedPlatforms.filter((p) => p !== "google_business");

      if (scheduleMode && scheduledDate) {
        // Schedule the post (social platforms only — GBP doesn't support scheduling yet)
        if (otherPlatforms.length > 0) {
          await schedulePostMutation.mutateAsync({
            contentPostId: contentPost.id,
            scheduledAt: scheduledDate,
            platforms: otherPlatforms as any,
          });
        }
        if (gbpSelected) {
          // For GBP, post immediately even in schedule mode (GBP scheduling not supported)
          await gbpPostMutation.mutateAsync({ summary: content, topicType: "STANDARD", mediaUrl: imageUrl ?? undefined });
          toast.success(`Scheduled social posts + posted to Google Business Profile`);
        } else {
          toast.success(`Post scheduled for ${format(scheduledDate, "PPP")}`);
        }
      } else {
        const results: string[] = [];
        const errors: string[] = [];

        // Post to social platforms
        if (otherPlatforms.length > 0) {
          const result = await postNowMutation.mutateAsync({
            contentPostId: contentPost.id,
            platforms: otherPlatforms as any,
          });
          if (result.success) {
            results.push(...result.postedPlatforms);
          } else {
            errors.push("some social platforms");
          }
        }

        // Post to GBP
        if (gbpSelected) {
          try {
            await gbpPostMutation.mutateAsync({ summary: content, topicType: "STANDARD", mediaUrl: imageUrl ?? undefined });
            results.push("Google Business Profile");
          } catch (err: any) {
            errors.push("Google Business Profile");
          }
        }

        if (results.length > 0) {
          toast.success(`Posted to: ${results.join(", ")}`);
        }
        if (errors.length > 0) {
          toast.error(`Failed to post to: ${errors.join(", ")}`);
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to post content");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Post to Social Media</DialogTitle>
          <DialogDescription>
            {hasConnectedPlatforms
              ? "Select platforms and choose when to post"
              : "Connect your social media accounts to start posting"}
          </DialogDescription>
        </DialogHeader>

        {!hasConnectedPlatforms ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No social media accounts connected yet
            </p>
            <Button
              onClick={() => {
                window.location.href = "/integrations";
              }}
            >
              Connect Accounts
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Platform Selection */}
            <div className="space-y-3">
              <Label>Select Platforms</Label>
              {connectedPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div key={platform.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                    <Label
                      htmlFor={platform.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className={cn("h-5 w-5", platform.color)} />
                      {platform.name}
                    </Label>
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
                      {scheduledDate ? (
                        format(scheduledDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
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
          </div>
        )}

        {hasConnectedPlatforms && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePost} disabled={isPosting}>
              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : scheduleMode ? (
                <>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule Post
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post Now
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
