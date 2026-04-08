import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type ToolType =
  | "full_avatar_video"
  | "ai_reels"
  | "property_tour"
  | "post_builder"
  | "blog_builder"
  | "youtube_builder"
  | "newsletter"
  | "lead_magnet"
  | "market_insights"
  | "expert_hooks"
  | "listing_presentation"
  | "other";

interface GenerationRatingPromptProps {
  toolType: ToolType;
  referenceId?: number;
  referenceTable?: string;
  onDismiss?: () => void;
  /** Compact inline mode — no card border, smaller text */
  compact?: boolean;
}

export function GenerationRatingPrompt({
  toolType,
  referenceId,
  referenceTable,
  onDismiss,
  compact = false,
}: GenerationRatingPromptProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.generationFeedback.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Thanks for the feedback!");
      setTimeout(() => onDismiss?.(), 1500);
    },
    onError: () => {
      toast.error("Couldn't save feedback — please try again.");
    },
  });

  const handleSubmit = () => {
    if (!selectedRating) return;
    submitMutation.mutate({
      toolType,
      rating: selectedRating,
      referenceId,
      referenceTable,
      note: note.trim() || undefined,
    });
  };

  if (submitted) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${compact ? "" : "py-2"}`}>
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        <span>Feedback saved — thank you!</span>
      </div>
    );
  }

  const displayRating = hoveredStar ?? selectedRating ?? 0;

  const labels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Great",
    5: "Excellent",
  };

  return (
    <div className={compact ? "space-y-2" : "rounded-lg border border-border bg-muted/30 p-4 space-y-3"}>
      <div className="flex items-center gap-2">
        <span className={`font-medium ${compact ? "text-sm" : "text-sm"}`}>
          How did this generation turn out?
        </span>
        {displayRating > 0 && (
          <span className="text-xs text-muted-foreground">{labels[displayRating]}</span>
        )}
      </div>

      {/* Star row */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(null)}
            onClick={() => setSelectedRating(star)}
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= displayRating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Optional note — only shown after a star is selected */}
      {selectedRating !== null && (
        <div className="space-y-2">
          <Textarea
            placeholder="Optional: any notes on what worked or didn't? (only you see this)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm min-h-[60px] resize-none"
            maxLength={1000}
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {submitMutation.isPending ? "Saving…" : "Submit"}
            </Button>
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss} className="text-muted-foreground">
                Skip
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Skip link when no star selected yet */}
      {selectedRating === null && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          Skip
        </button>
      )}
    </div>
  );
}
