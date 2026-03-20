import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Building2,
  Film,
  Clock,
  Zap,
  Music,
  Mic,
  Camera,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Play,
} from "lucide-react";

const LISTING_VIDEO_FEATURES = [
  { icon: Clock, text: "Ready in 1–2 minutes" },
  { icon: Camera, text: "Ken Burns panning & zooming effects" },
  { icon: Music, text: "Background music with your branding" },
  { icon: Mic, text: "Optional AI voice-over narration" },
  { icon: Zap, text: "Works with any listing photos" },
  { icon: CheckCircle, text: "Great for social posts, MLS, email" },
];

const AI_FILM_FEATURES = [
  { icon: Clock, text: "Ready in 5–10 minutes" },
  { icon: Sparkles, text: "AI animates each photo with realistic camera movement" },
  { icon: Camera, text: "Camera moves through the space realistically" },
  { icon: Music, text: "Cinematic soundtrack + voice-over" },
  { icon: Film, text: "Near-broadcast quality output" },
  { icon: CheckCircle, text: "Best for luxury listings & presentations" },
];

const COMPARISON_TABLE = [
  { label: "Generation time", listing: "1–2 min", film: "5–10 min" },
  { label: "Motion Style", listing: "Smooth pan & zoom", film: "AI-generated camera movement" },
  { label: "Camera motion", listing: "Smooth pan across photo", film: "AI moves through the space" },
  { label: "Best for", listing: "Any listing, daily use", film: "Luxury & premium listings" },
  { label: "Music", listing: "Yes", film: "Yes" },
  { label: "Voice-over", listing: "Optional", film: "Optional" },
  { label: "Credits used", listing: "Lower", film: "Higher (AI rendering)" },
];

export default function VideoComparison() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Which video is right for you?</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Authority Content offers two types of property videos. Here's exactly what makes them different — and when to use each one.
        </p>
      </div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Listing Video */}
        <Card className="p-6 border-2 border-border hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Listing Video</h2>
              <p className="text-sm text-muted-foreground">Quick · 1–2 min to generate</p>
            </div>
          </div>

          {/* Listing Video demo placeholder */}
          <div className="relative rounded-xl overflow-hidden bg-muted aspect-video mb-5 border border-border flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-full bg-primary/10">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center px-4">
              <p className="font-semibold text-sm">Listing Video Demo</p>
              <p className="text-xs text-muted-foreground mt-1">Generate your first Listing Video to see the Ken Burns effect in action — smooth panning and zooming across your listing photos.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setLocation("/property-tours")}
            >
              <Play className="h-3 w-3 mr-1" />
              Create a Listing Video
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-5">
            Each photo gets smooth panning and zooming motion (Ken Burns effect), layered with background music and your agent branding. Fast, professional, and works for any listing.
          </p>

          <ul className="space-y-2 mb-6">
            {LISTING_VIDEO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <f.icon className="h-4 w-4 text-primary shrink-0" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full"
            onClick={() => setLocation("/property-tours")}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Create a Listing Video
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Card>

        {/* AI Property Film */}
        <Card className="p-6 border-2 border-amber-500/40 hover:border-amber-500/70 transition-colors relative">
          <Badge className="absolute top-4 right-4 bg-amber-500/10 text-amber-600 border-amber-500/30">
            Premium
          </Badge>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Film className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Property Film</h2>
              <p className="text-sm text-muted-foreground">Cinematic · 5–10 min to generate</p>
            </div>
          </div>

          {/* AI Film demo - coming soon placeholder */}
          <div className="relative rounded-xl overflow-hidden bg-muted aspect-video mb-5 border border-amber-500/20 flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-full bg-amber-500/10">
              <Film className="h-10 w-10 text-amber-500" />
            </div>
            <div className="text-center px-4">
              <p className="font-semibold text-sm">AI Property Film Demo</p>
              <p className="text-xs text-muted-foreground mt-1">Generate your first AI Property Film to see the difference — each photo comes to life with real camera movement through the space.</p>
            </div>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => setLocation("/cinematic-walkthrough")}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Try it now
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-5">
            Our AI analyzes each photo and generates realistic camera movement — the camera actually moves <em>through</em> the room, not just across it. The result looks like a professional videographer walked through the property.
          </p>

          <ul className="space-y-2 mb-6">
            {AI_FILM_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <f.icon className="h-4 w-4 text-amber-500 shrink-0" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => setLocation("/cinematic-walkthrough")}
          >
            <Film className="h-4 w-4 mr-2" />
            Create an AI Property Film
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">At a glance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium w-1/3"></th>
                <th className="text-left py-2 pr-4 font-semibold">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Listing Video
                  </div>
                </th>
                <th className="text-left py-2 font-semibold">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-amber-500" />
                    AI Property Film
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_TABLE.map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4 text-muted-foreground">{row.label}</td>
                  <td className="py-3 pr-4">{row.listing}</td>
                  <td className="py-3">
                    <span className="text-amber-600 font-medium">{row.film}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recommendation */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Not sure which to use?</h3>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto mb-4">
          Use <strong>Listing Video</strong> for everyday listings and social content — it's fast and professional. Save <strong>AI Property Film</strong> for your best listings where you want to truly impress buyers and stand out from other agents.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => setLocation("/property-tours")}>
            <Building2 className="h-4 w-4 mr-2" />
            Start with Listing Video
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setLocation("/cinematic-walkthrough")}>
            <Film className="h-4 w-4 mr-2" />
            Try AI Property Film
          </Button>
        </div>
      </div>
    </div>
  );
}
