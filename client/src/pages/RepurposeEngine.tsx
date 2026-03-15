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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs" onClick={handleCopy}>
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
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
      toast.success("Content repurposed into 5 formats!");
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
          <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
            <RefreshCw className="w-4 h-4" />
            Start Over
          </Button>
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
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-sm font-medium text-foreground">
              "{result.topic}" repurposed into 5 formats
            </p>
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

            {/* Carousel Tab */}
            <TabsContent value="carousel" className="mt-4 space-y-3">
              <Card className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-purple-500" />
                      7-Slide Carousel
                    </CardTitle>
                    <CopyButton text={result.carousel.slides.map(s => `Slide ${s.slideNumber}: ${s.headline}\n${s.body}`).join("\n\n")} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.carousel.slides.map((slide) => (
                    <div key={slide.slideNumber} className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div className="w-7 h-7 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0 text-xs font-bold text-purple-600">
                        {slide.slideNumber}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{slide.headline}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{slide.body}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Instagram / Facebook Caption</CardTitle>
                    <CopyButton text={result.carousel.caption} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{result.carousel.caption}</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reel Script Tab */}
            <TabsContent value="reel" className="mt-4 space-y-3">
              <Card className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Video className="w-4 h-4 text-red-500" />
                      Opening Hook (first 3 seconds)
                    </CardTitle>
                    <CopyButton text={result.reelScript.hook} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold text-foreground bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    "{result.reelScript.hook}"
                  </p>
                </CardContent>
              </Card>
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
                Open in AI Reels
              </Button>
            </TabsContent>

            {/* Newsletter Tab */}
            <TabsContent value="newsletter" className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="border border-border bg-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Subject Line</CardTitle>
                      <CopyButton text={result.newsletter.subjectLine} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-semibold text-foreground">{result.newsletter.subjectLine}</p>
                  </CardContent>
                </Card>
                <Card className="border border-border bg-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Preview Text</CardTitle>
                      <CopyButton text={result.newsletter.previewText} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{result.newsletter.previewText}</p>
                  </CardContent>
                </Card>
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
            </TabsContent>

            {/* Google Business Profile Tab */}
            <TabsContent value="gbp" className="mt-4 space-y-3">
              <Card className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      Google Business Post
                    </CardTitle>
                    <CopyButton text={result.gbpPost.text} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result.gbpPost.text}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Suggested CTA: {result.gbpPost.callToAction}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {result.gbpPost.text.length} / 1500 chars
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LinkedIn Tab */}
            <TabsContent value="linkedin" className="mt-4 space-y-3">
              <Card className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Opening Hook</CardTitle>
                    <CopyButton text={result.linkedin.hook} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold text-foreground bg-sky-500/5 border border-sky-500/20 rounded-lg p-3">
                    {result.linkedin.hook}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-sky-600" />
                      Full LinkedIn Post
                    </CardTitle>
                    <CopyButton text={`${result.linkedin.hook}\n\n${result.linkedin.body}\n\n${result.linkedin.hashtags.join(" ")}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result.linkedin.body}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.linkedin.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
