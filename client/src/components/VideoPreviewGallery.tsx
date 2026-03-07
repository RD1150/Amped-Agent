import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Sparkles, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VideoSample {
  id: string;
  title: string;
  mode: "standard" | "full-ai";
  thumbnail: string;
  videoUrl: string;
  voice?: string;
  description: string;
  credits: number;
}

const sampleVideos: VideoSample[] = [
  {
    id: "1",
    title: "Modern Downtown Condo",
    mode: "standard",
    thumbnail: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=450&fit=crop",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/BLeuXFrFCJNvYbPz.mp4",
    description: "Ken Burns effects with smooth transitions",
    credits: 5,
  },
  {
    id: "3",
    title: "Contemporary Mountain Home",
    mode: "full-ai",
    thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=450&fit=crop",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/BLeuXFrFCJNvYbPz.mp4",
    voice: "Adam - Confident",
    description: "Cinematic AI motion on all photos + voiceover",
    credits: 40,
  },
];

const modeConfig = {
  standard: {
    label: "Standard",
    icon: Play,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    badgeVariant: "secondary" as const,
  },
  "full-ai": {
    label: "Full AI Cinematic",
    icon: Zap,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900",
    badgeVariant: "default" as const,
  },
};

export default function VideoPreviewGallery() {
  const [, setLocation] = useLocation();
  const [selectedVideo, setSelectedVideo] = useState<VideoSample | null>(null);

  return (
    <>
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2">Video Samples</h3>
          <p className="text-muted-foreground">
            See the difference between our video quality tiers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleVideos.map((video) => {
            const config = modeConfig[video.mode];
            const Icon = config.icon;

            return (
              <div key={video.id} className="group">
                <div className="relative aspect-video rounded-lg overflow-hidden mb-3 cursor-pointer"
                  onClick={() => setSelectedVideo(video)}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-black fill-black ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant={config.badgeVariant} className="gap-1">
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </Badge>
                  </div>
                </div>

                <h4 className="font-semibold mb-1">{video.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{video.description}</p>
                {video.voice && (
                  <p className="text-xs text-muted-foreground mb-2">
                    🎙️ {video.voice}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{video.credits} credits</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation("/property-tours")}
                  >
                    Try This Style
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h4 className="font-semibold mb-3">Compare Quality Tiers</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Standard (5 credits)</span>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Ken Burns pan/zoom effects</li>
                <li>• Smooth transitions</li>
                <li>• Background music</li>
                <li>• Text overlays</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Full AI Cinematic (40 credits)</span>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Everything in Standard</li>
                <li>• Kling AI pro mode on ALL photos</li>
                <li>• True 1080p/30fps quality</li>
                <li>• Dramatic room-specific camera movement</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
            <DialogDescription>{selectedVideo?.description}</DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {selectedVideo?.videoUrl && (
              <video
                className="w-full h-full"
                controls
                autoPlay
                src={selectedVideo.videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
