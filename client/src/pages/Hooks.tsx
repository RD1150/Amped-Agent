import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

  // Voiceover state per hook
  const [previewingHookId, setPreviewingHookId] = useState<number | null>(null);
  const [hookAudioUrls, setHookAudioUrls] = useState<Record<number, string>>({});
  const [playingHookId, setPlayingHookId] = useState<number | null>(null);

  // Fetch all hooks
  const { data: hooks, isLoading } = trpc.hooks.list.useQuery();

  // Fetch saved voice preference for the preview
  const { data: voicePref } = trpc.auth.getVoicePreference.useQuery();

  // previewVoice mutation from propertyTours router
  const previewVoiceMutation = trpc.propertyTours.previewVoice.useMutation({
    onSuccess: (data, variables) => {
      // variables contains the hookId we stored in sampleText context
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

  // Filter hooks based on search and filters
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
      buyer: "bg-blue-500/20 text-blue-500",
      seller: "bg-green-500/20 text-green-500",
      investor: "bg-purple-500/20 text-purple-500",
      local: "bg-orange-500/20 text-orange-500",
      luxury: "bg-yellow-500/20 text-yellow-500",
      relocation: "bg-pink-500/20 text-pink-500",
      general: "bg-gray-500/20 text-gray-500",
    };
    return colors[category];
  };

  const getFormatIcon = (format: HookFormat) => {
    const icons: Record<HookFormat, string> = {
      video: "🎥",
      email: "📧",
      social: "📱",
      carousel: "🎠",
    };
    return icons[format];
  };

  const getEffectiveHookText = (hook: Hook) =>
    editingHookId === hook.id ? editedHookText : hook.hookText;

  const handleUseHook = (hook: Hook) => {
    const text = getEffectiveHookText(hook);
    setLocation(`/ai-generate?hook=${encodeURIComponent(text)}`);
  };

  const handleCopyHook = (hook: Hook) => {
    const text = getEffectiveHookText(hook);
    navigator.clipboard.writeText(text);
    toast.success("Hook copied to clipboard!");
  };

  const handlePreviewVoice = (hook: Hook) => {
    const text = getEffectiveHookText(hook);

    // If already generated, toggle play/stop
    if (hookAudioUrls[hook.id]) {
      if (playingHookId === hook.id) {
        setPlayingHookId(null);
      } else {
        setPlayingHookId(hook.id);
      }
      return;
    }

    // Generate the preview
    setPreviewingHookId(hook.id);
    previewVoiceMutation.mutate({
      voiceId: voicePref?.voiceId ?? "21m00Tcm4TlvDq8ikWAM",
      sampleText: text,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Hooks Library</h1>
          <p className="text-muted-foreground mt-1">
            Browse proven hooks to start your social media posts, videos, and carousels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <TrendingUp className="h-3 w-3 mr-1" />
            {filteredHooks?.length || 0} hooks available
          </Badge>
        </div>
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
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hooks by text or use case..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
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
                  {category === "all"
                    ? "All Categories"
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Format Filter */}
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
                  {format === "all"
                    ? "All Formats"
                    : format.charAt(0).toUpperCase() + format.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hooks Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading hooks...</p>
        </div>
      ) : filteredHooks && filteredHooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHooks.map((hook: Hook) => (
            <Card
              key={hook.id}
              className="bg-card border-border hover:border-primary transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getCategoryColor(hook.category)}>{hook.category}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {getFormatIcon(hook.format)} {hook.format}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {hook.isPremium && (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ Pro
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => {
                        if (editingHookId === hook.id) {
                          setEditingHookId(null);
                        } else {
                          setEditingHookId(hook.id);
                          setEditedHookText(hook.hookText);
                        }
                      }}
                    >
                      {editingHookId === hook.id ? (
                        <>
                          <Save className="h-3 w-3 mr-1" />
                          Done
                        </>
                      ) : (
                        <>
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
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
                    <p className="font-semibold text-foreground leading-relaxed">
                      "{hook.hookText}"
                    </p>
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
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Example expansion:
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      {hook.exampleExpansion.length > 100
                        ? hook.exampleExpansion.substring(0, 100) + "..."
                        : hook.exampleExpansion}
                    </p>
                  </div>
                )}

                {/* Inline audio player when preview is available */}
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
                  <span className="text-xs text-muted-foreground">
                    Used {hook.usageCount} times
                  </span>
                  <div className="flex gap-1.5">
                    {/* Voice preview button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 gap-1"
                      onClick={() => handlePreviewVoice(hook)}
                      disabled={previewingHookId === hook.id}
                      title={
                        hookAudioUrls[hook.id]
                          ? playingHookId === hook.id
                            ? "Stop audio"
                            : "Play audio"
                          : "Preview with your voice"
                      }
                    >
                      {previewingHookId === hook.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : hookAudioUrls[hook.id] && playingHookId === hook.id ? (
                        <VolumeX className="h-3 w-3" />
                      ) : (
                        <Volume2 className="h-3 w-3" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyHook(hook)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" onClick={() => handleUseHook(hook)}>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Hooks Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find more hooks
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
