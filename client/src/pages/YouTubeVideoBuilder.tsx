import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Youtube,
  Sparkles,
  Loader2,
  Play,
  Download,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Video,
  FileText,
  Tag,
  Clock,
  Scissors,
  Upload,
  RefreshCw,
  Info,
  CheckCircle2,
} from "lucide-react";

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Topic" },
  { id: 2, label: "Script" },
  { id: 3, label: "SEO" },
  { id: 4, label: "Video" },
  { id: 5, label: "Distribute" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
              step.id < current
                ? "bg-primary text-primary-foreground"
                : step.id === current
                ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step.id < current ? <CheckCircle2 className="h-4 w-4" /> : step.id}
          </div>
          <span
            className={`text-xs hidden sm:block ${
              step.id === current ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function YouTubeVideoBuilder() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [step, setStep] = useState(1);

  // Step 1 — Topic
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [outline, setOutline] = useState("");
  const [targetDuration, setTargetDuration] = useState<"5min" | "8min" | "12min" | "15min">("8min");
  const [tone, setTone] = useState<"professional" | "conversational" | "authoritative" | "warm">("professional");
  const [agentName, setAgentName] = useState(user?.name || "");
  const [city, setCity] = useState("");

  // Step 2 — Script
  const [script, setScript] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);

  // Step 3 — SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoTags, setSeoTags] = useState<string[]>([]);
  const [seoChapters, setSeoChapters] = useState<{ time: string; title: string }[]>([]);

  // Step 4 — Video
  const [videoId, setVideoId] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState<"public" | "private" | "unlisted">("public");
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState<string | null>(null);

  // Step 5 — Clips
  const [clips, setClips] = useState<{
    title: string;
    hook: string;
    scriptExcerpt: string;
    estimatedSeconds: number;
    suggestedCaption: string;
  }[]>([]);

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: templates = [] } = trpc.youtubeVideoBuilder.getTopicTemplates.useQuery();
  const { data: twinStatus } = trpc.fullAvatarVideo.getCustomAvatarStatus.useQuery(undefined, {
    retry: false,
  });
  const { data: heygenVoices = [] } = trpc.fullAvatarVideo.getVoices.useQuery();
  const { data: youtubeConnection } = trpc.youtube.getConnection.useQuery();

  useEffect(() => {
    if (heygenVoices.length > 0 && !voiceId) {
      setVoiceId(heygenVoices[0].id);
    }
  }, [heygenVoices, voiceId]);

  const { data: videoStatus } = trpc.youtubeVideoBuilder.getVideoStatus.useQuery(
    { videoId: videoId! },
    {
      enabled: !!videoId && !videoUrl,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (data?.status === "completed" || data?.status === "failed") return false;
        return 8000;
      },
    }
  );

  useEffect(() => {
    if (videoStatus?.status === "completed" && videoStatus.videoUrl) {
      setVideoUrl(videoStatus.videoUrl);
      toast.success("Your YouTube video is ready!");
    } else if (videoStatus?.status === "failed") {
      toast.error("Video generation failed. Please try again.");
    }
  }, [videoStatus]);

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const generateScriptMutation = trpc.youtubeVideoBuilder.generateScript.useMutation({
    onSuccess: (data) => {
      setScript(data.script);
      setWordCount(data.wordCount);
      setEstimatedMinutes(data.estimatedMinutes);
      setStep(2);
      toast.success(`Script generated — ~${data.estimatedMinutes} min (${data.wordCount} words)`);
    },
    onError: (err) => toast.error(err.message),
  });

  const generateSEOMutation = trpc.youtubeVideoBuilder.generateSEO.useMutation({
    onSuccess: (data) => {
      setSeoTitle(data.title);
      setSeoDescription(data.description);
      setSeoTags(data.tags);
      setSeoChapters(data.chapters);
      setStep(3);
      toast.success("SEO metadata generated");
    },
    onError: (err) => toast.error(err.message),
  });

  const generateVideoMutation = trpc.youtubeVideoBuilder.generateVideo.useMutation({
    onSuccess: (data) => {
      setVideoId(data.videoId);
      setStep(4);
      toast.success("Video generation started — this takes 5–20 minutes for long-form content");
      utils.rateLimit.getDailyUsage.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateClipsMutation = trpc.youtubeVideoBuilder.generateClipTimestamps.useMutation({
    onSuccess: (data) => {
      setClips(data.clips);
      toast.success(`${data.clips.length} clip moments identified`);
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadToYoutubeMutation = trpc.youtube.uploadVideo.useMutation({
    onSuccess: (data) => {
      setYoutubeVideoUrl(data.videoUrl);
      toast.success("Published to YouTube!");
    },
    onError: (err) => toast.error(err.message),
  });

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleTemplateSelect = (key: string) => {
    setSelectedTemplate(key);
    const t = templates.find((t) => t.key === key);
    if (t) {
      setCustomTopic(t.title);
      setOutline(t.outline);
    }
  };

  const handleGenerateScript = () => {
    const topic = customTopic.trim();
    if (!topic) return toast.error("Please enter a topic");
    if (!outline.trim()) return toast.error("Please add an outline");
    generateScriptMutation.mutate({ topic, outline, agentName, city, targetDuration, tone });
  };

  const handleGenerateSEO = () => {
    generateSEOMutation.mutate({ topic: customTopic, script, city, agentName });
  };

  const handleGenerateVideo = () => {
    if (!twinStatus || twinStatus.status !== "ready") {
      toast.error("Please train your digital twin in Full Avatar Video first");
      navigate("/full-avatar-video");
      return;
    }
    generateVideoMutation.mutate({ script, voiceId, title: seoTitle || customTopic });
  };

  const handlePublishToYoutube = () => {
    if (!videoUrl) return toast.error("Video not ready yet");
    uploadToYoutubeMutation.mutate({
      videoUrl,
      title: seoTitle || customTopic,
      description: seoDescription,
      tags: seoTags,
      privacyStatus,
    });
  };

  const handleSendClipToReels = (clip: typeof clips[0]) => {
    const encoded = encodeURIComponent(clip.scriptExcerpt);
    navigate(`/auto-reels?script=${encoded}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <Youtube className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">YouTube Video Builder</h1>
            <p className="text-sm text-muted-foreground">
              Long-form avatar videos for YouTube — up to 15 minutes, ready to redistribute as Reels
            </p>
          </div>
          <Badge className="ml-auto bg-red-500/10 text-red-500 border-red-500/20 text-xs">New</Badge>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm text-muted-foreground">
          <Info className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <span>
            Requires your trained digital twin. Each video costs <strong>20 credits</strong> and takes 5–20 minutes to generate depending on length.
          </span>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 1: Topic & Outline ─────────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose a Topic</CardTitle>
            <CardDescription>Select a template or write your own topic and outline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="text-sm font-medium mb-2 block">Quick Templates</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleTemplateSelect(t.key)}
                    className={`text-left p-3 rounded-lg border text-sm transition-all ${
                      selectedTemplate === t.key
                        ? "border-red-500 bg-red-500/10 text-foreground"
                        : "border-border bg-card hover:border-red-500/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="font-medium text-xs leading-tight">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.duration}</div>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <Label htmlFor="topic">Topic / Title</Label>
                <Input
                  id="topic"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Why Now is the Best Time to Buy in Austin"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="outline">Video Outline</Label>
                <Textarea
                  id="outline"
                  value={outline}
                  onChange={(e) => setOutline(e.target.value)}
                  placeholder={"1. Hook: ...\n2. Main point...\n3. CTA: ..."}
                  className="mt-1 font-mono text-sm min-h-[140px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="agentName">Your Name</Label>
                  <Input
                    id="agentName"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Jane Smith"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City / Market</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Austin, TX"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Target Duration</Label>
                  <Select value={targetDuration} onValueChange={(v) => setTargetDuration(v as typeof targetDuration)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5min">~5 minutes (750 words)</SelectItem>
                      <SelectItem value="8min">~8 minutes (1,200 words)</SelectItem>
                      <SelectItem value="12min">~12 minutes (1,800 words)</SelectItem>
                      <SelectItem value="15min">~15 minutes (2,250 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="warm">Warm &amp; Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerateScript}
              disabled={generateScriptMutation.isPending || !customTopic.trim() || !outline.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {generateScriptMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating Script...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Script</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Script Editor ───────────────────────────────────────────── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-500" /> Script Editor
                </CardTitle>
                <CardDescription>
                  {wordCount.toLocaleString()} words · ~{estimatedMinutes} min · Review and edit before generating
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <CopyBtn text={script} />
                <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">← Back</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <strong>[B-ROLL: ...]</strong> and <strong>[PAUSE]</strong> markers are for your reference only.
                Remove them before generating if you don't want them read aloud by the avatar.
              </span>
            </div>
            <Textarea
              value={script}
              onChange={(e) => {
                setScript(e.target.value);
                const wc = e.target.value.split(/\s+/).filter(Boolean).length;
                setWordCount(wc);
                setEstimatedMinutes(Math.round(wc / 150));
              }}
              className="font-mono text-sm min-h-[500px] leading-relaxed"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateSEO}
                disabled={generateSEOMutation.isPending || !script.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                {generateSEOMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating SEO...</>
                ) : (
                  <><Tag className="h-4 w-4" /> Generate SEO Metadata</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setStep(3)} disabled={!script.trim()} className="gap-2">
                Skip SEO <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: SEO Metadata ────────────────────────────────────────────── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-red-500" /> YouTube SEO
                </CardTitle>
                <CardDescription>Review and edit your title, description, tags, and chapters</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="text-xs">← Back</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Title</Label>
                <span className={`text-xs ${seoTitle.length > 60 ? "text-destructive" : "text-muted-foreground"}`}>
                  {seoTitle.length}/60
                </span>
              </div>
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Description</Label>
                <CopyBtn text={seoDescription} />
              </div>
              <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="min-h-[160px] text-sm" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Tags ({seoTags.length})</Label>
                <CopyBtn text={seoTags.join(", ")} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {seoTags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/20" onClick={() => setSeoTags(seoTags.filter((_, j) => j !== i))}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
            {seoChapters.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Chapter Timestamps</Label>
                  <CopyBtn text={seoChapters.map((c) => `${c.time} ${c.title}`).join("\n")} />
                </div>
                <div className="space-y-1 text-sm font-mono">
                  {seoChapters.map((c, i) => (
                    <div key={i} className="flex gap-3 text-muted-foreground">
                      <span className="w-12 text-right">{c.time}</span>
                      <span>{c.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!seoTitle && (
              <Button onClick={handleGenerateSEO} disabled={generateSEOMutation.isPending} variant="outline" className="w-full gap-2">
                {generateSEOMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate SEO Metadata</>}
              </Button>
            )}
            <Button onClick={() => setStep(4)} className="w-full bg-red-600 hover:bg-red-700 text-white gap-2">
              <Video className="h-4 w-4" /> Continue to Video Generation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Video Generation ────────────────────────────────────────── */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-500" /> Generate Avatar Video
                </CardTitle>
                <CardDescription>Your avatar delivers the full script in 16:9 landscape format</CardDescription>
              </div>
              {!videoId && <Button variant="outline" size="sm" onClick={() => setStep(3)} className="text-xs">← Back</Button>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {twinStatus?.status !== "ready" ? (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400 mb-2">Digital twin not ready</p>
                <p className="text-muted-foreground mb-3">Train your digital twin in Full Avatar Video first.</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/full-avatar-video")}>Go to Full Avatar Video →</Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-green-700 dark:text-green-400">Digital twin ready</span>
              </div>
            )}

            {heygenVoices.length > 0 && (
              <div>
                <Label>Voice</Label>
                <Select value={voiceId} onValueChange={setVoiceId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select a voice..." /></SelectTrigger>
                  <SelectContent>
                    {heygenVoices.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name} ({v.gender})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Script length</span><span>{wordCount.toLocaleString()} words · ~{estimatedMinutes} min</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Format</span><span>16:9 Landscape (YouTube)</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Cost</span><span>20 credits</span>
              </div>
            </div>

            {videoId && !videoUrl && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                <div>
                  <p className="font-medium">Generating your YouTube video...</p>
                  <p className="text-sm text-muted-foreground mt-1">This takes 5–20 minutes. You can leave this page and come back.</p>
                </div>
                <Badge variant="outline" className="text-xs">Status: {videoStatus?.status ?? "processing"}</Badge>
              </div>
            )}

            {videoUrl && (
              <div className="space-y-3">
                <video src={videoUrl} controls className="w-full rounded-lg border border-border aspect-video" />
                <div className="flex gap-2">
                  <a href={videoUrl} download className="flex-1">
                    <Button variant="outline" className="w-full gap-2"><Download className="h-4 w-4" /> Download MP4</Button>
                  </a>
                  <Button onClick={() => setStep(5)} className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2">
                    <Scissors className="h-4 w-4" /> Distribute &amp; Clip
                  </Button>
                </div>
              </div>
            )}

            {!videoId && (
              <Button
                onClick={handleGenerateVideo}
                disabled={generateVideoMutation.isPending || !twinStatus || twinStatus.status !== "ready"}
                className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                {generateVideoMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Starting Generation...</>
                ) : (
                  <><Play className="h-4 w-4" /> Generate Video (20 credits)</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 5: Distribute ──────────────────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-4">
          {/* Publish to YouTube */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-500" /> Publish to YouTube
              </CardTitle>
              <CardDescription>Upload directly to your connected YouTube channel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!youtubeConnection?.connected ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Connect your YouTube channel to publish directly from here.</p>
                  <Button variant="outline" onClick={() => navigate("/integrations")} className="gap-2">
                    <ExternalLink className="h-4 w-4" /> Connect YouTube in Integrations
                  </Button>
                </div>
              ) : youtubeVideoUrl ? (
                <a href={youtubeVideoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-md bg-green-600/10 border border-green-500/30 text-green-600 dark:text-green-400 font-medium hover:bg-green-600/20 transition-colors">
                  <ExternalLink className="h-4 w-4" /> View on YouTube
                </a>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label>Privacy</Label>
                    <Select value={privacyStatus} onValueChange={(v) => setPrivacyStatus(v as typeof privacyStatus)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="unlisted">Unlisted</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handlePublishToYoutube}
                    disabled={uploadToYoutubeMutation.isPending || !videoUrl}
                    className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    {uploadToYoutubeMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Uploading to YouTube...</>
                    ) : (
                      <><Upload className="h-4 w-4" /> Publish to YouTube</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clip extraction */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scissors className="h-5 w-5 text-red-500" /> Extract Reels &amp; Shorts
              </CardTitle>
              <CardDescription>AI identifies the best 30–60 second moments for social redistribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {clips.length === 0 ? (
                <Button
                  onClick={() => generateClipsMutation.mutate({ script, estimatedMinutes })}
                  disabled={generateClipsMutation.isPending}
                  variant="outline"
                  className="w-full gap-2"
                >
                  {generateClipsMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Identifying clips...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Identify Clip Moments</>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  {clips.map((clip, i) => (
                    <div key={i} className="p-4 rounded-lg border border-border bg-card space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{clip.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">~{clip.estimatedSeconds}s</p>
                        </div>
                        <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs" onClick={() => handleSendClipToReels(clip)}>
                          <Play className="h-3 w-3" /> Make Reel
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground italic">"{clip.hook}"</p>
                      <div className="p-2 rounded bg-muted/50 text-xs font-mono text-muted-foreground leading-relaxed">
                        {clip.scriptExcerpt}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate mr-2">{clip.suggestedCaption.substring(0, 60)}...</p>
                        <CopyBtn text={clip.suggestedCaption} />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => generateClipsMutation.mutate({ script, estimatedMinutes })}
                    disabled={generateClipsMutation.isPending}
                    className="w-full gap-2 text-xs"
                  >
                    <RefreshCw className="h-3 w-3" /> Regenerate Clips
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
