import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
import {
  Youtube,
  Sparkles,
  FileText,
  Video,
  Scissors,
  Download,
  Copy,
  ChevronRight,
  ChevronLeft,
  Clock,
  Mic,
  Tag,
  Share2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Topic options ─────────────────────────────────────────────────────────────
const YOUTUBE_TOPICS = [
  { id: "market_update", label: "Monthly Market Update", emoji: "📊", description: "Local stats, trends, and what it means for buyers/sellers" },
  { id: "buyer_guide", label: "Buyer's Guide", emoji: "🏠", description: "Step-by-step guide for first-time or repeat buyers" },
  { id: "seller_guide", label: "Seller's Guide", emoji: "💰", description: "How to prep, price, and sell for top dollar" },
  { id: "neighborhood_spotlight", label: "Neighborhood Spotlight", emoji: "📍", description: "Deep dive into a specific city or neighborhood" },
  { id: "investment_tips", label: "Investment Tips", emoji: "📈", description: "Real estate investing strategies for your market" },
  { id: "mortgage_explainer", label: "Mortgage Explainer", emoji: "🏦", description: "Rates, types, and how to qualify — explained simply" },
  { id: "faq", label: "Real Estate FAQ", emoji: "❓", description: "Answer the top 10 questions clients always ask" },
  { id: "year_in_review", label: "Year in Review", emoji: "🗓️", description: "Annual market recap and what to expect next year" },
  { id: "custom", label: "Custom Topic", emoji: "✏️", description: "Write your own topic and key points" },
];

const DURATION_OPTIONS = [
  { id: "5min", label: "5 min", words: "~700 words", credits: 20 },
  { id: "8min", label: "8 min", words: "~1,100 words", credits: 30 },
  { id: "10min", label: "10 min", words: "~1,400 words", credits: 40 },
  { id: "15min", label: "15 min", words: "~2,100 words", credits: 55 },
];

const TONE_OPTIONS = [
  { id: "conversational", label: "Conversational", desc: "Warm & approachable" },
  { id: "professional", label: "Professional", desc: "Polished & authoritative" },
  { id: "educational", label: "Educational", desc: "Informative & clear" },
  { id: "energetic", label: "Energetic", desc: "High-energy & motivating" },
];

// ─── Step indicator ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Topic", icon: FileText },
  { id: 2, label: "Script", icon: Sparkles },
  { id: 3, label: "SEO", icon: Tag },
  { id: 4, label: "Generate", icon: Video },
  { id: 5, label: "Redistribute", icon: Share2 },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                done && "bg-green-100 text-green-700",
                active && "bg-navy-900 text-white bg-[#0a1628]",
                !done && !active && "bg-muted text-muted-foreground"
              )}
            >
              {done ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Word count badge ──────────────────────────────────────────────────────────
function WordCountBadge({ script }: { script: string }) {
  const words = script.trim() ? script.trim().split(/\s+/).length : 0;
  const mins = Math.round((words / 140) * 60 / 60);
  const secs = Math.round((words / 140) * 60 % 60);
  const label = mins > 0 ? `~${mins}m ${secs}s` : `~${secs}s`;
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>{words.toLocaleString()} words</span>
      <span>·</span>
      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{label} on camera</span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function YouTubeVideoBuilder() {
  const { user } = useAuth();
  const isPremium = user?.subscriptionTier === "premium" || user?.subscriptionTier === "pro";

  // ── Step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Step 1: Topic setup ───────────────────────────────────────────────────
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [city, setCity] = useState("");
  const [agentName, setAgentName] = useState(user?.name || "");
  const [keyPoints, setKeyPoints] = useState("");
  const [targetDuration, setTargetDuration] = useState("8min");
  const [tone, setTone] = useState("conversational");

  // ── Step 2: Script ────────────────────────────────────────────────────────
  const [script, setScript] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // ── Step 3: SEO ───────────────────────────────────────────────────────────
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoTags, setSeoTags] = useState<string[]>([]);
  const [chapters, setChapters] = useState<Array<{ time: string; title: string }>>([]);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);

  // ── Step 4: Video generation ──────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [resultVideoUrl, setResultVideoUrl] = useState("");
  const [resultDuration, setResultDuration] = useState(0);

  // ── Step 5: Clips ─────────────────────────────────────────────────────────
  const [clips, setClips] = useState<Array<{ openingSentence: string; title: string; reason: string; positionPercent: number }>>([]);
  const [isGeneratingClips, setIsGeneratingClips] = useState(false);

  // ── tRPC mutations ────────────────────────────────────────────────────────
  const generateScriptMutation = trpc.youtubeVideoBuilder.generateScript.useMutation();
  const generateSEOMutation = trpc.youtubeVideoBuilder.generateSEO.useMutation();
  const generateClipsMutation = trpc.youtubeVideoBuilder.generateClipTimestamps.useMutation();
  const generateVideoMutation = trpc.youtubeVideoBuilder.generateVideo.useMutation();
  const { data: twinStatus } = trpc.fullAvatarVideo.getCustomAvatarStatus.useQuery();

  const topicLabel = selectedTopic === "custom"
    ? customTopic
    : YOUTUBE_TOPICS.find(t => t.id === selectedTopic)?.label || "";

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleGenerateScript() {
    if (!selectedTopic) {
      toast.error("Select a topic first");
      return;
    }
    const topic = selectedTopic === "custom" ? customTopic : topicLabel;
    if (!topic) {
      toast.error("Enter your custom topic");
      return;
    }
    setIsGeneratingScript(true);
    try {
      const result = await generateScriptMutation.mutateAsync({
        topic,
        city: city || undefined,
        keyPoints: keyPoints || undefined,
        agentName: agentName || undefined,
        targetDuration: targetDuration as "5min" | "8min" | "10min" | "15min",
        tone: tone as "professional" | "conversational" | "educational" | "energetic",
      });
      setScript(result.script);
      setStep(2);
      toast.success(`Script generated! ${result.wordCount.toLocaleString()} words · ${result.estimatedLabel}`);
    } catch (err: any) {
      toast.error(`Script generation failed: ${err.message}`);
    } finally {
      setIsGeneratingScript(false);
    }
  }

  async function handleGenerateSEO() {
    if (!script) return;
    setIsGeneratingSEO(true);
    try {
      const result = await generateSEOMutation.mutateAsync({
        script,
        city: city || undefined,
        topic: topicLabel,
      });
      setSeoTitle(result.title);
      setSeoDescription(result.description);
      setSeoTags(result.tags);
      setChapters(result.chapters);
      setStep(3);
      toast.success("SEO metadata generated!");
    } catch (err: any) {
      toast.error(`SEO generation failed: ${err.message}`);
    } finally {
      setIsGeneratingSEO(false);
    }
  }

  async function handleGenerateVideo() {
    if (!script) return;
    if (!twinStatus || twinStatus?.status !== "ready") {
      toast.error("Custom avatar required. Please train your digital twin in the Full Avatar Video section first.");
      return;
    }
    setIsGenerating(true);
    setGenerationStep("Submitting to HeyGen...");
    try {
      setGenerationStep("Generating your avatar video (this takes 5–20 min for long-form)...");
      const result = await generateVideoMutation.mutateAsync({
        script,
        title: seoTitle || topicLabel,
      });
      setResultVideoUrl(result.videoUrl || "");
      setResultDuration(result.duration || 0);
      setStep(4);
      toast.success("Video ready! Your YouTube video has been generated.");
    } catch (err: any) {
      toast.error(`Video generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  }

  async function handleGenerateClips() {
    if (!script) return;
    setIsGeneratingClips(true);
    try {
      const words = script.trim().split(/\s+/).length;
      const estimatedSeconds = Math.round((words / 140) * 60);
      const result = await generateClipsMutation.mutateAsync({ script, estimatedSeconds });
      setClips(result);
      setStep(5);
      toast.success(`${result.length} clip ideas identified! Review and extract your Reels/Shorts below.`);
    } catch (err: any) {
      toast.error(`Clip analysis failed: ${err.message}`);
    } finally {
      setIsGeneratingClips(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-50 rounded-lg">
            <Youtube className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">YouTube Video Builder</h1>
            <p className="text-sm text-muted-foreground">
              AI writes your script → your avatar delivers it → redistribute as Reels & Shorts
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto bg-red-50 text-red-700 border-red-200">
            Premium
          </Badge>
        </div>

        {!isPremium && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Premium feature</p>
              <p className="text-xs text-amber-700 mt-0.5">
                YouTube Video Builder requires a Premium or Pro plan. Upgrade to unlock long-form avatar videos.
              </p>
            </div>
          </div>
        )}

          {isPremium && (!twinStatus || twinStatus?.status !== "ready") && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Custom avatar required</p>
              <p className="text-xs text-blue-700 mt-0.5">
                You'll need to train your digital twin before generating the video. You can still write your script and SEO metadata now.
                <a href="/full-avatar-video" className="underline ml-1 font-medium">Train your avatar →</a>
              </p>
            </div>
          </div>
        )}
      </div>

      <StepIndicator current={step} />

      {/* ─── Step 1: Topic Setup ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Choose Your Topic
              </CardTitle>
              <CardDescription>What do you want to teach your audience today?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {YOUTUBE_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={cn(
                      "text-left p-3 rounded-lg border-2 transition-all hover:border-[#0a1628] hover:bg-slate-50",
                      selectedTopic === topic.id
                        ? "border-[#0a1628] bg-slate-50"
                        : "border-border"
                    )}
                  >
                    <div className="text-xl mb-1">{topic.emoji}</div>
                    <div className="text-sm font-medium">{topic.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{topic.description}</div>
                  </button>
                ))}
              </div>

              {selectedTopic === "custom" && (
                <div className="mt-4">
                  <Label htmlFor="customTopic">Your Topic</Label>
                  <Input
                    id="customTopic"
                    placeholder="e.g. Why now is the best time to buy in Austin"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Video Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Your City / Market</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Austin, TX"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="agentName">Your Name</Label>
                  <Input
                    id="agentName"
                    placeholder="e.g. Sarah Johnson"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="keyPoints">Key Points to Cover <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="keyPoints"
                  placeholder="e.g. Inventory is down 15%, prices holding steady, interest rates at 6.8%, best neighborhoods for first-time buyers..."
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  rows={3}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="mb-2 block">Target Duration</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setTargetDuration(d.id)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all",
                        targetDuration === d.id
                          ? "border-[#0a1628] bg-slate-50"
                          : "border-border hover:border-[#0a1628]"
                      )}
                    >
                      <div className="text-sm font-semibold">{d.label}</div>
                      <div className="text-xs text-muted-foreground">{d.words}</div>
                      <div className="text-xs text-amber-600 mt-0.5">{d.credits} credits</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Tone</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={cn(
                        "p-2.5 rounded-lg border-2 text-center transition-all",
                        tone === t.id
                          ? "border-[#0a1628] bg-slate-50"
                          : "border-border hover:border-[#0a1628]"
                      )}
                    >
                      <div className="text-xs font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleGenerateScript}
              disabled={!selectedTopic || isGeneratingScript || !isPremium}
              className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2"
              size="lg"
            >
              {isGeneratingScript ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Writing script...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Generate Script</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Script Editor ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Your Script — {topicLabel}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Review and edit before generating your video. Every word will be spoken by your avatar.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(script, "Script")}
                  className="gap-1.5 flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={20}
                className="font-mono text-sm leading-relaxed resize-none"
                placeholder="Your script will appear here..."
              />
              <div className="mt-2 flex items-center justify-between">
                <WordCountBadge script={script} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateScript}
                  disabled={isGeneratingScript}
                  className="text-xs gap-1.5"
                >
                  {isGeneratingScript ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleGenerateSEO}
              disabled={!script || isGeneratingSEO}
              className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2"
              size="lg"
            >
              {isGeneratingSEO ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generating SEO...</>
              ) : (
                <><Tag className="w-4 h-4" />Generate SEO Metadata</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 3: SEO Metadata ────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  YouTube SEO Metadata
                </CardTitle>
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ready to copy
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Video Title</Label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(seoTitle, "Title")} className="h-7 text-xs gap-1">
                    <Copy className="w-3 h-3" />Copy
                  </Button>
                </div>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="font-medium" />
                <p className="text-xs text-muted-foreground mt-1">{seoTitle.length}/70 characters</p>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Description</Label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(seoDescription, "Description")} className="h-7 text-xs gap-1">
                    <Copy className="w-3 h-3" />Copy
                  </Button>
                </div>
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={8}
                  className="text-sm"
                />
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Tags</Label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(seoTags.join(", "), "Tags")} className="h-7 text-xs gap-1">
                    <Copy className="w-3 h-3" />Copy
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {seoTags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Chapters */}
              {chapters.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Chapter Markers</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(chapters.map(c => `${c.time} ${c.title}`).join("\n"), "Chapters")}
                      className="h-7 text-xs gap-1"
                    >
                      <Copy className="w-3 h-3" />Copy
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {chapters.map((ch, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground w-12 text-center">{ch.time}</span>
                        <span>{ch.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
              <ChevronLeft className="w-4 h-4" />
              Back to Script
            </Button>
            <Button
              onClick={() => setStep(4)}
              className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2"
              size="lg"
            >
              <Video className="w-4 h-4" />
              Continue to Video
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Generate Video ──────────────────────────────────────────── */}
      {step === 4 && !resultVideoUrl && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="w-4 h-4" />
                Generate Your YouTube Video
              </CardTitle>
              <CardDescription>
                Your avatar will deliver the full script in landscape (16:9) format, ready for YouTube upload.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Topic</span>
                  <span className="font-medium">{topicLabel}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Script length</span>
                  <WordCountBadge script={script} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">16:9 Landscape (YouTube)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avatar</span>
                  <span className={cn("font-medium", twinStatus?.status === "ready" ? "text-green-700" : "text-amber-700")}>
                    {twinStatus?.status === "ready" ? "✓ Custom avatar ready" : "⚠ Avatar not ready - train first"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  Long-form videos take <strong className="mx-1">5–20 minutes</strong> to generate. You can leave this page — we'll save the video when it's ready.
                </p>
              </div>

              {isGenerating && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Generating your video...</p>
                    <p className="text-xs text-blue-600 mt-0.5">{generationStep}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(3)} className="gap-1.5" disabled={isGenerating}>
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleGenerateVideo}
              disabled={isGenerating || !isPremium || !twinStatus || twinStatus?.status !== "ready"}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
              size="lg"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
              ) : (
                <><Youtube className="w-4 h-4" />Generate YouTube Video</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 4 result: Video ready ──────────────────────────────────────── */}
      {step === 4 && resultVideoUrl && (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Your YouTube video is ready!</p>
                  <p className="text-sm text-green-700">Download it and upload directly to YouTube with the SEO metadata from Step 3.</p>
                </div>
              </div>
              <video
                src={resultVideoUrl}
                controls
                className="w-full rounded-lg aspect-video bg-black"
              />
              <div className="flex gap-3 mt-4">
                <a href={resultVideoUrl} download className="flex-1">
                  <Button className="w-full gap-2 bg-[#0a1628] hover:bg-[#0a1628]/90 text-white">
                    <Download className="w-4 h-4" />
                    Download MP4
                  </Button>
                </a>
                <Button
                  variant="outline"
                  onClick={handleGenerateClips}
                  disabled={isGeneratingClips}
                  className="flex-1 gap-2"
                >
                  {isGeneratingClips ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>
                  ) : (
                    <><Scissors className="w-4 h-4" />Find Clip Moments</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleGenerateClips}
              disabled={isGeneratingClips}
              className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2"
              size="lg"
            >
              {isGeneratingClips ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Analyzing clips...</>
              ) : (
                <><Scissors className="w-4 h-4" />Identify Reels & Shorts Moments<ChevronRight className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 5: Redistribute ────────────────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-5 h-5 text-[#0a1628]" />
            <div>
              <h2 className="text-lg font-semibold">Redistribute as Short-Form Content</h2>
              <p className="text-sm text-muted-foreground">
                These moments from your video work great as standalone Reels, TikToks, and YouTube Shorts.
              </p>
            </div>
          </div>

          {/* Video player */}
          {resultVideoUrl && (
            <Card>
              <CardContent className="pt-4">
                <video src={resultVideoUrl} controls className="w-full rounded-lg aspect-video bg-black" />
                <div className="flex gap-3 mt-3">
                  <a href={resultVideoUrl} download className="flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <Download className="w-4 h-4" />
                      Download Full Video
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clip suggestions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {clips.length} Clip Moments Identified
            </h3>
            {clips.map((clip, i) => (
              <Card key={i} className="border-border hover:border-[#0a1628] transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="secondary" className="text-xs">Clip {i + 1}</Badge>
                        <span className="text-xs text-muted-foreground">
                          ~{Math.round(clip.positionPercent)}% into video
                        </span>
                      </div>
                      <p className="font-medium text-sm">{clip.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Starts: "{clip.openingSentence.slice(0, 80)}..."
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">{clip.reason}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(clip.title, "Clip title")}
                      className="flex-shrink-0 gap-1"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-50 border-dashed">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong className="text-foreground">Pro tip:</strong> Use a tool like CapCut, Descript, or Adobe Premiere to trim these moments from your downloaded video. Then post each clip to Instagram Reels, TikTok, and YouTube Shorts with the clip title as the caption.
              </p>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(4)} className="gap-1.5">
              <ChevronLeft className="w-4 h-4" />
              Back to Video
            </Button>
            <Button
              onClick={() => {
                setStep(1);
                setScript("");
                setSeoTitle("");
                setSeoDescription("");
                setSeoTags([]);
                setChapters([]);
                setClips([]);
                setResultVideoUrl("");
                setSelectedTopic("");
              }}
              className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2"
            >
              <Youtube className="w-4 h-4" />
              Create Another Video
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
