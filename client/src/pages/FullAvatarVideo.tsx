import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Video, Sparkles, Download, Upload, User, Trash2,
  CheckCircle2, Clock, AlertCircle, Zap, Crown, RefreshCw, Play
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ─── Voice options (Microsoft Neural, same as existing reels) ──────────────
const VOICE_OPTIONS = [
  { id: "en-US-JennyNeural", label: "Jenny (Female, Warm)" },
  { id: "en-US-GuyNeural", label: "Guy (Male, Confident)" },
  { id: "en-US-AriaNeural", label: "Aria (Female, Expressive)" },
  { id: "en-US-DavisNeural", label: "Davis (Male, Casual)" },
  { id: "en-US-AmberNeural", label: "Amber (Female, Friendly)" },
  { id: "en-US-TonyNeural", label: "Tony (Male, Authoritative)" },
];

/** Estimate read time from word count at 130 wpm */
function estimateReadTime(text: string): { words: number; seconds: number; label: string } {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const seconds = Math.ceil((words / 130) * 60);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const label = mins > 0 ? `~${mins}m ${secs}s` : `~${secs}s`;
  return { words, seconds, label };
}

type AvatarMode = "quick" | "custom";

export default function FullAvatarVideo() {
  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<AvatarMode>("quick");

  // ── Script ────────────────────────────────────────────────────────────────
  const [script, setScript] = useState("");
  const [title, setTitle] = useState("");
  const [voiceId, setVoiceId] = useState("en-US-JennyNeural");

  // ── Quick Avatar (V2) ─────────────────────────────────────────────────────
  const [avatarImagePreview, setAvatarImagePreview] = useState("");
  const [avatarImageUrl, setAvatarImageUrl] = useState(""); // S3 URL
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── tRPC ──────────────────────────────────────────────────────────────────
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: twinStatus, refetch: refetchTwin } = trpc.fullAvatarVideo.getCustomAvatarStatus.useQuery(undefined, {
    refetchInterval: (query) => (query.state.data?.status === "training" ? 8000 : false),
  });
  const { data: pastVideos = [], refetch: refetchVideos } = trpc.fullAvatarVideo.list.useQuery();
  const generateV2Mutation = trpc.fullAvatarVideo.generate.useMutation();
  const generateV3Mutation = trpc.fullAvatarVideo.generateWithCustomAvatar.useMutation();
  const trainMutation = trpc.fullAvatarVideo.trainCustomAvatar.useMutation();
  const deleteMutation = trpc.fullAvatarVideo.delete.useMutation();

  // Pre-fill avatar from saved profile
  useEffect(() => {
    if (currentUser?.avatarImageUrl && !avatarImagePreview) {
      setAvatarImagePreview(currentUser.avatarImageUrl);
      setAvatarImageUrl(currentUser.avatarImageUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const readTime = estimateReadTime(script);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }

    const reader = new FileReader();
    reader.onloadend = () => setAvatarImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setAvatarImageUrl(url);
      toast.success("Headshot uploaded!");
    } catch {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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

    if (mode === "quick" && !avatarImageUrl) {
      toast.error("Please upload your headshot first");
      return;
    }

    if (mode === "custom" && twinStatus?.status !== "ready") {
      toast.error("Your custom avatar is not ready yet. Please train it first.");
      return;
    }

    setIsGenerating(true);
    setResultVideoUrl("");
    setGenerationStep("Submitting script to D-ID…");

    try {
      let result: { videoUrl: string; duration: number };

      if (mode === "quick") {
        setGenerationStep("Animating your headshot and generating speech…");
        result = await generateV2Mutation.mutateAsync({
          script: script.trim(),
          avatarUrl: avatarImageUrl,
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

  // ── Render ─────────────────────────────────────────────────────────────────
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

      {/* Quick Avatar: headshot upload */}
      {mode === "quick" && (
        <Card className="p-6 space-y-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4 text-amber-500" />
            Your Headshot
          </Label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="relative h-20 w-20 rounded-full border-2 border-dashed border-amber-500/40 hover:border-amber-500 cursor-pointer transition-colors overflow-hidden flex-shrink-0 bg-muted/30 flex items-center justify-center"
            >
              {avatarImagePreview ? (
                <img src={avatarImagePreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {avatarImagePreview ? "Headshot saved — click to change" : "Click to upload your headshot"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Square crop, face centered, well-lit. JPG/PNG under 10MB.</p>
              {avatarImageUrl && <p className="text-xs text-green-600 mt-1">✓ Ready for generation</p>}
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
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
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Training Video Requirements:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• <strong>Duration:</strong> 1–3 minutes (2 min ideal)</li>
                  <li>• <strong>Content:</strong> Look directly at camera, speak naturally, vary expressions</li>
                  <li>• <strong>Lighting:</strong> Even, well-lit face — no harsh shadows</li>
                  <li>• <strong>Format:</strong> MP4 or MOV, under 200MB</li>
                </ul>
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

        {/* Voice selector */}
        <div className="space-y-1.5">
          <Label className="text-sm">Voice</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVoiceId(v.id)}
                className={`text-xs px-3 py-2 rounded-lg border transition-all text-left ${
                  voiceId === v.id
                    ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                    : "border-border hover:border-amber-500/40 text-muted-foreground"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            !script.trim() ||
            (mode === "quick" && (!avatarImageUrl || isUploadingAvatar)) ||
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
            D-ID is animating your avatar and syncing speech. This takes 1–5 minutes depending on script length.
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
