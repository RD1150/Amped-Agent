import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Copy, RefreshCw, Sparkles, BookOpen, User, Linkedin, Instagram, MessageSquare, Mic } from "lucide-react";

const QUESTIONS = [
  {
    key: "whyRealEstate" as const,
    label: "Why did you get into real estate?",
    placeholder: "e.g. I got into real estate after helping my sister navigate a really stressful home purchase. I realized how much people needed someone they could actually trust...",
    hint: "Be specific. What was the moment or experience that led you here?",
  },
  {
    key: "mostMemorableWin" as const,
    label: "What's your most memorable client win?",
    placeholder: "e.g. I helped a family of 5 find their forever home after they'd lost 4 offers in a row. We finally won by writing a personal letter to the sellers...",
    hint: "Tell a real story — the more specific, the more powerful.",
  },
  {
    key: "whatMakesYouDifferent" as const,
    label: "What makes you different from other agents?",
    placeholder: "e.g. I'm a former contractor, so I can walk through a home and immediately spot issues that other agents miss. My clients never get surprised by inspection results...",
    hint: "Avoid generic answers like 'I work hard.' What's your actual superpower?",
  },
  {
    key: "whoYouServe" as const,
    label: "Who is your ideal client?",
    placeholder: "e.g. First-time buyers who feel overwhelmed and don't know where to start. People who want someone to walk them through every step without judgment...",
    hint: "Be specific about who you love working with and why.",
  },
  {
    key: "yourMarket" as const,
    label: "What makes your market unique?",
    placeholder: "e.g. Austin is one of the fastest-growing cities in the country. Inventory is tight, prices move fast, and buyers need an agent who knows how to move quickly...",
    hint: "What do you know about your local market that others don't?",
  },
  {
    key: "personalFact" as const,
    label: "One personal fact that humanizes you",
    placeholder: "e.g. I'm a mom of three, I coach youth soccer on weekends, and I make a mean enchilada. Real estate is my career but my family is my why...",
    hint: "Something that makes you a real person, not just a professional.",
  },
];

type Answers = {
  whyRealEstate: string;
  mostMemorableWin: string;
  whatMakesYouDifferent: string;
  whoYouServe: string;
  yourMarket: string;
  personalFact: string;
};

export default function BrandStory() {
  const [answers, setAnswers] = useState<Answers>({
    whyRealEstate: "",
    mostMemorableWin: "",
    whatMakesYouDifferent: "",
    whoYouServe: "",
    yourMarket: "",
    personalFact: "",
  });
  const [agentName, setAgentName] = useState("");
  const [city, setCity] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: savedStory, isLoading: storyLoading } = trpc.brandStory.getMine.useQuery();

  const generateMutation = trpc.brandStory.generate.useMutation({
    onSuccess: () => {
      toast.success("Your brand story is ready!");
      utils.brandStory.getMine.invalidate();
    },
    onError: (err) => {
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  const deleteMutation = trpc.brandStory.delete.useMutation({
    onSuccess: () => {
      toast.success("Brand story deleted");
      utils.brandStory.getMine.invalidate();
    },
  });

  const handleGenerate = () => {
    const missing = QUESTIONS.filter((q) => !answers[q.key].trim());
    if (missing.length > 0) {
      toast.error(`Please answer all 6 questions before generating.`);
      return;
    }
    generateMutation.mutate({
      ...answers,
      agentName: agentName.trim() || undefined,
      city: city.trim() || undefined,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const loadSavedAnswers = () => {
    if (!savedStory) return;
    setAnswers({
      whyRealEstate: savedStory.whyRealEstate || "",
      mostMemorableWin: savedStory.mostMemorableWin || "",
      whatMakesYouDifferent: savedStory.whatMakesYouDifferent || "",
      whoYouServe: savedStory.whoYouServe || "",
      yourMarket: savedStory.yourMarket || "",
      personalFact: savedStory.personalFact || "",
    });
    toast.success("Previous answers loaded");
  };

  const answeredCount = QUESTIONS.filter((q) => answers[q.key].trim().length > 0).length;

  const OUTPUT_TABS = [
    { key: "shortBio", label: "Short Bio", icon: User, description: "For social media profiles & email signatures" },
    { key: "longBio", label: "Brand Story", icon: BookOpen, description: "Full narrative for your website About page" },
    { key: "elevatorPitch", label: "Elevator Pitch", icon: Mic, description: "What to say when someone asks what you do" },
    { key: "socialCaption", label: "Social Post", icon: Instagram, description: "Instagram/Facebook intro post" },
    { key: "linkedinSummary", label: "LinkedIn", icon: Linkedin, description: "LinkedIn About section" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Brand Storyteller</h1>
        <p className="text-muted-foreground mt-1">
          Answer 6 questions about your journey and let AI craft your complete brand story — bio, elevator pitch, social post, and more.
        </p>
      </div>

      {/* Saved story exists — show results first */}
      {savedStory && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Brand Story
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSavedAnswers}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Edit Answers
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate()}
                >
                  Delete
                </Button>
              </div>
            </div>
            <CardDescription>
              Generated {new Date(savedStory.createdAt).toLocaleDateString()} · Click any tab to copy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="shortBio">
              <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                {OUTPUT_TABS.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key} className="text-xs">
                    <tab.icon className="h-3.5 w-3.5 mr-1.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {OUTPUT_TABS.map((tab) => {
                const content = savedStory[tab.key as keyof typeof savedStory] as string | null;
                return (
                  <TabsContent key={tab.key} value={tab.key}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{tab.description}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => content && copyToClipboard(content, tab.label)}
                          disabled={!content}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1.5" />
                          {copiedField === tab.label ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                      <div className="bg-background border border-border rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed min-h-[120px]">
                        {content || <span className="text-muted-foreground italic">Not generated</span>}
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Interview Form */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {savedStory ? "Update Your Story" : "Tell Your Story"}
          </CardTitle>
          <CardDescription>
            Answer these 6 questions honestly and specifically. The more real you are, the better your story will be.
          </CardDescription>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${(answeredCount / 6) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{answeredCount}/6 answered</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Optional name/city */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agentName">Your Name (optional)</Label>
              <Input
                id="agentName"
                placeholder="e.g. Sarah Johnson"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Your Market (optional)</Label>
              <Input
                id="city"
                placeholder="e.g. Austin, TX"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Questions */}
          {QUESTIONS.map((q, i) => (
            <div key={q.key} className="space-y-2">
              <Label htmlFor={q.key} className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                {q.label}
                {answers[q.key].trim() && (
                  <Badge variant="secondary" className="text-xs ml-auto">✓</Badge>
                )}
              </Label>
              <Textarea
                id={q.key}
                placeholder={q.placeholder}
                value={answers[q.key]}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{q.hint}</p>
            </div>
          ))}

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || answeredCount < 6}
            className="w-full"
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Crafting your brand story…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {savedStory ? "Regenerate Brand Story" : "Generate My Brand Story"}
              </>
            )}
          </Button>
          {answeredCount < 6 && (
            <p className="text-xs text-center text-muted-foreground">
              Answer all 6 questions to unlock generation ({6 - answeredCount} remaining)
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
