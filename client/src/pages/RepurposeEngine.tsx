import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  Video,
  RefreshCw,
  ClipboardCopy,
  Linkedin,
  Instagram,
  Facebook,
  Music2,
  Clapperboard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "linkedin" | "instagram" | "facebook" | "tiktok" | "reelScript";

type RepurposeResult = {
  topic: string;
  platforms: Platform[];
  linkedin?: {
    hook: string;
    body: string;
    hashtags: string[];
  };
  instagram?: {
    caption: string;
    hashtags: string[];
    altText: string;
  };
  facebook?: {
    post: string;
    engagementQuestion: string;
  };
  tiktok?: {
    hook: string;
    script: string;
    cta: string;
    hashtags: string[];
  };
  reelScript?: {
    hook: string;
    script: string;
    cta: string;
    captionHook: string;
  };
};

// ─── Platform Config ──────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<
  Platform,
  {
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
  }
> = {
  linkedin: {
    label: "LinkedIn",
    shortLabel: "LinkedIn",
    icon: Linkedin,
    color: "text-sky-600",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-200 dark:border-sky-800",
    description: "Professional thought leadership post",
  },
  instagram: {
    label: "Instagram",
    shortLabel: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/40",
    borderColor: "border-pink-200 dark:border-pink-800",
    description: "Caption with hashtags & alt text",
  },
  facebook: {
    label: "Facebook",
    shortLabel: "Facebook",
    icon: Facebook,
    color: "text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/40",
    borderColor: "border-blue-200 dark:border-blue-800",
    description: "Community-driven conversational post",
  },
  tiktok: {
    label: "TikTok",
    shortLabel: "TikTok",
    icon: Music2,
    color: "text-foreground",
    bgColor: "bg-zinc-50 dark:bg-zinc-900/60",
    borderColor: "border-zinc-200 dark:border-zinc-700",
    description: "Ultra-casual direct-to-camera script",
  },
  reelScript: {
    label: "Reel Script",
    shortLabel: "Reel",
    icon: Clapperboard,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    borderColor: "border-red-200 dark:border-red-800",
    description: "30-60 sec Instagram/TikTok video script",
  },
};

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs shrink-0" onClick={handleCopy}>
      {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}

// ─── Platform Toggle Button ───────────────────────────────────────────────────

function PlatformToggle({
  platform,
  selected,
  onToggle,
}: {
  platform: Platform;
  selected: boolean;
  onToggle: () => void;
}) {
  const cfg = PLATFORM_CONFIG[platform];
  const Icon = cfg.icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium w-full text-left
        ${selected
          ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`
          : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
        }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected ? cfg.bgColor : "bg-muted/50"}`}>
        <Icon className={`w-4 h-4 ${selected ? cfg.color : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{cfg.label}</p>
        <p className="text-xs text-muted-foreground truncate">{cfg.description}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all
        ${selected ? "border-current bg-current" : "border-muted-foreground/30"}`}>
        {selected && <Check className="w-3 h-3 text-white dark:text-black" />}
      </div>
    </button>
  );
}

// ─── Expandable Section ───────────────────────────────────────────────────────

function Section({
  title,
  children,
  copyText,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  copyText?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
        <div className="flex items-center gap-2">
          {copyText && open && <CopyButton text={copyText} />}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ─── Platform Output Cards ────────────────────────────────────────────────────

function LinkedInCard({ data }: { data: NonNullable<RepurposeResult["linkedin"]> }) {
  const fullPost = `${data.hook}\n\n${data.body}\n\n${data.hashtags.join(" ")}`;
  return (
    <div className="space-y-3">
      <Section title="Hook (Opening Line)" copyText={data.hook}>
        <p className="text-sm font-semibold text-foreground leading-relaxed">{data.hook}</p>
      </Section>
      <Section title="Post Body" copyText={data.body}>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{data.body}</p>
      </Section>
      <Section title="Hashtags" copyText={data.hashtags.join(" ")}>
        <div className="flex flex-wrap gap-1.5">
          {data.hashtags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs text-sky-600 dark:text-sky-400">{tag}</Badge>
          ))}
        </div>
      </Section>
      <div className="flex justify-end">
        <CopyButton text={fullPost} label="Copy Full Post" />
      </div>
    </div>
  );
}

function InstagramCard({ data }: { data: NonNullable<RepurposeResult["instagram"]> }) {
  const fullCaption = `${data.caption}\n\n${data.hashtags.join(" ")}`;
  return (
    <div className="space-y-3">
      <Section title="Caption" copyText={data.caption}>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{data.caption}</p>
      </Section>
      <Section title="Hashtags (paste in first comment)" copyText={data.hashtags.join(" ")}>
        <div className="flex flex-wrap gap-1.5">
          {data.hashtags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs text-pink-600 dark:text-pink-400">{tag}</Badge>
          ))}
        </div>
      </Section>
      {data.altText && (
        <Section title="Alt Text (for accessibility)" copyText={data.altText} defaultOpen={false}>
          <p className="text-sm text-muted-foreground italic">{data.altText}</p>
        </Section>
      )}
      <div className="flex justify-end">
        <CopyButton text={fullCaption} label="Copy Caption + Hashtags" />
      </div>
    </div>
  );
}

function FacebookCard({ data }: { data: NonNullable<RepurposeResult["facebook"]> }) {
  return (
    <div className="space-y-3">
      <Section title="Post" copyText={data.post}>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{data.post}</p>
      </Section>
      <Section title="Engagement Booster (post as first comment)" copyText={data.engagementQuestion}>
        <p className="text-sm text-foreground font-medium">{data.engagementQuestion}</p>
        <p className="text-xs text-muted-foreground mt-1">Post this as the first comment to boost engagement.</p>
      </Section>
    </div>
  );
}

function TikTokCard({ data }: { data: NonNullable<RepurposeResult["tiktok"]> }) {
  const fullScript = `HOOK: ${data.hook}\n\n${data.script}\n\nCTA: ${data.cta}\n\n${data.hashtags.join(" ")}`;
  return (
    <div className="space-y-3">
      <Section title="Hook (First 3 Seconds)" copyText={data.hook}>
        <p className="text-sm font-bold text-foreground leading-relaxed">{data.hook}</p>
        <p className="text-xs text-muted-foreground mt-1">Say this in the first 3 seconds to stop the scroll.</p>
      </Section>
      <Section title="Full Script" copyText={data.script}>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono text-xs">{data.script}</p>
      </Section>
      <Section title="Closing CTA" copyText={data.cta}>
        <p className="text-sm text-foreground">{data.cta}</p>
      </Section>
      <Section title="Hashtags" copyText={data.hashtags.join(" ")} defaultOpen={false}>
        <div className="flex flex-wrap gap-1.5">
          {data.hashtags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      </Section>
      <div className="flex justify-end">
        <CopyButton text={fullScript} label="Copy Full Script" />
      </div>
    </div>
  );
}

function ReelScriptCard({ data }: { data: NonNullable<RepurposeResult["reelScript"]> }) {
  const fullScript = `HOOK: ${data.hook}\n\n${data.script}\n\nCTA: ${data.cta}\n\nCaption Hook: ${data.captionHook}`;
  return (
    <div className="space-y-3">
      <Section title="Hook (First 3 Seconds)" copyText={data.hook}>
        <p className="text-sm font-bold text-foreground leading-relaxed">{data.hook}</p>
      </Section>
      <Section title="Full Script" copyText={data.script}>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono text-xs">{data.script}</p>
      </Section>
      <Section title="Closing CTA" copyText={data.cta}>
        <p className="text-sm text-foreground">{data.cta}</p>
      </Section>
      <Section title="Caption Hook (first line of your caption)" copyText={data.captionHook} defaultOpen={false}>
        <p className="text-sm text-foreground font-medium">{data.captionHook}</p>
      </Section>
      <div className="flex justify-end">
        <CopyButton text={fullScript} label="Copy Full Script" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RepurposeEngine() {
  const [, navigate] = useLocation();

  // Support pre-filling from other tools via URL state
  const [topic, setTopic] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("topic") || "";
    } catch {
      return "";
    }
  });
  const [body, setBody] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("body") || "";
    } catch {
      return "";
    }
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["linkedin", "instagram", "facebook"]);
  const [result, setResult] = useState<RepurposeResult | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);

  const generateBody = trpc.repurpose.generateBody.useMutation({
    onSuccess: (data) => {
      setBody(data.body);
      toast.success("Content body generated!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate body. Please try again.");
    },
  });

  const repurpose = trpc.repurpose.repurposeContent.useMutation({
    onSuccess: (data) => {
      setResult(data as RepurposeResult);
      // Auto-select first platform
      if (data.platforms.length > 0) {
        setActivePlatform(data.platforms[0] as Platform);
      }
      toast.success(`${data.platforms.length} platform-native versions ready!`, { icon: "🎉" });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to repurpose content. Please try again.");
    },
  });

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleGenerate = () => {
    if (!topic.trim() || !body.trim()) {
      toast.error("Please enter both a topic and content body.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform.");
      return;
    }
    repurpose.mutate({ topic: topic.trim(), body: body.trim(), platforms: selectedPlatforms });
  };

  const handleReset = () => {
    setResult(null);
    setActivePlatform(null);
  };

  const buildCopyAll = (r: RepurposeResult) => {
    const parts: string[] = [];
    if (r.linkedin) {
      parts.push(`=== LINKEDIN ===\n${r.linkedin.hook}\n\n${r.linkedin.body}\n\n${r.linkedin.hashtags.join(" ")}`);
    }
    if (r.instagram) {
      parts.push(`=== INSTAGRAM ===\n${r.instagram.caption}\n\n${r.instagram.hashtags.join(" ")}`);
    }
    if (r.facebook) {
      parts.push(`=== FACEBOOK ===\n${r.facebook.post}\n\nFirst comment: ${r.facebook.engagementQuestion}`);
    }
    if (r.tiktok) {
      parts.push(`=== TIKTOK ===\nHook: ${r.tiktok.hook}\n\n${r.tiktok.script}\n\nCTA: ${r.tiktok.cta}\n\n${r.tiktok.hashtags.join(" ")}`);
    }
    if (r.reelScript) {
      parts.push(`=== REEL SCRIPT ===\nHook: ${r.reelScript.hook}\n\n${r.reelScript.script}\n\nCTA: ${r.reelScript.cta}`);
    }
    return parts.join("\n\n" + "─".repeat(40) + "\n\n");
  };

  const allPlatforms: Platform[] = ["linkedin", "instagram", "facebook", "tiktok", "reelScript"];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Repurpose Engine</h1>
            <Badge className="bg-primary/15 text-primary border-primary/20 text-xs">Agency</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Write once. Each platform gets content written in its own native style — not a copy-paste.
          </p>
        </div>
        {result && (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-primary hover:bg-green-700 text-white"
              onClick={() => {
                navigator.clipboard.writeText(buildCopyAll(result));
                toast.success("All platforms copied to clipboard!", { icon: "📋" });
              }}
            >
              <ClipboardCopy className="w-4 h-4" />
              Copy All
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
              <RefreshCw className="w-4 h-4" />
              Start Over
            </Button>
          </div>
        )}
      </div>

      {/* Input Section */}
      {!result && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Content Input */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="border border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Your Content</CardTitle>
                <CardDescription className="text-xs">
                  Enter a topic and a brief description. The engine will write platform-native versions for each platform you select.
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="body" className="text-sm">Content Body</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 gap-1.5 text-xs text-primary hover:text-primary hover:bg-muted dark:hover:bg-primary/10"
                      disabled={!topic.trim() || generateBody.isPending}
                      onClick={() => generateBody.mutate({ topic: topic.trim() })}
                    >
                      {generateBody.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {generateBody.isPending ? "Generating..." : "AI Generate"}
                    </Button>
                  </div>
                  <Textarea
                    id="body"
                    placeholder="Describe the key points, insights, or story you want to share. Or click AI Generate above."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    className="text-sm resize-none"
                  />
                </div>

                <Button
                  className="w-full gap-2 bg-muted0 hover:bg-primary text-white font-semibold"
                  disabled={!topic.trim() || !body.trim() || selectedPlatforms.length === 0 || repurpose.isPending}
                  onClick={handleGenerate}
                >
                  {repurpose.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Writing platform-native content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Repurpose for {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Platform Selector */}
          <div className="lg:col-span-2 space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Select Platforms</p>
              <p className="text-xs text-muted-foreground mb-3">Each one gets content written in its native style.</p>
            </div>
            <div className="space-y-2">
              {allPlatforms.map((p) => (
                <PlatformToggle
                  key={p}
                  platform={p}
                  selected={selectedPlatforms.includes(p)}
                  onToggle={() => togglePlatform(p)}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPlatforms.length === 0
                ? "Select at least one platform"
                : `${selectedPlatforms.length} platform${selectedPlatforms.length !== 1 ? "s" : ""} selected`}
            </p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Platform Nav */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Your Platforms</p>
            {result.platforms.map((p) => {
              const cfg = PLATFORM_CONFIG[p as Platform];
              const Icon = cfg.icon;
              const isActive = activePlatform === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActivePlatform(p as Platform)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left
                    ${isActive
                      ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`
                      : "border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? cfg.color : ""}`} />
                  <span className="text-sm font-medium">{cfg.label}</span>
                  {isActive && <div className={`ml-auto w-1.5 h-1.5 rounded-full ${cfg.color.replace("text-", "bg-")}`} />}
                </button>
              );
            })}

            <div className="pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-xs text-muted-foreground"
                onClick={handleReset}
              >
                <RefreshCw className="w-3 h-3" />
                New Content
              </Button>
            </div>
          </div>

          {/* Right: Active Platform Output */}
          <div className="lg:col-span-3">
            {activePlatform && (
              <Card className="border border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const cfg = PLATFORM_CONFIG[activePlatform];
                      const Icon = cfg.icon;
                      return (
                        <>
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cfg.bgColor}`}>
                            <Icon className={`w-5 h-5 ${cfg.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{cfg.label}</CardTitle>
                            <CardDescription className="text-xs">{cfg.description}</CardDescription>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent>
                  {activePlatform === "linkedin" && result.linkedin && (
                    <LinkedInCard data={result.linkedin} />
                  )}
                  {activePlatform === "instagram" && result.instagram && (
                    <InstagramCard data={result.instagram} />
                  )}
                  {activePlatform === "facebook" && result.facebook && (
                    <FacebookCard data={result.facebook} />
                  )}
                  {activePlatform === "tiktok" && result.tiktok && (
                    <TikTokCard data={result.tiktok} />
                  )}
                  {activePlatform === "reelScript" && result.reelScript && (
                    <ReelScriptCard data={result.reelScript} />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
