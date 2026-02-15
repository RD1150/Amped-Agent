import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, Video, AlertCircle, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

const AVATAR_PRESETS = [
  {
    id: "professional-woman",
    name: "Professional Woman",
    url: "https://create-images-results.d-id.com/google-oauth2%7C111070296763681365279/upl_-8xJyKJqN2Rl9xGwTgPQn/image.jpeg",
    description: "Confident, professional female presenter"
  },
  {
    id: "professional-man",
    name: "Professional Man",
    url: "https://create-images-results.d-id.com/google-oauth2%7C111070296763681365279/upl_Kq8Nqv0K2TFmQjpXjOPQn/image.jpeg",
    description: "Confident, professional male presenter"
  },
  {
    id: "friendly-woman",
    name: "Friendly Woman",
    url: "https://create-images-results.d-id.com/google-oauth2%7C111070296763681365279/upl_9xJyKJqN2Rl9xGwTgPQn/image.jpeg",
    description: "Warm, approachable female presenter"
  },
  {
    id: "friendly-man",
    name: "Friendly Man",
    url: "https://create-images-results.d-id.com/google-oauth2%7C111070296763681365279/upl_7xJyKJqN2Rl9xGwTgPQn/image.jpeg",
    description: "Warm, approachable male presenter"
  },
];

const VOICE_PRESETS = [
  { id: "en-US-JennyNeural", name: "Jenny (US Female)", description: "Professional, clear" },
  { id: "en-US-GuyNeural", name: "Guy (US Male)", description: "Confident, authoritative" },
  { id: "en-US-AriaNeural", name: "Aria (US Female)", description: "Friendly, conversational" },
  { id: "en-US-DavisNeural", name: "Davis (US Male)", description: "Warm, engaging" },
];

export default function ScriptToReel() {
  const [script, setScript] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_PRESETS[0]);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [needsWatermark, setNeedsWatermark] = useState(false);

  const { data: usage, isLoading: usageLoading } = trpc.reels.getUsage.useQuery();
  const generateMutation = trpc.reels.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedVideoUrl(data.videoUrl);
      setNeedsWatermark(data.needsWatermark);
      toast.success(`Reel Generated! ${data.usage.remaining} reels remaining this month.`);
    },
    onError: (error) => {
      toast.error(`Generation Failed: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!script.trim()) {
      toast.error("Please enter a script for your reel.");
      return;
    }

    if (script.length > 1000) {
      toast.error("Script too long. Please keep it under 1000 characters (~150 words for 60 seconds).");
      return;
    }

    generateMutation.mutate({
      script: script.trim(),
      avatarUrl: selectedAvatar.url,
      voiceId: selectedVoice.id,
    });
  };

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.round((wordCount / 2.5) * 10) / 10; // ~150 words/min = 2.5 words/sec

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Script-to-Reel Generator</h1>
        <p className="text-muted-foreground">
          Transform your script into a professional talking avatar video with AI
        </p>
      </div>

      {/* Usage Stats */}
      {usage && (
        <Alert className="mb-6">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>{usage.remaining} of {usage.limit} reels remaining</strong> this month ({usage.tier} tier)
            {usage.tier === "free" && " • Upgrade to Pro for 30 reels/month without watermark"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input */}
        <div className="space-y-6">
          {/* Script Input */}
          <Card>
            <CardHeader>
              <CardTitle>Your Script</CardTitle>
              <CardDescription>
                Write what you want your avatar to say (max 60 seconds)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Example: Hi, I'm Sarah, and today I want to share 3 insider tips for first-time home buyers that can save you thousands..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={8}
                className="resize-none font-mono text-sm"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{wordCount} words • ~{estimatedDuration}s duration</span>
                <span className={script.length > 1000 ? "text-destructive font-semibold" : ""}>
                  {script.length}/1000 characters
                </span>
              </div>
              {estimatedDuration > 60 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Script is too long. Maximum duration is 60 seconds (~150 words).
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Avatar Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Avatar</CardTitle>
              <CardDescription>Select a presenter for your video</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {AVATAR_PRESETS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedAvatar.id === avatar.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-xs font-semibold">{avatar.name}</p>
                      <p className="text-white/70 text-[10px]">{avatar.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Voice Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Voice</CardTitle>
              <CardDescription>Select a voice for your avatar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {VOICE_PRESETS.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice)}
                    className={`text-left p-3 rounded-lg border-2 transition-all ${
                      selectedVoice.id === voice.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold text-sm">{voice.name}</p>
                    <p className="text-xs text-muted-foreground">{voice.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !script.trim() || estimatedDuration > 60}
            size="lg"
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Reel...
              </>
            ) : (
              <>
                <Video className="mr-2 h-5 w-5" />
                Generate Talking Avatar Reel
              </>
            )}
          </Button>
        </div>

        {/* Right Column: Preview/Result */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {generatedVideoUrl ? "Your generated reel" : "Your reel will appear here"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generateMutation.isPending ? (
                <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Generating your talking avatar...</p>
                  <p className="text-xs text-muted-foreground mt-2">This may take 1-2 minutes</p>
                </div>
              ) : generatedVideoUrl ? (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      src={generatedVideoUrl}
                      controls
                      className="w-full rounded-lg"
                      autoPlay
                    />
                    {needsWatermark && (
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Created with AuthorityContent.co
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={generatedVideoUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                  {needsWatermark && (
                    <Alert>
                      <Sparkles className="h-4 w-4" />
                      <AlertDescription>
                        Upgrade to Pro to remove watermarks and get 30 reels per month
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
                  <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">No reel generated yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a script and click generate
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pro Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold">✍️ Keep it conversational</p>
                <p className="text-muted-foreground">Write like you're talking to a friend, not reading a textbook</p>
              </div>
              <div>
                <p className="font-semibold">⏱️ Aim for 30-45 seconds</p>
                <p className="text-muted-foreground">Short videos perform better on social media (~100-120 words)</p>
              </div>
              <div>
                <p className="font-semibold">🎯 Start with a hook</p>
                <p className="text-muted-foreground">Grab attention in the first 3 seconds with a question or bold statement</p>
              </div>
              <div>
                <p className="font-semibold">📱 End with a CTA</p>
                <p className="text-muted-foreground">Tell viewers what to do next (follow, comment, DM, etc.)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
