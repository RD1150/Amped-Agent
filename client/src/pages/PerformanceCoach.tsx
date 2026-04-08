import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Loader2, Sparkles, TrendingUp, Target, MessageSquare,
  CheckCircle2, Award, Upload, Image, Video, X, AlertCircle,
  FileText
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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

const ANALYSIS_TYPES = [
  { value: "headshot", label: "Professional Headshot", description: "Evaluate your profile photo for authority and approachability" },
  { value: "listing_photo", label: "Listing Photo", description: "Get feedback on composition, lighting, and staging" },
  { value: "social_post_screenshot", label: "Social Post Screenshot", description: "Analyze a screenshot of your Instagram or Facebook post" },
  { value: "video_reel", label: "Video / Reel", description: "Review your video for hook strength, presence, and engagement" },
  { value: "general", label: "General", description: "Any image or video for general marketing feedback" },
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
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
              Market Dominance Coach
            </h1>
            <p className="text-lg text-primary font-medium mb-1">
              Your unfair advantage in any market.
            </p>
            <p className="text-sm text-white/60 max-w-xl">
              Analyze your posts, headshots, listing photos, and videos. Get AI-powered strategic feedback scored on authority, engagement, and market impact.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center w-36 h-36 rounded-2xl bg-primary/10 border border-primary/30 shrink-0">
            <Award className="h-14 w-14 text-primary/80 mb-2" />
            <span className="text-xs text-slate-400 text-center leading-tight">AI Strategy<br/>Scoring</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="mb-6 w-full max-w-md">
          <TabsTrigger value="text" className="flex-1 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Analyze Post
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex-1 flex items-center gap-2">
            <Image className="h-4 w-4" />
            Analyze Photo / Video
          </TabsTrigger>
        </TabsList>

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
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center"><Target className="h-3.5 w-3.5 mr-1.5 text-primary" />Avatar Alignment</span>
                          <span className={getScoreColor(feedback.scores.avatarAlignment)}>{feedback.scores.avatarAlignment}/100</span>
                        </div>
                        <Progress value={feedback.scores.avatarAlignment} className="h-2" />
                      </div>
                    )}
                  </div>
                  {feedback.strengths.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2 flex items-center text-primary"><CheckCircle2 className="h-4 w-4 mr-1" />Strengths</h3>
                      <ul className="space-y-1 text-sm">{feedback.strengths.map((s, i) => <li key={i} className="flex items-start"><span className="text-primary mr-2">•</span><span>{s}</span></li>)}</ul>
                    </div>
                  )}
                  {feedback.improvements.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2 flex items-center text-primary/70"><Target className="h-4 w-4 mr-1" />Suggested Improvements</h3>
                      <ul className="space-y-1 text-sm">{feedback.improvements.map((imp, i) => <li key={i} className="flex items-start"><span className="text-primary/70 mr-2">•</span><span>{imp}</span></li>)}</ul>
                    </div>
                  )}
                  <Button onClick={() => { setFeedback(null); setPostContent(""); }} variant="outline" className="w-full">Analyze Another Post</Button>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                  <div><TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>Your performance analysis will appear here</p></div>
                </div>
              )}
            </Card>
          </div>

          {feedback?.rewriteSuggestion && (
            <Card className="mt-6 p-6">
              <h3 className="font-semibold mb-3 flex items-center"><MessageSquare className="h-5 w-5 mr-2" />Optimized Version</h3>
              <div className="bg-muted p-4 rounded-lg"><p className="whitespace-pre-wrap">{feedback.rewriteSuggestion}</p></div>
              <Button onClick={() => { navigator.clipboard.writeText(feedback.rewriteSuggestion); toast.success("Copied!"); }} variant="outline" className="mt-4">Copy Optimized Version</Button>
            </Card>
          )}
        </TabsContent>

        {/* ── VISUAL ANALYSIS TAB ── */}
        <TabsContent value="visual">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-1">Upload Photo or Video</h2>
              <p className="text-sm text-muted-foreground mb-5">Upload a headshot, listing photo, social post screenshot, or video reel for expert AI feedback.</p>

              {/* Analysis Type */}
              <div className="mb-4">
                <Label className="mb-1.5 block">What are you uploading?</Label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANALYSIS_TYPES.map((t) => (
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

              {/* Drop zone */}
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors mb-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium mb-1">Click to upload</p>
                  <p className="text-sm text-muted-foreground">JPG, PNG, WebP, MP4, MOV, WebM · Max 16MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="relative mb-4 rounded-xl overflow-hidden border border-border bg-muted">
                  {selectedFile.type.startsWith("video/") ? (
                    <video src={previewUrl!} controls className="w-full max-h-56 object-contain" />
                  ) : (
                    <img src={previewUrl!} alt="Preview" className="w-full max-h-56 object-contain" />
                  )}
                  <button
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background border border-border"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
                    {selectedFile.type.startsWith("video/") ? <Video className="h-3.5 w-3.5" /> : <Image className="h-3.5 w-3.5" />}
                    {selectedFile.name} · {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB
                  </div>
                </div>
              )}

              {/* Optional context */}
              <div className="mb-5">
                <Label htmlFor="context" className="mb-1.5 block">Additional context <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="context"
                  placeholder="e.g. This is my main Instagram profile photo. I'm targeting first-time buyers in Austin."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleVisualAnalyze}
                disabled={!selectedFile || analyzeVisual.isPending}
                className="w-full"
                size="lg"
              >
                {analyzeVisual.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />Get Visual Feedback</>
                )}
              </Button>

              {analyzeVisual.isPending && (
                <p className="text-xs text-muted-foreground text-center mt-2">This may take 15–30 seconds for videos</p>
              )}
            </Card>

            {/* Results Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Visual Feedback</h2>

              {visualFeedback ? (
                <div className="space-y-5">
                  {/* Score */}
                  <div className={`rounded-xl border p-4 text-center ${getScoreBg(visualFeedback.overallScore)}`}>
                    <div className={`text-5xl font-bold ${getScoreColor(visualFeedback.overallScore)}`}>
                      {visualFeedback.overallScore}
                    </div>
                    <div className="text-sm font-medium mt-1">{getScoreLabel(visualFeedback.overallScore)} · {ANALYSIS_TYPES.find(t => t.value === analysisType)?.label}</div>
                  </div>

                  {/* Summary */}
                  <div>
                    <p className="text-sm leading-relaxed">{visualFeedback.summary}</p>
                  </div>

                  {/* Priority Action */}
                  <div className="rounded-lg bg-muted border border-primary/20 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary mb-0.5">Priority Action</p>
                        <p className="text-sm text-primary/80">{visualFeedback.priorityAction}</p>
                      </div>
                    </div>
                  </div>

                  {/* Strengths */}
                  {visualFeedback.strengths.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2 flex items-center text-primary">
                        <CheckCircle2 className="h-4 w-4 mr-1" />What's Working
                      </h3>
                      <ul className="space-y-1.5 text-sm">
                        {visualFeedback.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {visualFeedback.improvements.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2 flex items-center text-primary/70">
                        <Target className="h-4 w-4 mr-1" />How to Improve
                      </h3>
                      <ul className="space-y-2 text-sm">
                        {visualFeedback.improvements.map((imp, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{i + 1}</Badge>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    onClick={() => { setVisualFeedback(null); clearFile(); }}
                    variant="outline"
                    className="w-full"
                  >
                    Analyze Another
                  </Button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-4 py-8">
                  <div className="grid grid-cols-2 gap-3 w-full max-w-xs opacity-60">
                    {[
                      { icon: "👤", label: "Headshot" },
                      { icon: "🏠", label: "Listing Photo" },
                      { icon: "📱", label: "Social Post" },
                      { icon: "🎬", label: "Video Reel" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-dashed border-border p-3 text-center">
                        <div className="text-2xl mb-1">{item.icon}</div>
                        <div className="text-xs">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm">Upload any of the above to get<br/>specific, actionable feedback</p>
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
