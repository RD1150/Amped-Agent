import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Mic, Clapperboard } from "lucide-react";
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
    title: "Bel Air Estate — Ken Burns Tour",
    thumbnail: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/prop1_exterior_de4423f4.jpg",
    videoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/ken_burns_tour_bff80cb9.mp4",
    description: "Smooth Ken Burns pan/zoom with crossfade transitions and text overlays",
    credits: 5,
    badge: "Standard",
    badgeColor: "secondary",
  },
  {
    id: "2",
    title: "Luxury Residence — Cinematic Mode",
    thumbnail: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/prop2_living_f2b1e396.jpg",
    videoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/cinematic_tour_ab4a96a3.mp4",
    description: "Dramatic diagonal pans with cinematic typography and slower pacing",
    credits: 10,
    badge: "Cinematic",
    badgeColor: "default",
  },
  {
    id: "3",
    title: "Estate Reel — Social Media Ready",
    thumbnail: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/prop3_aerial1_1056fc69.jpg",
    videoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/autoreel_b17928e4.mp4",
    description: "Vertical 9:16 format with hook text, property details, and CTA overlay",
    credits: 8,
    badge: "AutoReel",
    badgeColor: "outline",
    isVertical: true,
  },
];

export default function VideoPreviewGallery() {
  const [, setLocation] = useLocation();
  const [selectedVideo, setSelectedVideo] = useState<VideoSample | null>(null);

  return (
    <>
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2">Video Samples</h3>
          <p className="text-muted-foreground">
            Real AI-generated property videos — created with Authority Content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleVideos.map((video) => (
            <div key={video.id} className="group">
              <div
                className={`relative rounded-lg overflow-hidden mb-3 cursor-pointer ${
                  video.isVertical ? "aspect-[9/16] max-h-80" : "aspect-video"
                }`}
                onClick={() => setSelectedVideo(video)}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Play className="w-7 h-7 text-black fill-black ml-1" />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant={video.badgeColor as any} className="gap-1 text-xs">
                    <Play className="w-3 h-3" />
                    {video.badge}
                  </Badge>
                </div>
              </div>

              <h4 className="font-semibold mb-1 text-sm">{video.title}</h4>
              <p className="text-xs text-muted-foreground mb-2">{video.description}</p>
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
          ))}
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h4 className="font-semibold mb-3">What's Included in Every Video</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Standard (5 credits)</span>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Ken Burns pan/zoom effects</li>
                <li>• Smooth crossfade transitions</li>
                <li>• Professional background music</li>
                <li>• Property text overlays</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clapperboard className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Cinematic (10 credits)</span>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Dramatic diagonal pans</li>
                <li>• Cinematic typography</li>
                <li>• Slower, more impactful pacing</li>
                <li>• Luxury brand aesthetic</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-4 h-4 text-purple-600" />
                <span className="font-medium">With Voiceover (+5 credits)</span>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• AI voiceover narration</li>
                <li>• Multiple voice styles</li>
                <li>• Auto-generated script</li>
                <li>• Available on all video types</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className={selectedVideo?.isVertical ? "max-w-sm" : "max-w-4xl"}>
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
            <DialogDescription>{selectedVideo?.description}</DialogDescription>
          </DialogHeader>
          <div className={`bg-black rounded-lg overflow-hidden ${selectedVideo?.isVertical ? "aspect-[9/16]" : "aspect-video"}`}>
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
