import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";

const PLATFORMS = [
  { id: "facebook", label: "Facebook", color: "bg-blue-600" },
  { id: "instagram", label: "Instagram", color: "bg-pink-500" },
  { id: "linkedin", label: "LinkedIn", color: "bg-sky-700" },
];

type ContentType = "property_listing" | "market_report" | "trending_news" | "tips" | "neighborhood" | "custom" | "carousel" | "video";

interface ScheduleToCalendarModalProps {
  open: boolean;
  onClose: () => void;
  /** The generated content text to schedule */
  content: string;
  /** Optional title/headline for the post */
  title?: string;
  /** Content type hint */
  contentType?: ContentType;
  /** Optional image URL to attach */
  imageUrl?: string;
  /** Optional video URL to attach */
  videoUrl?: string;
  /** Source feature label shown in the modal header */
  sourceLabel?: string;
}

export default function ScheduleToCalendarModal({
  open,
  onClose,
  content,
  title,
  contentType = "custom",
  imageUrl,
  videoUrl,
  sourceLabel = "Content",
}: ScheduleToCalendarModalProps) {
  const utils = trpc.useUtils();

  // Default to tomorrow at 9am
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook", "instagram"]);
  const [editableContent, setEditableContent] = useState(content);
  const [isScheduling, setIsScheduling] = useState(false);
  const [done, setDone] = useState(false);

  const createContent = trpc.content.create.useMutation();
  const createCalendarEvent = trpc.calendar.create.useMutation();

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSchedule = async () => {
    if (!selectedDate) {
      toast.error("Please pick a date");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    setIsScheduling(true);
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);

      // 1. Save as a content post
      const post = await createContent.mutateAsync({
        title: title || `Scheduled ${sourceLabel}`,
        content: editableContent,
        contentType,
        status: "scheduled",
        scheduledAt,
        platforms: JSON.stringify(selectedPlatforms),
        imageUrl: imageUrl || undefined,
        aiGenerated: true,
      });

      // 2. Create a calendar event linked to the post
      await createCalendarEvent.mutateAsync({
        contentPostId: post.id,
        title: title || `Scheduled ${sourceLabel}`,
        description: editableContent.slice(0, 200),
        eventDate: scheduledAt,
        eventTime: selectedTime,
        eventType: "post",
        isAllDay: false,
      });

      await utils.calendar.list.invalidate();
      await utils.content.list.invalidate();

      setDone(true);
      toast.success("Added to your Content Calendar!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule — please try again");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    setEditableContent(content);
    setSelectedDate(defaultDate);
    setSelectedTime("09:00");
    setSelectedPlatforms(["facebook", "instagram"]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Schedule to Content Calendar
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <p className="font-semibold text-lg">Scheduled!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your {sourceLabel.toLowerCase()} has been added to the Content Calendar for{" "}
                <span className="font-medium text-foreground">
                  {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  at {selectedTime}
                </span>
                .
              </p>
            </div>
            <Button onClick={handleClose} className="mt-2">Done</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              {/* Content preview / edit */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Content Preview
                </Label>
                <Textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                  placeholder="Your post content..."
                />
                <p className="text-xs text-muted-foreground">You can edit before scheduling.</p>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date
                  </Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Time
                  </Label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Platforms
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        selectedPlatforms.includes(p.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {imageUrl && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Attached Image
                  </Label>
                  <img src={imageUrl} alt="Post image" className="h-20 w-auto rounded-md object-cover border" />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isScheduling}>
                Cancel
              </Button>
              <Button onClick={handleSchedule} disabled={isScheduling || !selectedDate}>
                {isScheduling ? "Scheduling…" : "Add to Calendar"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
