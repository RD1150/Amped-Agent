import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Youtube,
  Sparkles,
  Video,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Download,
  ExternalLink,
  ArrowLeft,
  Mic,
  Clock,
} from "lucide-react";

const TOPIC_SUGGESTIONS = [
  "Why now is a great time to buy in [your city]",
  "5 mistakes sellers make that cost them thousands",
  "What buyers need to know about today's market",
  "How I helped a client win in a bidding war",
  "The truth about home values in [your neighborhood]",
  "First-time buyer mistakes to avoid",
  "How to price your home to sell fast",
  "What makes a home sell above asking price",
];

type Step = 1 | 2 | 3;

export default function MakeYouTubeVideo() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [topic, setTopic] = useState("");

  // Step 2 — Script
  const [script, setScript] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // Step 3 — Video
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<number | null>(null);

  const { data: persona } = trpc.persona.get.useQuery(undefined, { retry: false });
  const { data: avatars } = trpc.fullAvatarVideo.getAvatars.useQuery(undefined, { retry: false });
  const { data: voices } = trpc.fullAvatarVideo.getVoices.useQuery(undefined, { retry: false });

  const defaultAvatar = avatars?.[0];
  const defaultVoice = voices?.[0]?.id ?? "1bd001e7e50f421d891986aad5158bc8";

  // Poll video status
  const { data: videoStatus } = trpc.youtubeVideoBuilder.getVideoStatus.useQuery(
    { videoId: videoId! },
    {
      enabled: !!videoId && !videoUrl,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "completed" || status === "failed") return false;
        return 8000;
      },
    }
  );

  useEffect(() => {
    if (videoStatus?.status === "completed" && videoStatus.videoUrl) {
      setVideoUrl(videoStatus.videoUrl);
    }
  }, [videoStatus]);

  // Generate script
  const generateScriptMutation = trpc.youtubeVideoBuilder.generateScript.useMutation({
    onSuccess: (data) => {
      setScript(data.script);
      setStep(2);
      // Fire SEO generation in background
      generateSEOMutation.mutate({ topic, script: data.script });
    },
    onError: (err) => toast.error(err.message || "Failed to generate script"),
  });

  // Generate SEO (background, non-blocking)
  const generateSEOMutation = trpc.youtubeVideoBuilder.generateSEO.useMutation({
    onSuccess: (data) => {
      setSeoTitle(data.title ?? "");
      setSeoDescription(data.description ?? "");
    },
  });

  // Generate avatar video from script
  const generateVideoMutation = trpc.fullAvatarVideo.generate.useMutation({
    onSuccess: (data) => {
      setVideoId(data.videoId);
      setVideoUrl(data.videoUrl ?? null);
      setStep(3);
      if (!data.videoUrl) {
        toast.success("Video is generating — usually takes 2–5 minutes.");
      }
    },
    onError: (err) => toast.error(err.message || "Failed to start video generation"),
  });

  const handleGenerateScript = () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic first");
      return;
    }
    generateScriptMutation.mutate({
      topic: topic.trim(),
      outline: " ", // single space satisfies min(1) — the LLM ignores it gracefully
      agentName: persona?.agentName || "",
      city: persona?.primaryCity || "",
      targetDuration: "8min",
      tone: "professional",
    });
  };

  const handleGenerateVideo = () => {
    if (!script.trim()) return;
    if (!defaultAvatar) {
      toast.error("No avatar available. Please check your HeyGen connection.");
      return;
    }
    generateVideoMutation.mutate({
      script: script.trim(),
      avatarId: defaultAvatar.id,
      avatarPreviewUrl: defaultAvatar.previewImageUrl,
      voiceId: defaultVoice,
      title: seoTitle || topic,
      captionsEnabled: true,
      landscape: false,
    });
  };

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const estMinutes = Math.round(wordCount / 130);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-500" />
            Make a YouTube Video
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enter a topic. We write the script and generate the video with your avatar.
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {(["1. Topic", "2. Script", "3. Video"] as const).map((label, i) => {
          const stepNum = (i + 1) as Step;
          const done = step > stepNum;
          const active = step === stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  done
                    ? "bg-green-100 text-green-700"
                    : active
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                {label}
              </div>
              {i < 2 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: TOPIC ── */}
      {step === 1 && (
        <Card className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold">What is this video about?</label>
            <Textarea
              placeholder="e.g. Why now is a great time to buy in Thousand Oaks"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="resize-none text-base"
              rows={3}
            />
          </div>

          {/* Topic suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Quick ideas — tap to use</p>
            <div className="flex flex-wrap gap-2">
              {TOPIC_SUGGESTIONS.map((s) => {
                const filled = s
                  .replace("[your city]", persona?.primaryCity || "your city")
                  .replace("[your neighborhood]", persona?.primaryCity || "your neighborhood");
                return (
                  <button
                    key={s}
                    onClick={() => setTopic(filled)}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 hover:border-primary hover:text-primary transition-colors text-left"
                  >
                    {filled}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleGenerateScript}
            disabled={!topic.trim() || generateScriptMutation.isPending}
            className="w-full gap-2"
            size="lg"
          >
            {generateScriptMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Writing your script…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Write My Script</>
            )}
          </Button>
        </Card>
      )}

      {/* ── STEP 2: SCRIPT ── */}
      {step === 2 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Your Script</h2>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                ~{estMinutes} min · {wordCount} words
              </p>
            </div>
            <Badge variant="outline" className="text-xs gap-1">
              <Mic className="h-3 w-3" /> Ready to record
            </Badge>
          </div>

          {seoTitle && (
            <div className="bg-slate-50 rounded-lg px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">YouTube Title</p>
              <p className="text-sm font-medium">{seoTitle}</p>
            </div>
          )}

          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="resize-none font-mono text-sm leading-relaxed"
            rows={16}
          />

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Change Topic
            </Button>
            <Button
              onClick={handleGenerateVideo}
              disabled={!script.trim() || generateVideoMutation.isPending || !defaultAvatar}
              className="flex-1 gap-2"
              size="lg"
            >
              {generateVideoMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating video…</>
              ) : !defaultAvatar ? (
                <><Video className="h-4 w-4" /> Loading avatars…</>
              ) : (
                <><Video className="h-4 w-4" /> Generate Video with My Avatar</>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* ── STEP 3: VIDEO ── */}
      {step === 3 && (
        <Card className="p-6 space-y-5">
          {!videoUrl ? (
            <div className="text-center space-y-4 py-8">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-lg">Generating your video…</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your avatar is recording the script. This usually takes 2–5 minutes.
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg px-4 py-3 text-left space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Topic</p>
                <p className="text-sm">{topic}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                You can close this page — the video will appear in My Videos when ready.
              </p>
              <Button variant="outline" onClick={() => setLocation("/my-videos")} className="gap-1.5">
                <Video className="h-4 w-4" /> Go to My Videos
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Your video is ready!
              </div>
              <video
                src={videoUrl}
                controls
                className="w-full rounded-xl border aspect-video bg-black"
              />
              {seoTitle && (
                <div className="bg-slate-50 rounded-lg px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Suggested YouTube Title</p>
                  <p className="text-sm font-medium">{seoTitle}</p>
                </div>
              )}
              {seoDescription && (
                <div className="bg-slate-50 rounded-lg px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Suggested Description</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{seoDescription}</p>
                </div>
              )}
              <div className="flex gap-3">
                <a href={videoUrl} download className="flex-1">
                  <Button className="w-full gap-2">
                    <Download className="h-4 w-4" /> Download Video
                  </Button>
                </a>
                <Button
                  variant="outline"
                  onClick={() => window.open("https://studio.youtube.com/channel/upload", "_blank")}
                  className="gap-1.5"
                >
                  <ExternalLink className="h-4 w-4" /> Upload to YouTube
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep(1);
                  setTopic("");
                  setScript("");
                  setSeoTitle("");
                  setSeoDescription("");
                  setVideoUrl(null);
                  setVideoId(null);
                }}
                className="w-full text-muted-foreground"
              >
                Make another video
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Advanced options link */}
      <p className="text-center text-xs text-muted-foreground">
        Need more control?{" "}
        <button
          onClick={() => setLocation("/youtube-video-builder")}
          className="underline hover:text-foreground transition-colors"
        >
          Open the full YouTube Builder →
        </button>
      </p>
    </div>
  );
}
