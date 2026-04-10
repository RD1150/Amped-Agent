import { useState } from "react";
import { Play, X, CheckCircle2, BookOpen, Video, Mic, BarChart2, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const POST_BUILDER_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/walkthrough-post-builder_6968e999.mp4";
const AGENT_PROFILE_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/walkthrough-agent-profile_1f382cd7.mp4";
const BRAND_STORY_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/walkthrough-brand-story_25de4381.mp4";

const THUMBNAILS: Record<string, string> = {
  "agent-profile": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb-authority-profile_49225b7f.webp",
  "post-builder": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb-post-builder_85d735f9.webp",
  "blog-builder": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb-brand-story_787e79af.webp",
  "market-insights": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb-market-insights_676e6a4b.webp",
  "avatar-video": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb-avatar-video_f59e8395.webp",
  "lead-magnet": "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/thumb-lead-magnet_b3633e6e.webp",
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
    duration: "Coming Soon",
    icon: <BarChart2 className="h-5 w-5" />,
    videoUrl: null,
    comingSoon: true,
    category: "Content Creation",
  },
  {
    id: "avatar-video",
    title: "Creating Avatar Videos",
    description: "Generate professional avatar videos with your face and voice clone for social media and listings.",
    duration: "Coming Soon",
    icon: <Video className="h-5 w-5" />,
    videoUrl: null,
    comingSoon: true,
    category: "Video",
  },
  {
    id: "lead-magnet",
    title: "Setting Up Lead Magnets",
    description: "Create downloadable guides and resources that capture leads and grow your database.",
    duration: "Coming Soon",
    icon: <Mic className="h-5 w-5" />,
    videoUrl: null,
    comingSoon: true,
    category: "Lead Generation",
  },
];

const categories = ["Getting Started", "Content Creation", "Video", "Lead Generation"];

export default function GetStarted() {
  const [activeVideo, setActiveVideo] = useState<VideoCard | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = activeCategory === "All"
    ? videos
    : videos.filter((v) => v.category === activeCategory);

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
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8 flex items-center gap-4">
        <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
        <div>
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

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((video) => (
          <div
            key={video.id}
            className={`group relative bg-card border rounded-xl overflow-hidden transition-shadow hover:shadow-md ${
              video.comingSoon ? "opacity-70" : "cursor-pointer"
            }`}
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
              {/* Dark overlay for readability */}
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
            </div>

            {/* Card content */}
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-1 leading-snug">{video.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{video.description}</p>
            </div>
          </div>
        ))}
      </div>

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
              <button
                onClick={() => setActiveVideo(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
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
