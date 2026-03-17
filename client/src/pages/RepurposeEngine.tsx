import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  LayoutGrid,
  Video,
  Mail,
  MapPin,
  Linkedin,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  PartyPopper,
  ClipboardCopy,
} from "lucide-react";

type RepurposeResult = {
  topic: string;
  carousel: {
    slides: { slideNumber: number; headline: string; body: string }[];
    caption: string;
  };
  reelScript: {
    hook: string;
    script: string;
    cta: string;
  };
  newsletter: {
    subjectLine: string;
    previewText: string;
    body: string;
  };
  gbpPost: {
    text: string;
    callToAction: string;
  };
  linkedin: {
    hook: string;
    body: string;
    hashtags: string[];
  };
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs" onClick={handleCopy}>
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}

/** Visual phone-frame carousel mock */
function CarouselMock({ slides, caption }: { slides: RepurposeResult["carousel"]["slides"]; caption: string }) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];
  const colors = [
    "from-violet-600 to-purple-700",
    "from-blue-600 to-indigo-700",
    "from-emerald-600 to-teal-700",
    "from-rose-600 to-pink-700",
    "from-amber-500 to-orange-600",
    "from-sky-600 to-cyan-700",
    "from-violet-600 to-purple-700",
  ];
  const bg = colors[current % colors.length];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phone frame */}
      <div className="relative w-[220px] shrink-0">
        {/* Phone shell */}
        <div className="rounded-[2rem] border-[6px] border-foreground/20 bg-black overflow-hidden shadow-2xl">
          {/* Status bar */}
          <div className="h-5 bg-black flex items-center justify-center">
            <div className="w-16 h-2.5 bg-foreground/20 rounded-full" />
          </div>
          {/* Slide content */}
          <div className={`relative aspect-square bg-gradient-to-br ${bg} flex flex-col items-center justify-center p-5 text-white`}>
            {/* Slide number badge */}
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {slide.slideNumber}
            </div>
            <p className="text-base font-bold text-center leading-tight mb-2">{slide.headline}</p>
            <p className="text-xs text-white/80 text-center leading-relaxed">{slide.body}</p>
          </div>
          {/* Dots indicator */}
          <div className="h-8 bg-black flex items-center justify-center gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white w-3" : "bg-white/30"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground font-medium">
          Slide {current + 1} of {slides.length}
        </span>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          disabled={current === slides.length - 1}
          onClick={() => setCurrent((c) => c + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Caption preview */}
      <div className="w-full rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Caption</p>
          <CopyButton text={caption} />
        </div>
        <p className="text-xs text-foreground leading-relaxed line-clamp-4">{caption}</p>
      </div>
    </div>
  );
}

export default function RepurposeEngine() {
  const [, setLocation] = useLocation();
  const [topic, setTopic] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<RepurposeResult | null>(null);

  const repurpose = trpc.repurpose.repurposeContent.useMutation({
    onSuccess: (data) => {
      setResult(data as RepurposeResult);
      toast.success("5 formats ready! Swipe through your content below.", { icon: "🎉" });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to repurpose content. Please try again.");
    },
  });

  const handleGenerate = () => {
    if (!topic.trim() || !body.trim()) {
      toast.error("Please enter both a topic and content body.");
      return;
    }
    repurpose.mutate({ topic: topic.trim(), body: body.trim() });
  };

  const handleReset = () => {
    setResult(null);
    setTopic("");
    setBody("");
  };

  /** Build a single "copy everything" string */
  const buildCopyAll = (r: RepurposeResult) => {
    const slides = r.carousel.slides.map((s) => `Slide ${s.slideNumber}: ${s.headline}\n${s.body}`).join("\n\n");
    return [
      `=== CAROUSEL (7 Slides) ===\n${slides}\n\nCaption: ${r.carousel.caption}`,
      `=== REEL SCRIPT ===\nHook: ${r.reelScript.hook}\n\n${r.reelScript.script}\n\nCTA: ${r.reelScript.cta}`,
      `=== NEWSLETTER ===\nSubject: ${r.newsletter.subjectLine}\nPreview: ${r.newsletter.previewText}\n\n${r.newsletter.body}`,
      `=== GOOGLE BUSINESS POST ===\n${r.gbpPost.text}\nCTA: ${r.gbpPost.callToAction}`,
      `=== LINKEDIN ===\n${r.linkedin.hook}\n\n${r.linkedin.body}\n\n${r.linkedin.hashtags.join(" ")}`,
    ].join("\n\n" + "─".repeat(40) + "\n\n");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Auto-Repurpose Engine</h1>
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">Premium</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Write once. Publish everywhere. One idea → carousel, reel script, newsletter, Google Business post, and LinkedIn article.
          </p>
        </div>
        {result && (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                navigator.clipboard.writeText(buildCopyAll(result));
                toast.success("All 5 formats copied to clipboard!", { icon: "📋" });
              }}
            >
              <ClipboardCopy className="w-4 h-4" />
              Copy Everything
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
              <RefreshCw className="w-4 h-4" />
              Start Over
            </Button>
          </div>
        )}
      </div>

      {/* Format Preview Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { icon: LayoutGrid, label: "Carousel (7 slides)", color: "text-purple-500" },
          { icon: Video, label: "Reel Script", color: "text-red-500" },
          { icon: Mail, label: "Newsletter Section", color: "text-blue-500" },
          { icon: MapPin, label: "Google Business Post", color: "text-green-500" },
          { icon: Linkedin, label: "LinkedIn Article", color: "text-sky-600" },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-medium text-muted-foreground"
          >
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Input Section */}
      {!result && (
        <Card className="border border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Your Content Idea</CardTitle>
            <CardDescription className="text-xs">
              Enter any real estate topic and a brief description. The engine will transform it into 5 platform-ready formats.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="topic" className="text-sm">Topic / Title</Label>
              <Input
                id="topic"
                placeholder="e.g. 5 mistakes first-time buyers make in a competitive market"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body" className="text-sm">Content Body</Label>
              <Textarea
                id="body"
                placeholder="Describe the key points, insights, or story you want to share. The more detail you provide, the better the output. (2-5 sentences is ideal)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[120px] text-sm resize-y"
              />
              <p className="text-xs text-muted-foreground">
                {body.length} characters · Aim for 100–500 characters for best results
              </p>
            </div>

            {/* Example prompts */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Quick examples:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Why pre-approval matters before house hunting",
                  "How to price your home to sell fast",
                  "3 signs it's a seller's market right now",
                ].map((example) => (
                  <button
                    key={example}
                    className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setTopic(example)}
                  >
                    {example} <ChevronRight className="inline w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={repurpose.isPending || !topic.trim() || !body.trim()}
              className="w-full gap-2"
              size="lg"
            >
              {repurpose.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating 5 formats…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Repurpose Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Ready banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
            <PartyPopper className="w-5 h-5 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                5 formats ready for "{result.topic}"
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                Tap a tab to preview each format. Use "Copy Everything" to grab all at once.
              </p>
            </div>
          </div>

          <Tabs defaultValue="carousel">
            <TabsList className="grid grid-cols-5 w-full h-auto">
              <TabsTrigger value="carousel" className="text-xs py-2 gap-1.5 flex-col sm:flex-row">
                <LayoutGrid className="w-3.5 h-3.5 text-purple-500" />
                <span className="hidden sm:inline">Carousel</span>
              </TabsTrigger>
              <TabsTrigger value="reel" className="text-xs py-2 gap-1.5 flex-col sm:flex-row">
                <Video className="w-3.5 h-3.5 text-red-500" />
                <span className="hidden sm:inline">Reel</span>
              </TabsTrigger>
              <TabsTrigger value="newsletter" className="text-xs py-2 gap-1.5 flex-col sm:flex-row">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Newsletter</span>
              </TabsTrigger>
              <TabsTrigger value="gbp" className="text-xs py-2 gap-1.5 flex-col sm:flex-row">
                <MapPin className="w-3.5 h-3.5 text-green-500" />
                <span className="hidden sm:inline">Google</span>
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="text-xs py-2 gap-1.5 flex-col sm:flex-row">
                <Linkedin className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">LinkedIn</span>
              </TabsTrigger>
            </TabsList>

            {/* Carousel Tab — visual phone mock + slide list */}
            <TabsContent value="carousel" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Phone mock */}
                <div className="flex justify-center">
                  <CarouselMock slides={result.carousel.slides} caption={result.carousel.caption} />
                </div>

                {/* Slide text list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">All 7 Slides</p>
                    <CopyButton
                      text={result.carousel.slides.map((s) => `Slide ${s.slideNumber}: ${s.headline}\n${s.body}`).join("\n\n")}
                      label="Copy All Slides"
                    />
                  </div>
                  {result.carousel.slides.map((slide) => (
                    <div key={slide.slideNumber} className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div className="w-7 h-7 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0 text-xs font-bold text-purple-600">
                        {slide.slideNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{slide.headline}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{slide.body}</p>
                      </div>
                      <CopyButton text={`${slide.headline}\n${slide.body}`} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Reel Script Tab */}
            <TabsContent value="reel" className="mt-4 space-y-3">
              {/* Big hook callout */}
              <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Opening Hook (first 3 seconds)</p>
                  <CopyButton text={result.reelScript.hook} />
                </div>
                <p className="text-base font-semibold text-foreground leading-snug">"{result.reelScript.hook}"</p>
              </div>

              <Card className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Full Script (30–60 seconds)</CardTitle>
                    <CopyButton text={result.reelScript.script} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result.reelScript.script}</p>
                </CardContent>
              </Card>

              <Card className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Closing CTA</CardTitle>
                    <CopyButton text={result.reelScript.cta} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground">{result.reelScript.cta}</p>
                </CardContent>
              </Card>

              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams({ script: result.reelScript.script });
                  setLocation(`/autoreels?${params.toString()}`);
                }}
              >
                <Video className="w-4 h-4" />
                Open in AI Reels → Generate Video
              </Button>
            </TabsContent>

            {/* Newsletter Tab */}
            <TabsContent value="newsletter" className="mt-4 space-y-3">
              {/* Subject + preview in a visual email mock */}
              <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                <div className="bg-muted/60 px-4 py-2 flex items-center gap-2 border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">Email Preview</p>
                </div>
                <div className="p-4 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-foreground leading-tight">{result.newsletter.subjectLine}</p>
                    <CopyButton text={result.newsletter.subjectLine} />
                  </div>
                  <p className="text-xs text-muted-foreground">{result.newsletter.previewText}</p>
                </div>
              </div>

              <Card className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      Newsletter Body
                    </CardTitle>
                    <CopyButton text={result.newsletter.body} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result.newsletter.body}</p>
                </CardContent>
              </Card>

              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => setLocation("/newsletter")}
              >
                <Mail className="w-4 h-4" />
                Open in Newsletter Builder
              </Button>
            </TabsContent>

            {/* Google Business Profile Tab */}
            <TabsContent value="gbp" className="mt-4 space-y-3">
              {/* GBP visual mock */}
              <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                <div className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-border flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Google Business Post</p>
                    <p className="text-xs text-muted-foreground">Preview</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result.gbpPost.text}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                      {result.gbpPost.callToAction}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{result.gbpPost.text.length} / 1500 chars</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <CopyButton text={result.gbpPost.text} label="Copy Post" />
              </div>
            </TabsContent>

            {/* LinkedIn Tab */}
            <TabsContent value="linkedin" className="mt-4 space-y-3">
              {/* LinkedIn visual mock */}
              <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                <div className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-border flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                    <Linkedin className="w-4 h-4 text-sky-700" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">LinkedIn Post Preview</p>
                    <p className="text-xs text-muted-foreground">See more</p>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">{result.linkedin.hook}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result.linkedin.body}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {result.linkedin.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs text-sky-600 dark:text-sky-400">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <CopyButton
                  text={`${result.linkedin.hook}\n\n${result.linkedin.body}\n\n${result.linkedin.hashtags.join(" ")}`}
                  label="Copy Full Post"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Bottom CTA bar */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Done reviewing?</p>
              <p className="text-xs text-muted-foreground">Copy individual sections above or grab everything at once.</p>
            </div>
            <Button
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-700 text-white shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(buildCopyAll(result));
                toast.success("All 5 formats copied!", { icon: "📋" });
              }}
            >
              <ClipboardCopy className="w-4 h-4" />
              Copy Everything
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
