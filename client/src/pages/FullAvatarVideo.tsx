import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Video, Sparkles, Download, Upload, User, Trash2,
  CheckCircle2, Clock, AlertCircle, Zap, Crown, RefreshCw, Play, Wand2
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// Voice options are loaded live from HeyGen API

/** Estimate read time from word count at 130 wpm */
function estimateReadTime(text: string): { words: number; seconds: number; label: string } {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const seconds = Math.ceil((words / 130) * 60);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const label = mins > 0 ? `~${mins}m ${secs}s` : `~${secs}s`;
  return { words, seconds, label };
}

// ─── Script generator content types ─────────────────────────────────────────
const CONTENT_TYPES = [
  { id: "market_update", label: "Market Update", emoji: "📊" },
  { id: "listing_pitch", label: "New Listing", emoji: "🏠" },
  { id: "just_sold", label: "Just Sold", emoji: "🎉" },
  { id: "tips_advice", label: "Tips & Advice", emoji: "💡" },
  { id: "testimonial_request", label: "Ask for Review", emoji: "⭐" },
  { id: "open_house", label: "Open House", emoji: "🚪" },
  { id: "custom", label: "Custom", emoji: "✏️" },
] as const;

const TARGET_LENGTHS = [
  { id: "30s", label: "30 sec" },
  { id: "60s", label: "1 min" },
  { id: "90s", label: "90 sec" },
  { id: "2min", label: "2 min" },
] as const;

type AvatarMode = "quick" | "custom";

export default function FullAvatarVideo() {
  const { user, loading: isAuthLoading } = useAuth();
  const isPremium = user?.subscriptionTier === "premium" || user?.subscriptionTier === "pro";

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<AvatarMode>("quick");

  // ── Script ────────────────────────────────────────────────────────────────
  const [script, setScript] = useState("");
  const [title, setTitle] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<"all" | "male" | "female">("all");
  const [voiceSearch, setVoiceSearch] = useState("");
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // ── Quick Avatar (V2) — stock avatar picker ──────────────────────────────
  const [selectedAvatarId, setSelectedAvatarId] = useState("");
  const [selectedAvatarPreviewUrl, setSelectedAvatarPreviewUrl] = useState("");
  const [avatarGenderFilter, setAvatarGenderFilter] = useState<"all" | "male" | "female">("all");
  const [avatarSearch, setAvatarSearch] = useState("");

  // ── Script generator state ────────────────────────────────────────────────
  const [showScriptGen, setShowScriptGen] = useState(false);
  const [scriptContentType, setScriptContentType] = useState<string>("market_update");
  const [scriptKeyPoints, setScriptKeyPoints] = useState("");
  const [scriptTargetLength, setScriptTargetLength] = useState<"30s" | "60s" | "90s" | "2min">("60s");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // ── Generation state ──────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [resultVideoUrl, setResultVideoUrl] = useState("");
  const [resultDuration, setResultDuration] = useState(0);

  // ── Custom Avatar training (V3) ───────────────────────────────────────────
  const [trainingVideoFile, setTrainingVideoFile] = useState<File | null>(null);
  const [trainingVideoPreview, setTrainingVideoPreview] = useState("");
  const [isUploadingTraining, setIsUploadingTraining] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const trainingVideoRef = useRef<HTMLInputElement>(null);


  // ── tRPC ──────────────────────────────────────────────────────────────────
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: twinStatus, refetch: refetchTwin } = trpc.fullAvatarVideo.getCustomAvatarStatus.useQuery(undefined, {
    refetchInterval: (query) => (query.state.data?.status === "training" ? 8000 : false),
  });
  const { data: pastVideos = [], refetch: refetchVideos } = trpc.fullAvatarVideo.list.useQuery();
  const generateV2Mutation = trpc.fullAvatarVideo.generate.useMutation();
  const { data: stockAvatars = [], isLoading: isLoadingAvatars } = trpc.fullAvatarVideo.getAvatars.useQuery();
  const generateV3Mutation = trpc.fullAvatarVideo.generateWithCustomAvatar.useMutation();
  const trainMutation = trpc.fullAvatarVideo.trainCustomAvatar.useMutation();
  const deleteMutation = trpc.fullAvatarVideo.delete.useMutation();
  const generateScriptMutation = trpc.fullAvatarVideo.generateAvatarScript.useMutation();
  const { data: heygenVoices = [], isLoading: isLoadingVoices } = trpc.fullAvatarVideo.getVoices.useQuery();

  // Auto-select first voice once loaded
  useEffect(() => {
    if (heygenVoices.length > 0 && !voiceId) {
      // Default to a warm female voice if available, else first
      const jenny = heygenVoices.find((v) => v.name.toLowerCase().includes("jenny") || v.name.toLowerCase().includes("warm"));
      setVoiceId(jenny?.id ?? heygenVoices[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heygenVoices]);

  const filteredVoices = heygenVoices
    .filter((v) => voiceGenderFilter === "all" || v.gender === voiceGenderFilter)
    .filter((v) => !voiceSearch.trim() || v.name.toLowerCase().includes(voiceSearch.toLowerCase()));

  const handleVoicePreview = (voice: { id: string; previewUrl: string | null }) => {
    if (!voice.previewUrl) return;
    if (playingPreviewId === voice.id) {
      previewAudioRef.current?.pause();
      setPlayingPreviewId(null);
      return;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    const audio = new Audio(voice.previewUrl);
    previewAudioRef.current = audio;
    audio.play();
    setPlayingPreviewId(voice.id);
    audio.onended = () => setPlayingPreviewId(null);
    audio.onerror = () => setPlayingPreviewId(null);
  };

  // Auto-select first avatar once loaded
  useEffect(() => {
    if (stockAvatars.length > 0 && !selectedAvatarId) {
      // Default to first professional-looking avatar
      const preferred = stockAvatars.find(a =>
        a.name.toLowerCase().includes("business") ||
        a.name.toLowerCase().includes("suit") ||
        a.name.toLowerCase().includes("office")
      ) ?? stockAvatars[0];
      setSelectedAvatarId(preferred.id);
      setSelectedAvatarPreviewUrl(preferred.previewImageUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockAvatars]);

  const readTime = estimateReadTime(script);

  // ── Handlers ──────────────────────────────────────────────────────────────


  const handleTrainingVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("Please upload a video file"); return; }
    if (file.size > 200 * 1024 * 1024) { toast.error("Video must be under 200MB"); return; }
    setTrainingVideoFile(file);
    setTrainingVideoPreview(URL.createObjectURL(file));
  };

  const handleTrainAvatar = async () => {
    if (!trainingVideoFile) { toast.error("Please select a training video first"); return; }
    setIsUploadingTraining(true);
    try {
      const formData = new FormData();
      formData.append("file", trainingVideoFile);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url: videoUrl } = await res.json();

      setIsTraining(true);
      await trainMutation.mutateAsync({ trainingVideoUrl: videoUrl });
      toast.success("Training started! Your digital twin will be ready in a few minutes.");
      refetchTwin();
    } catch (err: any) {
      toast.error(err.message || "Training failed. Please try again.");
    } finally {
      setIsUploadingTraining(false);
      setIsTraining(false);
    }
  };

  const handleGenerate = async () => {
    if (!script.trim() || script.trim().split(/\s+/).length < 5) {
      toast.error("Please enter a script of at least 5 words");
      return;
    }

    if (mode === "quick" && !selectedAvatarId) {
      toast.error("Please select an avatar first");
      return;
    }

    if (mode === "custom" && twinStatus?.status !== "ready") {
      toast.error("Your custom avatar is not ready yet. Please train it first.");
      return;
    }

    setIsGenerating(true);
    setResultVideoUrl("");
    setGenerationStep("Submitting to HeyGen…");

    try {
      let result: { videoUrl: string; duration: number };

      if (mode === "quick") {
        setGenerationStep("Generating your avatar video with HeyGen…");
        result = await generateV2Mutation.mutateAsync({
          script: script.trim(),
          avatarId: selectedAvatarId,
          avatarPreviewUrl: selectedAvatarPreviewUrl || undefined,
          voiceId,
          title: title.trim() || undefined,
        });
      } else {
        setGenerationStep("Generating with your custom digital twin…");
        result = await generateV3Mutation.mutateAsync({
          script: script.trim(),
          voiceId,
          title: title.trim() || undefined,
        });
      }

      setResultVideoUrl(result.videoUrl);
      setResultDuration(result.duration);
      toast.success("Your avatar video is ready!");
      refetchVideos();
    } catch (err: any) {
      toast.error(err.message || "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleGenerateScript = async () => {
    if (!scriptKeyPoints.trim()) {
      toast.error("Enter at least one key point for the script");
      return;
    }
    setIsGeneratingScript(true);
    try {
      const result = await generateScriptMutation.mutateAsync({
        contentType: scriptContentType as any,
        keyPoints: scriptKeyPoints,
        agentName: currentUser?.name || undefined,
        targetLength: scriptTargetLength,
      });
      setScript(result.script);
      setShowScriptGen(false);
      toast.success("Script generated! Review and edit before generating your video.");
    } catch (err: any) {
      toast.error(err.message || "Script generation failed");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleDelete = async (videoId: number) => {
    try {
      await deleteMutation.mutateAsync({ videoId });
      toast.success("Video deleted");
      refetchVideos();
    } catch {
      toast.error("Failed to delete video");
    }
  };

  const handleDownload = (url: string, videoTitle?: string | null) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${videoTitle || "avatar-video"}-${Date.now()}.mp4`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  // ── Render ──────────────────────────────────────────────────────────────────

  // Premium gate — show upgrade prompt for non-premium users
  if (!isAuthLoading && !isPremium) {
    return (
      <div className="container max-w-2xl py-16">
        <Card className="border-2 border-amber-500/30 bg-amber-500/5">
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Crown className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
              <p className="text-muted-foreground">
                Full Avatar Video is available on the <strong>Pro</strong> and <strong>Premium</strong> plans.
                Generate Captions/Mirage-quality talking-head videos with 1,200+ stock avatars and 2,000+ voices — all without leaving the platform.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="rounded-lg border p-4 space-y-1">
                <Video className="h-5 w-5 text-amber-500" />
                <p className="font-semibold text-sm">1,200+ Avatars</p>
                <p className="text-xs text-muted-foreground">Professional stock avatars in business attire</p>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <p className="font-semibold text-sm">AI Script Writer</p>
                <p className="text-xs text-muted-foreground">Generate camera-ready scripts in seconds</p>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <Crown className="h-5 w-5 text-amber-500" />
                <p className="font-semibold text-sm">Custom Digital Twin</p>
                <p className="text-xs text-muted-foreground">Train your own AI avatar from a 2-min video</p>
              </div>
            </div>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 h-12"
              onClick={() => window.location.href = "/subscription"}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <User className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Full Avatar Video</h1>
            <p className="text-muted-foreground text-sm">Your AI twin delivers your entire script — no background photos needed</p>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setMode("quick")}
          className={`relative p-5 rounded-xl border-2 text-left transition-all ${
            mode === "quick"
              ? "border-amber-500 bg-amber-500/10"
              : "border-border hover:border-amber-500/40 bg-muted/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`h-5 w-5 ${mode === "quick" ? "text-amber-500" : "text-muted-foreground"}`} />
            <span className="font-semibold">Quick Avatar</span>
            <Badge variant="secondary" className="text-xs">V2 · No setup</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Uses your headshot photo. Generates immediately. Best for 30–90 second scripts.</p>
        </button>

        <button
          onClick={() => setMode("custom")}
          className={`relative p-5 rounded-xl border-2 text-left transition-all ${
            mode === "custom"
              ? "border-amber-500 bg-amber-500/10"
              : "border-border hover:border-amber-500/40 bg-muted/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Crown className={`h-5 w-5 ${mode === "custom" ? "text-amber-500" : "text-muted-foreground"}`} />
            <span className="font-semibold">Custom Digital Twin</span>
            <Badge className="text-xs bg-amber-500 text-black">V3 · Premium</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Train once with a 2-min video clip. Natural motion, any length, unlimited videos.</p>
          {twinStatus?.status === "ready" && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Twin ready
            </div>
          )}
          {twinStatus?.status === "training" && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              Training in progress…
            </div>
          )}
        </button>
      </div>

      {/* Quick Avatar: stock avatar picker */}
      {mode === "quick" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-amber-500" />
              Choose Your Avatar
            </Label>
            {selectedAvatarId && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {stockAvatars.find(a => a.id === selectedAvatarId)?.name ?? "Selected"}
              </span>
            )}
          </div>

          {/* Gender filter + search */}
          <div className="flex gap-2">
            {(["all", "female", "male"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setAvatarGenderFilter(g)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${
                  avatarGenderFilter === g
                    ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                    : "border-border hover:border-amber-500/30 text-muted-foreground"
                }`}
              >
                {g === "all" ? "All" : g === "female" ? "Female" : "Male"}
              </button>
            ))}
            <Input
              placeholder="Search avatars…"
              value={avatarSearch}
              onChange={(e) => setAvatarSearch(e.target.value)}
              className="h-7 text-xs flex-1"
            />
          </div>

          {/* Avatar grid */}
          {isLoadingAvatars ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading avatars…
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pr-1">
                {stockAvatars
                  .filter(a => avatarGenderFilter === "all" || a.gender === avatarGenderFilter)
                  .filter(a => !avatarSearch.trim() || a.name.toLowerCase().includes(avatarSearch.toLowerCase()))
                  .slice(0, 48)
                  .map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => { setSelectedAvatarId(avatar.id); setSelectedAvatarPreviewUrl(avatar.previewImageUrl); }}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4] ${
                        selectedAvatarId === avatar.id
                          ? "border-amber-500 ring-2 ring-amber-500/30"
                          : "border-border hover:border-amber-500/50"
                      }`}
                      title={avatar.name}
                    >
                      <img
                        src={avatar.previewImageUrl}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {selectedAvatarId === avatar.id && (
                        <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-0.5">
                          <CheckCircle2 className="h-3 w-3 text-black" />
                        </div>
                      )}
                    </button>
                  ))}
              </div>
              {stockAvatars.filter(a => avatarGenderFilter === "all" || a.gender === avatarGenderFilter).length > 48 && (
                <p className="text-xs text-muted-foreground text-center mt-2">Showing 48 of {stockAvatars.filter(a => avatarGenderFilter === "all" || a.gender === avatarGenderFilter).length} — use search to narrow down</p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Custom Twin: training section */}
      {mode === "custom" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              Train Your Digital Twin
            </Label>
            {twinStatus && (
              <Badge
                variant={twinStatus.status === "ready" ? "default" : twinStatus.status === "training" ? "secondary" : "destructive"}
                className={twinStatus.status === "ready" ? "bg-green-500" : ""}
              >
                {twinStatus.status === "ready" ? "Ready" : twinStatus.status === "training" ? "Training…" : "Failed"}
              </Badge>
            )}
          </div>

          {twinStatus?.status === "ready" ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Your digital twin is trained and ready!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Trained {twinStatus.trainedAt ? new Date(twinStatus.trainedAt).toLocaleDateString() : "recently"}.
                  You can retrain anytime by uploading a new video below.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Upload a video of YOUR FACE to create your personal AI twin</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upload a short clip of yourself speaking to camera — for example, a video you made with Captions AI or any selfie-style recording. Once trained, every video you generate here will use your face and voice automatically.
                </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">Video Requirements for Best Results:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div><span className="font-medium text-foreground">Duration:</span> 1–3 min (2 min ideal)</div>
                  <div><span className="font-medium text-foreground">Format:</span> MP4 or MOV, under 200MB</div>
                  <div><span className="font-medium text-foreground">Face:</span> Look directly at camera</div>
                  <div><span className="font-medium text-foreground">Lighting:</span> Even, no harsh shadows</div>
                </div>
              </div>

              <div
                onClick={() => trainingVideoRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/30 hover:border-amber-500/50 rounded-xl p-6 cursor-pointer transition-colors text-center"
              >
                {trainingVideoPreview ? (
                  <div className="space-y-2">
                    <video src={trainingVideoPreview} className="w-full max-h-32 rounded-lg object-contain mx-auto" />
                    <p className="text-sm text-green-600 font-medium">✓ {trainingVideoFile?.name}</p>
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Video className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium">Upload your training video</p>
                    <p className="text-xs text-muted-foreground">MP4, MOV up to 200MB</p>
                  </div>
                )}
              </div>
              <input ref={trainingVideoRef} type="file" accept="video/*" className="hidden" onChange={handleTrainingVideoChange} />

              <Button
                onClick={handleTrainAvatar}
                disabled={!trainingVideoFile || isUploadingTraining || isTraining}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                {isUploadingTraining ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading video…</>
                ) : isTraining ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting training…</>
                ) : (
                  <><Crown className="mr-2 h-4 w-4" />Train My Digital Twin</>
                )}
              </Button>

              {twinStatus?.status === "training" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  Training in progress — this usually takes 3–8 minutes. You can leave this page and come back.
                </div>
              )}
            </div>
          )}

          {twinStatus?.status === "ready" && (
            <button
              onClick={() => trainingVideoRef.current?.click()}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Retrain with a new video
            </button>
          )}
        </Card>
      )}

      {/* AI Script Generator */}
      <Card className="p-6 space-y-4 border-amber-500/20">
        <button
          onClick={() => setShowScriptGen((v) => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <Label className="text-base font-semibold flex items-center gap-2 cursor-pointer">
            <Wand2 className="h-4 w-4 text-amber-500" />
            Write Script with AI
          </Label>
          <span className="text-xs text-muted-foreground">{showScriptGen ? "Hide" : "Expand"}</span>
        </button>

        {showScriptGen && (
          <div className="space-y-4 pt-2">
            {/* Content type */}
            <div className="space-y-2">
              <Label className="text-sm">What kind of video?</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => setScriptContentType(ct.id)}
                    className={`text-xs px-2 py-2 rounded-lg border transition-all text-center ${
                      scriptContentType === ct.id
                        ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                        : "border-border hover:border-amber-500/40 text-muted-foreground"
                    }`}
                  >
                    <span className="block text-base mb-0.5">{ct.emoji}</span>
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target length */}
            <div className="space-y-2">
              <Label className="text-sm">Target length</Label>
              <div className="flex gap-2">
                {TARGET_LENGTHS.map((tl) => (
                  <button
                    key={tl.id}
                    onClick={() => setScriptTargetLength(tl.id as any)}
                    className={`flex-1 text-xs py-2 rounded-lg border transition-all ${
                      scriptTargetLength === tl.id
                        ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                        : "border-border hover:border-amber-500/40 text-muted-foreground"
                    }`}
                  >
                    {tl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Key points */}
            <div className="space-y-2">
              <Label className="text-sm">Key points to cover</Label>
              <Textarea
                placeholder={`e.g.\n- Inventory is down 18% from last year\n- Interest rates stabilizing around 6.5%\n- Great time to list before spring rush`}
                value={scriptKeyPoints}
                onChange={(e) => setScriptKeyPoints(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">Jot down 2–4 bullet points. The AI will write the full camera-ready script.</p>
            </div>

            <Button
              onClick={handleGenerateScript}
              disabled={isGeneratingScript || !scriptKeyPoints.trim()}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {isGeneratingScript ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Writing your script…</>
              ) : (
                <><Wand2 className="mr-2 h-4 w-4" />Generate Script</>  
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Script input */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Your Script</Label>
          {script.trim() && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{readTime.words} words</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readTime.label} read time
              </span>
              {readTime.seconds > 180 && (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Long script — may take 3–5 min to generate
                </span>
              )}
            </div>
          )}
        </div>

        <Input
          placeholder="Video title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm"
        />

        <Textarea
          placeholder="Write or paste your full script here. The AI avatar will speak every word exactly as written. Aim for 100–250 words for a 45–120 second video."
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={8}
          className="resize-none text-sm leading-relaxed"
        />

        {/* Voice selector — live from HeyGen */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Voice</Label>
            {voiceId && heygenVoices.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {heygenVoices.find((v) => v.id === voiceId)?.name ?? ""}
              </span>
            )}
          </div>

          {/* Gender filter + search */}
          <div className="flex gap-2">
            {(["all", "female", "male"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setVoiceGenderFilter(g)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${
                  voiceGenderFilter === g
                    ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                    : "border-border hover:border-amber-500/30 text-muted-foreground"
                }`}
              >
                {g === "all" ? "All" : g === "female" ? "Female" : "Male"}
              </button>
            ))}
            <Input
              placeholder="Search voices…"
              value={voiceSearch}
              onChange={(e) => setVoiceSearch(e.target.value)}
              className="h-7 text-xs flex-1"
            />
          </div>

          {/* Voice list */}
          {isLoadingVoices ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading voices…
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredVoices.slice(0, 60).map((v) => (
                <div
                  key={v.id}
                  onClick={() => setVoiceId(v.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                    voiceId === v.id
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-border hover:border-amber-500/30"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-medium truncate ${
                      voiceId === v.id ? "text-amber-700 dark:text-amber-400" : "text-foreground"
                    }`}>{v.name}</span>
                    <span className="text-xs text-muted-foreground capitalize shrink-0">{v.gender}</span>
                  </div>
                  {v.previewUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleVoicePreview(v); }}
                      className="ml-2 p-1 rounded-full hover:bg-amber-500/20 transition-colors shrink-0"
                      title="Preview voice"
                    >
                      {playingPreviewId === v.id ? (
                        <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 text-muted-foreground hover:text-amber-500" />
                      )}
                    </button>
                  )}
                </div>
              ))}
              {filteredVoices.length === 0 && (
                <p className="text-xs text-muted-foreground py-2 text-center">No voices match your search</p>
              )}
              {filteredVoices.length > 60 && (
                <p className="text-xs text-muted-foreground text-center py-1">Showing 60 of {filteredVoices.length} — use search to narrow down</p>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            !script.trim() ||
            (mode === "quick" && (!selectedAvatarId || isLoadingAvatars)) ||
            (mode === "custom" && twinStatus?.status !== "ready")
          }
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold h-12 text-base"
        >
          {isGenerating ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{generationStep || "Generating…"}</>
          ) : (
            <><Sparkles className="mr-2 h-5 w-5" />Generate Full Avatar Video</>
          )}
        </Button>

        {isGenerating && (
          <div className="text-center text-xs text-muted-foreground">
    HeyGen is animating your avatar and syncing speech. This takes 1–5 minutes depending on script length.
          </div>
        )}
      </Card>

      {/* Result */}
      {resultVideoUrl && (
        <Card className="p-6 space-y-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Your Avatar Video is Ready!
            </Label>
            <Badge variant="secondary">{resultDuration}s</Badge>
          </div>
          <video
            src={resultVideoUrl}
            controls
            className="w-full rounded-xl border border-border"
            style={{ maxHeight: "480px" }}
          />
          <div className="flex gap-3">
            <Button
              onClick={() => handleDownload(resultVideoUrl, title)}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              <Download className="mr-2 h-4 w-4" />
              Download MP4
            </Button>
            <Button
              variant="outline"
              onClick={() => { setScript(""); setTitle(""); setResultVideoUrl(""); }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              New Video
            </Button>
          </div>
        </Card>
      )}

      {/* Past videos */}
      {pastVideos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Avatar Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pastVideos.map((video) => (
              <Card key={video.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{video.title || "Untitled Avatar Video"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {video.avatarType === "v3_custom" ? "Custom Twin" : "Quick Avatar"}
                      </Badge>
                      {video.duration && <span className="text-xs text-muted-foreground">{video.duration}s</span>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {video.videoUrl && (
                  <video
                    src={video.videoUrl}
                    controls
                    className="w-full rounded-lg border border-border"
                    style={{ maxHeight: "200px" }}
                  />
                )}

                <div className="flex gap-2">
                  {video.videoUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => handleDownload(video.videoUrl!, video.title)}
                    >
                      <Download className="mr-1.5 h-3 w-3" />
                      Download
                    </Button>
                  )}
                  <div className="text-xs text-muted-foreground flex items-center gap-1 px-2">
                    <Clock className="h-3 w-3" />
                    {(video as any).daysUntilExpiration}d left
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
