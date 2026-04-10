import { useState, useMemo } from "react";
import { Play, X, CheckCircle2, BookOpen, Video, Mic, BarChart2, FileText, Users, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const POST_BUILDER_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/postbuilder_final_v6_d324127d.mp4";
const AGENT_PROFILE_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/authority_profile_v2_42b2462b.mp4";
const BRAND_STORY_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/brand_story_v2_787f3da0.mp4";
const MARKET_INSIGHTS_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/market_insights_v2_c26b5465.mp4";
const AVATAR_VIDEO_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/avatar_video_v2_2f838bcd.mp4";
const LEAD_MAGNET_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/lead_magnet_v2_4b706464.mp4";

// Updated thumbnails from fixed videos
const THUMBNAILS: Record<string, string> = {
  "agent-profile": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb_agentprofile_2a40268e.webp",
  "post-builder": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb_postbuilder_13a4d08f.webp",
  "blog-builder": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb_brandstory_f44dfc6b.webp",
  "market-insights": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb_marketinsights_85e01e10.webp",
  "avatar-video": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb_avatarvideo_29fd16a8.webp",
  "lead-magnet": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb_leadmagnet_4f7cc90d.webp",
};

interface VideoCard {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  videoUrl: string | null;
  comingSoon?: boolean;
  category: string;
}

const videos: VideoCard[] = [
  {
    id: "agent-profile",
    title: "Setting Up Your Agent Profile",
    description: "Define your customer avatar, brand values, market context, and clone your voice for personalized content.",
    duration: "0:47",
    icon: <Users className="h-5 w-5" />,
    videoUrl: AGENT_PROFILE_VIDEO,
    category: "Getting Started",
  },
  {
    id: "post-builder",
    title: "Creating Your First Post",
    description: "Use the Post Builder to generate professional social media posts in seconds — static, carousel, or reel scripts.",
    duration: "0:48",
    icon: <FileText className="h-5 w-5" />,
    videoUrl: POST_BUILDER_VIDEO,
    category: "Content Creation",
  },
  {
    id: "blog-builder",
    title: "Your Brand Story",
    description: "Turn your personal experience into professional bios, elevator pitches, social posts, and LinkedIn summaries — all in one click.",
    duration: "0:53",
    icon: <BookOpen className="h-5 w-5" />,
    videoUrl: BRAND_STORY_VIDEO,
    category: "Getting Started",
  },
  {
    id: "market-insights",
    title: "Using Market Insights",
    description: "Pull live market data for your city and turn it into ready-to-share content automatically.",
    duration: "0:47",
    icon: <BarChart2 className="h-5 w-5" />,
    videoUrl: MARKET_INSIGHTS_VIDEO,
    category: "Content Creation",
  },
  {
    id: "avatar-video",
    title: "Creating Avatar Videos",
    description: "Generate professional avatar videos with your face and voice clone for social media and listings.",
    duration: "0:51",
    icon: <Video className="h-5 w-5" />,
    videoUrl: AVATAR_VIDEO_VIDEO,
    category: "Video",
  },
  {
    id: "lead-magnet",
    title: "Setting Up Lead Magnets",
    description: "Create downloadable guides and resources that capture leads and grow your database.",
    duration: "0:45",
    icon: <Mic className="h-5 w-5" />,
    videoUrl: LEAD_MAGNET_VIDEO,
    category: "Lead Generation",
  },
];

const categories = ["Getting Started", "Content Creation", "Video", "Lead Generation"];

export default function GetStarted() {
  const [activeVideo, setActiveVideo] = useState<VideoCard | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();
  const { data: watchedIds = [] } = trpc.getStarted.getWatched.useQuery();

  const markWatched = trpc.getStarted.markWatched.useMutation({
    onSuccess: () => utils.getStarted.getWatched.invalidate(),
  });
  const unmarkWatched = trpc.getStarted.unmarkWatched.useMutation({
    onSuccess: () => utils.getStarted.getWatched.invalidate(),
  });

  const toggleWatched = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (watchedIds.includes(videoId)) {
      unmarkWatched.mutate({ videoId });
      toast("Marked as unwatched.");
    } else {
      markWatched.mutate({ videoId });
      toast.success("Marked as watched! ✓");
    }
  };

  const filtered = useMemo(() => {
    let list = activeCategory === "All" ? videos : videos.filter((v) => v.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, search]);

  const watchedCount = watchedIds.length;
  const totalCount = videos.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Get Started</h1>
        <p className="text-muted-foreground text-base">
          Short video walkthroughs to help you get the most out of every feature.
        </p>
      </div>

      {/* Progress banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex items-center gap-4">
        <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Start here: Set up your Agent Profile first</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your profile powers personalized content across every tool — it only takes 3 minutes.
          </p>
        </div>
        <Button
          size="sm"
          className="ml-auto shrink-0"
          onClick={() => window.location.href = "/authority-profile"}
        >
          Go to Profile
        </Button>
      </div>

      {/* Progress tracker */}
      <div className="bg-card border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Your Progress</span>
          <span className="text-sm text-muted-foreground">{watchedCount} / {totalCount} watched</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${totalCount > 0 ? (watchedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
        {watchedCount === totalCount && totalCount > 0 && (
          <p className="text-xs text-primary font-medium mt-2">🎉 You've watched all tutorials! You're all set.</p>
        )}
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tutorials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Video grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tutorials found</p>
          <p className="text-sm mt-1">Try a different search term or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((video) => {
            const isWatched = watchedIds.includes(video.id);
            return (
              <div
                key={video.id}
                className={`group relative bg-card border rounded-xl overflow-hidden transition-shadow hover:shadow-md ${
                  video.comingSoon ? "opacity-70" : "cursor-pointer"
                } ${isWatched ? "ring-2 ring-primary/30" : ""}`}
                onClick={() => !video.comingSoon && video.videoUrl && setActiveVideo(video)}
              >
                {/* Thumbnail area */}
                <div className="relative h-40 overflow-hidden bg-muted">
                  {THUMBNAILS[video.id] ? (
                    <img
                      src={THUMBNAILS[video.id]}
                      alt={video.title}
                      className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <div className="text-primary/40 scale-150">{video.icon}</div>
                    </div>
                  )}
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/20" />
                  {!video.comingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-primary rounded-full p-3 shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 text-white fill-white" />
                      </div>
                    </div>
                  )}
                  {video.comingSoon && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      Coming Soon
                    </div>
                  )}
                  {!video.comingSoon && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
                      {video.duration}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-primary/90 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {video.category}
                  </div>
                  {/* Watched badge */}
                  {isWatched && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* Card content */}
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1 leading-snug">{video.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{video.description}</p>
                  {!video.comingSoon && (
                    <button
                      onClick={(e) => toggleWatched(e, video.id)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        isWatched
                          ? "text-green-600 hover:text-muted-foreground"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {isWatched ? "Watched" : "Mark as watched"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video modal */}
      {activeVideo && activeVideo.videoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative bg-black rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white font-semibold text-sm">{activeVideo.title}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => toggleWatched(e, activeVideo.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    watchedIds.includes(activeVideo.id)
                      ? "text-green-400 hover:text-white/60"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {watchedIds.includes(activeVideo.id) ? "Watched" : "Mark as watched"}
                </button>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <video
              src={activeVideo.videoUrl}
              controls
              autoPlay
              className="w-full max-h-[70vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
