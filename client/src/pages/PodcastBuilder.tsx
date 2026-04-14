import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Mic,
  BookOpen,
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
  Volume2,
  Video,
  Download,
  ArrowLeft,
  Clock,
  FileText,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Series = {
  id: number;
  title: string;
  description: string | null;
  seriesType: "podcast" | "book";
  category: string | null;
  authorName: string | null;
  episodeCount: number;
  createdAt: Date;
};

type Episode = {
  id: number;
  seriesId: number;
  episodeNumber: number;
  title: string;
  rawInput: string | null;
  script: string | null;
  outputType: "audio" | "avatar_video";
  audioUrl: string | null;
  videoUrl: string | null;
  durationSeconds: number | null;
  status: "draft" | "generating" | "ready" | "failed";
  errorMessage: string | null;
  creditsCost: number;
  createdAt: Date;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDuration(secs: number | null) {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function StatusBadge({ status }: { status: Episode["status"] }) {
  if (status === "ready") return <Badge className="bg-green-100 text-green-700 border-green-200">Ready</Badge>;
  if (status === "generating") return <Badge className="bg-blue-100 text-blue-700 border-blue-200 animate-pulse">Generating…</Badge>;
  if (status === "failed") return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PodcastBuilder() {
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [showNewSeries, setShowNewSeries] = useState(false);
  const [showNewEpisode, setShowNewEpisode] = useState(false);

  if (selectedEpisode && selectedSeries) {
    return (
      <EpisodeEditor
        episode={selectedEpisode}
        series={selectedSeries}
        onBack={() => setSelectedEpisode(null)}
        onUpdate={(ep) => setSelectedEpisode(ep)}
      />
    );
  }

  if (selectedSeries) {
    return (
      <SeriesView
        series={selectedSeries}
        onBack={() => setSelectedSeries(null)}
        onSelectEpisode={setSelectedEpisode}
        showNewEpisode={showNewEpisode}
        setShowNewEpisode={setShowNewEpisode}
      />
    );
  }

  return (
    <SeriesList
      onSelect={setSelectedSeries}
      showNew={showNewSeries}
      setShowNew={setShowNewSeries}
    />
  );
}

// ── Series List ───────────────────────────────────────────────────────────────

function SeriesList({
  onSelect,
  showNew,
  setShowNew,
}: {
  onSelect: (s: Series) => void;
  showNew: boolean;
  setShowNew: (v: boolean) => void;
}) {
  const { data: seriesList, refetch } = trpc.podcast.listSeries.useQuery();
  const createMutation = trpc.podcast.createSeries.useMutation({
    onSuccess: () => {
      refetch();
      setShowNew(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.podcast.deleteSeries.useMutation({
    onSuccess: () => refetch(),
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    seriesType: "podcast" as "podcast" | "book",
    category: "Real Estate",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" />
            Podcast & Book Builder
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Turn your expertise into AI-narrated audio episodes and avatar videos
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Series
        </Button>
      </div>

      {/* How it works */}
      {(!seriesList || seriesList.length === 0) && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: FileText,
              title: "1. Write or paste",
              desc: "Add your chapter notes, bullet points, or a full draft. Or just give us a topic.",
            },
            {
              icon: Sparkles,
              title: "2. AI polishes the script",
              desc: "We turn your raw ideas into a professional narration script — conversational, authoritative, ready to record.",
            },
            {
              icon: Volume2,
              title: "3. Generate audio or video",
              desc: "Produce an MP3 with your AI voice, or render a full talking-head avatar video for YouTube.",
            },
          ].map((step) => (
            <Card key={step.title} className="p-5 space-y-2">
              <div className="p-2 w-fit rounded-lg bg-primary/10">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-sm">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Series grid */}
      {seriesList && seriesList.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map((s) => (
            <Card
              key={s.id}
              className="overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              {/* Banner */}
              <div
                className={`h-20 relative flex items-center justify-center ${
                  s.seriesType === "book"
                    ? "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500"
                    : "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700"
                }`}
              >
                {s.seriesType === "book" ? (
                  <BookOpen className="h-8 w-8 text-white/80" />
                ) : (
                  <Mic className="h-8 w-8 text-white/80" />
                )}
                <Badge className="absolute top-2 right-2 text-[10px] bg-white/20 text-white border-white/30">
                  {s.seriesType === "book" ? "Book" : "Podcast"}
                </Badge>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.episodeCount} {s.seriesType === "book" ? "chapters" : "episodes"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate({ id: s.id });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {s.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                )}
                <Button
                  size="sm"
                  className="w-full gap-1.5 mt-1"
                  onClick={() => onSelect(s as Series)}
                >
                  Open <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Series Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Series</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.seriesType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, seriesType: v as "podcast" | "book" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="podcast">🎙️ Podcast Series</SelectItem>
                  <SelectItem value="book">📖 Book / Chapter Series</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                placeholder={
                  form.seriesType === "book"
                    ? "e.g. The Real Estate Playbook"
                    : "e.g. Market Mondays with Reena"
                }
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Description{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                placeholder="What is this series about?"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Create Series
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Series View (episode list) ────────────────────────────────────────────────

function SeriesView({
  series,
  onBack,
  onSelectEpisode,
  showNewEpisode,
  setShowNewEpisode,
}: {
  series: Series;
  onBack: () => void;
  onSelectEpisode: (ep: Episode) => void;
  showNewEpisode: boolean;
  setShowNewEpisode: (v: boolean) => void;
}) {
  const { data: episodes, refetch } = trpc.podcast.listEpisodes.useQuery({
    seriesId: series.id,
  });
  const createMutation = trpc.podcast.createEpisode.useMutation({
    onSuccess: () => {
      refetch();
      setShowNewEpisode(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.podcast.deleteEpisode.useMutation({
    onSuccess: () => refetch(),
  });

  const [epForm, setEpForm] = useState({ title: "", rawInput: "" });
  const label = series.seriesType === "book" ? "Chapter" : "Episode";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {series.seriesType === "book" ? (
              <BookOpen className="h-5 w-5 text-orange-500" />
            ) : (
              <Mic className="h-5 w-5 text-purple-600" />
            )}
            <h1 className="text-xl font-bold">{series.title}</h1>
          </div>
          {series.description && (
            <p className="text-sm text-muted-foreground">{series.description}</p>
          )}
        </div>
        <Button onClick={() => setShowNewEpisode(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New {label}
        </Button>
      </div>

      {/* Episode list */}
      {episodes && episodes.length === 0 && (
        <Card className="p-8 text-center space-y-3 border-dashed">
          <div className="flex justify-center">
            {series.seriesType === "book" ? (
              <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            ) : (
              <Mic className="h-10 w-10 text-muted-foreground/40" />
            )}
          </div>
          <p className="font-medium text-muted-foreground">
            No {label.toLowerCase()}s yet
          </p>
          <p className="text-sm text-muted-foreground">
            Click "New {label}" to add your first one
          </p>
        </Card>
      )}

      {episodes && episodes.length > 0 && (
        <div className="space-y-3">
          {episodes.map((ep) => (
            <Card
              key={ep.id}
              className="p-4 cursor-pointer hover:shadow-sm hover:border-primary/40 transition-all"
              onClick={() => onSelectEpisode(ep as Episode)}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                  {ep.episodeNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{ep.title}</p>
                    <StatusBadge status={ep.status} />
                    {ep.outputType === "avatar_video" && ep.status === "ready" && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Video className="h-3 w-3" />
                        Video
                      </Badge>
                    )}
                    {ep.outputType === "audio" && ep.status === "ready" && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Volume2 className="h-3 w-3" />
                        Audio
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {ep.durationSeconds && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fmtDuration(ep.durationSeconds)}
                      </span>
                    )}
                    {ep.script && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Script ready
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate({ id: ep.id });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Episode Dialog */}
      <Dialog open={showNewEpisode} onOpenChange={setShowNewEpisode}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New {label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{label} Title</Label>
              <Input
                placeholder={
                  series.seriesType === "book"
                    ? "e.g. Chapter 3: Pricing to Win"
                    : "e.g. Why Rates Are Dropping"
                }
                value={epForm.title}
                onChange={(e) => setEpForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Notes / Draft{" "}
                <span className="text-muted-foreground text-xs">
                  (optional — paste your notes or leave blank to generate from title)
                </span>
              </Label>
              <Textarea
                placeholder="Paste your chapter draft, bullet points, or talking points here…"
                rows={6}
                value={epForm.rawInput}
                onChange={(e) => setEpForm((f) => ({ ...f, rawInput: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEpisode(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createMutation.mutate({
                  seriesId: series.id,
                  title: epForm.title,
                  rawInput: epForm.rawInput || undefined,
                })
              }
              disabled={!epForm.title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Create {label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Episode Editor ────────────────────────────────────────────────────────────

function EpisodeEditor({
  episode,
  series,
  onBack,
}: {
  episode: Episode;
  series: Series;
  onBack: () => void;
  onUpdate: (ep: Episode) => void;
}) {
  const utils = trpc.useUtils();
  const [script, setScript] = useState(episode.script ?? "");
  const [targetMinutes, setTargetMinutes] = useState(5);
  const [outputType, setOutputType] = useState<"audio" | "avatar_video">("audio");
  const [isPolling, setIsPolling] = useState(false);

  // Live episode data (poll while generating)
  const { data: liveEp } = trpc.podcast.getEpisode.useQuery(
    { id: episode.id },
    { refetchInterval: isPolling ? 5000 : false }
  );
  const ep = (liveEp as Episode | undefined) ?? episode;

  // Mutations
  const saveScriptMutation = trpc.podcast.updateEpisode.useMutation({
    onSuccess: () => {
      utils.podcast.getEpisode.invalidate({ id: episode.id });
      toast.success("Script saved");
    },
  });

  const generateScriptMutation = trpc.podcast.generateScript.useMutation({
    onSuccess: (data) => {
      setScript(data.script);
      utils.podcast.getEpisode.invalidate({ id: episode.id });
      toast.success(`Script generated! ~${fmtDuration(data.durationSeconds)} estimated`);
    },
    onError: (e) => toast.error(`Script generation failed: ${e.message}`),
  });

  const generateAudioMutation = trpc.podcast.generateAudio.useMutation({
    onMutate: () => setIsPolling(true),
    onSuccess: (data) => {
      setIsPolling(false);
      utils.podcast.getEpisode.invalidate({ id: episode.id });
      toast.success(
        `Audio ready! ${fmtDuration(data.durationSeconds)} · ${data.credits} credits used`
      );
    },
    onError: (e) => {
      setIsPolling(false);
      toast.error(`Audio failed: ${e.message}`);
    },
  });

  const generateVideoMutation = trpc.podcast.generateAvatarVideo.useMutation({
    onMutate: () => setIsPolling(true),
    onSuccess: (data) => {
      setIsPolling(false);
      utils.podcast.getEpisode.invalidate({ id: episode.id });
      toast.success(
        `Avatar video ready! ${fmtDuration(data.durationSeconds)} · ${data.credits} credits used`
      );
    },
    onError: (e) => {
      setIsPolling(false);
      toast.error(`Video failed: ${e.message}`);
    },
  });

  const isGenerating =
    ep.status === "generating" ||
    generateAudioMutation.isPending ||
    generateVideoMutation.isPending;
  const label = series.seriesType === "book" ? "Chapter" : "Episode";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">{series.title}</span>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-bold">
              {label} {ep.episodeNumber}: {ep.title}
            </h1>
            <StatusBadge status={ep.status} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="script">
        <TabsList>
          <TabsTrigger value="script" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Script
          </TabsTrigger>
          <TabsTrigger value="produce" className="gap-1.5">
            <Volume2 className="h-3.5 w-3.5" />
            Produce
          </TabsTrigger>
          {ep.status === "ready" && (
            <TabsTrigger value="output" className="gap-1.5">
              <Play className="h-3.5 w-3.5" />
              Output
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Script Tab ── */}
        <TabsContent value="script" className="space-y-4 mt-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold">AI Script Generator</p>
                <p className="text-xs text-muted-foreground">
                  Turns your notes into a polished narration script
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Target length</Label>
                  <Select
                    value={String(targetMinutes)}
                    onValueChange={(v) => setTargetMinutes(Number(v))}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">~2 min</SelectItem>
                      <SelectItem value="5">~5 min</SelectItem>
                      <SelectItem value="10">~10 min</SelectItem>
                      <SelectItem value="15">~15 min</SelectItem>
                      <SelectItem value="20">~20 min</SelectItem>
                      <SelectItem value="30">~30 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    generateScriptMutation.mutate({
                      episodeId: episode.id,
                      seriesType: series.seriesType,
                      targetMinutes,
                    })
                  }
                  disabled={generateScriptMutation.isPending}
                >
                  {generateScriptMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {script ? "Regenerate" : "Generate Script"}
                </Button>
              </div>
            </div>

            {ep.rawInput && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Your notes:</p>
                <p className="line-clamp-3 whitespace-pre-wrap">{ep.rawInput}</p>
              </div>
            )}
          </Card>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Script</Label>
              {script && (
                <span className="text-xs text-muted-foreground">
                  ~{Math.ceil(script.trim().split(/\s+/).length / 130)} min ·{" "}
                  {script.trim().split(/\s+/).length} words
                </span>
              )}
            </div>
            <Textarea
              placeholder="Your script will appear here after generation, or paste/type directly…"
              rows={20}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="font-mono text-sm leading-relaxed"
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                saveScriptMutation.mutate({ id: episode.id, script })
              }
              disabled={saveScriptMutation.isPending || !script.trim()}
            >
              {saveScriptMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Save Script
            </Button>
          </div>
        </TabsContent>

        {/* ── Produce Tab ── */}
        <TabsContent value="produce" className="space-y-4 mt-4">
          {!script.trim() && (
            <Card className="p-6 text-center space-y-2 border-dashed">
              <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Generate or write a script first, then come back here to produce it.
              </p>
            </Card>
          )}

          {script.trim() && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Audio option */}
                <Card
                  className={`p-5 cursor-pointer border-2 transition-all ${
                    outputType === "audio"
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40"
                  }`}
                  onClick={() => setOutputType("audio")}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Volume2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Audio Only</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        MP3 file using your AI voice. Perfect for Spotify, Apple Podcasts, or
                        Buzzsprout.
                      </p>
                      <p className="text-xs text-primary mt-1.5">~1 credit / minute</p>
                    </div>
                  </div>
                </Card>

                {/* Avatar video option */}
                <Card
                  className={`p-5 cursor-pointer border-2 transition-all ${
                    outputType === "avatar_video"
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40"
                  }`}
                  onClick={() => setOutputType("avatar_video")}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Video className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Avatar Video</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your AI avatar reads the script on screen. Great for YouTube, LinkedIn,
                        or your website.
                      </p>
                      <p className="text-xs text-primary mt-1.5">
                        ~5 credits / minute · requires AI Avatar setup
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                disabled={isGenerating}
                onClick={() => {
                  if (outputType === "audio") {
                    generateAudioMutation.mutate({ episodeId: episode.id });
                  } else {
                    generateVideoMutation.mutate({ episodeId: episode.id });
                  }
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating… this may take a
                    few minutes
                  </>
                ) : outputType === "audio" ? (
                  <>
                    <Volume2 className="h-4 w-4" /> Generate Audio Episode
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" /> Generate Avatar Video
                  </>
                )}
              </Button>

              {isGenerating && (
                <p className="text-xs text-center text-muted-foreground">
                  {outputType === "audio"
                    ? "Audio usually takes 30–60 seconds."
                    : "Avatar video usually takes 3–8 minutes."}{" "}
                  You can leave this page and come back.
                </p>
              )}

              {ep.status === "failed" && ep.errorMessage && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{ep.errorMessage}</span>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Output Tab ── */}
        <TabsContent value="output" className="space-y-4 mt-4">
          {ep.status === "ready" && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-semibold">
                  {ep.outputType === "audio" ? "Audio episode ready!" : "Avatar video ready!"}
                </p>
              </div>

              {ep.outputType === "audio" && ep.audioUrl && (
                <div className="space-y-3">
                  <audio controls className="w-full rounded-lg" src={ep.audioUrl}>
                    Your browser does not support audio playback.
                  </audio>
                  <Button
                    variant="outline"
                    className="gap-2 w-full"
                    onClick={() => window.open(ep.audioUrl!, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                    Download MP3
                  </Button>
                </div>
              )}

              {ep.outputType === "avatar_video" && ep.videoUrl && (
                <div className="space-y-3">
                  <video
                    controls
                    className="w-full rounded-lg max-h-96"
                    src={ep.videoUrl}
                  >
                    Your browser does not support video playback.
                  </video>
                  <Button
                    variant="outline"
                    className="gap-2 w-full"
                    onClick={() => window.open(ep.videoUrl!, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                    Download Video
                  </Button>
                </div>
              )}

              {ep.durationSeconds && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duration: {fmtDuration(ep.durationSeconds)}
                  {ep.creditsCost > 0 && <> · {ep.creditsCost} credits used</>}
                </p>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
