import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Copy,
  Check,
  Calendar,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Users,
  Star,
  Zap,
  Target,
  ArrowRight,
  Video,
  UserCheck,
  Repeat2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getFirstPost } from "@/lib/postFormatter";
import { PostingDialog } from "@/components/PostingDialog";
import ScheduleToCalendarModal from "@/components/ScheduleToCalendarModal";

type ContentType = "property_listing" | "market_report" | "trending_news" | "tips" | "neighborhood" | "custom";
type ContentFormat = "static_post" | "carousel" | "reel_script";
type BrandVoice = "professional" | "friendly" | "luxury" | "casual" | "authoritative";
type GoalType = "attract_buyers" | "engage_sphere" | "build_authority";
type Step = 1 | 2 | 3 | 4;

const PROGRESS_MESSAGES = [
  "Analyzing your topic…",
  "Researching market context…",
  "Crafting your message…",
  "Applying your brand voice…",
  "Finalizing your content…",
];

const GOAL_CONFIG: Record<GoalType, { contentType: ContentType; tone: BrandVoice }> = {
  attract_buyers:  { contentType: "property_listing", tone: "professional"  },
  engage_sphere:   { contentType: "tips",             tone: "friendly"      },
  build_authority: { contentType: "market_report",    tone: "authoritative" },
};

export default function AIGenerate() {
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);

  // Step state
  const [step, setStep] = useState<Step>(1);

  // Screen 1 — topic
  const [topic, setTopic] = useState(urlParams.get("topic") ?? "");
  const [showCustomize, setShowCustomize] = useState(false);
  const [contentFormat, setContentFormat] = useState<ContentFormat>("static_post");
  const [tone, setTone] = useState<BrandVoice>("professional");
  const [contentType, setContentType] = useState<ContentType>("custom");

  // Screen 2 — goal
  const [goal, setGoal] = useState<GoalType | null>(null);

  // Screen 3 — generation progress
  const [progressIdx, setProgressIdx] = useState(0);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Screen 4 — results
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPostingDialog, setShowPostingDialog] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [savedToDrafts, setSavedToDrafts] = useState(false);

  const { data: persona } = trpc.persona.get.useQuery();
  const utils = trpc.useUtils();

  const generateContent = trpc.content.generate.useMutation({
    onSuccess: (result) => {
      clearProgressTimer();
      setGeneratedContent(getFirstPost(result.content));
      setStep(4);
    },
    onError: (error) => {
      clearProgressTimer();
      toast.error("Generation failed: " + error.message);
      setStep(2);
    },
  });

  const createContent = trpc.content.create.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      setSavedToDrafts(true);
      toast.success("Saved to drafts");
    },
  });

  function clearProgressTimer() {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }

  // Kick off generation when entering step 3
  useEffect(() => {
    if (step !== 3 || !goal) return;

    setProgressIdx(0);
    progressTimer.current = setInterval(() => {
      setProgressIdx((i) => Math.min(i + 1, PROGRESS_MESSAGES.length - 1));
    }, 900);

    const resolved = GOAL_CONFIG[goal];
    generateContent.mutate({
      topic: topic.trim() || "real estate tips",
      contentType: contentType !== "custom" ? contentType : resolved.contentType,
      format: contentFormat,
      tone: tone || resolved.tone || (persona?.brandVoice as BrandVoice) || "professional",
      showBrandingOverlay: true,
    });

    return () => clearProgressTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleTopicNext() {
    if (!topic.trim()) {
      toast.error("Please describe your topic or property first");
      return;
    }
    setStep(2);
  }

  function handleGoalSelect(g: GoalType) {
    setGoal(g);
    setStep(3);
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveDraft() {
    if (!generatedContent) return;
    createContent.mutate({
      content: generatedContent,
      contentType,
      status: "draft",
      aiGenerated: true,
    });
  }

  function handleRegenerate() {
    setSavedToDrafts(false);
    setGeneratedContent("");
    setStep(3);
  }

  function handleStartOver() {
    setStep(1);
    setGoal(null);
    setGeneratedContent("");
    setSavedToDrafts(false);
    setProgressIdx(0);
  }

  // ─── Step bar ─────────────────────────────────────────────────────────────
  const STEP_LABELS = ["Topic", "Goal", "Generating", "Results"];

  function StepBar() {
    return (
      <div className="flex items-center justify-center gap-0 mb-10">
        {STEP_LABELS.map((label, i) => {
          const num = (i + 1) as Step;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : num}
                </div>
                <span
                  className={`text-xs hidden sm:block transition-colors ${
                    isActive ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`h-0.5 w-12 sm:w-20 mx-1 mb-4 transition-all duration-500 ${
                    step > num ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Screen 1: Topic Input ─────────────────────────────────────────────────
  function Screen1() {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">What do you want to post about?</h1>
          <p className="text-muted-foreground">
            Describe your topic, listing, or idea — we'll handle the rest.
          </p>
        </div>

        <div className="space-y-2">
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Just listed a 3-bed home in Austin, TX — $485K, great schools, move-in ready…"
            rows={4}
            className="text-base resize-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleTopicNext();
            }}
          />
          <p className="text-xs text-muted-foreground text-right">Cmd+Enter to continue</p>
        </div>

        {/* Customize toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowCustomize((v) => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            {showCustomize ? "Hide" : "Customize"} options
            <ChevronRight
              className={`w-3 h-3 transition-transform duration-200 ${showCustomize ? "rotate-90" : ""}`}
            />
          </button>

          {showCustomize && (
            <div className="mt-4 p-4 rounded-xl border bg-muted/30 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Format
                  </Label>
                  <Select value={contentFormat} onValueChange={(v) => setContentFormat(v as ContentFormat)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static_post">📝 Static Post</SelectItem>
                      <SelectItem value="carousel">📊 Carousel</SelectItem>
                      <SelectItem value="reel_script">🎬 Reel Script</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Tone
                  </Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as BrandVoice)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Content Type
                </Label>
                <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">✨ Auto-detect</SelectItem>
                    <SelectItem value="property_listing">🏠 Property Listing</SelectItem>
                    <SelectItem value="market_report">📈 Market Report</SelectItem>
                    <SelectItem value="trending_news">📰 Trending News</SelectItem>
                    <SelectItem value="tips">💡 Tips & Advice</SelectItem>
                    <SelectItem value="neighborhood">📍 Neighborhood</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleTopicNext} size="lg" className="w-full text-base h-12 font-semibold gap-2">
          <Sparkles className="h-5 w-5" />
          Generate Content
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // ─── Screen 2: Goal Selection ──────────────────────────────────────────────
  function Screen2() {
    const goals: {
      id: GoalType;
      icon: React.ReactNode;
      label: string;
      description: string;
      badge: string;
    }[] = [
      {
        id: "attract_buyers",
        icon: <Target className="w-7 h-7" />,
        label: "Attract Buyers",
        description: "Showcase listings and generate leads with compelling property content.",
        badge: "Listing-focused",
      },
      {
        id: "engage_sphere",
        icon: <Users className="w-7 h-7" />,
        label: "Engage Your Sphere",
        description: "Stay top-of-mind with your network through helpful, relatable posts.",
        badge: "Relationship-building",
      },
      {
        id: "build_authority",
        icon: <Star className="w-7 h-7" />,
        label: "Build Authority",
        description: "Position yourself as the local expert with market insights and data.",
        badge: "Thought leadership",
      },
    ];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">What's the goal of this post?</h1>
          <p className="text-muted-foreground">Pick one — we'll tailor the message to match.</p>
        </div>

        <div className="grid gap-4">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => handleGoalSelect(g.id)}
              className="group flex items-start gap-5 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="text-primary mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0">
                {g.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-lg">{g.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {g.badge}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{g.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    );
  }

  // ─── Screen 3: Generation Loading ─────────────────────────────────────────
  function Screen3() {
    return (
      <div className="max-w-md mx-auto text-center space-y-8 py-8">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-9 h-9 text-primary animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Building your post…</h2>
          <p className="text-muted-foreground text-sm min-h-[1.5rem] transition-all duration-500">
            {PROGRESS_MESSAGES[progressIdx]}
          </p>
        </div>

        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${((progressIdx + 1) / PROGRESS_MESSAGES.length) * 100}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground">Personalizing for your brand and market…</p>
      </div>
    );
  }

  // ─── Screen 4: Results ─────────────────────────────────────────────────────
  function Screen4() {
    const goalLabel = goal
      ? {
          attract_buyers: "Attract Buyers",
          engage_sphere: "Engage Your Sphere",
          build_authority: "Build Authority",
        }[goal]
      : "";

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your content is ready</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Goal: <span className="text-foreground font-medium">{goalLabel}</span>
              {contentFormat !== "static_post" && (
                <>
                  {" · "}Format:{" "}
                  <span className="text-foreground font-medium capitalize">
                    {contentFormat.replace("_", " ")}
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={handleStartOver}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors flex-shrink-0 mt-1"
          >
            <ChevronLeft className="w-3 h-3" />
            Start over
          </button>
        </div>

        {/* Content card */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{generatedContent}</div>

          <div className="flex gap-2 pt-3 border-t flex-wrap">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={generateContent.isPending}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={savedToDrafts || createContent.isPending}
              className="gap-1.5"
            >
              {savedToDrafts && <Check className="w-3.5 h-3.5 text-green-500" />}
              {savedToDrafts ? "Saved" : "Save Draft"}
            </Button>
          </div>
        </div>

        {/* Primary CTA */}
        <Button
          size="lg"
          className="w-full h-12 text-base font-semibold gap-2"
          onClick={() => setShowPostingDialog(true)}
        >
          <Zap className="w-5 h-5" />
          Post to Social Media
        </Button>

        {/* What's Next */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            What's next
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Schedule It</p>
                <p className="text-xs text-muted-foreground">Add to your content calendar</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-auto" />
            </button>

            <button
              onClick={() => {
                const params = new URLSearchParams({
                  topic: topic || "Social Media Post",
                  body: generatedContent.slice(0, 600),
                });
                setLocation(`/repurpose?${params.toString()}`);
              }}
              className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <Repeat2 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Repurpose It</p>
                <p className="text-xs text-muted-foreground">Turn into email, blog, or reel</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-auto" />
            </button>

            {contentFormat === "reel_script" ? (
              <button
                onClick={() =>
                  setLocation("/autoreels?script=" + encodeURIComponent(generatedContent))
                }
                className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
              >
                <Video className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Create a Reel</p>
                  <p className="text-xs text-muted-foreground">Turn script into AI video</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-auto" />
              </button>
            ) : (
              <button
                onClick={() => setLocation("/crm")}
                className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
              >
                <UserCheck className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Manage Leads</p>
                  <p className="text-xs text-muted-foreground">Follow up with your pipeline</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-auto" />
              </button>
            )}
          </div>
        </div>

        {/* Tertiary links */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
          <button
            onClick={() => setLocation("/content-calendar")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            View Content Calendar
          </button>
          <button
            onClick={() => setLocation("/my-content")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            All My Content
          </button>
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-3xl mx-auto w-full">
          <StepBar />
          {step === 1 && <Screen1 />}
          {step === 2 && <Screen2 />}
          {step === 3 && <Screen3 />}
          {step === 4 && <Screen4 />}
        </div>
      </div>

      {showPostingDialog && (
        <PostingDialog
          open={showPostingDialog}
          onOpenChange={setShowPostingDialog}
          content={generatedContent}
        />
      )}

      {showScheduleModal && (
        <ScheduleToCalendarModal
          open={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          content={generatedContent}
        />
      )}
    </>
  );
}
