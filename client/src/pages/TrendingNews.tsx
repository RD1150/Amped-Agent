import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Newspaper,
  Sparkles,
  Copy,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Home,
  DollarSign,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const NEWS_TOPICS = [
  { label: "Interest Rates & Fed Decisions", icon: DollarSign, description: "Turn rate news into buyer/seller guidance" },
  { label: "Local Market Stats", icon: BarChart3, description: "Translate data into digestible insights" },
  { label: "Housing Inventory & Supply", icon: Home, description: "Explain what low/high inventory means" },
  { label: "Home Price Trends", icon: TrendingUp, description: "Break down appreciation or correction news" },
  { label: "Mortgage & Lending News", icon: Newspaper, description: "Clarify lending changes for your clients" },
];

const FORMAT_OPTIONS = [
  { value: "static_post", label: "Social Post (3 captions)" },
  { value: "carousel", label: "Carousel (5 slides)" },
  { value: "reel_script", label: "Reel Script (30 sec)" },
];

export default function TrendingNews() {
  const [, navigate] = useLocation();
  const [newsText, setNewsText] = useState("");
  const [format, setFormat] = useState("static_post");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateMutation = trpc.content.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedContent(data.content);
    },
    onError: (err) => {
      toast.error(err.message || "Generation failed. Please try again.");
    },
  });

  const handleGenerate = () => {
    if (!newsText.trim()) {
      toast.error("Please paste a news headline or describe the story first.");
      return;
    }
    generateMutation.mutate({
      topic: newsText,
      contentType: "trending_news",
      format: format as "static_post" | "carousel" | "reel_script",
    });
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Newspaper className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Trending News</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Turn real estate headlines into engaging social content that positions you as the local expert.
        </p>
      </div>

      <div>
        <Label className="text-sm font-semibold mb-3 block">Popular Topics</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {NEWS_TOPICS.map((topic) => (
            <button
              key={topic.label}
              onClick={() => setNewsText(topic.label)}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors hover:border-primary/50 hover:bg-primary/5 ${
                newsText === topic.label ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <topic.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium leading-tight">{topic.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{topic.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <Label htmlFor="news-input" className="text-sm font-semibold">
            Paste a headline or describe the news story
          </Label>
          <Textarea
            id="news-input"
            placeholder="e.g. 'Fed holds rates steady — what does this mean for buyers?' or paste a full headline..."
            value={newsText}
            onChange={(e) => setNewsText(e.target.value)}
            className="mt-2 min-h-[100px] resize-none"
          />
        </div>

        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label className="text-sm font-semibold mb-1.5 block">Output Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !newsText.trim()}
            className="shrink-0"
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Content
              </>
            )}
          </Button>
        </div>
      </Card>

      {generatedContent && (
        <Card className="p-6 space-y-4 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold">Your content is ready</span>
              <Badge variant="secondary" className="text-xs">
                {FORMAT_OPTIONS.find((f) => f.value === format)?.label}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="bg-background rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap border">
            {generatedContent}
          </div>
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-3 font-medium">What's next?</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/calendar")}>
                <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                Schedule It
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/repurpose")}>
                <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                Repurpose It
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/generate")}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate Another Post
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
