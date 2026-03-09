import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Video,
  Download,
  Trash2,
  Play,
  Clock,
  Mic,
  Film,
  BarChart3,
  Building2,
  RefreshCw,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type VideoType = "property_tour" | "authority_reel" | "market_stats";
type VideoStatus = "rendering" | "completed" | "failed";

interface GeneratedVideo {
  id: number;
  title: string;
  type: VideoType;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  renderId: string | null;
  status: VideoStatus;
  durationSeconds: number | null;
  hasVoiceover: boolean;
  creditsCost: number;
  metadata: string | null;
  createdAt: Date;
}

const TYPE_LABELS: Record<VideoType, string> = {
  property_tour: "Property Tour",
  authority_reel: "Authority Reel",
  market_stats: "Market Update",
};

const TYPE_ICONS: Record<VideoType, React.ElementType> = {
  property_tour: Building2,
  authority_reel: Film,
  market_stats: BarChart3,
};

const TYPE_COLORS: Record<VideoType, string> = {
  property_tour: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  authority_reel: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  market_stats: "bg-green-500/20 text-green-400 border-green-500/30",
};

const STATUS_COLORS: Record<VideoStatus, string> = {
  rendering: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyVideos() {
  const [, setLocation] = useLocation();
  const [typeFilter, setTypeFilter] = useState<VideoType | "all">("all");
  const [playingId, setPlayingId] = useState<number | null>(null);

  const { data: videos, isLoading, refetch } = trpc.myVideos.list.useQuery({ type: typeFilter });

  const deleteMutation = trpc.myVideos.delete.useMutation({
    onSuccess: () => {
      toast.success("Video removed from library");
      refetch();
    },
    onError: (err) => toast.error(`Failed to delete: ${err.message}`),
  });

  const typeFilters: Array<{ value: VideoType | "all"; label: string; icon: React.ElementType }> = [
    { value: "all", label: "All Videos", icon: Video },
    { value: "property_tour", label: "Property Tours", icon: Building2 },
    { value: "authority_reel", label: "Authority Reels", icon: Film },
    { value: "market_stats", label: "Market Updates", icon: BarChart3 },
  ];

  const completedCount = videos?.filter((v: GeneratedVideo) => v.status === "completed").length ?? 0;
  const renderingCount = videos?.filter((v: GeneratedVideo) => v.status === "rendering").length ?? 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Video className="h-8 w-8 text-primary" />
            My Videos
          </h1>
          <p className="text-muted-foreground mt-1">
            All your generated Property Tours, Authority Reels, and Market Update videos
          </p>
        </div>
        <div className="flex items-center gap-3">
          {renderingCount > 0 && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              {renderingCount} rendering
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Video className="h-3 w-3" />
            {completedCount} completed
          </Badge>
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={typeFilter === value ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(value)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <div className="aspect-video bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos && videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video: GeneratedVideo) => {
            const TypeIcon = TYPE_ICONS[video.type];
            const isPlaying = playingId === video.id;
            const metadata = video.metadata ? (() => { try { return JSON.parse(video.metadata); } catch { return {}; } })() : {};

            return (
              <Card key={video.id} className="bg-card border-border hover:border-primary/50 transition-all overflow-hidden group">
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
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TypeIcon className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}

                  {/* Status overlay */}
                  {video.status === "rendering" && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-8 w-8 text-yellow-400 animate-spin" />
                      <span className="text-yellow-400 text-sm font-medium">Rendering…</span>
                    </div>
                  )}
                  {video.status === "failed" && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                      <VideoOff className="h-8 w-8 text-red-400" />
                      <span className="text-red-400 text-sm font-medium">Render failed</span>
                    </div>
                  )}

                  {/* Play button overlay for completed videos */}
                  {video.status === "completed" && video.videoUrl && !isPlaying && (
                    <button
                      onClick={() => setPlayingId(video.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <Play className="h-6 w-6 text-white fill-white ml-1" />
                      </div>
                    </button>
                  )}

                  {/* Duration badge */}
                  {video.durationSeconds && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(video.durationSeconds)}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">{video.title}</h3>
                    {metadata.address && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{metadata.address}</p>
                    )}
                    {metadata.location && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{metadata.location}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={`text-xs ${TYPE_COLORS[video.type]}`}>
                      <TypeIcon className="h-3 w-3 mr-1" />
                      {TYPE_LABELS[video.type]}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[video.status]}`}>
                      {video.status === "rendering" ? (
                        <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Rendering</>
                      ) : video.status === "completed" ? (
                        "Completed"
                      ) : (
                        "Failed"
                      )}
                    </Badge>
                    {video.hasVoiceover && (
                      <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
                        <Mic className="h-3 w-3 mr-1" />
                        Voiceover
                      </Badge>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">{formatDate(video.createdAt)}</span>
                    <div className="flex items-center gap-1">
                      {video.status === "completed" && video.videoUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = video.videoUrl!;
                            a.download = `${video.title}.mp4`;
                            a.target = "_blank";
                            a.click();
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove from library?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes the video record from your library. The video file itself is not deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ id: video.id })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center space-y-4">
            <Video className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No videos yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {typeFilter === "all"
                  ? "Generate your first video from Property Tours, Authority Reels, or Market Stats."
                  : `No ${TYPE_LABELS[typeFilter as VideoType]} videos yet.`}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button onClick={() => setLocation("/property-tours")} variant="outline" size="sm" className="gap-2">
                <Building2 className="h-4 w-4" />
                Create Property Tour
              </Button>
              <Button onClick={() => setLocation("/autoreels")} variant="outline" size="sm" className="gap-2">
                <Film className="h-4 w-4" />
                Create Authority Reel
              </Button>
              <Button onClick={() => setLocation("/market-stats")} variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Create Market Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
