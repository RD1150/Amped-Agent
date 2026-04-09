import { useState } from "react";
import { trpc } from "@/lib/trpc";
import ScheduleToCalendarModal from "@/components/ScheduleToCalendarModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Loader2, FileText, Copy, Trash2, ChevronDown, ChevronUp, Sparkles, Search, Repeat2, ExternalLink, CalendarPlus } from "lucide-react";

const TOPIC_SUGGESTIONS = [
  "5 Things First-Time Buyers Wish They Knew Before Buying",
  "Why Now Is Still a Good Time to Sell Your Home",
  "How to Price Your Home Right in Today's Market",
  "The Hidden Costs of Buying a Home",
  "What to Expect During the Closing Process",
  "Neighborhood Spotlight: Why [City] Is a Great Place to Live",
  "How to Win in a Competitive Offer Situation",
  "Investment Property 101: What Every Beginner Should Know",
  "Downsizing Done Right: A Guide for Empty Nesters",
  "How to Prepare Your Home for a Spring Sale",
];

export default function BlogBuilder() {
  const [, navigate] = useLocation();
  const [topic, setTopic] = useState("");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState<"buyers" | "sellers" | "investors" | "luxury" | "relocation" | "general">("general");
  const [tone, setTone] = useState<"professional" | "conversational" | "educational" | "inspirational">("conversational");
  const [wordCount, setWordCount] = useState<"short" | "medium" | "long">("medium");
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [schedulePost, setSchedulePost] = useState<{ title: string; content: string } | null>(null);

  const utils = trpc.useUtils();

  const { data: posts, isLoading: postsLoading } = trpc.blogBuilder.list.useQuery();

  const generateMutation = trpc.blogBuilder.generate.useMutation({
    onSuccess: () => {
      toast.success("Blog post generated! Saved to your library.");
      utils.blogBuilder.list.invalidate();
      setTopic("");
    },
    onError: (err) => {
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  const deleteMutation = trpc.blogBuilder.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      utils.blogBuilder.list.invalidate();
    },
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Enter a blog topic to get started.");
      return;
    }
    generateMutation.mutate({ topic: topic.trim(), city: city.trim() || undefined, niche, tone, wordCount });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const wordCountLabel = { short: "~500 words", medium: "~800 words", long: "~1,100 words" };

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Blog Builder</h1>
        <p className="text-muted-foreground mt-1">
          Generate SEO-optimized blog posts that position you as the local real estate expert.
        </p>
      </div>

      {/* Generator Form */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate a New Post
          </CardTitle>
          <CardDescription>
            Enter a topic and let AI write a complete, SEO-ready blog post in your voice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Blog Topic *</Label>
            <Input
              id="topic"
              placeholder="e.g. 5 Things First-Time Buyers Wish They Knew"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            {/* Topic suggestions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {TOPIC_SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => setTopic(s.replace("[City]", city || "Your City"))}
                  className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                >
                  {s.length > 40 ? s.slice(0, 40) + "…" : s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">Target City (optional)</Label>
              <Input
                id="city"
                placeholder="e.g. Austin, TX"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            {/* Niche */}
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={niche} onValueChange={(v) => setNiche(v as typeof niche)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Real Estate</SelectItem>
                  <SelectItem value="buyers">First-Time & Move-Up Buyers</SelectItem>
                  <SelectItem value="sellers">Home Sellers</SelectItem>
                  <SelectItem value="investors">Real Estate Investors</SelectItem>
                  <SelectItem value="luxury">Luxury Buyers & Sellers</SelectItem>
                  <SelectItem value="relocation">Relocation Clients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label>Writing Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Word Count */}
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={wordCount} onValueChange={(v) => setWordCount(v as typeof wordCount)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short ({wordCountLabel.short})</SelectItem>
                  <SelectItem value="medium">Medium ({wordCountLabel.medium})</SelectItem>
                  <SelectItem value="long">Long ({wordCountLabel.long})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !topic.trim()}
            className="w-full sm:w-auto"
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Writing your post…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Blog Post
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Saved Posts Library */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          Your Blog Posts
          {posts && posts.length > 0 && (
            <Badge variant="secondary">{posts.length}</Badge>
          )}
        </h2>

        {postsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !posts || posts.length === 0 ? (
          <Card className="border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No blog posts yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Generate your first post above to start building your content library.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className="border-border">
                <CardContent className="pt-4 pb-3 px-5">
                  {/* Post header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground leading-tight">{post.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-xs capitalize">{post.niche}</Badge>
                        {post.city && <Badge variant="outline" className="text-xs">{post.city}</Badge>}
                        {post.wordCount && (
                          <span className="text-xs text-muted-foreground">{post.wordCount.toLocaleString()} words</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {post.metaDescription && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{post.metaDescription}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(post.content, "Blog post")}
                        title="Copy post"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                        title={expandedPost === post.id ? "Collapse" : "Expand"}
                      >
                        {expandedPost === post.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate({ id: post.id })}
                        className="text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* SEO Keywords */}
                  {post.seoKeywords && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <Search className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      {JSON.parse(post.seoKeywords).map((kw: string) => (
                        <span key={kw} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded content */}
                  {expandedPost === post.id && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Full Post</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(post.content, "Blog post")}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                            {copiedField === "Blog post" ? "Copied!" : "Copy All"}
                          </Button>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto font-mono text-xs">
                          {post.content}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-primary border-primary/30 hover:bg-muted dark:hover:bg-primary/10"
                            onClick={() => setSchedulePost({ title: post.title, content: post.content })}
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            Add to Calendar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-primary border-primary/30 hover:bg-muted dark:hover:bg-primary/10"
                            onClick={() => {
                              const params = new URLSearchParams({
                                topic: post.title,
                                body: post.content.slice(0, 600),
                              });
                              navigate(`/repurpose?${params.toString()}`);
                            }}
                          >
                            <Repeat2 className="h-3.5 w-3.5" />
                            Repurpose This Post
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            onClick={() => {
                              const formatted = `${post.title}\n\n${post.content}${post.metaDescription ? `\n\n---\nSEO Meta Description: ${post.metaDescription}` : ''}`;
                              navigator.clipboard.writeText(formatted).then(() => {
                                toast.success(
                                  "Blog post copied to clipboard!",
                                  { description: "Opening Lofty — paste the content into your blog editor and click Publish." }
                                );
                                setTimeout(() => {
                                  window.open("https://app.lofty.com", "_blank");
                                }, 800);
                              }).catch(() => {
                                toast.error("Could not copy to clipboard. Please copy the post manually.");
                                window.open("https://app.lofty.com", "_blank");
                              });
                            }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Publish to Lofty
                          </Button>
                        </div>
                        {post.metaDescription && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SEO Meta Description</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => copyToClipboard(post.metaDescription!, "Meta description")}
                              >
                                {copiedField === "Meta description" ? "Copied!" : "Copy"}
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground bg-muted/40 rounded p-2">{post.metaDescription}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Schedule to Calendar Modal */}
    {schedulePost && (
      <ScheduleToCalendarModal
        open={!!schedulePost}
        onClose={() => setSchedulePost(null)}
        content={schedulePost.content}
        title={schedulePost.title}
        contentType="custom"
        sourceLabel="Blog Post"
      />
    )}
    </>
  );
}
