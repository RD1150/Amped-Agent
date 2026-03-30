import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Music, Volume2, CheckCircle2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

interface MusicLibraryProps {
  onSelectTrack: (trackId: string, trackUrl: string) => void;
  selectedTrackId?: string;
  propertyType?: 'luxury' | 'family' | 'modern' | 'commercial' | 'any';
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  showVolumeControl?: boolean;
}

export function MusicLibrary({
  onSelectTrack,
  selectedTrackId,
  propertyType = 'any',
  volume = 50,
  onVolumeChange,
  showVolumeControl = true,
}: MusicLibraryProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<'all' | 'recommended'>('recommended');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: allTracks = [] } = trpc.musicLibrary.getAllTracks.useQuery();
  const { data: recommendedTracks = [] } = trpc.musicLibrary.getRecommended.useQuery({ propertyType });

  const displayTracks = filter === 'recommended' ? recommendedTracks : allTracks;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const startProgressTracking = (audio: HTMLAudioElement, trackId: string) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      if (audio.duration > 0) {
        setProgress(prev => ({
          ...prev,
          [trackId]: (audio.currentTime / audio.duration) * 100,
        }));
      }
    }, 200);
  };

  const handlePlayPause = (e: React.MouseEvent, trackId: string, trackUrl: string) => {
    e.stopPropagation();

    if (playingTrackId === trackId) {
      // Pause
      audioRef.current?.pause();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setPlayingTrackId(null);
    } else {
      // Stop previous
      if (audioRef.current) {
        audioRef.current.pause();
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }

      const audio = new Audio(trackUrl);
      audio.volume = volume / 100;
      audio.play().catch(() => {/* browser autoplay policy */});
      audioRef.current = audio;
      setPlayingTrackId(trackId);
      startProgressTracking(audio, trackId);

      audio.addEventListener('ended', () => {
        setPlayingTrackId(null);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setProgress(prev => ({ ...prev, [trackId]: 0 }));
      });
    }
  };

  const getPaceBadgeColor = (pace: string) => {
    switch (pace) {
      case 'slow': return 'bg-primary/10 text-primary border-primary/30';
      case 'medium': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
      case 'fast': return 'bg-primary/15 text-primary border-primary/30';
      case 'upbeat': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getMoodBadgeColor = (mood: string) => {
    switch (mood) {
      case 'calm': return 'bg-primary/10 text-primary/70 border-primary/20';
      case 'dramatic': return 'bg-primary/10 text-primary/80 border-primary/20';
      case 'uplifting': return 'bg-primary/10 text-primary border-primary/20';
      case 'professional': return 'bg-muted text-muted-foreground border-border';
      case 'energetic': return 'bg-primary/10 text-primary border-primary/20';
      case 'luxurious': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="border bg-background">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <Music className="h-4 w-4 text-primary" />
          Music Library
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Click <Play className="inline h-3 w-3 mx-0.5" /> to preview, then click a track to select it
        </p>
      </CardHeader>

      {/* Volume Control */}
      {showVolumeControl && onVolumeChange && (
        <div className="px-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs text-muted-foreground">Music Volume</Label>
                <span className="text-xs font-medium text-foreground">{volume}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={(values) => {
                  onVolumeChange(values[0]);
                  if (audioRef.current) audioRef.current.volume = values[0] / 100;
                }}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {volume < 30 ? 'Subtle background' : volume < 70 ? 'Balanced mix' : 'Music prominent'}
          </p>
        </div>
      )}

      <CardContent className="pt-4 space-y-3">
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'recommended')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="all">All Tracks ({allTracks.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Track List */}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {displayTracks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No tracks available</p>
          ) : (
            displayTracks.map((track) => {
              const isSelected = selectedTrackId === track.id;
              const isPlaying = playingTrackId === track.id;
              const trackProgress = progress[track.id] ?? 0;

              return (
                <div
                  key={track.id}
                  className={`rounded-lg border p-3 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-background'
                  }`}
                  onClick={() => onSelectTrack(track.id, track.url)}
                >
                  <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <Button
                      size="sm"
                      variant={isPlaying ? "default" : "outline"}
                      className={`shrink-0 h-8 w-8 p-0 rounded-full ${
                        isPlaying ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={(e) => handlePlayPause(e, track.id, track.url)}
                    >
                      {isPlaying ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5 ml-0.5" />
                      )}
                    </Button>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {track.title}
                        </h4>
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.artist} · {track.genre} · {track.duration}s · {track.bpm} BPM
                      </p>

                      {/* Progress bar (visible when playing) */}
                      {isPlaying && (
                        <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-200"
                            style={{ width: `${trackProgress}%` }}
                          />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <Badge variant="outline" className={`text-[10px] py-0 ${getPaceBadgeColor(track.pace)}`}>
                          {track.pace}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] py-0 ${getMoodBadgeColor(track.mood)}`}>
                          {track.mood}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filter === 'recommended' && recommendedTracks.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            {recommendedTracks.length} tracks recommended for {propertyType} properties
          </p>
        )}
      </CardContent>
    </Card>
  );
}
