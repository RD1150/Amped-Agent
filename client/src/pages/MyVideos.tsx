import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Video,
  Download,
  Play,
  Film,
  Building2,
  UserCircle,
  Clapperboard,
  Loader2,
  VideoOff,
  ExternalLink,
  Trash2,
  Smartphone,
  Share2,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { VideoPostingDialog } from "@/components/VideoPostingDialog";

type VideoSource = 'listing_video' | 'cinematic_tour' | 'ai_reel' | 'avatar_video' | 'authority_reel' | 'live_tour';

interface UnifiedVideo {
  id: string;
  source: VideoSource;
  title: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: 'processing' | 'completed' | 'failed' | 'rendering';
  durationSeconds: number | null;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

const SOURCE_CONFIG: Record<VideoSource, { label: string; icon: React.ElementType; color: string; path: string }> = {
  listing_video: {
    label: "Property Tour",
    icon: Building2,
    color: "bg-primary/15 text-primary border-primary/20",
    path: "/property-tours",
  },
  cinematic_tour: {
    label: "Property Tour",
    icon: Film,
    color: "bg-primary/20 text-primary border-primary/20",
    path: "/property-tours",
  },
  ai_reel: {
    label: "AI Reel",
    icon: Clapperboard,
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    path: "/autoreels",
  },
  authority_reel: {
    label: "Authority Reel",
    icon: Clapperboard,
    color: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    path: "/autoreels",
  },
  avatar_video: {
    label: "Avatar Video",
    icon: UserCircle,
    color: "bg-primary/20 text-primary border-primary/20",
    path: "/full-avatar-video",
  },
  live_tour: {
    label: "Live Tour",
    icon: Smartphone,
    color: "bg-teal-500/20 text-teal-600 border-teal-500/30",
    path: "/live-tour",
  },
};

const STATUS_COLORS: Record<string, string> = {
  processing: "bg-primary/10 text-primary/60 border-primary/30",
  rendering: "bg-primary/10 text-primary/60 border-primary/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

async function downloadVideo(url: string, title: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.mp4`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, "_blank");
  }
}

type FilterSource = VideoSource | "all";

const FILTER_TABS: Array<{ value: FilterSource; label: string; icon: React.ElementType }> = [
  { value: "all", label: "All Videos", icon: Video },
  { value: "listing_video", label: "Property Tours", icon: Building2 },
  { value: "cinematic_tour", label: "Cinematic Tours", icon: Film },
  { value: "ai_reel", label: "AI Reels", icon: Clapperboard },
  { value: "avatar_video", label: "Avatar Videos", icon: UserCircle },
  { value: "live_tour", label: "Live Tours", icon: Smartphone },
];

export default function MyVideos() {
  const [, setLocation] = useLocation();
  const [sourceFilter, setSourceFilter] = useState<FilterSource>("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnifiedVideo | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [shareVideo, setShareVideo] = useState<UnifiedVideo | null>(null);

  const utils = trpc.useUtils();
  const deleteMutation = trpc.myVideos.deleteUnified.useMutation({
    onSuccess: () => {
      utils.myVideos.listAll.invalidate();
      setDeleteTarget(null);
      setDeleteConfirmText("");
      toast.success("Video deleted", { description: "The video has been permanently removed." });
    },
    onError: (err) => {
      toast.error("Delete failed", { description: err.message });
    },
  });

  const { data: videos, isLoading } = trpc.myVideos.listAll.useQuery({
    source: "all",
  });

  const filteredVideos = (videos ?? []).filter((v: UnifiedVideo) => {
    if (sourceFilter === "all") return true;
    if (sourceFilter === "ai_reel") return v.source === "ai_reel" || v.source === "authority_reel";
    return v.source === sourceFilter;
  });

  const completedCount = filteredVideos.filter((v: UnifiedVideo) => v.status === "completed").length;
  const processingCount = filteredVideos.filter(
    (v: UnifiedVideo) => v.status === "processing" || v.status === "rendering"
  ).length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Video className="h-8 w-8 text-primary" />
            My Videos
          </h1>
          <p className="text-muted-foreground mt-1">
            All your generated videos — Property Tours, AI Reels, Avatar Videos, and Live Tours
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {processingCount > 0 && (
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary/60 border-primary/30 gap-1"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              {processingCount} processing
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Video className="h-3 w-3" />
            {completedCount} completed
          </Badge>
        </div>
      </div>

      {/* Source Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={sourceFilter === value ? "default" : "outline"}
            size="sm"
            onClick={() => setSourceFilter(value)}
            className={
              sourceFilter === value
                ? "bg-muted0 hover:bg-primary text-primary-foreground border-primary gap-2"
                : "gap-2"
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video: UnifiedVideo) => {
            const cfg = SOURCE_CONFIG[video.source] ?? SOURCE_CONFIG.listing_video;
            const SourceIcon = cfg.icon;
            const isPlaying = playingId === video.id;

            return (
              <Card
                key={video.id}
                className="bg-card border-border hover:border-primary/30 transition-all overflow-hidden group"
              >
                {/* Thumbnail / Video Player */}
                <div className="relative aspect-video bg-muted/50 overflow-hidden">
                  {isPlaying && video.videoUrl ? (
                    <video
                      src={video.videoUrl}
                      autoPlay
                      controls
                      className="w-full h-full object-cover"
                      onEnded={() => setPlayingId(null)}
                    />
                  ) : video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted/40">
                      <SourceIcon className="h-14 w-14 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Play overlay */}
                  {!isPlaying && video.videoUrl && video.status === "completed" && (
                    <button
                      onClick={() => setPlayingId(video.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="bg-white/90 rounded-full p-3 shadow-lg">
                        <Play className="h-6 w-6 text-black fill-black" />
                      </div>
                    </button>
                  )}

                  {/* Processing status overlay */}
                  {(video.status === "processing" || video.status === "rendering") && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 text-primary/80 animate-spin" />
                      <span className="text-primary/80 text-sm font-medium">Processing…</span>
                    </div>
                  )}

                  {/* Source badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                      <SourceIcon className="h-3 w-3 mr-1" />
                      {cfg.label}
                    </Badge>
                  </div>

                  {/* Status badge (non-completed) */}
                  {video.status === "failed" && (
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_COLORS[video.status]}`}
                      >
                        Failed
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(video.createdAt)}</span>
                      {video.durationSeconds && (
                        <>
                          <span>·</span>
                          <span>{formatDuration(video.durationSeconds)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {video.videoUrl && video.status === "completed" && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 bg-muted0 hover:bg-primary text-black font-semibold h-8 text-xs"
                          onClick={() => downloadVideo(video.videoUrl!, video.title)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs px-3 text-primary hover:text-primary hover:border-primary/50"
                          onClick={() => setShareVideo(video)}
                          title="Post to Social Media"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs px-3"
                      onClick={() => setLocation(cfg.path)}
                      title={`Go to ${cfg.label}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs px-3 text-red-500 hover:text-red-600 hover:border-red-400 hover:bg-red-500/10"
                      onClick={() => { setDeleteTarget(video); setDeleteConfirmText(""); }}
                      title="Delete video"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty state — intentional fall-through */
        // (rendered below)
        undefined
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              Delete Video
            </DialogTitle>
            <DialogDescription className="pt-1">
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">"{deleteTarget?.title}"</span>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-bold text-foreground">delete</span> to confirm.
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type delete here"
              className="font-mono"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && deleteConfirmText === "delete" && deleteTarget) {
                  deleteMutation.mutate({ compositeId: deleteTarget.id });
                }
              }}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "delete" || deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate({ compositeId: deleteTarget.id })}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting…</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" /> Delete Permanently</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredVideos.length === 0 && !isLoading && (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
            <VideoOff className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No videos yet</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">
              {sourceFilter === "all"
                ? "Generate your first video using Property Tour, AI Reels, Avatar Video, or Live Tour."
                : `You haven't created any ${
                    FILTER_TABS.find((t) => t.value === sourceFilter)?.label ?? "videos"
                  } yet.`}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button
              size="sm"
              onClick={() => setLocation("/property-tours")}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              Property Tour
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/autoreels")}
              className="gap-2"
            >
              <Clapperboard className="h-4 w-4" />
              AI Reels
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/full-avatar-video")}
              className="gap-2"
            >
              <UserCircle className="h-4 w-4" />
              Avatar Video
            </Button>
          </div>
        </div>
      )}

      {/* Video Posting Dialog */}
      {shareVideo && shareVideo.videoUrl && (
        <VideoPostingDialog
          open={!!shareVideo}
          onOpenChange={(open) => { if (!open) setShareVideo(null); }}
          videoUrl={shareVideo.videoUrl}
          videoTitle={shareVideo.title}
          defaultCaption={`Check out this ${SOURCE_CONFIG[shareVideo.source]?.label ?? "video"}! 🏡 #RealEstate #AmpedAgent`}
          onSuccess={() => setShareVideo(null)}
        />
      )}
    </div>
  );
}
