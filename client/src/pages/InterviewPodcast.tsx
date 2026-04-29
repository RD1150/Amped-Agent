import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Mic,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Loader2,
  User,
  MessageSquare,
  CheckCircle2,
  Trash2,
  Play,
  Clock,
  FileText,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// ── Types ─────────────────────────────────────────────────────────────────────

type Guest = {
  id: number;
  name: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  accentColor: string | null;
  voiceName: string | null;
};

type Exchange = {
  speaker: "host" | "guest";
  text: string;
};

type Script = {
  title: string;
  description: string;
  exchanges: Exchange[];
};

type Episode = {
  id: number;
  topic: string;
  status: string;
  script: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  createdAt: Date;
  guest: Guest | null;
};

// ── Step indicator ─────────────────────────────────────────────────────────────

const steps = [
  { id: 1, label: "Choose Guest" },
  { id: 2, label: "Set Topic" },
  { id: 3, label: "Review Script" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors",
              current === step.id
                ? "bg-primary text-primary-foreground"
                : current > step.id
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {current > step.id ? <CheckCircle2 className="h-4 w-4" /> : step.id}
          </div>
          <span
            className={cn(
              "text-sm hidden sm:block",
              current === step.id ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Guest Card ─────────────────────────────────────────────────────────────────

function GuestCard({
  guest,
  selected,
  onSelect,
}: {
  guest: Guest;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border-2 p-4 transition-all hover:shadow-md",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-primary/40"
      )}
    >
      <div className="flex items-start gap-4">
        {guest.avatarUrl ? (
          <img
            src={guest.avatarUrl}
            alt={guest.name}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2"
            style={{ borderColor: guest.accentColor || "#6366f1" }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xl font-bold"
            style={{ backgroundColor: guest.accentColor || "#6366f1" }}
          >
            {guest.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{guest.name}</p>
            <Badge
              variant="secondary"
              className="text-xs"
              style={{
                backgroundColor: (guest.accentColor || "#6366f1") + "22",
                color: guest.accentColor || "#6366f1",
              }}
            >
              {guest.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{guest.bio}</p>
          {guest.voiceName && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Mic className="h-3 w-3" />
              Voice: {guest.voiceName}
            </p>
          )}
        </div>
        {selected && (
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        )}
      </div>
    </button>
  );
}

// ── Script Exchange ────────────────────────────────────────────────────────────

function ExchangeRow({
  exchange,
  index,
  guestName,
  hostName,
  onChange,
}: {
  exchange: Exchange;
  index: number;
  guestName: string;
  hostName: string;
  onChange: (text: string) => void;
}) {
  const isHost = exchange.speaker === "host";
  return (
    <div className={cn("flex gap-3", isHost ? "flex-row" : "flex-row-reverse")}>
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white mt-1",
          isHost ? "bg-primary" : "bg-amber-500"
        )}
      >
        {isHost ? hostName[0] : guestName[0]}
      </div>
      <div className={cn("flex-1 max-w-[85%]", isHost ? "" : "")}>
        <p className="text-xs text-muted-foreground mb-1 font-medium">
          {isHost ? hostName : guestName}
        </p>
        <Textarea
          value={exchange.text}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "text-sm resize-none min-h-[80px] border rounded-xl",
            isHost
              ? "bg-primary/5 border-primary/20"
              : "bg-amber-500/5 border-amber-500/20"
          )}
        />
      </div>
    </div>
  );
}

// ── Episode History Row ────────────────────────────────────────────────────────

function EpisodeRow({
  episode,
  onDelete,
}: {
  episode: Episode;
  onDelete: () => void;
}) {
  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    approved: "bg-blue-500/15 text-blue-400",
    generating: "bg-amber-500/15 text-amber-400",
    ready: "bg-green-500/15 text-green-400",
    failed: "bg-red-500/15 text-red-400",
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      {episode.guest?.avatarUrl ? (
        <img
          src={episode.guest.avatarUrl}
          alt={episode.guest.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Mic className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{episode.topic}</p>
        <p className="text-xs text-muted-foreground">
          {episode.guest?.name} · {episode.guest?.role} ·{" "}
          {new Date(episode.createdAt).toLocaleDateString()}
        </p>
      </div>
      <Badge className={cn("text-xs flex-shrink-0", statusColor[episode.status] || statusColor.draft)}>
        {episode.status}
      </Badge>
      {episode.audioUrl && (
        <a href={episode.audioUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Play className="h-4 w-4" />
          </Button>
        </a>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InterviewPodcast() {
  const { user } = useAuth();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [topic, setTopic] = useState("");
  const [numExchanges, setNumExchanges] = useState(6);
  const [script, setScript] = useState<Script | null>(null);
  const [episodeId, setEpisodeId] = useState<number | null>(null);
  const [editedExchanges, setEditedExchanges] = useState<Exchange[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  // tRPC
  const { data: guests, isLoading: guestsLoading } = trpc.interviewPodcast.getGuests.useQuery();
  const { data: episodes, refetch: refetchEpisodes } = trpc.interviewPodcast.listEpisodes.useQuery();
  const generateScriptMutation = trpc.interviewPodcast.generateScript.useMutation();
  const approveScriptMutation = trpc.interviewPodcast.approveScript.useMutation();
  const deleteEpisodeMutation = trpc.interviewPodcast.deleteEpisode.useMutation();

  // Keep editedExchanges in sync with generated script
  useEffect(() => {
    if (script) setEditedExchanges(script.exchanges);
  }, [script]);

  const handleGenerateScript = async () => {
    if (!selectedGuest) return;
    if (topic.trim().length < 10) {
      toast.error("Please enter a topic (at least 10 characters)");
      return;
    }
    try {
      const result = await generateScriptMutation.mutateAsync({
        guestId: selectedGuest.id,
        topic: topic.trim(),
        agentName: user?.name || undefined,
        numExchanges,
      });
      setScript({
        title: result.title,
        description: result.description,
        exchanges: result.exchanges as Exchange[],
      });
      setEpisodeId(result.episodeId);
      setStep(3);
      toast.success("Script generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate script");
    }
  };

  const handleApproveScript = async () => {
    if (!episodeId || !script) return;
    try {
      await approveScriptMutation.mutateAsync({
        episodeId,
        script: JSON.stringify({ ...script, exchanges: editedExchanges }),
        topic: script.title,
      });
      toast.success("Script approved and saved!");
      refetchEpisodes();
      // Reset to start
      setStep(1);
      setSelectedGuest(null);
      setTopic("");
      setScript(null);
      setEpisodeId(null);
      setActiveTab("history");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve script");
    }
  };

  const handleDeleteEpisode = async (id: number) => {
    try {
      await deleteEpisodeMutation.mutateAsync({ episodeId: id });
      refetchEpisodes();
      toast.success("Episode deleted");
    } catch {
      toast.error("Failed to delete episode");
    }
  };

  const handleExchangeChange = (index: number, text: string) => {
    setEditedExchanges((prev) => prev.map((ex, i) => (i === index ? { ...ex, text } : ex)));
  };

  const hostName = user?.name || "Host";

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" />
            AI Interview Podcast
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate interview-style podcast episodes with expert guests
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "create" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("create")}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Create
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("history")}
          >
            <FileText className="h-4 w-4 mr-1.5" />
            History
            {episodes && episodes.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs h-4 px-1">
                {episodes.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {activeTab === "create" && (
        <div className="space-y-6">
          {/* Step Indicator */}
          <StepIndicator current={step} />

          {/* ── Step 1: Choose Guest ── */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Choose Your Guest
                </CardTitle>
                <CardDescription>
                  Select an expert guest persona for your interview episode
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {guestsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  guests?.map((guest) => (
                    <GuestCard
                      key={guest.id}
                      guest={guest}
                      selected={selectedGuest?.id === guest.id}
                      onSelect={() => setSelectedGuest(guest)}
                    />
                  ))
                )}
                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!selectedGuest}
                  >
                    Next: Set Topic
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Step 2: Set Topic ── */}
          {step === 2 && selectedGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Set Your Topic
                </CardTitle>
                <CardDescription>
                  What would you like to discuss with{" "}
                  <span className="font-medium text-foreground">{selectedGuest.name}</span>?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Selected guest preview */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {selectedGuest.avatarUrl ? (
                    <img
                      src={selectedGuest.avatarUrl}
                      alt={selectedGuest.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: selectedGuest.accentColor || "#6366f1" }}
                    >
                      {selectedGuest.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{selectedGuest.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedGuest.role}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-xs"
                    onClick={() => setStep(1)}
                  >
                    Change
                  </Button>
                </div>

                {/* Topic input */}
                <div className="space-y-2">
                  <Label htmlFor="topic">Interview Topic</Label>
                  <Textarea
                    id="topic"
                    placeholder={`e.g., "How to stage a home for under $500 to maximize sale price"`}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[100px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {topic.length}/500
                  </p>
                </div>

                {/* Number of exchanges */}
                <div className="space-y-2">
                  <Label htmlFor="exchanges" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Number of Q&amp;A Exchanges
                  </Label>
                  <div className="flex items-center gap-3">
                    {[4, 6, 8, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setNumExchanges(n)}
                        className={cn(
                          "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                          numExchanges === n
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border hover:border-primary/40"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      ≈ {Math.round(numExchanges * 0.5)}-{Math.round(numExchanges * 1)} min
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerateScript}
                    disabled={generateScriptMutation.isPending || topic.trim().length < 10}
                  >
                    {generateScriptMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Script...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Script
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Step 3: Review Script ── */}
          {step === 3 && script && selectedGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Review &amp; Edit Script
                </CardTitle>
                <CardDescription>
                  Edit the script before approving. Click any text to modify it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Episode meta */}
                <div className="p-4 bg-muted/50 rounded-xl space-y-1">
                  <p className="font-semibold text-foreground">{script.title}</p>
                  <p className="text-sm text-muted-foreground">{script.description}</p>
                </div>

                <Separator />

                {/* Script exchanges */}
                <ScrollArea className="max-h-[500px] pr-2">
                  <div className="space-y-4">
                    {editedExchanges.map((exchange, i) => (
                      <ExchangeRow
                        key={i}
                        exchange={exchange}
                        index={i}
                        guestName={selectedGuest.name}
                        hostName={hostName}
                        onChange={(text) => handleExchangeChange(i, text)}
                      />
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                <div className="flex justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(2);
                      setScript(null);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    onClick={handleApproveScript}
                    disabled={approveScriptMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {approveScriptMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve Script
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Episode History
            </CardTitle>
            <CardDescription>
              All your generated interview episodes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!episodes || episodes.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Mic className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No episodes yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("create")}
                >
                  Create Your First Episode
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {episodes.map((ep) => (
                  <EpisodeRow
                    key={ep.id}
                    episode={ep as unknown as Episode}
                    onDelete={() => handleDeleteEpisode(ep.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
