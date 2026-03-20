import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, X, Play, Loader2, CheckCircle, Film, Wand2, Music, Mic, ChevronDown, ChevronUp, Info, Library } from "lucide-react";
import { Link } from "wouter";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PhotoEntry {
  id: string;
  url: string;
  file?: File;
  previewUrl: string;
  roomType: string;
  label: string;
  customPrompt?: string;
  uploading?: boolean;
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  exterior_front: "Front Exterior",
  exterior_back: "Back Exterior",
  living_room: "Living Room",
  kitchen: "Kitchen",
  dining_room: "Dining Room",
  master_bedroom: "Master Bedroom",
  bedroom: "Bedroom",
  master_bathroom: "Master Bathroom",
  bathroom: "Bathroom",
  office: "Home Office",
  garage: "Garage",
  pool: "Pool / Outdoor",
  view: "View",
  other: "Other",
};

const MUSIC_OPTIONS = [
  { value: "none", label: "No music" },
  // Pixabay CDN audio links (direct .mp3 paths, not /download/ redirects)
  { value: "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3", label: "Elegant Ambient" },
  { value: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1c23.mp3", label: "Cinematic Bold" },
  { value: "https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3", label: "Authoritative" },
  { value: "https://cdn.pixabay.com/audio/2021/11/25/audio_91b32e02f9.mp3", label: "Warm & Inviting" },
];

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadPhotoToServer(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("images", file);
  const res = await fetch("/api/upload-images", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.urls?.[0] || data.url;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CinematicWalkthrough() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentBrokerage, setAgentBrokerage] = useState("");
  const [musicTrackUrl, setMusicTrackUrl] = useState("https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3"); // default: Elegant Ambient
  const [enableVoiceover, setEnableVoiceover] = useState(false);
  const [voiceoverScript, setVoiceoverScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Job tracking
  const [jobId, setJobId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Failed job state for retry
  const [failedJobId, setFailedJobId] = useState<string | null>(null);
  const [failedJobError, setFailedJobError] = useState<string | null>(null);

  // tRPC
  const generateMutation = trpc.cinematicWalkthrough.generate.useMutation();
  const retryMutation = trpc.cinematicWalkthrough.retry.useMutation();
  const { data: jobProgress } = trpc.cinematicWalkthrough.getJobProgress.useQuery(
    { jobId: jobId! },
    {
      enabled: !!jobId && isGenerating,
      refetchInterval: 5000,
    }
  );

  // Handle job completion via useEffect (MUST be in useEffect, not render phase)
  useEffect(() => {
    if (!jobProgress) return;
    if (jobProgress.status === "done" && jobProgress.videoUrl) {
      setIsGenerating(false);
      setVideoUrl(jobProgress.videoUrl);
      setJobId(null);
      toast.success("Your AI Cinematic Tour is ready!");
    } else if (jobProgress.status === "failed") {
      setIsGenerating(false);
      setFailedJobId(jobId);
      setFailedJobError(jobProgress.error || "Generation failed. Please try again.");
      setJobId(null);
    } else if (jobProgress.status === "not_found" && isGenerating) {
      setIsGenerating(false);
      setFailedJobId(jobId);
      setFailedJobError("The job could not be located. Please try again.");
      setJobId(null);
    }
  }, [jobProgress?.status, jobProgress?.videoUrl]);

  // ─── Photo handling ─────────────────────────────────────────────────────────

  const handleFileDrop = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPhotos: PhotoEntry[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 12 - photos.length)
      .map((file) => ({
        id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url: "",
        file,
        previewUrl: URL.createObjectURL(file),
        roomType: "other",
        label: "",
        uploading: true,
      }));

    setPhotos((prev) => [...prev, ...newPhotos]);

    // Upload each photo
    for (const photo of newPhotos) {
      try {
        const url = await uploadPhotoToServer(photo.file!);
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, url, uploading: false } : p))
        );
      } catch {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, uploading: false, url: "" } : p
          )
        );
        toast.error("Upload failed", { description: `Could not upload ${photo.file?.name}` });
      }
    }
  }, [photos.length]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileDrop(e.dataTransfer.files);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePhoto = (id: string, updates: Partial<PhotoEntry>) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // ─── Generation ─────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (photos.length < 2) {
      toast.error("Add at least 2 photos");
      return;
    }
    if (!propertyAddress.trim()) {
      toast.error("Enter the property address");
      return;
    }
    const readyPhotos = photos.filter((p) => p.url && !p.uploading);
    if (readyPhotos.length < 2) {
      toast.error("Photos still uploading", { description: "Wait for uploads to finish." });
      return;
    }

    setIsGenerating(true);
    setVideoUrl(null);

    try {
      const result = await generateMutation.mutateAsync({
        photos: readyPhotos.map((p) => ({
          url: p.url,
          roomType: p.roomType,
          label: p.label || ROOM_TYPE_LABELS[p.roomType] || p.roomType,
          customPrompt: p.customPrompt || undefined,
        })),
        propertyAddress: propertyAddress.trim(),
        agentName: agentName.trim() || undefined,
        agentBrokerage: agentBrokerage.trim() || undefined,
        musicTrackUrl: musicTrackUrl === "none" ? undefined : musicTrackUrl || undefined,
        enableVoiceover,
        voiceoverScript: enableVoiceover ? voiceoverScript : undefined,
        aspectRatio,
      });

      setJobId(result.jobId);
      toast.success("Generation Started", { description: `Generating ${result.totalPhotos} cinematic clips. This takes 3–8 minutes.` });
    } catch (err: any) {
      setIsGenerating(false);
      toast.error("Failed to start generation", { description: err.message });
    }
  };

  // ─── Progress ───────────────────────────────────────────────────────────────

  const progressPercent = jobProgress
    ? jobProgress.status === "assembling"
      ? 90
      : jobProgress.totalPhotos > 0
      ? Math.round((jobProgress.completedClips / jobProgress.totalPhotos) * 80)
      : 0
    : 0;

  const progressLabel =
    jobProgress?.status === "generating_clips"
      ? `Generating AI clips… ${jobProgress.completedClips}/${jobProgress.totalPhotos}`
      : jobProgress?.status === "assembling"
      ? "Assembling final video…"
      : jobProgress?.status === "pending"
      ? "Starting generation…"
      : "Processing…";

  // Estimated time: ~90s per clip (Runway) + 60s assembly
  const estimatedTotalSec = jobProgress
    ? jobProgress.totalPhotos * 90 + 60
    : photos.length * 90 + 60;
  const elapsedSec = jobProgress?.elapsedMs ? Math.floor(jobProgress.elapsedMs / 1000) : 0;
  const remainingSec = Math.max(0, estimatedTotalSec - elapsedSec);
  const remainingLabel =
    remainingSec > 60
      ? `~${Math.ceil(remainingSec / 60)} min remaining`
      : remainingSec > 0
      ? `~${remainingSec}s remaining`
      : "Almost done…";

  // ─── Retry handler ───────────────────────────────────────────────────────────

  const handleRetry = async () => {
    if (!failedJobId) return;
    setFailedJobId(null);
    setFailedJobError(null);
    setIsGenerating(true);
    setVideoUrl(null);
    try {
      const result = await retryMutation.mutateAsync({ failedJobId });
      setJobId(result.jobId);
      toast.success("Retrying generation", { description: `Restarting ${result.totalPhotos} clips.` });
    } catch (err: any) {
      setIsGenerating(false);
      toast.error("Retry failed", { description: err.message });
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Film className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Property Film</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered property tour video — realistic camera motion through every room
            </p>
          </div>
          <Badge className="ml-auto bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs">Premium</Badge>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm text-muted-foreground">
          <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <span>
            Each photo is animated with a unique cinematic camera movement, then assembled into a
            seamless walkthrough video. Generation takes <strong>3–8 minutes</strong> depending on the number of photos.
          </span>
        </div>
      </div>

      {/* Video Result */}
      {videoUrl && (
        <div className="rounded-xl overflow-hidden border border-amber-500/30 bg-card">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-semibold text-foreground">Your AI Property Film is Ready!</span>
          </div>
          <div className="p-4">
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg aspect-video bg-black"
              poster={photos[0]?.previewUrl}
            />
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex gap-3">
                <Button asChild className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                  <a href={videoUrl} download="cinematic-walkthrough.mp4">
                    Download Video
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(videoUrl);
                    toast.success("Link copied!");
                  }}
                >
                  Copy Link
                </Button>
              </div>
              <Button asChild variant="outline" className="w-full border-amber-500/40 text-amber-500 hover:bg-amber-500/10">
                <Link href="/my-content">
                  <Library className="h-4 w-4 mr-2" />
                  View in My Content
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Failure card with Retry button */}
      {failedJobId && failedJobError && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-red-500/10 shrink-0 mt-0.5">
              <X className="h-4 w-4 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Generation failed</p>
              <p className="text-sm text-muted-foreground mt-0.5">{failedJobError}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRetry}
              disabled={retryMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {retryMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Retrying…</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />Retry Generation</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setFailedJobId(null); setFailedJobError(null); }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Progress */}
      {isGenerating && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
              <span className="font-semibold text-foreground">{progressLabel}</span>
            </div>
            <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
              {remainingLabel}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-amber-500 h-2.5 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your photos are being animated with cinematic camera movement and assembled into a professional walkthrough video. You'll receive a notification when it's ready — you can safely close this tab.
          </p>
        </div>
      )}

      {/* Photo Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Property Photos</Label>
          <span className="text-xs text-muted-foreground">{photos.length}/12 photos</span>
        </div>

        {/* Drop zone */}
        {photos.length < 12 && (
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Drop photos here or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP — up to 12 photos</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileDrop(e.target.files)}
            />
          </div>
        )}

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  <img
                    src={photo.previewUrl}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {photo.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs bg-black/60 text-white border-0">
                      {index + 1}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <Select
                    value={photo.roomType}
                    onValueChange={(val) =>
                      updatePhoto(photo.id, {
                        roomType: val,
                        label: ROOM_TYPE_LABELS[val] || val,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Custom label (optional)"
                    value={photo.label}
                    onChange={(e) => updatePhoto(photo.id, { label: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Property Details</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Property Address *</Label>
            <Input
              placeholder="123 Oak Street, Westlake Village, CA"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Agent Name</Label>
            <Input
              placeholder="Your name (from profile if blank)"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Brokerage</Label>
            <Input
              placeholder="Keller Williams, Compass, etc."
              value={agentBrokerage}
              onChange={(e) => setAgentBrokerage(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as "16:9" | "9:16")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 — Landscape (YouTube, Facebook)</SelectItem>
                <SelectItem value="9:16">9:16 — Portrait (Reels, TikTok)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-muted/50 transition-colors"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-amber-500" />
            Advanced Options (Music &amp; Voice-over)
          </span>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showAdvanced && (
          <div className="p-4 border-t border-border space-y-4">
            {/* Music */}
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-2">
                <Music className="h-4 w-4 text-muted-foreground" />
                Background Music
              </Label>
              <Select value={musicTrackUrl} onValueChange={setMusicTrackUrl}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a music track" />
                </SelectTrigger>
                <SelectContent>
                  {MUSIC_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice-over */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  AI Voice-over Narration
                </Label>
                <Switch checked={enableVoiceover} onCheckedChange={setEnableVoiceover} />
              </div>
              {enableVoiceover && (
                <Textarea
                  placeholder="Write your narration script here. Describe each room as the camera moves through it. Example: 'Welcome to this stunning Westlake Village estate. As we enter the grand living room, you'll notice the soaring ceilings and natural light...'"
                  value={voiceoverScript}
                  onChange={(e) => setVoiceoverScript(e.target.value)}
                  rows={5}
                  className="text-sm"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || photos.length < 2 || !propertyAddress.trim()}
        className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-base disabled:opacity-50"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Generating AI Property Film…
          </>
        ) : (
          <>
            <Play className="h-5 w-5 mr-2" />
            Generate AI Property Film
          </>
        )}
      </Button>

      {photos.length < 2 && (
        <p className="text-center text-xs text-muted-foreground">Add at least 2 property photos to generate</p>
      )}
    </div>
  );
}
