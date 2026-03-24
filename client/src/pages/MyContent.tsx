import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Film,
  FileText,
  Shuffle,
  Download,
  Copy,
  Check,
  Play,
  Building2,
  BarChart3,
  Loader2,
  RefreshCw,
  VideoOff,
  ExternalLink,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type ContentFilter = "all" | "videos" | "reels" | "lead_magnets" | "repurposed";

interface VideoItem {
  id: number;
  title: string;
  type: "property_tour" | "authority_reel" | "market_stats";
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: "rendering" | "completed" | "failed";
  durationSeconds: number | null;
  createdAt: Date;
}

interface ReelItem {
  id: number;
  title: string | null;
  didVideoUrl: string | null;
  shotstackRenderUrl: string | null;
  s3Url: string | null;
  reelType: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
}

interface LeadMagnetItem {
  id: number;
  title: string;
  type: string;
  pdfUrl: string;
  agentName: string | null;
  city: string;
  createdAt: Date;
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      className="gap-1.5 text-xs h-8"
      onClick={() => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy Link"}
    </Button>
  );
}

const TYPE_LABELS: Record<string, string> = {
  property_tour: "Property Tour",
  authority_reel: "Authority Reel",
  market_stats: "Market Update",
  first_time_buyer_guide: "Buyer Guide",
  neighborhood_report: "Neighborhood Report",
  market_update: "Market Update PDF",
};

const TYPE_COLORS: Record<string, string> = {
  property_tour: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  authority_reel: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  market_stats: "bg-green-500/15 text-green-600 border-green-500/30",
  first_time_buyer_guide: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  neighborhood_report: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  market_update: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

export default function MyContent() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<ContentFilter>("all");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const { data: videos, isLoading: videosLoading } = trpc.myVideos.list.useQuery({ type: "all" });
  const { data: reels, isLoading: reelsLoading } = trpc.autoreels.getReels.useQuery();
  const { data: leadMagnets, isLoading: magnetsLoading } = trpc.leadMagnet.getMyLeadMagnets.useQuery();

  const isLoading = videosLoading || reelsLoading || magnetsLoading;

  const filterTabs: Array<{ value: ContentFilter; label: string; icon: React.ElementType; count?: number }> = [
    { value: "all", label: "All Content", icon: Shuffle, count: (videos?.length ?? 0) + (reels?.length ?? 0) + (leadMagnets?.length ?? 0) },
    { value: "videos", label: "Property Tours", icon: Building2, count: videos?.filter((v: VideoItem) => v.type === "property_tour").length ?? 0 },
    { value: "reels", label: "AI Reels", icon: Film, count: reels?.length ?? 0 },
    { value: "lead_magnets", label: "Lead Magnets", icon: FileText, count: leadMagnets?.length ?? 0 },
  ];

  const totalItems = (videos?.length ?? 0) + (reels?.length ?? 0) + (leadMagnets?.length ?? 0);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shuffle className="h-8 w-8 text-primary" />
            My Content
          </h1>
          <p className="text-muted-foreground mt-1">
            Everything you've created — videos, reels, and lead magnets in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
            <Video className="h-3.5 w-3.5" />
            {totalItems} items
          </Badge>
        </div>
      </div>

      {/* Quick create buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setLocation("/property-tours")}>
          <Plus className="w-3.5 h-3.5" />
          New Property Tour
        </Button>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setLocation("/autoreels")}>
          <Plus className="w-3.5 h-3.5" />
          New AI Reel
        </Button>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setLocation("/lead-magnet")}>
          <Plus className="w-3.5 h-3.5" />
          New Lead Magnet
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map(({ value, label, icon: Icon, count }) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(value)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
            {count !== undefined && count > 0 && (
              <Badge variant={filter === value ? "secondary" : "outline"} className="text-xs px-1.5 py-0 h-4">
                {count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

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
      ) : totalItems === 0 ? (
        <Card className="p-12 text-center">
          <Shuffle className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-semibold text-foreground mb-1">Nothing here yet</p>
          <p className="text-muted-foreground text-sm mb-6">
            Create your first property tour, AI reel, or lead magnet to see it here.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => setLocation("/property-tours")} className="gap-2">
              <Building2 className="w-4 h-4" />
              Create Property Tour
            </Button>
            <Button variant="outline" onClick={() => setLocation("/autoreels")} className="gap-2">
              <Film className="w-4 h-4" />
              Create AI Reel
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Property Tour Videos */}
          {(filter === "all" || filter === "videos") &&
            videos
              ?.filter((v: VideoItem) => filter === "all" || v.type === "property_tour")
              .map((video: VideoItem) => {
                const playKey = `video-${video.id}`;
                const isPlaying = playingVideoId === playKey;
                return (
                  <Card key={playKey} className="overflow-hidden hover:border-primary/50 transition-all group">
                    {/* Thumbnail / Player */}
                    <div className="relative aspect-video bg-muted/50 overflow-hidden">
                      {isPlaying && video.videoUrl ? (
                        <video
                          src={video.videoUrl}
                          autoPlay
                          controls
                          className="w-full h-full object-cover"
                          onEnded={() => setPlayingVideoId(null)}
                        />
                      ) : video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}

                      {video.status === "rendering" && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="h-7 w-7 text-yellow-400 animate-spin" />
                          <span className="text-yellow-400 text-xs font-medium">Rendering…</span>
                        </div>
                      )}
                      {video.status === "failed" && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                          <VideoOff className="h-7 w-7 text-red-400" />
                          <span className="text-red-400 text-xs font-medium">Failed</span>
                        </div>
                      )}
                      {video.status === "completed" && video.videoUrl && !isPlaying && (
                        <button
                          onClick={() => setPlayingVideoId(playKey)}
                          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <Play className="h-5 w-5 text-black ml-0.5" />
                          </div>
                        </button>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{video.title}</p>
                        <Badge variant="outline" className={`text-xs shrink-0 ${TYPE_COLORS[video.type] || ""}`}>
                          {TYPE_LABELS[video.type] || video.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {new Date(video.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>

                      {video.status === "completed" && video.videoUrl && (
                        <div className="flex gap-2">
                          <a
                            href={video.videoUrl}
                            download
                            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                          <CopyLinkButton url={video.videoUrl} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

          {/* AI Reels */}
          {(filter === "all" || filter === "reels") &&
            reels?.map((reel: ReelItem) => {
              const playKey = `reel-${reel.id}`;
              const isPlaying = playingVideoId === playKey;
              // Resolve the best available video URL: authority reels use shotstackRenderUrl, D-ID reels use didVideoUrl
              const reelVideoUrl = reel.shotstackRenderUrl || reel.s3Url || reel.didVideoUrl || null;
              const isProcessing = reel.status === "processing";
              const isFailed = reel.status === "failed";
              return (
                <Card key={playKey} className="overflow-hidden hover:border-primary/50 transition-all group">
                  {/* Vertical video thumbnail */}
                  <div className="relative aspect-[9/16] max-h-[240px] bg-muted/50 overflow-hidden">
                    {isPlaying && reelVideoUrl ? (
                      <video
                        src={reelVideoUrl}
                        autoPlay
                        controls
                        className="w-full h-full object-cover"
                        onEnded={() => setPlayingVideoId(null)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                        <Film className="h-10 w-10 text-purple-400/50" />
                      </div>
                    )}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-7 w-7 text-yellow-400 animate-spin" />
                        <span className="text-yellow-400 text-xs font-medium">Rendering…</span>
                      </div>
                    )}
                    {isFailed && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                        <VideoOff className="h-7 w-7 text-red-400" />
                        <span className="text-red-400 text-xs font-medium">Failed</span>
                      </div>
                    )}
                    {reelVideoUrl && !isPlaying && !isProcessing && !isFailed && (
                      <button
                        onClick={() => setPlayingVideoId(playKey)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Play className="h-5 w-5 text-black ml-0.5" />
                        </div>
                      </button>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">
                        {reel.title || `AI Reel #${reel.id}`}
                      </p>
                      <Badge variant="outline" className="text-xs shrink-0 bg-purple-500/15 text-purple-600 border-purple-500/30">
                        AI Reel
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {new Date(reel.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>

                    {reelVideoUrl && !isProcessing && !isFailed && (
                      <div className="flex gap-2">
                        <a
                          href={reelVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                        <CopyLinkButton url={reelVideoUrl} />
                      </div>
                    )}
                    {isProcessing && (
                      <p className="text-xs text-yellow-600 font-medium">Video is still rendering…</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}

          {/* Lead Magnets */}
          {(filter === "all" || filter === "lead_magnets") &&
            leadMagnets?.map((magnet: LeadMagnetItem) => (
              <Card key={`magnet-${magnet.id}`} className="overflow-hidden hover:border-primary/50 transition-all">
                {/* PDF preview placeholder */}
                <div className="relative aspect-video bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950 dark:to-blue-900 flex flex-col items-center justify-center gap-2">
                  <FileText className="h-10 w-10 text-sky-500" />
                  <p className="text-xs font-medium text-sky-700 dark:text-sky-300 text-center px-4 line-clamp-2">{magnet.title}</p>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{magnet.title}</p>
                    <Badge variant="outline" className={`text-xs shrink-0 ${TYPE_COLORS[magnet.type] || "bg-sky-500/15 text-sky-600 border-sky-500/30"}`}>
                      {TYPE_LABELS[magnet.type] || "Lead Magnet"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {magnet.city} · {new Date(magnet.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>

                  <div className="flex gap-2">
                    <a
                      href={magnet.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </a>
                    <CopyLinkButton url={magnet.pdfUrl} />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
