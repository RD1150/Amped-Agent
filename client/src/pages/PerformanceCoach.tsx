import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Loader2, Sparkles, TrendingUp, Target, MessageSquare,
  CheckCircle2, Award, Upload, Image, Video, X, AlertCircle,
  FileText, Send, Bot, User, Zap
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

interface CoachFeedback {
  overallScore: number;
  scores: {
    engagement: number;
    clarity: number;
    cta: number;
    authority: number;
    avatarAlignment?: number;
    brandAlignment?: number;
    marketRelevance?: number;
  };
  strengths: string[];
  improvements: string[];
  rewriteSuggestion: string;
}

interface VisualFeedback {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  priorityAction: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const ANALYSIS_TYPES = [
  { value: "headshot", label: "Professional Headshot", description: "Evaluate your profile photo for authority and approachability" },
  { value: "listing_photo", label: "Listing Photo", description: "Get feedback on composition, lighting, and staging" },
  { value: "social_post_screenshot", label: "Social Post Screenshot", description: "Analyze a screenshot of your Instagram or Facebook post" },
  { value: "video_reel", label: "Video / Reel", description: "Review your video for hook strength, presence, and engagement" },
  { value: "general", label: "General", description: "Any image or video for general marketing feedback" },
];

const STARTER_PROMPTS = [
  "What should I focus on this week to win more listings?",
  "How do I build more authority in my local market?",
  "What content strategy will get me the most leads?",
  "How do I stand out against bigger teams in my area?",
  "What's the fastest way to grow my sphere of influence?",
];

export default function PerformanceCoach() {
  const [postContent, setPostContent] = useState("");
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);

  // Visual analysis state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<string>("general");
  const [additionalContext, setAdditionalContext] = useState("");
  const [visualFeedback, setVisualFeedback] = useState<VisualFeedback | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dominance Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const analyzePost = trpc.coach.analyze.useMutation({
    onSuccess: (data: CoachFeedback) => {
      setFeedback(data);
      toast.success("Analysis complete!");
    },
    onError: (error: any) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const analyzeVisual = trpc.coach.analyzeVisual.useMutation({
    onSuccess: (data: VisualFeedback) => {
      setVisualFeedback(data);
      toast.success("Visual analysis complete!");
    },
    onError: (error: any) => {
      toast.error(`Visual analysis failed: ${error.message}`);
    },
  });

  const dominanceChat = trpc.coach.dominanceChat.useMutation({
    onSuccess: (data) => {
      const reply = typeof data.reply === 'string' ? data.reply : '';
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    },
    onError: (error: any) => {
      toast.error(`Coach unavailable: ${error.message}`);
      // Remove the optimistic user message on error
      setChatMessages(prev => prev.slice(0, -1));
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleAnalyze = () => {
    if (!postContent.trim()) {
      toast.error("Please enter post content to analyze");
      return;
    }
    if (postContent.length < 50) {
      toast.error("Post content is too short. Please enter at least 50 characters.");
      return;
    }
    analyzePost.mutate({ content: postContent });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 16MB limit
    if (file.size > 16 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 16MB.");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Please upload an image (JPG, PNG, WebP) or video (MP4, MOV, WebM).");
      return;
    }

    setSelectedFile(file);
    setVisualFeedback(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Auto-set analysis type based on file type
    if (isVideo && analysisType === "general") {
      setAnalysisType("video_reel");
    }
  };

  const handleVisualAnalyze = () => {
    if (!selectedFile) {
      toast.error("Please upload a photo or video first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target?.result as string;
      analyzeVisual.mutate({
        fileData,
        mimeType: selectedFile.type,
        fileName: selectedFile.name,
        analysisType: analysisType as any,
        additionalContext: additionalContext || undefined,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setVisualFeedback(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChatSend = (message?: string) => {
    const text = message ?? chatInput.trim();
    if (!text) return;

    const newMessage: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    setChatInput("");

    dominanceChat.mutate({
      messages: updatedMessages,
    });
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-primary/70";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Work";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-primary/5 border-primary/20";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="container max-w-6xl py-8">
      {/* Hero Banner */}
      <div className="relative mb-10 rounded-2xl overflow-hidden bg-[#0F0F0F] border border-primary/30 shadow-xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative px-8 py-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/30">
                <Award className="h-3.5 w-3.5" />
                Agency Feature
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/30">
                <Zap className="h-3.5 w-3.5" />
                Personalized to your activity
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
              Market Dominance Coach
            </h1>
            <p className="text-lg text-primary font-medium mb-1">
              Your unfair advantage in any market.
            </p>
            <p className="text-sm text-white/60 max-w-xl">
              Analyze your posts, headshots, listing photos, and videos — or chat directly with your AI coach for personalized strategy based on your actual platform activity.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center w-36 h-36 rounded-2xl bg-primary/10 border border-primary/30 shrink-0">
            <Award className="h-14 w-14 text-primary/80 mb-2" />
            <span className="text-xs text-slate-400 text-center leading-tight">AI Strategy<br/>Scoring</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="mb-6 w-full max-w-2xl">
          <TabsTrigger value="chat" className="flex-1 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Strategy Chat
          </TabsTrigger>
          <TabsTrigger value="text" className="flex-1 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Analyze Post
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex-1 flex items-center gap-2">
            <Image className="h-4 w-4" />
            Analyze Photo / Video
          </TabsTrigger>
        </TabsList>

        {/* ── STRATEGY CHAT TAB ── */}
        <TabsContent value="chat">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Chat Window */}
            <div className="md:col-span-2 flex flex-col">
              <Card className="flex flex-col h-[540px]">
                <div className="px-5 py-4 border-b flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Market Dominance Coach</div>
                    <div className="text-xs text-muted-foreground">Knows your activity · Gives real advice</div>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs text-green-600 border-green-300 bg-green-50">
                    Live
                  </Badge>
                </div>

                <ScrollArea className="flex-1 px-5 py-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Bot className="h-8 w-8 text-primary/60" />
                      </div>
                      <p className="text-muted-foreground text-sm max-w-xs">
                        Your coach has reviewed your platform activity and is ready to give you specific, personalized strategy. Ask anything.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            msg.role === "assistant" ? "bg-primary/10" : "bg-slate-100"
                          }`}>
                            {msg.role === "assistant"
                              ? <Bot className="h-4 w-4 text-primary" />
                              : <User className="h-4 w-4 text-slate-500" />
                            }
                          </div>
                          <div className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === "assistant"
                              ? "bg-muted text-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {dominanceChat.isPending && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
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
                      placeholder="Ask your coach anything about your market strategy..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleChatKeyDown}
                      rows={2}
                      className="resize-none text-sm"
                    />
                    <Button
                      onClick={() => handleChatSend()}
                      disabled={dominanceChat.isPending || !chatInput.trim()}
                      size="icon"
                      className="h-auto"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Press Enter to send · Shift+Enter for new line</p>
                </div>
              </Card>
            </div>

            {/* Starter Prompts */}
            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Ask your coach
                </h3>
                <div className="space-y-2">
                  {STARTER_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleChatSend(prompt)}
                      disabled={dominanceChat.isPending}
                      className="w-full text-left text-xs px-3 py-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-5 bg-primary/5 border-primary/20">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  How this works
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your coach automatically reviews your last 30 days of activity — videos created, guides generated, presentations built, credits used, and your subscription tier — then gives you advice that's specific to <em>you</em>, not generic tips.
                </p>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── TEXT ANALYSIS TAB ── */}
        <TabsContent value="text">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Post</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="postContent">Post Content</Label>
                  <Textarea
                    id="postContent"
                    placeholder="Paste your post content here for analysis..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows={12}
                    className="mt-1.5"
                  />
                  <p className="text-sm text-muted-foreground mt-1">{postContent.length} characters</p>
                </div>
                <Button onClick={handleAnalyze} disabled={analyzePost.isPending} className="w-full" size="lg">
                  {analyzePost.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Analyze Post</>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Performance Analysis</h2>
              {feedback ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${getScoreColor(feedback.overallScore)}`}>{feedback.overallScore}</div>
                    <div className="text-sm text-muted-foreground mt-1">{getScoreLabel(feedback.overallScore)}</div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Engagement Potential", key: "engagement" },
                      { label: "Clarity & Readability", key: "clarity" },
                      { label: "Call-to-Action Strength", key: "cta" },
                      { label: "Authority & Credibility", key: "authority" },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{label}</span>
                          <span className={getScoreColor((feedback.scores as any)[key])}>{(feedback.scores as any)[key]}/100</span>
                        </div>
                        <Progress value={(feedback.scores as any)[key]} className="h-2" />
                      </div>
                    ))}
                    {feedback.scores.avatarAlignment !== undefined && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Avatar Alignment</span>
                          <span className={getScoreColor(feedback.scores.avatarAlignment)}>{feedback.scores.avatarAlignment}/100</span>
                        </div>
                        <Progress value={feedback.scores.avatarAlignment} className="h-2" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {feedback.strengths.length > 0 && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <div className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />Strengths
                        </div>
                        <ul className="text-xs text-green-800 space-y-1">
                          {feedback.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                      </div>
                    )}
                    {feedback.improvements.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <div className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                          <Target className="h-3.5 w-3.5" />Improvements
                        </div>
                        <ul className="text-xs text-amber-800 space-y-1">
                          {feedback.improvements.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                      </div>
                    )}
                    {feedback.rewriteSuggestion && (
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                        <div className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />Suggested Rewrite
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{feedback.rewriteSuggestion}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Your performance analysis will appear here after you analyze a post.</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ── VISUAL ANALYSIS TAB ── */}
        <TabsContent value="visual">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Photo or Video</h2>
              <div className="space-y-4">
                <div>
                  <Label>Analysis Type</Label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANALYSIS_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <div>
                            <div className="font-medium">{t.label}</div>
                            <div className="text-xs text-muted-foreground">{t.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!selectedFile ? (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WebP, MP4, MOV, WebM · Max 16MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    {selectedFile.type.startsWith("image/") ? (
                      <img src={previewUrl!} alt="Preview" className="w-full h-48 object-cover" />
                    ) : (
                      <video src={previewUrl!} className="w-full h-48 object-cover" controls />
                    )}
                    <button
                      onClick={clearFile}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                    <div className="p-3 bg-muted/50">
                      <p className="text-xs text-muted-foreground truncate">{selectedFile.name}</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="additionalContext">Additional Context (optional)</Label>
                  <Textarea
                    id="additionalContext"
                    placeholder="e.g. This is for Instagram, targeting first-time buyers in Austin..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                    className="mt-1.5"
                  />
                </div>

                <Button
                  onClick={handleVisualAnalyze}
                  disabled={analyzeVisual.isPending || !selectedFile}
                  className="w-full"
                  size="lg"
                >
                  {analyzeVisual.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Analyze {selectedFile?.type.startsWith("video/") ? "Video" : "Photo"}</>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Visual Analysis</h2>
              {visualFeedback ? (
                <div className="space-y-5">
                  <div className={`rounded-xl border p-4 text-center ${getScoreBg(visualFeedback.overallScore)}`}>
                    <div className={`text-4xl font-bold ${getScoreColor(visualFeedback.overallScore)}`}>{visualFeedback.overallScore}</div>
                    <div className="text-sm text-muted-foreground mt-1">{getScoreLabel(visualFeedback.overallScore)}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm leading-relaxed">{visualFeedback.summary}</p>
                  </div>
                  {visualFeedback.strengths.length > 0 && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <div className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />Strengths
                      </div>
                      <ul className="text-xs text-green-800 space-y-1">
                        {visualFeedback.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                  )}
                  {visualFeedback.improvements.length > 0 && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <div className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />Improvements
                      </div>
                      <ul className="text-xs text-amber-800 space-y-1">
                        {visualFeedback.improvements.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                  )}
                  {visualFeedback.priorityAction && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                      <div className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" />Priority Action
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{visualFeedback.priorityAction}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Image className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Upload a photo or video to get AI-powered visual feedback.</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tips Section */}
      <Card className="mt-6 p-6">
        <h3 className="font-semibold mb-3">💡 Market Dominance Tips</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div><strong>Hook in first line:</strong> Grab attention immediately with a question, stat, or bold statement.</div>
          <div><strong>Clear CTA:</strong> Tell readers exactly what to do next — DM, comment, visit link, etc.</div>
          <div><strong>Show authority:</strong> Include specific numbers, local knowledge, or unique insights to build credibility.</div>
        </div>
      </Card>
    </div>
  );
}
