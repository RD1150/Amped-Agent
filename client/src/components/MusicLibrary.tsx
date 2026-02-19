import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Music, Clock, Activity, Volume2 } from "lucide-react";
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
  showVolumeControl = true
}: MusicLibraryProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'recommended'>('recommended');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: allTracks = [] } = trpc.musicLibrary.getAllTracks.useQuery();
  const { data: recommendedTracks = [] } = trpc.musicLibrary.getRecommended.useQuery({ propertyType });

  const displayTracks = filter === 'recommended' ? recommendedTracks : allTracks;

  const handlePlayPause = (trackId: string, trackUrl: string) => {
    if (playingTrackId === trackId) {
      // Pause current track
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      // Play new track
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(trackUrl);
      audio.play();
      audioRef.current = audio;
      setPlayingTrackId(trackId);

      // Auto-stop when track ends
      audio.addEventListener('ended', () => {
        setPlayingTrackId(null);
      });
    }
  };

  const getPaceBadgeColor = (pace: string) => {
    switch (pace) {
      case 'slow': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'medium': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'fast': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'upbeat': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getMoodBadgeColor = (mood: string) => {
    switch (mood) {
      case 'calm': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'dramatic': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'uplifting': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'professional': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'energetic': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'luxurious': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Music className="h-5 w-5 text-amber-500" />
          Music Library
        </CardTitle>
        <p className="text-sm text-slate-400">
          Select background music for your video
        </p>
      </CardHeader>
      
      {/* Volume Control */}
      {showVolumeControl && onVolumeChange && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-slate-400" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-slate-400">Music Volume</Label>
                <span className="text-xs text-slate-400">{volume}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={(values) => onVolumeChange(values[0])}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {volume < 30 ? '🔉 Subtle background' : volume < 70 ? '🔊 Balanced mix' : '📢 Music prominent'}
          </p>
        </div>
      )}
      <CardContent className="space-y-4">
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'recommended')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900/50">
            <TabsTrigger value="recommended" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900">
              Recommended
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900">
              All Tracks ({allTracks.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Track List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {displayTracks.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No tracks available</p>
          ) : (
            displayTracks.map((track) => (
              <Card
                key={track.id}
                className={`bg-slate-900/50 border transition-all cursor-pointer hover:border-amber-500/50 ${
                  selectedTrackId === track.id
                    ? 'border-amber-500 ring-2 ring-amber-500/30'
                    : 'border-slate-700'
                }`}
                onClick={() => onSelectTrack(track.id, track.url)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Play/Pause Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-slate-600 hover:bg-amber-500 hover:text-slate-900 hover:border-amber-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPause(track.id, track.url);
                      }}
                    >
                      {playingTrackId === track.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {track.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">
                        {track.artist} • {track.genre}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {track.description}
                      </p>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="outline" className={getPaceBadgeColor(track.pace)}>
                          <Activity className="h-3 w-3 mr-1" />
                          {track.pace}
                        </Badge>
                        <Badge variant="outline" className={getMoodBadgeColor(track.mood)}>
                          {track.mood}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {track.duration}s
                        </Badge>
                        <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600">
                          {track.bpm} BPM
                        </Badge>
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {selectedTrackId === track.id && (
                      <div className="shrink-0">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filter === 'recommended' && recommendedTracks.length > 0 && (
          <p className="text-xs text-slate-500 text-center">
            Showing {recommendedTracks.length} tracks recommended for {propertyType} properties
          </p>
        )}
      </CardContent>
    </Card>
  );
}
