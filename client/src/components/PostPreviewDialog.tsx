import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Send, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface PostPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: number;
    content: string;
    imageUrl?: string | null;
    format?: string;
    platform?: string;
  } | null;
  onPublish: (data: {
    postId: number;
    platforms: string[];
    scheduleDate?: string;
    scheduleTime?: string;
  }) => void;
}

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "📘", color: "bg-blue-600" },
  { id: "instagram", name: "Instagram", icon: "📷", color: "bg-pink-600" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "bg-blue-700" },
  { id: "twitter", name: "Twitter/X", icon: "🐦", color: "bg-sky-500" },
  { id: "tiktok", name: "TikTok", icon: "🎵", color: "bg-black" },
];

export default function PostPreviewDialog({
  open,
  onOpenChange,
  post,
  onPublish,
}: PostPreviewDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublishNow = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    if (!post) return;

    setIsPublishing(true);
    try {
      await onPublish({
        postId: post.id,
        platforms: selectedPlatforms,
      });
      toast.success("Publishing to social media...");
      onOpenChange(false);
      // Reset state
      setSelectedPlatforms([]);
      setScheduleDate("");
      setScheduleTime("");
    } catch (error) {
      toast.error("Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    if (!scheduleDate || !scheduleTime) {
      toast.error("Please select date and time");
      return;
    }

    if (!post) return;

    setIsPublishing(true);
    try {
      await onPublish({
        postId: post.id,
        platforms: selectedPlatforms,
        scheduleDate,
        scheduleTime,
      });
      toast.success("Post scheduled successfully!");
      onOpenChange(false);
      // Reset state
      setSelectedPlatforms([]);
      setScheduleDate("");
      setScheduleTime("");
    } catch (error) {
      toast.error("Failed to schedule post");
    } finally {
      setIsPublishing(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview & Publish Post</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Post Preview */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Post Preview</h3>
              <Card>
                <CardContent className="p-4 space-y-3">
                  {/* Format Badge */}
                  {post.format && (
                    <Badge variant="secondary" className="mb-2">
                      {post.format === "static" && "📄 Static Post"}
                      {post.format === "reel" && "🎬 Reel Script"}
                      {post.format === "carousel" && "🎠 Carousel"}
                    </Badge>
                  )}

                  {/* Image */}
                  {post.imageUrl ? (
                    <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No image</p>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="space-y-2">
                    <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right: Publishing Options */}
          <div className="space-y-4">
            {/* Platform Selection */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Select Platforms</h3>
              <div className="space-y-2">
                {PLATFORMS.map(platform => (
                  <div
                    key={platform.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                    <Label
                      htmlFor={platform.id}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <span className="text-lg">{platform.icon}</span>
                      <span className="font-medium">{platform.name}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Schedule (Optional)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="schedule-date" className="text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Date
                  </Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-time" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Time
                  </Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to publish immediately
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {scheduleDate && scheduleTime ? (
            <Button onClick={handleSchedule} disabled={isPublishing}>
              <Calendar className="h-4 w-4 mr-2" />
              {isPublishing ? "Scheduling..." : "Schedule Post"}
            </Button>
          ) : (
            <Button onClick={handlePublishNow} disabled={isPublishing}>
              <Send className="h-4 w-4 mr-2" />
              {isPublishing ? "Publishing..." : "Publish Now"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
