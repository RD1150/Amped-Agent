import { useState } from "react";
import { trpc } from "@/lib/trpc";
import ScheduleToCalendarModal from "@/components/ScheduleToCalendarModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Search,
  Sparkles,
  Filter,
  TrendingUp,
  Pencil,
  Save,
  Copy,
  Volume2,
  VolumeX,
  Loader2,
  Wand2,
  X,
  FileText,
  Clapperboard,
  CalendarPlus,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type HookCategory = "buyer" | "seller" | "investor" | "local" | "luxury" | "relocation" | "general";
type HookFormat = "video" | "email" | "social" | "carousel";

interface Hook {
  id: number;
  category: HookCategory;
  format: HookFormat;
  hookText: string;
  useCase: string | null;
  exampleExpansion: string | null;
  isPremium: boolean | null;
  usageCount: number | null;
  createdAt: Date;
}

export default function Hooks() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HookCategory | "all">("all");
  const [selectedFormat, setSelectedFormat] = useState<HookFormat | "all">("all");
  const [editingHookId, setEditingHookId] = useState<number | null>(null);
  const [editedHookText, setEditedHookText] = useState<string>("");

  // Script generation state
  const [scriptPanelHookId, setScriptPanelHookId] = useState<number | null>(null);
  const [scriptPrompt, setScriptPrompt] = useState("");
  const [scriptFormat, setScriptFormat] = useState<"video" | "email" | "social" | "carousel">("social");
  const [scriptLength, setScriptLength] = useState<"short" | "medium" | "long">("medium");
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [scheduleScript, setScheduleScript] = useState<string | null>(null);

  // Voiceover state per hook
  const [previewingHookId, setPreviewingHookId] = useState<number | null>(null);
  const [hookAudioUrls, setHookAudioUrls] = useState<Record<number, string>>({});
  const [playingHookId, setPlayingHookId] = useState<number | null>(null);

  const { data: hooks, isLoading } = trpc.hooks.list.useQuery();
  const { data: voicePref } = trpc.auth.getVoicePreference.useQuery();

  const previewVoiceMutation = trpc.propertyTours.previewVoice.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        setHookAudioUrls((prev) => ({ ...prev, [previewingHookId!]: data.url }));
        setPlayingHookId(previewingHookId);
      }
      setPreviewingHookId(null);
    },
    onError: (err) => {
      toast.error(`Voice preview failed: ${err.message}`);
      setPreviewingHookId(null);
    },
  });

  const generateScriptMutation = trpc.hooks.generateScript.useMutation({
    onSuccess: (data) => {
      setGeneratedScript(data.script);
      toast.success("Script generated!");
    },
    onError: (err) => {
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  const filteredHooks = hooks?.filter((hook: Hook) => {
    const matchesSearch =
      hook.hookText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hook.useCase?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || hook.category === selectedCategory;
    const matchesFormat = selectedFormat === "all" || hook.format === selectedFormat;
    return matchesSearch && matchesCategory && matchesFormat;
  });

  const categories: Array<HookCategory | "all"> = [
    "all", "buyer", "seller", "investor", "local", "luxury", "relocation", "general",
  ];
  const formats: Array<HookFormat | "all"> = ["all", "video", "email", "social", "carousel"];

  const getCategoryColor = (category: HookCategory) => {
    const colors: Record<HookCategory, string> = {
      buyer: "bg-primary/15 text-primary",
      seller: "bg-primary/15 text-primary",
      investor: "bg-primary/20 text-primary",
      local: "bg-primary/20 text-primary",
      luxury: "bg-primary/10 text-primary",
      relocation: "bg-pink-500/20 text-pink-500",
      general: "bg-gray-500/20 text-gray-500",
    };
    return colors[category];
  };

  const getFormatIcon = (format: HookFormat) => {
    const icons: Record<HookFormat, string> = { video: "🎥", email: "📧", social: "📱", carousel: "🎠" };
    return icons[format];
  };

  const getEffectiveHookText = (hook: Hook) =>
    editingHookId === hook.id ? editedHookText : hook.hookText;

  const handleOpenScriptPanel = (hook: Hook) => {
    if (scriptPanelHookId === hook.id) {
      setScriptPanelHookId(null);
      setGeneratedScript(null);
      setScriptPrompt("");
    } else {
      setScriptPanelHookId(hook.id);
      setGeneratedScript(null);
      setScriptPrompt("");
    }
  };

  const handleGenerateScript = (hook: Hook) => {
    if (!scriptPrompt.trim()) {
      toast.error("Please enter a prompt describing what you want to create.");
      return;
    }
    generateScriptMutation.mutate({
      hookText: getEffectiveHookText(hook),
      prompt: scriptPrompt,
      format: scriptFormat,
      targetLength: scriptLength,
    });
  };

  const handleCopyHook = (hook: Hook) => {
    navigator.clipboard.writeText(getEffectiveHookText(hook));
    toast.success("Hook copied to clipboard!");
  };

  const handlePreviewVoice = (hook: Hook) => {
    const text = getEffectiveHookText(hook);
    if (hookAudioUrls[hook.id]) {
      setPlayingHookId(playingHookId === hook.id ? null : hook.id);
      return;
    }
    setPreviewingHookId(hook.id);
    previewVoiceMutation.mutate({
      voiceId: voicePref?.voiceId ?? "21m00Tcm4TlvDq8ikWAM",
      sampleText: text,
    });
  };

  return (
    <>
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Hooks Library</h1>
          <p className="text-muted-foreground mt-1">
            Browse proven hooks to start your social media posts, videos, and carousels
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <TrendingUp className="h-3 w-3 mr-1" />
          {filteredHooks?.length || 0} hooks available
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hooks by text or use case..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Format</label>
            <div className="flex flex-wrap gap-2">
              {formats.map((format) => (
                <Button
                  key={format}
                  variant={selectedFormat === format ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFormat(format)}
                >
                  {format === "all" ? "All Formats" : `${getFormatIcon(format as HookFormat)} ${format.charAt(0).toUpperCase() + format.slice(1)}`}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hooks Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-40" /></Card>
          ))}
        </div>
      ) : filteredHooks && filteredHooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {filteredHooks.map((hook: Hook) => (
            <div key={hook.id} className="flex flex-col">
              {/* Hook Card */}
              <Card className={`bg-card border-border hover:border-primary/50 transition-colors ${scriptPanelHookId === hook.id ? "rounded-b-none border-b-0 border-primary/60" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className={`text-xs ${getCategoryColor(hook.category)}`}>{hook.category}</Badge>
                      <Badge variant="outline" className="text-xs">{getFormatIcon(hook.format)} {hook.format}</Badge>
                      {hook.isPremium && <Badge variant="secondary" className="text-xs">⭐ Pro</Badge>}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() => {
                        if (editingHookId === hook.id) {
                          setEditingHookId(null);
                        } else {
                          setEditingHookId(hook.id);
                          setEditedHookText(hook.hookText);
                        }
                      }}
                    >
                      {editingHookId === hook.id ? <><Save className="h-3 w-3 mr-1" />Done</> : <><Pencil className="h-3 w-3 mr-1" />Edit</>}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    {editingHookId === hook.id ? (
                      <Textarea
                        value={editedHookText}
                        onChange={(e) => setEditedHookText(e.target.value)}
                        className="min-h-[80px] text-sm resize-y"
                        autoFocus
                      />
                    ) : (
                      <p className="font-semibold text-foreground leading-relaxed">"{hook.hookText}"</p>
                    )}
                  </div>
                  {hook.useCase && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">When to use:</p>
                      <p className="text-sm text-muted-foreground">{hook.useCase}</p>
                    </div>
                  )}
                  {hook.exampleExpansion && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Example expansion:</p>
                      <p className="text-sm text-muted-foreground italic">
                        {hook.exampleExpansion.length > 100 ? hook.exampleExpansion.substring(0, 100) + "..." : hook.exampleExpansion}
                      </p>
                    </div>
                  )}
                  {hookAudioUrls[hook.id] && playingHookId === hook.id && (
                    <audio
                      key={hookAudioUrls[hook.id]}
                      src={hookAudioUrls[hook.id]}
                      autoPlay
                      className="w-full h-8"
                      controls
                      onEnded={() => setPlayingHookId(null)}
                    />
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">Used {hook.usageCount ?? 0} times</span>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        onClick={() => handlePreviewVoice(hook)}
                        disabled={previewingHookId === hook.id}
                        title={hookAudioUrls[hook.id] ? (playingHookId === hook.id ? "Stop audio" : "Play audio") : "Preview with your voice"}
                      >
                        {previewingHookId === hook.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : hookAudioUrls[hook.id] && playingHookId === hook.id ? (
                          <VolumeX className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCopyHook(hook)}>
                        <Copy className="h-3 w-3 mr-1" />Copy
                      </Button>
                      <Button
                        size="sm"
                        variant={scriptPanelHookId === hook.id ? "default" : "outline"}
                        onClick={() => handleOpenScriptPanel(hook)}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />Use
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Script Generation Panel — expands below the hook card */}
              {scriptPanelHookId === hook.id && (
                <Card className="rounded-t-none border-t-0 border-primary/60 bg-primary/5">
                  <CardContent className="pt-4 pb-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Generate Script from This Hook</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => { setScriptPanelHookId(null); setGeneratedScript(null); setScriptPrompt(""); }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Hook preview */}
                    <div className="bg-background rounded-md border px-3 py-2">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Opening hook:</p>
                      <p className="text-sm font-medium text-foreground">"{getEffectiveHookText(hook)}"</p>
                    </div>

                    {/* Prompt input */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        What do you want to create? <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        placeholder='e.g., "A 60-second Instagram Reel script about why now is a great time to buy. Target first-time buyers who are nervous about the market."'
                        value={scriptPrompt}
                        onChange={(e) => setScriptPrompt(e.target.value)}
                        className="min-h-[80px] text-sm resize-none bg-background"
                      />
                    </div>

                    {/* Format + Length */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Format</Label>
                        <Select value={scriptFormat} onValueChange={(v) => setScriptFormat(v as typeof scriptFormat)}>
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="social">📱 Social Caption</SelectItem>
                            <SelectItem value="video">🎥 Video Script</SelectItem>
                            <SelectItem value="email">📧 Email</SelectItem>
                            <SelectItem value="carousel">🎠 Carousel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Length</Label>
                        <Select value={scriptLength} onValueChange={(v) => setScriptLength(v as typeof scriptLength)}>
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">Short (30–45s)</SelectItem>
                            <SelectItem value="medium">Medium (60–90s)</SelectItem>
                            <SelectItem value="long">Long (2–3 min)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleGenerateScript(hook)}
                      disabled={generateScriptMutation.isPending || !scriptPrompt.trim()}
                    >
                      {generateScriptMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" />Generate Script</>
                      )}
                    </Button>

                    {/* Generated script output */}
                    {generatedScript && (
                      <div className="space-y-3">
                        <div className="bg-background rounded-md border p-3">
                          <p className="text-xs text-muted-foreground font-medium mb-2">Generated script:</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{generatedScript}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => { navigator.clipboard.writeText(generatedScript); toast.success("Script copied!"); }}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1.5" />Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setScheduleScript(generatedScript)}
                          >
                            <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />Schedule
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setLocation(`/generate?hook=${encodeURIComponent(generatedScript)}`)}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1.5" />Post Builder
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setLocation(`/video-script-builder?script=${encodeURIComponent(generatedScript)}`)}
                          >
                            <Clapperboard className="h-3.5 w-3.5 mr-1.5" />Video Script
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Hooks Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters to find more hooks</p>
          </CardContent>
        </Card>
      )}
    </div>

    {/* Schedule to Calendar Modal */}
    {scheduleScript && (
      <ScheduleToCalendarModal
        open={!!scheduleScript}
        onClose={() => setScheduleScript(null)}
        content={scheduleScript}
        title="Hook Script"
        contentType="custom"
        sourceLabel="Hook Script"
      />
    )}
    </>
  );
}
