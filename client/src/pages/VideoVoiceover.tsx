import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  Wand2,
  Mic,
  FileVideo,
  Download,
  RefreshCw,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Captions,
  Pencil,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = "upload" | "script" | "render" | "done";
type CaptionStyle = "white" | "yellow" | "gold" | "none";
type CaptionSize = "normal" | "large";

export default function VideoVoiceover() {
  const [step, setStep] = useState<Step>("upload");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [script, setScript] = useState<string>("");
  const [scriptMode, setScriptMode] = useState<"auto" | "manual">("auto");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("white");
  const [captionSize, setCaptionSize] = useState<CaptionSize>("normal");
  const [outputUrl, setOutputUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutations
  const generateScript = trpc.videoVoiceover.generateScript.useMutation();
  const renderVoiceover = trpc.videoVoiceover.renderVoiceover.useMutation();

  // ── Step 1: Upload video ──────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file (MP4, MOV, etc.)");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video must be under 500 MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setVideoUrl(data.url);
      toast.success("Video uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinueFromUpload = async () => {
    if (!videoUrl) {
      toast.error("Please upload a video first");
      return;
    }
    if (scriptMode === "manual") {
      setStep("script");
      return;
    }
    // Auto mode: generate script from frames
    try {
      const result = await generateScript.mutateAsync({ videoUrl });
      setScript(result.script);
      setVideoDuration(result.duration);
      setStep("script");
    } catch (err: any) {
      toast.error(err.message || "Could not analyze video — try manual script mode");
    }
  };

  // ── Step 2: Review / edit script ─────────────────────────────────────────
  const handleRender = async () => {
    if (!script.trim()) {
      toast.error("Please enter a voiceover script");
      return;
    }
    try {
      const result = await renderVoiceover.mutateAsync({
        videoUrl,
        script,
        captionStyle,
        captionSize,
      });
      setOutputUrl(result.videoUrl);
      setStep("done");
    } catch (err: any) {
      toast.error(err.message || "Render failed — please try again");
    }
  };

  // ── Step 3: Done ──────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep("upload");
    setVideoUrl("");
    setScript("");
    setOutputUrl("");
    setVideoDuration(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mic className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Video Voiceover</h1>
          <Badge variant="outline" className="text-xs">Beta</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload a silent video and get a professional voiceover in your cloned voice — with burned-in captions.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 text-xs font-medium">
        {(["upload", "script", "render", "done"] as Step[]).map((s, i) => {
          const labels = ["Upload", "Script", "Render", "Done"];
          const active = step === s;
          const done = ["upload", "script", "render", "done"].indexOf(step) > i;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  done
                    ? "bg-primary text-white border-primary"
                    : active
                    ? "bg-primary/10 text-primary border-primary"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={active ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground"}>
                {labels[i]}
              </span>
              {i < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* ── Step: Upload ─────────────────────────────────────────────────────── */}
      {step === "upload" && (
        <Card className="p-6 space-y-5">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              videoUrl ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading…</p>
              </div>
            ) : videoUrl ? (
              <div className="flex flex-col items-center gap-2">
                <FileVideo className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium text-primary">Video uploaded</p>
                <p className="text-xs text-muted-foreground">Click to replace</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload your video</p>
                <p className="text-xs text-muted-foreground">MP4, MOV, or WebM · Max 500 MB</p>
              </div>
            )}
          </div>

          {/* Script mode toggle */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Voiceover script</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setScriptMode("auto")}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                  scriptMode === "auto"
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Wand2 className="h-4 w-4" />
                AI writes it for me
              </button>
              <button
                onClick={() => setScriptMode("manual")}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                  scriptMode === "manual"
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Pencil className="h-4 w-4" />
                I'll paste my script
              </button>
            </div>
            {scriptMode === "auto" && (
              <p className="text-xs text-muted-foreground">
                The AI will analyze your video frame by frame and write a matching voiceover script. You can edit it before generating.
              </p>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleContinueFromUpload}
            disabled={!videoUrl || isUploading || generateScript.isPending}
          >
            {generateScript.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing video…
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </Card>
      )}

      {/* ── Step: Script ─────────────────────────────────────────────────────── */}
      {step === "script" && (
        <Card className="p-6 space-y-5">
          <div>
            <p className="text-sm font-medium mb-1">
              {scriptMode === "auto" ? "AI-generated script — review and edit" : "Paste your voiceover script"}
            </p>
            {videoDuration > 0 && (
              <p className="text-xs text-muted-foreground">
                Video is ~{videoDuration}s — aim for ~{Math.round((videoDuration * 140) / 60)} words for a natural pace.
              </p>
            )}
          </div>

          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Type or paste your voiceover script here…"
            className="min-h-[180px] text-sm resize-none"
          />

          {/* Caption options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Captions className="h-3.5 w-3.5" />
                Caption style
              </label>
              <Select value={captionStyle} onValueChange={(v) => setCaptionStyle(v as CaptionStyle)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="none">No captions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Caption size</label>
              <Select value={captionSize} onValueChange={(v) => setCaptionSize(v as CaptionSize)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleRender}
              disabled={!script.trim() || renderVoiceover.isPending}
            >
              {renderVoiceover.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating voiceover…
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-1.5" />
                  Generate Voiceover
                </>
              )}
            </Button>
          </div>

          {renderVoiceover.isPending && (
            <p className="text-xs text-center text-muted-foreground">
              This takes 30–90 seconds depending on video length…
            </p>
          )}
        </Card>
      )}

      {/* ── Step: Done ───────────────────────────────────────────────────────── */}
      {step === "done" && outputUrl && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="font-semibold">Your voiceover video is ready!</p>
          </div>

          <video
            src={outputUrl}
            controls
            className="w-full rounded-lg border bg-black"
            style={{ maxHeight: "360px" }}
          />

          <div className="flex gap-2">
            <a href={outputUrl} download className="flex-1">
              <Button className="w-full gap-2">
                <Download className="h-4 w-4" />
                Download Video
              </Button>
            </a>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              New Video
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
