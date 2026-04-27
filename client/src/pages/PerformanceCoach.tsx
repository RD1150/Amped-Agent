import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Loader2, Sparkles, TrendingUp, Target, MessageSquare,
  CheckCircle2, Award, Upload, Image, X, AlertCircle,
  FileText, Send, Bot, User, Zap, ChevronRight, ArrowRight,
  BarChart2, Home, Users, Phone, Video, Lightbulb, RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ContextOutput {
  strategy: string;
  talkTrack: string;
  actionSteps: string[];
}

// ── Context selection options ──────────────────────────────────────────────
const CONTEXTS = [
  {
    id: "market_shift",
    icon: BarChart2,
    label: "Market Shift",
    description: "Rates changed, inventory shifted, or buyer sentiment moved",
    color: "text-blue-600",
    bg: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    activeBg: "bg-blue-600 text-white border-blue-600",
    prompt: "The market has shifted. Give me a decisive strategy for how to position myself, what to say to clients, and the 3 most important actions I should take right now.",
  },
  {
    id: "listing_appointment",
    icon: Home,
    label: "Listing Appointment",
    description: "Prep me to win a listing appointment this week",
    color: "text-emerald-600",
    bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
    activeBg: "bg-emerald-600 text-white border-emerald-600",
    prompt: "I have a listing appointment coming up. Based on my activity and authority level, give me a decisive strategy to win it, the exact talk track I should use, and the 3 most important things I need to prepare.",
  },
  {
    id: "buyer_consultation",
    icon: Users,
    label: "Buyer Consultation",
    description: "Set expectations and convert a buyer into a committed client",
    color: "text-violet-600",
    bg: "bg-violet-50 hover:bg-violet-100 border-violet-200",
    activeBg: "bg-violet-600 text-white border-violet-600",
    prompt: "I have a buyer consultation. Give me a decisive strategy to convert them into a committed client, the exact talk track I should use, and the 3 most important actions to take before and during the meeting.",
  },
  {
    id: "lead_followup",
    icon: Phone,
    label: "Lead Follow-Up",
    description: "Re-engage a cold lead or convert a warm one",
    color: "text-orange-600",
    bg: "bg-orange-50 hover:bg-orange-100 border-orange-200",
    activeBg: "bg-orange-600 text-white border-orange-600",
    prompt: "I need to follow up with leads. Give me a decisive strategy for re-engaging cold leads and converting warm ones, the exact words to say, and the 3 most effective follow-up actions I should take this week.",
  },
  {
    id: "content_strategy",
    icon: Video,
    label: "Content Strategy",
    description: "Tell me exactly what content to create this week",
    color: "text-pink-600",
    bg: "bg-pink-50 hover:bg-pink-100 border-pink-200",
    activeBg: "bg-pink-600 text-white border-pink-600",
    prompt: "Tell me exactly what content I should create this week based on my current activity gaps and market position. Give me a decisive content plan, the specific messages I should be sending, and the 3 highest-leverage content actions I can take right now.",
  },
];

const ANALYSIS_TYPES = [
  { value: "headshot", label: "Professional Headshot" },
  { value: "listing_photo", label: "Listing Photo" },
  { value: "social_post_screenshot", label: "Social Post Screenshot" },
  { value: "video_reel", label: "Video / Reel" },
  { value: "general", label: "General" },
];

export default function PerformanceCoach() {
  const [activeTab, setActiveTab] = useState("strategy");
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [contextOutput, setContextOutput] = useState<ContextOutput | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Post analysis
  const [postContent, setPostContent] = useState("");
  const [feedback, setFeedback] = useState<any>(null);

  // Visual analysis
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState("general");
  const [additionalContext, setAdditionalContext] = useState("");
  const [visualFeedback, setVisualFeedback] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activitySummary = trpc.coach.getActivitySummary.useQuery();

  const dominanceChat = trpc.coach.dominanceChat.useMutation({
    onSuccess: (data) => {
      const reply = typeof data.reply === "string" ? data.reply : "";
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    },
    onError: (error: any) => {
      toast.error(`Coach unavailable: ${error.message}`);
      setChatMessages((prev) => prev.slice(0, -1));
    },
  });

  const analyzePost = trpc.coach.analyze.useMutation({
    onSuccess: (data: any) => {
      setFeedback(data);
      toast.success("Analysis complete!");
    },
    onError: (error: any) => toast.error(`Analysis failed: ${error.message}`),
  });

  const analyzeVisual = trpc.coach.analyzeVisual.useMutation({
    onSuccess: (data: any) => {
      setVisualFeedback(data);
      toast.success("Visual analysis complete!");
    },
    onError: (error: any) => toast.error(`Visual analysis failed: ${error.message}`),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Context selection handler ──────────────────────────────────────────
  const handleContextSelect = (contextId: string) => {
    const ctx = CONTEXTS.find((c) => c.id === contextId);
    if (!ctx) return;
    setSelectedContext(contextId);
    setContextOutput(null);

    const userMsg: ChatMessage = { role: "user", content: ctx.prompt };
    const msgs = [userMsg];
    setChatMessages(msgs);

    dominanceChat.mutate({ messages: msgs }, {
      onSuccess: (data) => {
        const reply = typeof data.reply === "string" ? data.reply : "";
        // Parse the 3-part output from the reply
        const strategyMatch = reply.match(/##?\s*Strategy[:\s]*([\s\S]*?)(?=##?\s*Talk Track|##?\s*Action|$)/i);
        const talkMatch = reply.match(/##?\s*Talk Track[:\s]*([\s\S]*?)(?=##?\s*Action|$)/i);
        const actionsMatch = reply.match(/##?\s*Action Steps?[:\s]*([\s\S]*?)$/i);

        if (strategyMatch || talkMatch || actionsMatch) {
          const rawActions = actionsMatch?.[1]?.trim() ?? "";
          const actionLines = rawActions
            .split(/\n/)
            .map((l) => l.replace(/^[-*\d.]+\s*/, "").trim())
            .filter((l) => l.length > 10)
            .slice(0, 5);

          setContextOutput({
            strategy: strategyMatch?.[1]?.trim() ?? reply,
            talkTrack: talkMatch?.[1]?.trim() ?? "",
            actionSteps: actionLines.length > 0 ? actionLines : ["Review your current pipeline", "Post one piece of content today", "Follow up with 3 leads"],
          });
        } else {
          // Fallback: show full reply as strategy
          setContextOutput({
            strategy: reply,
            talkTrack: "",
            actionSteps: [],
          });
        }
        setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      },
    });
  };

  const handleChatSend = (message?: string) => {
    const text = message ?? chatInput.trim();
    if (!text) return;
    const newMsg: ChatMessage = { role: "user", content: text };
    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    setChatInput("");
    dominanceChat.mutate({ messages: updated });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { toast.error("File too large. Max 16MB."); return; }
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) { toast.error("Please upload an image or video."); return; }
    setSelectedFile(file);
    setVisualFeedback(null);
    setPreviewUrl(URL.createObjectURL(file));
    if (isVideo && analysisType === "general") setAnalysisType("video_reel");
  };

  const handleVisualAnalyze = () => {
    if (!selectedFile) { toast.error("Please upload a file first."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      analyzeVisual.mutate({
        fileData: e.target?.result as string,
        mimeType: selectedFile.type,
        fileName: selectedFile.name,
        analysisType: analysisType as any,
        additionalContext: additionalContext || undefined,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="container max-w-6xl py-8">
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative mb-8 rounded-2xl overflow-hidden bg-[#0f172a] shadow-xl">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative px-8 py-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Award className="h-3.5 w-3.5" />
                Authority Feature
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/30">
                <Zap className="h-3.5 w-3.5" />
                Knows your activity
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2 leading-tight">
              Market Dominance Coach
            </h1>
            <p className="text-base text-orange-400 font-semibold mb-1">
              Here's what I'd focus on if I were you.
            </p>
            <p className="text-sm text-white/50 max-w-xl">
              I analyze your activity and tell you exactly what to do to win listings. Choose what you're working on and I'll give you a strategy, a talk track, and your next 3 actions.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center w-32 h-32 rounded-2xl bg-orange-500/10 border border-orange-500/20 shrink-0">
            <Target className="h-12 w-12 text-orange-400 mb-1.5" />
            <span className="text-[10px] text-slate-400 text-center leading-tight">Decisive<br/>Strategist</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 w-full max-w-2xl">
          <TabsTrigger value="strategy" className="flex-1 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Strategy Session
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex-1 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Open Chat
          </TabsTrigger>
          <TabsTrigger value="text" className="flex-1 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Analyze Post
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex-1 flex items-center gap-2">
            <Image className="h-4 w-4" />
            Analyze Visual
          </TabsTrigger>
        </TabsList>

        {/* ── STRATEGY SESSION TAB ──────────────────────────────────────── */}
        <TabsContent value="strategy">
          <div className="space-y-6">
            {/* Context picker — horizontal grid */}
            <div>
              <h2 className="text-sm font-semibold text-[#111111] mb-3">What are you working on?</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {CONTEXTS.map((ctx) => {
                  const Icon = ctx.icon;
                  const isActive = selectedContext === ctx.id;
                  return (
                    <button
                      key={ctx.id}
                      onClick={() => handleContextSelect(ctx.id)}
                      disabled={dominanceChat.isPending}
                      className={`text-left rounded-xl border px-4 py-3.5 transition-all duration-150 ${
                        isActive ? ctx.activeBg + " shadow-sm" : "bg-white border-[#E5E7EB] hover:border-[#FF6A00]/40 hover:bg-[#FFF3E8]"
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-2 ${isActive ? "text-white" : ctx.color}`} />
                      <div className={`text-sm font-semibold leading-tight ${isActive ? "text-white" : "text-[#111111]"}`}>{ctx.label}</div>
                      <div className={`text-xs mt-1 leading-snug ${isActive ? "text-white/70" : "text-[#6B7280]"}`}>{ctx.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Output area — full width */}
            <div>
              {!selectedContext && !dominanceChat.isPending && (
                <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB]">
                  <Target className="h-10 w-10 text-[#E5E7EB] mb-3" />
                  <h3 className="text-sm font-semibold text-[#6B7280] mb-1">Select a situation above</h3>
                  <p className="text-xs text-[#9CA3AF] max-w-xs">
                    I'll analyze your activity and give you a clear strategy, talk track, and next steps.
                  </p>
                </div>
              )}

              {dominanceChat.isPending && !contextOutput && (
                <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-[#E5E7EB] bg-white">
                  <Loader2 className="h-8 w-8 animate-spin text-[#FF6A00] mb-3" />
                  <p className="text-sm font-semibold text-[#111111] mb-1">Building your strategy...</p>
                  <p className="text-xs text-[#6B7280]">Analyzing your activity data</p>
                </div>
              )}

              {contextOutput && (
                <div className="space-y-4">
                  {/* Strategy */}
                  <Card className="overflow-hidden border-[#E5E7EB]">
                    <div className="px-5 py-3 flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                      <Lightbulb className="h-4 w-4 text-[#FF6A00]" />
                      <span className="text-sm font-semibold text-[#111111]">Your Strategy</span>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{contextOutput.strategy}</p>
                    </div>
                  </Card>

                  {/* Talk Track */}
                  {contextOutput.talkTrack && (
                    <Card className="overflow-hidden border-[#E5E7EB]">
                      <div className="px-5 py-3 flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                        <MessageSquare className="h-4 w-4 text-[#6B7280]" />
                        <span className="text-sm font-semibold text-[#111111]">Talk Track</span>
                        <span className="ml-auto text-xs text-[#6B7280]">Exact words to use</span>
                      </div>
                      <div className="p-5 bg-[#FAFAFA]">
                        <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap italic">"{contextOutput.talkTrack}"</p>
                      </div>
                    </Card>
                  )}

                  {/* Action Steps */}
                  {contextOutput.actionSteps.length > 0 && (
                    <Card className="overflow-hidden border-[#E5E7EB]">
                      <div className="px-5 py-3 flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-[#111111]">Your Next Actions</span>
                        <span className="ml-auto text-xs text-[#6B7280]">Do these today</span>
                      </div>
                      <div className="p-5 space-y-3">
                        {contextOutput.actionSteps.map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FF6A00] text-white text-xs font-bold shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-sm text-[#374151] leading-snug">{step}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  <button
                    onClick={() => { setSelectedContext(null); setContextOutput(null); setChatMessages([]); }}
                    className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#111111] transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Start a new session
                  </button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── OPEN CHAT TAB ─────────────────────────────────────────────── */}
        <TabsContent value="chat">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 flex flex-col">
              <Card className="flex flex-col h-[540px]">
                <div className="px-5 py-4 border-b flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0f172a] flex items-center justify-center">
                    <Bot className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Market Dominance Coach</div>
                    <div className="text-xs text-muted-foreground">Decisive · Opinionated · Personalized</div>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs text-green-600 border-green-300 bg-green-50">Live</Badge>
                </div>

                <ScrollArea className="flex-1 px-5 py-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-[#0f172a] flex items-center justify-center mb-4">
                        <Bot className="h-8 w-8 text-orange-400" />
                      </div>
                      <p className="font-semibold text-slate-700 mb-2">What are you trying to win?</p>
                      <p className="text-muted-foreground text-sm max-w-xs">
                        I've reviewed your activity. Ask me anything and I'll give you a direct answer — not a list of options.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-[#0f172a]" : "bg-slate-100"}`}>
                            {msg.role === "assistant" ? <Bot className="h-4 w-4 text-orange-400" /> : <User className="h-4 w-4 text-slate-500" />}
                          </div>
                          <div className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "assistant" ? "bg-muted text-foreground" : "bg-[#0f172a] text-white"}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {dominanceChat.isPending && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-orange-400" />
                          </div>
                          <div className="rounded-2xl px-4 py-3 bg-muted">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="px-5 py-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask your coach anything..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                      rows={2}
                      className="resize-none text-sm"
                    />
                    <Button onClick={() => handleChatSend()} disabled={dominanceChat.isPending || !chatInput.trim()} size="icon" className="h-auto bg-[#0f172a] hover:bg-slate-800">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Press Enter to send · Shift+Enter for new line</p>
                </div>
              </Card>
            </div>

            {/* Sidebar: contextual prompts + activity */}
            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  Contextual prompts
                </h3>
                <div className="space-y-2">
                  {[
                    "Fix my pipeline",
                    "Prep me for a listing appointment",
                    "Turn my activity into content",
                    "What's my biggest gap right now?",
                    "Give me one leverage move for this week",
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleChatSend(prompt)}
                      disabled={dominanceChat.isPending}
                      className="w-full text-left text-xs px-3 py-2.5 rounded-lg border border-border hover:border-orange-300 hover:bg-orange-50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  Your Activity
                  <Badge variant="outline" className="ml-auto text-xs">30 days</Badge>
                </h3>
                {activitySummary.isLoading ? (
                  <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                ) : activitySummary.data ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Authority Profile</span>
                        <span className="text-xs font-semibold">{activitySummary.data.profileScore}%</span>
                      </div>
                      <Progress value={activitySummary.data.profileScore} className="h-1.5" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        { val: activitySummary.data.postsLast30, label: "Posts" },
                        { val: activitySummary.data.videosLast30, label: "Videos" },
                        { val: activitySummary.data.blogsLast30, label: "Blogs" },
                      ].map((s) => (
                        <div key={s.label} className="text-center rounded-lg bg-muted/50 px-2 py-2">
                          <div className="text-lg font-bold text-foreground">{s.val}</div>
                          <div className="text-[10px] text-muted-foreground">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── ANALYZE POST TAB ──────────────────────────────────────────── */}
        <TabsContent value="text">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  Paste your post content
                </h3>
                <Textarea
                  placeholder="Paste your social media post, email, or any marketing copy here..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={8}
                  className="resize-none text-sm mb-3"
                />
                <Button
                  onClick={() => {
                    if (!postContent.trim() || postContent.length < 50) { toast.error("Post must be at least 50 characters."); return; }
                    analyzePost.mutate({ content: postContent });
                  }}
                  disabled={analyzePost.isPending}
                  className="w-full bg-[#0f172a] hover:bg-slate-800"
                >
                  {analyzePost.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2" />Analyze Post</>}
                </Button>
              </Card>
            </div>

            <div>
              {feedback ? (
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Analysis Results</h3>
                    <span className={`text-2xl font-bold ${feedback.overallScore >= 80 ? "text-green-600" : feedback.overallScore >= 60 ? "text-orange-500" : "text-red-600"}`}>
                      {feedback.overallScore}/100
                    </span>
                  </div>
                  {feedback.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-green-600 mb-2">Strengths</p>
                      {feedback.strengths.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-700 mb-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                  {feedback.improvements?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-2">Improvements</p>
                      {feedback.improvements.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-700 mb-1">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                  {feedback.rewriteSuggestion && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Suggested Rewrite</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{feedback.rewriteSuggestion}</p>
                    </div>
                  )}
                </Card>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
                  <FileText className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-400">Your analysis will appear here</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── ANALYZE VISUAL TAB ────────────────────────────────────────── */}
        <TabsContent value="visual">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Image className="h-4 w-4 text-orange-500" />
                  Upload photo or video
                </h3>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger className="mb-3 text-sm">
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANALYSIS_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!selectedFile ? (
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Click to upload image or video</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP, MP4, MOV · Max 16MB</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    {selectedFile.type.startsWith("image/") ? (
                      <img src={previewUrl!} alt="Preview" className="w-full h-48 object-cover" />
                    ) : (
                      <video src={previewUrl!} className="w-full h-48 object-cover" controls />
                    )}
                    <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); setVisualFeedback(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />

                <Textarea
                  placeholder="Optional: add context (e.g., 'This is for Instagram')"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={2}
                  className="resize-none text-sm mt-3"
                />

                <Button
                  onClick={handleVisualAnalyze}
                  disabled={analyzeVisual.isPending || !selectedFile}
                  className="w-full mt-3 bg-[#0f172a] hover:bg-slate-800"
                >
                  {analyzeVisual.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2" />Analyze Visual</>}
                </Button>
              </Card>
            </div>

            <div>
              {visualFeedback ? (
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Visual Analysis</h3>
                    <span className={`text-2xl font-bold ${visualFeedback.overallScore >= 80 ? "text-green-600" : visualFeedback.overallScore >= 60 ? "text-orange-500" : "text-red-600"}`}>
                      {visualFeedback.overallScore}/100
                    </span>
                  </div>
                  {visualFeedback.summary && <p className="text-sm text-slate-600 leading-relaxed">{visualFeedback.summary}</p>}
                  {visualFeedback.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-green-600 mb-2">Strengths</p>
                      {visualFeedback.strengths.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-700 mb-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />{s}
                        </div>
                      ))}
                    </div>
                  )}
                  {visualFeedback.improvements?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-2">Improvements</p>
                      {visualFeedback.improvements.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-700 mb-1">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />{s}
                        </div>
                      ))}
                    </div>
                  )}
                  {visualFeedback.priorityAction && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-orange-600 mb-1">Priority Action</p>
                      <p className="text-sm text-slate-700">{visualFeedback.priorityAction}</p>
                    </div>
                  )}
                </Card>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
                  <Image className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-400">Your visual analysis will appear here</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
