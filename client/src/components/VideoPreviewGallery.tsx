import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clapperboard } from "lucide-react";
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
  thumbnail: string;
  videoUrl: string;
  voice?: string;
  description: string;
  credits: number;
  badge: string;
  badgeColor: string;
  isVertical?: boolean;
}

const sampleVideos: VideoSample[] = [
  {
    id: "1",
    title: "Luxury Estate — Cinematic Tour",
    thumbnail: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/prop1_exterior_de4423f4.jpg",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/lBdDdFxODeKkouVu.mp4",
    description: "Dramatic diagonal pans, hard cuts, letterbox bars, and warm color grade",
    credits: 7,
    badge: "Cinematic",
    badgeColor: "default",
  },
];

export default function VideoPreviewGallery() {
  const [, setLocation] = useLocation();
  const [selectedVideo, setSelectedVideo] = useState<VideoSample | null>(null);

  return (
    <>
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2">Video Sample</h3>
          <p className="text-muted-foreground">
            Real AI-generated property video — created with Amped Agent
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Video card */}
          <div className="group">
            <div
              className="relative rounded-lg overflow-hidden mb-3 cursor-pointer aspect-video"
              onClick={() => setSelectedVideo(sampleVideos[0])}
            >
              <img
                src={sampleVideos[0].thumbnail}
                alt={sampleVideos[0].title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-7 h-7 text-black fill-black ml-1" />
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <Badge variant="default" className="gap-1 text-xs">
                  <Play className="w-3 h-3" />
                  Cinematic
                </Badge>
              </div>
            </div>
            <h4 className="font-semibold mb-1 text-sm">{sampleVideos[0].title}</h4>
            <p className="text-xs text-muted-foreground mb-3">{sampleVideos[0].description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{sampleVideos[0].credits} credits</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/property-tours")}
              >
                Try This Style
              </Button>
            </div>
          </div>

          {/* Two styles info panel */}
          <div className="p-5 bg-muted rounded-lg space-y-5">
            <h4 className="font-semibold text-sm">Two Ways to Showcase a Property</h4>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">Ken Burns (5 credits)</span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Slow pan &amp; zoom effects</li>
                <li>• Smooth crossfade transitions</li>
                <li>• Professional background music</li>
                <li>• Property text overlays</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clapperboard className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Cinematic (7 credits)</span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Diagonal pans &amp; hard cuts</li>
                <li>• 2.39:1 letterbox bars</li>
                <li>• Dark vignette &amp; warm grade</li>
                <li>• Luxury brand aesthetic</li>
              </ul>
            </div>
            <Button
              size="sm"
              className="w-full mt-2"
              onClick={() => setLocation("/property-tours")}
            >
              Create a Property Tour
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
            <DialogDescription>{selectedVideo?.description}</DialogDescription>
          </DialogHeader>
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
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
