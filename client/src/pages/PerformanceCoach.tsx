import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, TrendingUp, Target, MessageSquare, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

export default function PerformanceCoach() {
  const [postContent, setPostContent] = useState("");
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);

  const analyzePost = trpc.coach.analyze.useMutation({
    onSuccess: (data: CoachFeedback) => {
      setFeedback(data);
      toast.success("Analysis complete!");
    },
    onError: (error: any) => {
      toast.error(`Analysis failed: ${error.message}`);
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Work";
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Market Dominance Coach</h1>
        <p className="text-muted-foreground">
          Get strategic positioning feedback to dominate your local market
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
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
              <p className="text-sm text-muted-foreground mt-1">
                {postContent.length} characters
              </p>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={analyzePost.isPending}
              className="w-full"
              size="lg"
            >
              {analyzePost.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Post
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Feedback Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Analysis</h2>

          {feedback ? (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                  {feedback.overallScore}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {getScoreLabel(feedback.overallScore)}
                </div>
              </div>

              {/* Individual Scores */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Engagement Potential</span>
                    <span className={getScoreColor(feedback.scores.engagement)}>
                      {feedback.scores.engagement}/100
                    </span>
                  </div>
                  <Progress value={feedback.scores.engagement} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Clarity & Readability</span>
                    <span className={getScoreColor(feedback.scores.clarity)}>
                      {feedback.scores.clarity}/100
                    </span>
                  </div>
                  <Progress value={feedback.scores.clarity} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Call-to-Action Strength</span>
                    <span className={getScoreColor(feedback.scores.cta)}>
                      {feedback.scores.cta}/100
                    </span>
                  </div>
                  <Progress value={feedback.scores.cta} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Authority & Credibility</span>
                    <span className={getScoreColor(feedback.scores.authority)}>
                      {feedback.scores.authority}/100
                    </span>
                  </div>
                  <Progress value={feedback.scores.authority} className="h-2" />
                </div>

                {/* Personalized Scores */}
                {feedback.scores.avatarAlignment !== undefined && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center">
                        <Target className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Customer Avatar Alignment
                      </span>
                      <span className={getScoreColor(feedback.scores.avatarAlignment)}>
                        {feedback.scores.avatarAlignment}/100
                      </span>
                    </div>
                    <Progress value={feedback.scores.avatarAlignment} className="h-2" />
                  </div>
                )}

                {feedback.scores.brandAlignment !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center">
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Brand Values Alignment
                      </span>
                      <span className={getScoreColor(feedback.scores.brandAlignment)}>
                        {feedback.scores.brandAlignment}/100
                      </span>
                    </div>
                    <Progress value={feedback.scores.brandAlignment} className="h-2" />
                  </div>
                )}

                {feedback.scores.marketRelevance !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center">
                        <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Market Relevance
                      </span>
                      <span className={getScoreColor(feedback.scores.marketRelevance)}>
                        {feedback.scores.marketRelevance}/100
                      </span>
                    </div>
                    <Progress value={feedback.scores.marketRelevance} className="h-2" />
                  </div>
                )}
              </div>

              {/* Strengths */}
              {feedback.strengths.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center text-green-600">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Strengths
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {feedback.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {feedback.improvements.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center text-yellow-600">
                    <Target className="h-4 w-4 mr-1" />
                    Suggested Improvements
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {feedback.improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-yellow-600 mr-2">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={() => {
                  setFeedback(null);
                  setPostContent("");
                }}
                variant="outline"
                className="w-full"
              >
                Analyze Another Post
              </Button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground">
              <div>
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Your performance analysis will appear here</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Rewrite Suggestion */}
      {feedback?.rewriteSuggestion && (
        <Card className="mt-6 p-6">
          <h3 className="font-semibold mb-3 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Optimized Version
          </h3>
          <div className="bg-muted p-4 rounded-lg">
            <p className="whitespace-pre-wrap">{feedback.rewriteSuggestion}</p>
          </div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(feedback.rewriteSuggestion);
              toast.success("Copied to clipboard!");
            }}
            variant="outline"
            className="mt-4"
          >
            Copy Optimized Version
          </Button>
        </Card>
      )}

      {/* Tips Section */}
      <Card className="mt-6 p-6">
        <h3 className="font-semibold mb-3">💡 Performance Tips</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Hook in first line:</strong> Grab attention immediately with a question, stat, or bold statement.
          </div>
          <div>
            <strong>Clear CTA:</strong> Tell readers exactly what to do next - DM, comment, visit link, etc.
          </div>
          <div>
            <strong>Show authority:</strong> Include specific numbers, local knowledge, or unique insights to build credibility.
          </div>
        </div>
      </Card>
    </div>
  );
}
