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
import { Loader2, FileText, Copy, Trash2, ChevronDown, ChevronUp, Sparkles, Search, Repeat2, ExternalLink, CalendarPlus, RefreshCw } from "lucide-react";

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
  const [cityRotationIndex, setCityRotationIndex] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("blogBuilder_cityRotationIndex") || "0", 10) || 0; } catch { return 0; }
  });
  const persistCityIndex = (idx: number) => {
    setCityRotationIndex(idx);
    try { localStorage.setItem("blogBuilder_cityRotationIndex", String(idx)); } catch {};
  };
  const { data: persona } = trpc.persona.get.useQuery();

  // Parse service cities for rotation
  const parsedServiceCities: Array<{ city: string; state: string }> = (() => {
    try {
      const raw = (persona as any)?.serviceCities;
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return [];
      if (typeof parsed[0] === "object" && parsed[0] !== null && "city" in parsed[0]) return parsed;
      return (parsed as string[]).filter(Boolean).map((c: string) => ({ city: c, state: (persona as any)?.primaryState || "" }));
    } catch { return []; }
  })();

  const activeCityEntry = parsedServiceCities.length > 0
    ? parsedServiceCities[cityRotationIndex % parsedServiceCities.length]
    : null;
  const activeCityLabel = activeCityEntry
    ? `${activeCityEntry.city}${activeCityEntry.state ? ", " + activeCityEntry.state : ""}`
    : (persona as any)?.primaryCity || "";
  const [niche, setNiche] = useState<"buyers" | "sellers" | "investors" | "luxury" | "relocation" | "general" | "local_authority">("general");
  const [localAuthorityTemplate, setLocalAuthorityTemplate] = useState<"neighborhood_guide" | "zip_code_market" | "best_streets" | "moving_to" | "hidden_gems" | "">("neighborhood_guide");
  const [tone, setTone] = useState<"professional" | "conversational" | "educational" | "inspirational">("conversational");
  const [wordCount, setWordCount] = useState<"short" | "medium" | "long">("medium");
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [schedulePost, setSchedulePost] = useState<{ title: string; content: string } | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

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
    const effectiveCity = city.trim() || activeCityLabel || undefined;
    generateMutation.mutate({ topic: topic.trim(), city: effectiveCity, niche, tone, wordCount, ...(niche === "local_authority" && localAuthorityTemplate ? { localAuthorityTemplate: localAuthorityTemplate as any } : {}) });
    // Advance city rotation for next post
    if (!city.trim() && parsedServiceCities.length > 1) {
      persistCityIndex((cityRotationIndex + 1) % parsedServiceCities.length);
    }
  };

  const handleBatchGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a blog topic before generating for all cities.");
      return;
    }
    if (parsedServiceCities.length < 2) {
      toast.error("Add at least 2 service cities in your profile to use batch mode.");
      return;
    }
    setBatchProgress({ current: 0, total: parsedServiceCities.length });
    for (let i = 0; i < parsedServiceCities.length; i++) {
      const entry = parsedServiceCities[i];
      const lbl = `${entry.city}${entry.state ? ", " + entry.state : ""}`;
      setBatchProgress({ current: i + 1, total: parsedServiceCities.length });
      await new Promise<void>((resolve, reject) => {
        generateMutation.mutate(
          { topic: topic.trim(), city: lbl, niche, tone, wordCount, ...(niche === "local_authority" && localAuthorityTemplate ? { localAuthorityTemplate: localAuthorityTemplate as any } : {}) },
          { onSuccess: () => resolve(), onError: (e) => { toast.error(`Failed for ${lbl}: ${e.message}`); resolve(); } }
        );
      });
      // Small delay between requests
      if (i < parsedServiceCities.length - 1) await new Promise(r => setTimeout(r, 1200));
    }
    setBatchProgress(null);
    persistCityIndex(0);
    toast.success(`Generated ${parsedServiceCities.length} blog posts — one for each market!`, { icon: "🎉" });
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
              <div className="flex items-center justify-between">
                <Label htmlFor="city">Target City</Label>
                {parsedServiceCities.length > 1 && cityRotationIndex !== 0 && !city.trim() && (
                  <button
                    type="button"
                    onClick={() => persistCityIndex(0)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
              <Input
                id="city"
                placeholder={activeCityLabel || "e.g. Austin, TX"}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              {parsedServiceCities.length > 1 && !city.trim() && (
                <div className="flex flex-wrap gap-1.5">
                  {parsedServiceCities.map((entry, i) => {
                    const lbl = `${entry.city}${entry.state ? ", " + entry.state : ""}`;
                    const isActive = i === (cityRotationIndex % parsedServiceCities.length);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => persistCityIndex(i)}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                        }`}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              )}
              {parsedServiceCities.length > 1 && !city.trim() && (
                <p className="text-xs text-muted-foreground">
                  Auto-rotating markets — next: <span className="text-primary font-medium">{activeCityLabel}</span>
                </p>
              )}
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
                  <SelectItem value="local_authority">🏘️ Local Authority / Neighborhood Guide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Local Authority Template Picker */}
            {niche === "local_authority" && (
              <div className="space-y-2">
                <Label>Template Style</Label>
                <Select value={localAuthorityTemplate} onValueChange={(v) => setLocalAuthorityTemplate(v as typeof localAuthorityTemplate)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neighborhood_guide">🗺️ Ultimate Neighborhood Guide</SelectItem>
                    <SelectItem value="zip_code_market">📊 ZIP Code Market Report</SelectItem>
                    <SelectItem value="best_streets">🏡 Best Streets / Blocks</SelectItem>
                    <SelectItem value="moving_to">📦 Moving to [City/Neighborhood]</SelectItem>
                    <SelectItem value="hidden_gems">💎 Hidden Gem Neighborhoods</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {localAuthorityTemplate === "neighborhood_guide" && "Comprehensive guide to living in a specific neighborhood — schools, restaurants, parks, lifestyle, and market stats."}
                  {localAuthorityTemplate === "zip_code_market" && "Hyperlocal market analysis for a specific ZIP code — prices, trends, inventory, and what it means for buyers and sellers."}
                  {localAuthorityTemplate === "best_streets" && "Showcase the most desirable streets or blocks in a neighborhood and why buyers love them."}
                  {localAuthorityTemplate === "moving_to" && "A relocation guide for people moving to the area — what to know, where to live, and how to find the right home."}
                  {localAuthorityTemplate === "hidden_gems" && "Spotlight underrated or up-and-coming neighborhoods before they hit the mainstream radar."}
                </p>
              </div>
            )}

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

          <div className="flex flex-wrap gap-2 items-center">
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !!batchProgress || !topic.trim()}
              className="w-full sm:w-auto"
              size="lg"
            >
              {generateMutation.isPending && !batchProgress ? (
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

            {parsedServiceCities.length > 1 && (
              <Button
                variant="outline"
                onClick={handleBatchGenerate}
                disabled={generateMutation.isPending || !!batchProgress || !topic.trim()}
                size="lg"
                className="w-full sm:w-auto"
              >
                {batchProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating {batchProgress.current}/{batchProgress.total}…
                  </>
                ) : (
                  <>
                    <Repeat2 className="h-4 w-4 mr-2" />
                    Generate for All {parsedServiceCities.length} Cities
                  </>
                )}
              </Button>
            )}
          </div>
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
