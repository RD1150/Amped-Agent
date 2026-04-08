import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Wand2,
  Save,
  FileText,
  Clapperboard,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Clock,
  Mic,
  Eye,
  Copy,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Scene {
  id: string;
  spokenScript: string;
  visualPrompt: string;
  durationSec?: number;
}

function generateId() {
  return `scene_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function estimateDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((words / 150) * 60); // 150 wpm
}

// ─── Scene Row Component ──────────────────────────────────────────────────────
function SceneRow({
  scene,
  index,
  total,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isGeneratingPrompt,
}: {
  scene: Scene;
  index: number;
  total: number;
  onUpdate: (id: string, field: keyof Scene, value: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isGeneratingPrompt: boolean;
}) {
  const duration = scene.durationSec ?? estimateDuration(scene.spokenScript);

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      {/* Scene header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/40 border-b border-border">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Scene {index + 1}
        </span>
        {duration > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
            <Clock className="h-3 w-3" />
            ~{duration}s
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMoveUp(scene.id)}
            disabled={index === 0}
            title="Move up"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMoveDown(scene.id)}
            disabled={index === total - 1}
            title="Move down"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onDelete(scene.id)}
            title="Delete scene"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-2 divide-x divide-border">
        {/* Left: Spoken Script */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Mic className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
              Spoken Script
            </span>
          </div>
          <Textarea
            value={scene.spokenScript}
            onChange={(e) => onUpdate(scene.id, "spokenScript", e.target.value)}
            placeholder="Type the exact words to be spoken aloud..."
            className="min-h-[120px] resize-none text-sm leading-relaxed border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Right: Visual Prompt */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Visual Direction
            </span>
            {isGeneratingPrompt && (
              <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin ml-auto" />
            )}
          </div>
          <Textarea
            value={scene.visualPrompt}
            onChange={(e) => onUpdate(scene.id, "visualPrompt", e.target.value)}
            placeholder="What to show on screen while this is spoken... (B-roll, screen demo, text overlay, animation)"
            className="min-h-[120px] resize-none text-sm leading-relaxed border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Generate from Brief Dialog ───────────────────────────────────────────────
function GenerateFromBriefDialog({
  open,
  onClose,
  onGenerated,
  agentName,
  city,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (title: string, scenes: Scene[]) => void;
  agentName?: string;
  city?: string;
}) {
  const [topic, setTopic] = useState("");
  const [videoType, setVideoType] = useState<string>("custom");
  const [duration, setDuration] = useState("60");
  const [tone, setTone] = useState<string>("professional");

  const generateMutation = trpc.videoScriptBuilder.generateFromBrief.useMutation({
    onSuccess: (data) => {
      onGenerated(data.title, data.scenes as Scene[]);
      onClose();
      toast.success(`Script generated! ${data.scenes.length} scenes created.`);
    },
    onError: (err) => {
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            Generate Script from Brief
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Topic / Brief</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Why now is a great time to sell in Austin — rising prices, low inventory, motivated buyers"
              className="min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Video Type</Label>
              <Select value={videoType} onValueChange={setVideoType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intro">Agent Intro</SelectItem>
                  <SelectItem value="market_update">Market Update</SelectItem>
                  <SelectItem value="property_tour">Property Tour</SelectItem>
                  <SelectItem value="testimonial">Testimonial</SelectItem>
                  <SelectItem value="tips">Tips / Education</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="90">90 seconds</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                  <SelectItem value="180">3 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
                <SelectItem value="authoritative">Authoritative</SelectItem>
                <SelectItem value="warm">Warm & Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() =>
              generateMutation.mutate({
                topic,
                videoType: videoType as "intro" | "market_update" | "property_tour" | "testimonial" | "tips" | "custom",
                targetDurationSec: parseInt(duration),
                agentName,
                city,
                tone: tone as "professional" | "conversational" | "authoritative" | "warm",
              })
            }
            disabled={!topic.trim() || generateMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Script
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VideoScriptBuilder() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Script list state
  const [activeScriptId, setActiveScriptId] = useState<number | null>(null);
  const [scriptTitle, setScriptTitle] = useState("Untitled Script");
  const [scenes, setScenes] = useState<Scene[]>([
    { id: generateId(), spokenScript: "", visualPrompt: "" },
  ]);
  const [isDirty, setIsDirty] = useState(false);
  const [showBriefDialog, setShowBriefDialog] = useState(false);
  const [generatingPromptsFor, setGeneratingPromptsFor] = useState<Set<string>>(new Set());

  // Persona for agent name / city
  const { data: persona } = trpc.persona.get.useQuery();

  // Saved scripts list
  const { data: savedScripts, isLoading: loadingScripts } = trpc.videoScriptBuilder.list.useQuery();

  // Mutations
  const createMutation = trpc.videoScriptBuilder.create.useMutation({
    onSuccess: (data) => {
      setActiveScriptId(data.id);
      setIsDirty(false);
      utils.videoScriptBuilder.list.invalidate();
      toast.success("Script saved!");
    },
    onError: (err) => toast.error(`Save failed: ${err.message}`),
  });

  const updateMutation = trpc.videoScriptBuilder.update.useMutation({
    onSuccess: () => {
      setIsDirty(false);
      utils.videoScriptBuilder.list.invalidate();
      toast.success("Script saved!");
    },
    onError: (err) => toast.error(`Save failed: ${err.message}`),
  });

  const deleteMutation = trpc.videoScriptBuilder.delete.useMutation({
    onSuccess: () => {
      utils.videoScriptBuilder.list.invalidate();
      toast.success("Script deleted");
    },
  });

  const generatePromptsMutation = trpc.videoScriptBuilder.generateVisualPrompts.useMutation({
    onSuccess: (data) => {
      setScenes((prev) =>
        prev.map((s) => {
          const match = data.find((d) => d.id === s.id);
          return match ? { ...s, visualPrompt: match.visualPrompt } : s;
        })
      );
      setGeneratingPromptsFor(new Set());
      setIsDirty(true);
      toast.success("Visual prompts generated!");
    },
    onError: (err) => {
      setGeneratingPromptsFor(new Set());
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  // ─── Scene operations ───────────────────────────────────────────────────────
  const addScene = useCallback(() => {
    setScenes((prev) => [...prev, { id: generateId(), spokenScript: "", visualPrompt: "" }]);
    setIsDirty(true);
  }, []);

  const updateScene = useCallback((id: string, field: keyof Scene, value: string) => {
    setScenes((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, [field]: value, durationSec: field === "spokenScript" ? estimateDuration(value) : s.durationSec }
          : s
      )
    );
    setIsDirty(true);
  }, []);

  const deleteScene = useCallback((id: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== id));
    setIsDirty(true);
  }, []);

  const moveScene = useCallback((id: string, direction: "up" | "down") => {
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
    setIsDirty(true);
  }, []);

  // ─── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (activeScriptId) {
      updateMutation.mutate({ id: activeScriptId, title: scriptTitle, scenes });
    } else {
      createMutation.mutate({ title: scriptTitle, scenes });
    }
  };

  // ─── Load saved script ──────────────────────────────────────────────────────
  const loadScript = (script: { id: number; title: string; scenes: Scene[] }) => {
    setActiveScriptId(script.id);
    setScriptTitle(script.title);
    setScenes(script.scenes.length > 0 ? script.scenes : [{ id: generateId(), spokenScript: "", visualPrompt: "" }]);
    setIsDirty(false);
  };

  // ─── New script ─────────────────────────────────────────────────────────────
  const newScript = () => {
    setActiveScriptId(null);
    setScriptTitle("Untitled Script");
    setScenes([{ id: generateId(), spokenScript: "", visualPrompt: "" }]);
    setIsDirty(false);
  };

  // ─── AI: Generate visual prompts for all scenes ─────────────────────────────
  const generateAllVisualPrompts = () => {
    const scenesWithScript = scenes.filter((s) => s.spokenScript.trim());
    if (scenesWithScript.length === 0) {
      toast.error("Write your spoken lines before generating visual prompts.");
      return;
    }
    setGeneratingPromptsFor(new Set(scenesWithScript.map((s) => s.id)));
    generatePromptsMutation.mutate({
      scenes: scenesWithScript.map((s) => ({ id: s.id, spokenScript: s.spokenScript })),
      agentName: persona?.agentName ?? user?.name ?? undefined,
      videoType: "custom",
    });
  };

  // ─── Copy full script ───────────────────────────────────────────────────────
  const copyFullScript = () => {
    const text = scenes
      .map((s, i) => `SCENE ${i + 1}\nSPOKEN: ${s.spokenScript}\nVISUAL: ${s.visualPrompt}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const totalWords = scenes.reduce((acc, s) => acc + s.spokenScript.trim().split(/\s+/).filter(Boolean).length, 0);
  const totalDuration = scenes.reduce((acc, s) => acc + (s.durationSec ?? estimateDuration(s.spokenScript)), 0);
  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  return (
    <div className="flex h-full min-h-screen bg-background">
      {/* ── Left sidebar: saved scripts ─────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Clapperboard className="h-5 w-5 text-orange-500" />
            <h2 className="font-semibold text-sm">Script Builder</h2>
          </div>
          <Button
            onClick={newScript}
            size="sm"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Script
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingScripts ? (
            <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
          ) : savedScripts && savedScripts.length > 0 ? (
            savedScripts.map((script) => (
              <button
                key={script.id}
                onClick={() => loadScript(script as { id: number; title: string; scenes: Scene[] })}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                  activeScriptId === script.id
                    ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="font-medium line-clamp-2 leading-tight">{script.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate({ id: script.id });
                      if (activeScriptId === script.id) newScript();
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0 mt-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {(script.scenes as Scene[]).length} scenes
                </div>
              </button>
            ))
          ) : (
            <div className="text-xs text-muted-foreground text-center py-8 px-2">
              No saved scripts yet. Create your first script above.
            </div>
          )}
        </div>
      </aside>

      {/* ── Main editor ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-border bg-card px-6 py-3 flex items-center gap-4">
          <Input
            value={scriptTitle}
            onChange={(e) => { setScriptTitle(e.target.value); setIsDirty(true); }}
            className="text-lg font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0 max-w-sm"
            placeholder="Script title..."
          />
          {isDirty && <Badge variant="outline" className="text-xs text-muted-foreground">Unsaved</Badge>}

          <div className="ml-auto flex items-center gap-2">
            {/* Stats */}
            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground mr-2">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {totalWords} words
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                ~{formatDuration(totalDuration)}
              </span>
            </div>

            <Button variant="outline" size="sm" onClick={copyFullScript}>
              <Copy className="h-4 w-4 mr-1.5" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateAllVisualPrompts}
              disabled={generatePromptsMutation.isPending}
            >
              {generatePromptsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-1.5" />
              )}
              AI Visuals
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBriefDialog(true)}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Generate from Brief
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </Button>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-2 px-6 py-2 bg-muted/30 border-b border-border ml-64 -ml-0">
          <div className="flex items-center gap-2 pl-[52px]">
            <Mic className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
              Spoken Script
            </span>
            <span className="text-xs text-muted-foreground ml-1">— what is said</span>
          </div>
          <div className="flex items-center gap-2 pl-4">
            <Eye className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Visual Direction
            </span>
            <span className="text-xs text-muted-foreground ml-1">— what is shown</span>
          </div>
        </div>

        {/* Scene list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {scenes.map((scene, index) => (
            <SceneRow
              key={scene.id}
              scene={scene}
              index={index}
              total={scenes.length}
              onUpdate={updateScene}
              onDelete={deleteScene}
              onMoveUp={(id) => moveScene(id, "up")}
              onMoveDown={(id) => moveScene(id, "down")}
              isGeneratingPrompt={generatingPromptsFor.has(scene.id)}
            />
          ))}

          {/* Add scene button */}
          <button
            onClick={addScene}
            className="w-full rounded-xl border-2 border-dashed border-border hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-colors py-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400"
          >
            <Plus className="h-4 w-4" />
            Add Scene
          </button>

          {/* Use with video generator CTA */}
          {scenes.some((s) => s.spokenScript.trim()) && (
            <Card className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      Ready to generate your video?
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Copy your spoken script and use it in Full Avatar Video or YouTube Builder.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
                      onClick={() => {
                        const text = scenes.map((s) => s.spokenScript).join("\n\n");
                        navigator.clipboard.writeText(text);
                        toast.success("Script copied! Paste it into Full Avatar Video or YouTube Builder.");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy Script
                    </Button>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => window.location.href = "/full-avatar-video"}
                    >
                      Use in Avatar Video
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Generate from Brief Dialog */}
      <GenerateFromBriefDialog
        open={showBriefDialog}
        onClose={() => setShowBriefDialog(false)}
        onGenerated={(title, newScenes) => {
          setScriptTitle(title);
          setScenes(newScenes);
          setIsDirty(true);
        }}
        agentName={persona?.agentName ?? user?.name ?? undefined}
        city={persona?.primaryCity ?? undefined}
      />
    </div>
  );
}
