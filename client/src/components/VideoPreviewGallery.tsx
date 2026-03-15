import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Music, Mic } from "lucide-react";
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
}

const sampleVideos: VideoSample[] = [
  {
    id: "1",
    title: "Modern Downtown Condo",
    thumbnail: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=450&fit=crop",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/BLeuXFrFCJNvYbPz.mp4",
    description: "Ken Burns effects with smooth crossfade transitions",
    credits: 5,
  },
  {
    id: "2",
    title: "Luxury Suburban Estate",
    thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=450&fit=crop",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/BLeuXFrFCJNvYbPz.mp4",
    voice: "Adam - Confident",
    description: "Ken Burns with professional AI voiceover",
    credits: 10,
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
            Professional Ken Burns property tour videos — ready in under 2 minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sampleVideos.map((video) => (
            <div key={video.id} className="group">
              <div
                className="relative aspect-video rounded-lg overflow-hidden mb-3 cursor-pointer"
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
                  <Badge variant="secondary" className="gap-1">
                    <Play className="w-3 h-3" />
                    Standard
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
          ))}
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h4 className="font-semibold mb-3">What's Included in Every Video</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                <Mic className="w-4 h-4 text-purple-600" />
                <span className="font-medium">With Voiceover (+5 credits)</span>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Everything in Standard</li>
                <li>• AI voiceover narration</li>
                <li>• Multiple voice styles</li>
                <li>• Auto-generated script from property details</li>
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
