import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clapperboard, Music, Layers, Mic } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const sampleVideo = {
  id: "1",
  title: "Luxury Estate — Cinematic Property Tour",
  thumbnail: "https://d2xsxph8kpxj0f.cloudfront.net/310419663026756998/K9BXxKfRk2PJ2AbRYdraAT/prop1_exterior_de4423f4.jpg",
  videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/lBdDdFxODeKkouVu.mp4",
  description: "Dramatic diagonal pans, hard cuts, letterbox bars, and warm color grade",
  credits: 7,
};

const features = [
  { icon: Clapperboard, label: "Cinematic camera movement", desc: "Diagonal pans, hard cuts & letterbox bars" },
  { icon: Music,        label: "Licensed background music", desc: "Curated tracks matched to your listing" },
  { icon: Mic,          label: "Optional AI voice-over",    desc: "Script auto-generated from your property details" },
  { icon: Layers,       label: "Branded intro & outro",     desc: "Your name, logo, and contact info baked in" },
];

export default function VideoPreviewGallery() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-1">Video Sample</h3>
          <p className="text-muted-foreground text-sm">
            Real AI-generated property video — created with Amped Agent
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Video preview */}
          <div className="group cursor-pointer" onClick={() => setOpen(true)}>
            <div className="relative rounded-lg overflow-hidden mb-3 aspect-video">
              <img
                src={sampleVideo.thumbnail}
                alt={sampleVideo.title}
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
              {/* Play hint */}
              <div className="absolute bottom-3 left-3">
                <span className="text-xs text-white/80 bg-black/50 px-2 py-1 rounded">Click to play</span>
              </div>
            </div>
            <h4 className="font-semibold mb-1 text-sm">{sampleVideo.title}</h4>
            <p className="text-xs text-muted-foreground mb-3">{sampleVideo.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{sampleVideo.credits} credits per video</span>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
                Watch Sample
              </Button>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="p-5 bg-muted rounded-lg space-y-4">
            <h4 className="font-semibold text-sm mb-1">What's included in every video</h4>
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 w-7 h-7 rounded-md bg-background flex items-center justify-center shrink-0 border border-border">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{sampleVideo.title}</DialogTitle>
            <DialogDescription>{sampleVideo.description}</DialogDescription>
          </DialogHeader>
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <video
              className="w-full h-full"
              controls
              autoPlay
              src={sampleVideo.videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
