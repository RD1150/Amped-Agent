import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Video } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ConvertToVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
  carouselImages: string[];
  onVideoGenerated: (videoUrl: string) => void;
}

const TRANSITIONS = [
  { value: "wipe_left", label: "Wipe Left" },
  { value: "wipe_right", label: "Wipe Right" },
  { value: "fade", label: "Fade" },
  { value: "slide_up", label: "Slide Up" },
  { value: "slide_down", label: "Slide Down" },
  { value: "zoom_in", label: "Zoom In" },
  { value: "zoom_out", label: "Zoom Out" },
];

const MUSIC_GENRES = ["All", "Pop", "Country", "Rock", "Dance", "Trendy"];

const MUSIC_LIBRARY = [
  { id: "steady_ride", title: "Steady Ride", duration: "2:14", genre: "Country", url: "/music/steady_ride.mp3" },
  { id: "whiskey_sunrise", title: "Whiskey Sunrise", duration: "2:12", genre: "Country", url: "/music/whiskey_sunrise.mp3" },
  { id: "dirt_road_dreams", title: "Dirt Road Dreams", duration: "2:54", genre: "Country", url: "/music/dirt_road_dreams.mp3" },
  { id: "one_more_night", title: "One More Night", duration: "2:34", genre: "Pop", url: "/music/one_more_night.mp3" },
  { id: "highway_stars", title: "Highway Stars", duration: "2:32", genre: "Rock", url: "/music/highway_stars.mp3" },
  { id: "back_home", title: "Back Home", duration: "2:36", genre: "Country", url: "/music/back_home.mp3" },
  { id: "by_the_river", title: "By The River", duration: "2:09", genre: "Country", url: "/music/by_the_river.mp3" },
  { id: "camping_in_the_woods", title: "Camping in the Woods", duration: "2:15", genre: "Country", url: "/music/camping_in_the_woods.mp3" },
  { id: "good_year", title: "Good Year", duration: "2:46", genre: "Pop", url: "/music/good_year.mp3" },
  { id: "electric_nights", title: "Electric Nights", duration: "2:28", genre: "Dance", url: "/music/electric_nights.mp3" },
  { id: "summer_vibes", title: "Summer Vibes", duration: "2:45", genre: "Trendy", url: "/music/summer_vibes.mp3" },
  { id: "rock_anthem", title: "Rock Anthem", duration: "3:02", genre: "Rock", url: "/music/rock_anthem.mp3" },
];

export default function ConvertToVideoModal({
  open,
  onOpenChange,
  postId,
  carouselImages,
  onVideoGenerated,
}: ConvertToVideoModalProps) {
  const [pauseTime, setPauseTime] = useState(3);
  const [transition, setTransition] = useState("wipe_left");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [playingMusic, setPlayingMusic] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const convertToVideoMutation = trpc.video.convertCarouselToVideo.useMutation({
    onSuccess: (data: { videoUrl: string; success: boolean }) => {
      setIsGenerating(false);
      onVideoGenerated(data.videoUrl);
      onOpenChange(false);
    },
    onError: (error: any) => {
      alert(`Error: ${error.message}`);
      setIsGenerating(false);
    },
  });

  const filteredMusic = selectedGenre === "All"
    ? MUSIC_LIBRARY
    : MUSIC_LIBRARY.filter(m => m.genre === selectedGenre);

  const handleConvert = async () => {
    if (!selectedMusic) {
      alert("Please select background music");
      return;
    }

    if (carouselImages.length > 10) {
      alert("Maximum 10 slides allowed for video conversion. Please reduce the number of slides.");
      return;
    }

    if (carouselImages.length === 0) {
      alert("No images found to convert");
      return;
    }

    setIsGenerating(true);
    await convertToVideoMutation.mutateAsync({
      postId,
      carouselImages,
      pauseTime,
      transition,
      musicId: selectedMusic,
    });
  };

  const toggleMusicPreview = (musicId: string) => {
    if (playingMusic === musicId) {
      setPlayingMusic(null);
      // Stop audio playback
    } else {
      setPlayingMusic(musicId);
      // Start audio playback
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Convert to Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview Section */}
          <div className="bg-muted rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
            {isGenerating ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-lg font-medium">Generating...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your media is being generated, this can take up to 2 minutes.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Video Preview</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {carouselImages.length} slides will be converted to video
                  {carouselImages.length > 10 && (
                    <span className="block text-destructive mt-1">
                      ⚠️ Maximum 10 slides allowed
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Slide Pause Time */}
          <div>
            <Label htmlFor="pause-time" className="text-base font-semibold mb-3 block">
              Slide Pause Time:
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="pause-time"
                type="number"
                min="1"
                max="10"
                value={pauseTime}
                onChange={(e) => setPauseTime(parseInt(e.target.value) || 3)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">seconds</span>
            </div>
          </div>

          {/* Slide Transition */}
          <div>
            <Label htmlFor="transition" className="text-base font-semibold mb-3 block">
              Slide Transition:
            </Label>
            <Select value={transition} onValueChange={setTransition}>
              <SelectTrigger id="transition" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSITIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video Sound */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Video Sound:
            </Label>
            
            {/* Genre Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {MUSIC_GENRES.map((genre) => (
                <Button
                  key={genre}
                  variant={selectedGenre === genre ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedGenre(genre)}
                  className={selectedGenre === genre ? "bg-primary" : ""}
                >
                  {genre}
                </Button>
              ))}
            </div>

            {/* Music List */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-2 border rounded-lg">
              {filteredMusic.map((music) => (
                <button
                  key={music.id}
                  onClick={() => setSelectedMusic(music.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedMusic === music.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{music.title}</p>
                      <p className="text-xs text-muted-foreground">{music.duration}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMusicPreview(music.id);
                      }}
                      className="shrink-0 w-8 h-8 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors"
                    >
                      {playingMusic === music.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleConvert}
              disabled={isGenerating || !selectedMusic}
              className="flex-1 bg-black text-white hover:bg-black/90"
            >
              <Video className="h-4 w-4 mr-2" />
              Convert to Video
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
