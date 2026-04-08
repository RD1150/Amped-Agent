import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, Video, Sparkles, Download, Upload, User, Trash2,
  CheckCircle2, Clock, AlertCircle, Zap, Crown, RefreshCw, Play, Wand2,
  Lightbulb, ChevronDown, ChevronUp, Share2, ImagePlus
} from "lucide-react";
import { toast } from "sonner";
import { VideoPostingDialog } from "@/components/VideoPostingDialog";
import { GenerationRatingPrompt } from "@/components/GenerationRatingPrompt";
import { trpc } from "@/lib/trpc";

// Voice options are loaded live from the AI engine

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
  const isPremium = user?.subscriptionTier === "agency" || user?.subscriptionTier === "pro";

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<AvatarMode>("quick");

  // ── Script ────────────────────────────────────────────────────────────────
  const [script, setScript] = useState("");
  const [visualPrompt, setVisualPrompt] = useState("");
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const bgUploadRef = useRef<HTMLInputElement>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicFileName, setMusicFileName] = useState<string | null>(null);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const musicUploadRef = useRef<HTMLInputElement>(null);
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
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [ratedVideoId, setRatedVideoId] = useState<number | undefined>(undefined);
  const [showVideoShare, setShowVideoShare] = useState(false);
  const [resultDuration, setResultDuration] = useState(0);

  // ── Custom Photo Avatar ───────────────────────────────────────────
  const [showTwinTips, setShowTwinTips] = useState(true); // Open by default so agents see requirements before uploading
  const [trainingPhotoFile, setTrainingPhotoFile] = useState<File | null>(null);
  const [trainingPhotoPreview, setTrainingPhotoPreview] = useState("");
  const [isUploadingTraining, setIsUploadingTraining] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const trainingPhotoRef = useRef<HTMLInputElement>(null);
  const scriptSectionRef = useRef<HTMLDivElement>(null);


  // ── tRPC ──────────────────────────────────────────────────────────────────
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: personaData } = trpc.persona.get.useQuery();
  const { data: twinStatus, refetch: refetchTwin } = trpc.fullAvatarVideo.getCustomAvatarStatus.useQuery(undefined, {
    refetchInterval: (query) => (query.state.data?.status === "training" ? 8000 : false),
  });
  const { data: pastVideos = [], refetch: refetchVideos } = trpc.fullAvatarVideo.list.useQuery();
  const generateV2Mutation = trpc.fullAvatarVideo.generate.useMutation();
  const { data: stockAvatars = [], isLoading: isLoadingAvatars } = trpc.fullAvatarVideo.getAvatars.useQuery();
  const generateV3Mutation = trpc.fullAvatarVideo.generateWithCustomAvatar.useMutation();
  const trainMutation = trpc.fullAvatarVideo.trainCustomAvatar.useMutation();
  const retryTrainingMutation = trpc.fullAvatarVideo.retryAvatarTraining.useMutation({
    onSuccess: () => { toast.success("Training re-triggered — polling for updates…"); refetchTwin(); },
    onError: (e) => toast.error(`Retry failed: ${e.message}`),
  });
  const deleteAvatarMutation = trpc.fullAvatarVideo.deleteCustomAvatar.useMutation({
    onSuccess: () => { toast.success("Avatar deleted. You can now upload a new headshot."); refetchTwin(); },
    onError: (e) => toast.error(`Delete failed: ${e.message}`),
  });
  const deleteMutation = trpc.fullAvatarVideo.delete.useMutation();
  const generateScriptMutation = trpc.fullAvatarVideo.generateAvatarScript.useMutation();
  const { data: voices = [], isLoading: isLoadingVoices } = trpc.fullAvatarVideo.getVoices.useQuery();
  // alias for internal use
  const heygenVoices = voices;

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

  // Photo Avatar virtual entry — prepended to the picker when ready
  const photoAvatarEntry = twinStatus?.status === "ready" ? {
    id: "__photo_avatar__",
    name: "Your Photo Avatar",
    gender: "female" as const,
    previewImageUrl: personaData?.headshotUrl || twinStatus.thumbnailUrl || twinStatus.trainingVideoUrl || "",
    isPhotoAvatar: true,
  } : null;

  // Auto-select first avatar once loaded (prefer user's Photo Avatar if ready)
  useEffect(() => {
    if (twinStatus?.status === "ready" && !selectedAvatarId && mode === "quick") {
      setSelectedAvatarId("__photo_avatar__");
      setSelectedAvatarPreviewUrl(twinStatus.thumbnailUrl || twinStatus.trainingVideoUrl || "");
      return;
    }
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
  }, [stockAvatars, twinStatus]);

  const handleUseMyAvatar = useCallback(() => {
    setMode("quick");
    setSelectedAvatarId("__photo_avatar__");
    setSelectedAvatarPreviewUrl(twinStatus?.thumbnailUrl || twinStatus?.trainingVideoUrl || "");
    setTimeout(() => {
      scriptSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [twinStatus]);

  const readTime = estimateReadTime(script);

  // ── Handlers ──────────────────────────────────────────────────────────────


  const handleTrainingPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload a photo (JPG, PNG, or WEBP)"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Photo must be under 10MB"); return; }
    setTrainingPhotoFile(file);
    setTrainingPhotoPreview(URL.createObjectURL(file));
  };

  const handleTrainAvatar = async () => {
    if (!trainingPhotoFile) { toast.error("Please select a headshot photo first"); return; }
    setIsUploadingTraining(true);
    try {
      const formData = new FormData();
      formData.append("file", trainingPhotoFile);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url: photoUrl } = await res.json();

      setIsTraining(true);
      await trainMutation.mutateAsync({ photoUrl });
      toast.success("Your Photo Avatar is being created! It will be ready in a few minutes.");
      refetchTwin();
    } catch (err: any) {
      toast.error(err.message || "Photo Avatar creation failed. Please try again.");
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
    setGenerationStep("Submitting your video request…");

    try {
      let result: { videoUrl: string; duration: number };

      if (mode === "quick" && selectedAvatarId === "__photo_avatar__") {
        // User selected their Photo Avatar from the picker — use the custom avatar generation path
        if (twinStatus?.status !== "ready") {
          toast.error("Your Photo Avatar is not ready yet.");
          setIsGenerating(false);
          return;
        }
        setGenerationStep("Generating with your Photo Avatar…");
        result = await generateV3Mutation.mutateAsync({
          script: script.trim(),
          voiceId,
          title: title.trim() || undefined,
          captionsEnabled,
          visualPrompt: visualPrompt.trim() || undefined,
          backgroundUrl: selectedBackground || undefined,
          musicUrl: musicUrl || undefined,
        });
      } else if (mode === "quick") {
        setGenerationStep("Generating your avatar video…");
        result = await generateV2Mutation.mutateAsync({
          script: script.trim(),
          avatarId: selectedAvatarId,
          avatarPreviewUrl: selectedAvatarPreviewUrl || undefined,
          voiceId,
          title: title.trim() || undefined,
          captionsEnabled,
          visualPrompt: visualPrompt.trim() || undefined,
          backgroundUrl: selectedBackground || undefined,
          musicUrl: musicUrl || undefined,
        });
      } else {
        setGenerationStep("Generating with your custom digital twin…");
        result = await generateV3Mutation.mutateAsync({
          script: script.trim(),
          voiceId,
          title: title.trim() || undefined,
          captionsEnabled,
          visualPrompt: visualPrompt.trim() || undefined,
          backgroundUrl: selectedBackground || undefined,
          musicUrl: musicUrl || undefined,
        });
      }

      setResultVideoUrl(result.videoUrl);
      setResultDuration(result.duration);
      setShowRatingPrompt(true);
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
        <Card className="border-2 border-primary/20 bg-primary/5">
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Agency Feature</h2>
              <p className="text-muted-foreground">
                Full Avatar Video is available on the <strong>Pro</strong> and <strong>Agency</strong> plans.
                Generate Captions/Mirage-quality talking-head videos with 1,200+ stock avatars and 2,000+ voices — all without leaving the platform.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="rounded-lg border p-4 space-y-1">
                <Video className="h-5 w-5 text-primary" />
                <p className="font-semibold text-sm">1,200+ Avatars</p>
                <p className="text-xs text-muted-foreground">Professional stock avatars in business attire</p>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="font-semibold text-sm">AI Script Writer</p>
                <p className="text-xs text-muted-foreground">Generate camera-ready scripts in seconds</p>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <Crown className="h-5 w-5 text-primary" />
                <p className="font-semibold text-sm">Custom Digital Twin</p>
                <p className="text-xs text-muted-foreground">Train your own AI avatar from a 2-min video</p>
              </div>
            </div>
            <Button
              className="bg-muted0 hover:bg-primary text-black font-semibold px-8 h-12"
              onClick={() => window.location.href = "/subscription"}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Agency
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
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
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
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/30 bg-muted/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`h-5 w-5 ${mode === "quick" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-semibold">Quick Avatar</span>
            <Badge variant="secondary" className="text-xs">V2 · No setup</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Uses your headshot photo. Generates immediately. Best for 30–90 second scripts.</p>
        </button>

        <button
          onClick={() => setMode("custom")}
          className={`relative p-5 rounded-xl border-2 text-left transition-all ${
            mode === "custom"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/30 bg-muted/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Crown className={`h-5 w-5 ${mode === "custom" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-semibold">Custom Digital Twin</span>
            <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Avatar IV · Agency</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Train once with a 2-min video clip. Powered by Avatar IV — expressive full-face motion, 1080p, up to 3 min.</p>
          <p className="text-xs text-amber-500/80 mt-1 flex items-center gap-1"><Sparkles className="h-3 w-3" />Avatar V coming soon — cinematic full-body motion from a 15-sec clip.</p>
          {twinStatus?.status === "ready" && (
            <div className="mt-2 flex items-center gap-1 text-xs text-primary">
              <CheckCircle2 className="h-3 w-3" />
              Twin ready
            </div>
          )}
          {twinStatus?.status === "training" && (
            <div className="mt-2 flex items-center gap-1 text-xs text-primary">
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
              <User className="h-4 w-4 text-primary" />
              Choose Your Avatar
            </Label>
            {selectedAvatarId && (
              <span className="text-xs text-primary flex items-center gap-1">
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
                    ? "border-primary bg-primary/10 text-primary dark:text-primary/80 font-medium"
                    : "border-border hover:border-primary/20 text-muted-foreground"
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
                {/* User's Photo Avatar — always first if ready */}
                {photoAvatarEntry && (
                  <button
                    key="__photo_avatar__"
                    onClick={() => { setSelectedAvatarId("__photo_avatar__"); setSelectedAvatarPreviewUrl(photoAvatarEntry.previewImageUrl); }}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4] ${
                      selectedAvatarId === "__photo_avatar__"
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-green-500 hover:border-primary/30"
                    }`}
                    title="Your Photo Avatar"
                  >
                    {photoAvatarEntry.previewImageUrl ? (
                      <img
                        src={photoAvatarEntry.previewImageUrl}
                        alt="Your Photo Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/15 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    {/* Your Avatar badge */}
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[9px] font-bold text-center py-0.5 leading-tight">
                      YOUR AVATAR
                    </div>
                    {selectedAvatarId === "__photo_avatar__" && (
                      <div className="absolute top-1 right-1 bg-muted0 rounded-full p-0.5">
                        <CheckCircle2 className="h-3 w-3 text-black" />
                      </div>
                    )}
                  </button>
                )}
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
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/30"
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
                        <div className="absolute top-1 right-1 bg-muted0 rounded-full p-0.5">
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

      {/* Custom Photo Avatar section */}
      {mode === "custom" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Your Photo Avatar
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3 flex-1">
                {twinStatus.thumbnailUrl || twinStatus.trainingVideoUrl ? (
                  <img
                    src={twinStatus.thumbnailUrl || twinStatus.trainingVideoUrl}
                    alt="Your Photo Avatar"
                    className="h-12 w-12 rounded-full object-cover border-2 border-green-500 flex-shrink-0"
                  />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-primary flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-sm">Your Photo Avatar is ready!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Created {twinStatus.trainedAt ? new Date(twinStatus.trainedAt).toLocaleDateString() : "recently"}.{" "}
                    <button
                      className="underline text-primary hover:text-primary transition-colors"
                      onClick={() => trainingPhotoRef.current?.click()}
                    >
                      Replace photo
                    </button>
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-muted0 hover:bg-primary text-black font-semibold whitespace-nowrap flex-shrink-0"
                onClick={handleUseMyAvatar}
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Generate with My Avatar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-primary dark:text-primary">📸 Upload a headshot photo of YOUR FACE to create your personal AI avatar</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upload a clear, front-facing photo of yourself. The AI will animate your face to speak any script you write — so every video looks like you.
                </p>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-xs font-medium text-primary dark:text-primary/80 mb-2">Photo Requirements for Best Results:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div><span className="font-medium text-foreground">Format:</span> JPG, PNG, or WEBP — under 10MB</div>
                  <div><span className="font-medium text-foreground">Framing:</span> Head &amp; shoulders, face centred with plenty of space above</div>
                  <div><span className="font-medium text-foreground">Expression:</span> Relaxed jaw, <span className="font-semibold text-primary">slightly open mouth</span> (not smiling)</div>
                  <div><span className="font-medium text-foreground">Lighting:</span> Even, no harsh shadows</div>
                </div>
                <div className="mt-2 flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-2">
                  <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed"><span className="font-semibold">Key tip for natural-looking video:</span> Use a photo where your mouth is <span className="font-semibold">slightly open and relaxed</span> — not smiling, not closed tight. This gives the AI the best starting point for realistic lip animation. A closed-mouth photo can cause the mouth to look oversized when animated.</p>
                </div>
              </div>

              {/* Tips for recording a high-quality training video */}
              <div className="rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTwinTips((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" />
                    Tips for a high-quality headshot photo
                  </span>
                  {showTwinTips ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {showTwinTips && (
                  <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border bg-muted/20">

                    {/* Critical warnings — shown first, always visible */}
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-md p-3 text-xs space-y-1.5">
                      <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">⚠️ Most common mistakes that cause distorted results</p>
                      <ul className="space-y-1 text-amber-700 dark:text-amber-400 list-disc list-inside">
                        <li><span className="font-semibold">Closed or tightly pressed lips</span> — the AI over-animates a closed mouth, making it look huge and distorted. Keep your mouth <span className="font-semibold">slightly open</span> (like mid-sentence) when the photo is taken.</li>
                        <li><span className="font-semibold">Head too close to the top edge</span> — your head will be cropped. Leave space above your head equal to at least 20% of the photo height.</li>
                        <li><span className="font-semibold">Face too small in frame</span> — your face should fill at least 50% of the photo height. Crop in close before uploading.</li>
                      </ul>
                    </div>

                    {/* Dimensions */}
                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-xs">
                      <p className="font-bold text-blue-800 dark:text-blue-300 mb-1.5">📐 Recommended photo dimensions</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-blue-700 dark:text-blue-400">
                        <span className="font-semibold">Size:</span><span>800 × 800 px minimum (square preferred)</span>
                        <span className="font-semibold">Aspect ratio:</span><span>1:1 (square) or 3:4 (portrait)</span>
                        <span className="font-semibold">Max file size:</span><span>10 MB</span>
                        <span className="font-semibold">Format:</span><span>JPG, PNG, or WEBP</span>
                        <span className="font-semibold">Face size:</span><span>Face fills 50–70% of the frame height</span>
                        <span className="font-semibold">Head room:</span><span>At least 20% space above your head</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground flex items-center gap-1">📍 Background</p>
                        <p className="text-muted-foreground leading-relaxed">Choose a clean, uncluttered background — a plain wall or simple office setting. Avoid busy patterns or distracting objects behind you.</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground flex items-center gap-1">💡 Lighting</p>
                        <p className="text-muted-foreground leading-relaxed">Face a window or use a ring light so your face is evenly lit. Avoid sitting with a bright window behind you — it will silhouette your face.</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground flex items-center gap-1">📷 Framing</p>
                        <p className="text-muted-foreground leading-relaxed">Head and shoulders in frame, face centred. Camera at eye level — not looking up from a desk or down from a shelf.</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground flex items-center gap-1">😊 Expression &amp; Mouth</p>
                        <p className="text-muted-foreground leading-relaxed">Relaxed jaw, mouth <span className="font-semibold text-foreground">slightly open</span> — not smiling, not clenched. Eyes open, looking directly at the camera. This is the single biggest factor for natural-looking lip sync.</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground flex items-center gap-1">🖼️ Photo quality</p>
                        <p className="text-muted-foreground leading-relaxed">Sharp, well-lit, recent photo. JPG, PNG, or WEBP under 10 MB. Avoid blurry, heavily filtered, or low-resolution photos.</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground flex items-center gap-1">🚫 What to Avoid</p>
                        <p className="text-muted-foreground leading-relaxed">No sunglasses, hats, or masks. No group photos — only your face. No heavy filters or extreme colour grading.</p>
                      </div>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-2.5 text-xs text-green-700 dark:text-green-400">
                      <span className="font-semibold">Pro tip:</span> A professional headshot cropped to 800×800 px in good natural light gives the best results. You only need to do this once — update it whenever you get a new headshot.
                    </div>
                  </div>
                )}
              </div>

              <div
                onClick={() => trainingPhotoRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/30 rounded-xl p-6 cursor-pointer transition-colors text-center"
              >
                {trainingPhotoPreview ? (
                  <div className="space-y-2">
                    <img src={trainingPhotoPreview} alt="Your headshot" className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-primary/30" />
                    <p className="text-sm text-primary font-medium">✓ {trainingPhotoFile?.name}</p>
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <User className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium">Upload your headshot photo</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, or WEBP — under 10MB</p>
                  </div>
                )}
              </div>
              <input ref={trainingPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleTrainingPhotoChange} />

              <Button
                onClick={handleTrainAvatar}
                disabled={!trainingPhotoFile || isUploadingTraining || isTraining}
                className="w-full bg-muted0 hover:bg-primary text-black font-semibold"
              >
                {isUploadingTraining ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading photo…</>
                ) : isTraining ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating your avatar…</>
                ) : (
                  <><User className="mr-2 h-4 w-4" />Create My Photo Avatar</>
                )}
              </Button>

              {twinStatus?.status === "training" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary dark:text-primary/80">
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    Creating your Photo Avatar — usually takes 2–5 minutes. You can leave this page and come back.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryTrainingMutation.mutate()}
                      disabled={retryTrainingMutation.isPending}
                      className="text-xs"
                    >
                      {retryTrainingMutation.isPending ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Retrying…</> : "Stuck? Retry Training"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAvatarMutation.mutate()}
                      disabled={deleteAvatarMutation.isPending}
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      {deleteAvatarMutation.isPending ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Deleting…</> : "Delete & Start Over"}
                    </Button>
                  </div>
                </div>
              )}

              {twinStatus?.status === "failed" && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    <span className="text-base leading-none mt-0.5">⚠️</span>
                    <div>
                      <p className="font-medium">Avatar creation failed</p>
                      <p className="text-xs mt-0.5 text-destructive/80">The avatar creation didn't complete. Please delete this attempt and upload your headshot again — no credits were charged.</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteAvatarMutation.mutate()}
                    disabled={deleteAvatarMutation.isPending}
                    className="text-xs w-full"
                  >
                    {deleteAvatarMutation.isPending ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Clearing…</> : "🗑️ Delete & Upload Again"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {twinStatus?.status === "ready" && (
            <button
              onClick={() => trainingPhotoRef.current?.click()}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Update with a new headshot
            </button>
          )}
        </Card>
      )}

      {/* AI Script Generator */}
      <Card className="p-6 space-y-4 border-primary/20">
        <button
          onClick={() => setShowScriptGen((v) => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <Label className="text-base font-semibold flex items-center gap-2 cursor-pointer">
            <Wand2 className="h-4 w-4 text-primary" />
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
                        ? "border-primary bg-primary/10 text-primary dark:text-primary/80 font-medium"
                        : "border-border hover:border-primary/30 text-muted-foreground"
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
                        ? "border-primary bg-primary/10 text-primary dark:text-primary/80 font-medium"
                        : "border-border hover:border-primary/30 text-muted-foreground"
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
              className="w-full bg-muted0 hover:bg-primary text-black font-semibold"
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

      {/* Background Scene Picker */}
      <Card className="p-6 space-y-4">
        <div>
          <Label className="text-base font-semibold">🎨 Background Scene</Label>
          <p className="text-xs text-muted-foreground mt-1">Choose the environment behind your avatar. A realistic scene makes your video look professional and natural.</p>
        </div>
        {/* Custom background upload input */}
        <input
          ref={bgUploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) {
              toast.error("Image must be under 10 MB");
              return;
            }
            setIsUploadingBg(true);
            try {
              const formData = new FormData();
              formData.append("file", file);
              const res = await fetch("/api/upload-images", { method: "POST", body: formData });
              const json = await res.json();
              const url = json.urls?.[0] ?? json.url;
              if (!url) throw new Error("Upload failed");
              setCustomBgUrl(url);
              setSelectedBackground(url);
              toast.success("Custom background uploaded!");
            } catch {
              toast.error("Upload failed — please try again");
            } finally {
              setIsUploadingBg(false);
              e.target.value = "";
            }
          }}
        />
        <div className="grid grid-cols-5 gap-2">
          {([
            { id: null, label: "None" },
            { id: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/jYfgdUExrEcbDAis.jpg", label: "Podcast Studio", thumb: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/jYfgdUExrEcbDAis.jpg" },
            { id: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/qKjEeuuLaWkzAxNe.jpg", label: "News Desk", thumb: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/qKjEeuuLaWkzAxNe.jpg" },
            { id: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/MgWGSwAwyfSFefaS.jpg", label: "Home Office", thumb: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/MgWGSwAwyfSFefaS.jpg" },
            { id: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/zDZBrCkDfXNXbDWe.jpg", label: "Luxury Lounge", thumb: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/zDZBrCkDfXNXbDWe.jpg" },
            { id: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/hHUSgwiKTppasmAr.jpg", label: "Outdoor Terrace", thumb: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/hHUSgwiKTppasmAr.jpg" },
            { id: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/mFqorDBHYTlbITEk.jpg", label: "Modern Office", thumb: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/mFqorDBHYTlbITEk.jpg" },
            { id: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/eTbIKQMscznjExYf.jpg", label: "Café", thumb: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/eTbIKQMscznjExYf.jpg" },
            { id: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/NgjqXKaYOnCvGxxC.jpg", label: "Real Estate Office", thumb: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/NgjqXKaYOnCvGxxC.jpg" },
          ] as { id: string | null; label: string; thumb?: string }[]).map((bg) => (
            <button
              key={bg.id ?? "none"}
              type="button"
              onClick={() => setSelectedBackground(bg.id)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                selectedBackground === bg.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40"
              }`}
              style={{ aspectRatio: "9/16" }}
            >
              {bg.thumb ? (
                <img src={bg.thumb} alt={bg.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-1">
                  <span className="text-xl">⬛</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                <p className="text-[9px] text-white font-medium text-center leading-tight truncate">{bg.label}</p>
              </div>
              {selectedBackground === bg.id && (
                <div className="absolute top-1 right-1 bg-primary rounded-full w-4 h-4 flex items-center justify-center">
                  <span className="text-[9px] text-white font-bold">✓</span>
                </div>
              )}
            </button>
          ))}

          {/* Custom upload tile */}
          {customBgUrl ? (
            <button
              type="button"
              onClick={() => setSelectedBackground(customBgUrl)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                selectedBackground === customBgUrl
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40"
              }`}
              style={{ aspectRatio: "9/16" }}
            >
              <img src={customBgUrl} alt="Custom" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                <p className="text-[9px] text-white font-medium text-center leading-tight">My Background</p>
              </div>
              {selectedBackground === customBgUrl && (
                <div className="absolute top-1 right-1 bg-primary rounded-full w-4 h-4 flex items-center justify-center">
                  <span className="text-[9px] text-white font-bold">✓</span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCustomBgUrl(null); if (selectedBackground === customBgUrl) setSelectedBackground(null); }}
                className="absolute top-1 left-1 bg-black/60 rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-500/80 transition-colors"
              >
                <span className="text-[9px] text-white font-bold">✕</span>
              </button>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => bgUploadRef.current?.click()}
              disabled={isUploadingBg}
              className="relative rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary/60 transition-all bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-1"
              style={{ aspectRatio: "9/16" }}
            >
              {isUploadingBg ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <ImagePlus className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-[9px] text-muted-foreground font-medium text-center leading-tight px-1">
                {isUploadingBg ? "Uploading..." : "Upload Custom"}
              </span>
            </button>
          )}
        </div>
      </Card>

      {/* Script input */}
      <Card className="p-6 space-y-4" ref={scriptSectionRef}>
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Script &amp; Visual Direction</Label>
          {script.trim() && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{readTime.words} words</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readTime.label} read time
              </span>
              {readTime.seconds > 180 && (
                <span className="text-primary flex items-center gap-1">
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

        {/* Two-column: Script + Visual Prompt */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Spoken Script */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">🎙️ Spoken Script</Label>
              <span className="text-xs text-muted-foreground">— what the avatar says</span>
            </div>
            <Textarea
              placeholder="Write or paste your full script here. The AI avatar will speak every word exactly as written. Aim for 100–250 words for a 45–120 second video."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={10}
              className="resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Right: Visual Prompt / Captions */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">🎬 Visual Prompt / Captions</Label>
              <span className="text-xs text-muted-foreground">— on-screen direction</span>
            </div>
            <Textarea
              placeholder={`Describe what should appear on screen as the script is read.\n\nExamples:\n• Show exterior shot of 123 Main St\n• Cut to kitchen with granite counters\n• Display caption: "3 beds · 2 baths · $650K"\n• B-roll: couple walking through backyard\n• Text overlay: Call to action`}
              value={visualPrompt}
              onChange={(e) => setVisualPrompt(e.target.value)}
              rows={10}
              className="resize-none text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              Optional — use this to guide your video editor or AI video tool on what visuals to pair with each line.
            </p>
          </div>
        </div>

        {/* Captions toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              🎬 Add Closed Captions (CC)
            </Label>
            <p className="text-xs text-muted-foreground">
              Burn styled subtitles into the video — bold, centred, Reels/TikTok style. Viewers can follow along without sound.
            </p>
          </div>
          <Switch
            checked={captionsEnabled}
            onCheckedChange={setCaptionsEnabled}
          />
        </div>

        {/* Background Music upload */}
        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
          <div className="space-y-0.5 flex-1 min-w-0">
            <Label className="text-sm font-medium flex items-center gap-2">
              🎵 Background Music
            </Label>
            <p className="text-xs text-muted-foreground">
              {musicFileName
                ? <span className="text-primary font-medium truncate block max-w-[220px]">{musicFileName}</span>
                : "Upload an MP3 or WAV to play softly behind your avatar's voice."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {musicUrl && (
              <button
                type="button"
                onClick={() => { setMusicUrl(null); setMusicFileName(null); }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove
              </button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => musicUploadRef.current?.click()}
              disabled={isUploadingMusic}
              className="text-xs"
            >
              {isUploadingMusic ? (
                <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Uploading…</>
              ) : (
                <><Upload className="mr-1 h-3 w-3" />{musicUrl ? "Change" : "Upload"}</>
              )}
            </Button>
          </div>
          <input
            ref={musicUploadRef}
            type="file"
            accept="audio/mp3,audio/mpeg,audio/wav,audio/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 20 * 1024 * 1024) {
                toast.error("Music file must be under 20 MB");
                return;
              }
              setIsUploadingMusic(true);
              try {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const json = await res.json();
                const url = json.url;
                if (!url) throw new Error("Upload failed");
                setMusicUrl(url);
                setMusicFileName(file.name);
                toast.success("Music track uploaded!");
              } catch {
                toast.error("Upload failed — please try again");
              } finally {
                setIsUploadingMusic(false);
                e.target.value = "";
              }
            }}
          />
        </div>

        {/* Voice selector */}
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
                    ? "border-primary bg-primary/10 text-primary dark:text-primary/80 font-medium"
                    : "border-border hover:border-primary/20 text-muted-foreground"
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
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-medium truncate ${
                      voiceId === v.id ? "text-primary dark:text-primary/80" : "text-foreground"
                    }`}>{v.name}</span>
                    <span className="text-xs text-muted-foreground capitalize shrink-0">{v.gender}</span>
                  </div>
                  {v.previewUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleVoicePreview(v); }}
                      className="ml-2 p-1 rounded-full hover:bg-primary/20 transition-colors shrink-0"
                      title="Preview voice"
                    >
                      {playingPreviewId === v.id ? (
                        <Loader2 className="h-3 w-3 text-primary animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 text-muted-foreground hover:text-primary" />
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
          className="w-full bg-muted0 hover:bg-primary text-black font-semibold h-12 text-base"
        >
          {isGenerating ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{generationStep || "Generating…"}</>
          ) : (
            <><Sparkles className="mr-2 h-5 w-5" />Generate Full Avatar Video</>
          )}
        </Button>

        {isGenerating && (
          <div className="text-center text-xs text-muted-foreground">
    Your AI avatar video is being created and synced with your voice. This takes 1–5 minutes depending on script length.
          </div>
        )}
      </Card>

      {/* Result */}
      {resultVideoUrl && (
        <Card className="p-6 space-y-4 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
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
          {showRatingPrompt && (
            <GenerationRatingPrompt
              toolType="full_avatar_video"
              referenceId={ratedVideoId}
              referenceTable="full_avatar_videos"
              onDismiss={() => setShowRatingPrompt(false)}
            />
          )}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => handleDownload(resultVideoUrl, title)}
              className="flex-1 bg-muted0 hover:bg-primary text-black font-semibold"
            >
              <Download className="mr-2 h-4 w-4" />
              Download MP4
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setShowVideoShare(true)}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Post to Social
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

      {/* Video Posting Dialog */}
      {showVideoShare && resultVideoUrl && (
        <VideoPostingDialog
          open={showVideoShare}
          onOpenChange={setShowVideoShare}
          videoUrl={resultVideoUrl}
          videoTitle={title || "Avatar Video"}
          defaultCaption={`🌟 ${title || "Check out my latest video!"} 🏡 #RealEstate #AIAvatar #AmpedAgent`}
        />
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
