import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Video, Sparkles, Download, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type InputMethod = "bullets" | "caption" | "blog" | "listing";
type VideoLength = "7" | "15" | "30";
type Tone = "calm" | "bold" | "authoritative" | "warm";

export default function AutoReels() {
  const [inputMethod, setInputMethod] = useState<InputMethod>("bullets");
  const [inputText, setInputText] = useState("");
  const [videoLength, setVideoLength] = useState<VideoLength>("15");
  const [tone, setTone] = useState<Tone>("authoritative");
  const [niche] = useState("real estate");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  
  // Generated content
  const [hooks, setHooks] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState<string>("");
  const [script, setScript] = useState("");
  const [caption, setCaption] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const inputMethodLabels = {
    bullets: "Bullet Points",
    caption: "Long Caption",
    blog: "Blog Post / Paragraph",
    listing: "Listing Description"
  };

  const inputMethodPlaceholders = {
    bullets: "• First key point\n• Second key point\n• Third key point",
    caption: "Write your long-form caption here...",
    blog: "Paste your blog post or paragraph here...",
    listing: "Paste your property listing description here..."
  };

  const generateMutation = trpc.autoreels.generate.useMutation();
  const renderVideoMutation = trpc.autoreels.renderVideo.useMutation();
  const utils = trpc.useUtils();

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter some content to generate your reel");
      return;
    }

    setIsGenerating(true);
    setGenerationStep("Generating hooks...");
    
    try {
      // Step 1: Generate content
      const result = await generateMutation.mutateAsync({
        inputText,
        inputMethod,
        videoLength,
        tone,
        niche: "real estate"
      });
      
      setHooks(result.hooks);
      setSelectedHook(result.selectedHook);
      setScript(result.script);
      setCaption(result.caption);
      
      // Step 2: Render video
      setGenerationStep("Rendering your video...");
      const renderResult = await renderVideoMutation.mutateAsync({
        hook: result.selectedHook,
        script: result.script,
        videoLength,
        tone
      });
      
      if (renderResult.status === 'failed') {
        throw new Error(renderResult.error || 'Video rendering failed');
      }
      
      // Step 3: Poll for completion
      const renderId = renderResult.renderId;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5s intervals)
      
      const pollStatus = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          throw new Error('Video rendering timeout');
        }
        
        attempts++;
        const status = await utils.autoreels.checkRenderStatus.fetch({ renderId });
        
        if (status.status === 'done' && status.url) {
          setVideoUrl(status.url);
          toast.success("Your reel is ready!");
          return;
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Video rendering failed');
        } else {
          // Still rendering, poll again in 5 seconds
          setGenerationStep(`Rendering your video... (${Math.floor(attempts * 5)}s)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          return pollStatus();
        }
      };
      
      await pollStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate reel. Please try again.");
      console.error(error);
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    toast.success("Caption copied to clipboard");
  };

  const handleDownload = () => {
    if (!videoUrl) {
      toast.error("No video to download");
      return;
    }
    
    // Download video by opening in new tab
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `autoreel-${Date.now()}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Video download started!");
  };

  const handleRegenerate = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter content first");
      return;
    }
    
    // Reset state
    setHooks([]);
    setSelectedHook("");
    setScript("");
    setCaption("");
    setVideoUrl("");
    
    // Regenerate with same input
    await handleGenerate();
  };

  const showResults = hooks.length > 0 && !isGenerating;

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Video className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AutoReels</h1>
        </div>
        <p className="text-muted-foreground">
          Generate scroll-stopping vertical videos in under 60 seconds
        </p>
      </div>

      {!showResults ? (
        /* Input Form */
        <Card className="p-8">
          {/* Input Method Selection */}
          <div className="mb-6">
            <Label className="text-base font-semibold mb-3 block">Choose Your Input Method</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(inputMethodLabels) as InputMethod[]).map((method) => (
                <Button
                  key={method}
                  variant={inputMethod === method ? "default" : "outline"}
                  className="h-auto py-4"
                  onClick={() => setInputMethod(method)}
                >
                  {inputMethodLabels[method]}
                </Button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <div className="mb-6">
            <Label htmlFor="input-text" className="text-base font-semibold mb-2 block">
              Your Content
            </Label>
            <Textarea
              id="input-text"
              placeholder={inputMethodPlaceholders[inputMethod]}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[200px] text-base"
            />
          </div>

          {/* Video Settings */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Video Length */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Video Length</Label>
              <RadioGroup value={videoLength} onValueChange={(v) => setVideoLength(v as VideoLength)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7" id="length-7" />
                  <Label htmlFor="length-7" className="font-normal cursor-pointer">7 seconds</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="15" id="length-15" />
                  <Label htmlFor="length-15" className="font-normal cursor-pointer">15 seconds</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30" id="length-30" />
                  <Label htmlFor="length-30" className="font-normal cursor-pointer">30 seconds</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Tone */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Tone</Label>
              <RadioGroup value={tone} onValueChange={(v) => setTone(v as Tone)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="calm" id="tone-calm" />
                  <Label htmlFor="tone-calm" className="font-normal cursor-pointer">Calm</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bold" id="tone-bold" />
                  <Label htmlFor="tone-bold" className="font-normal cursor-pointer">Bold</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="authoritative" id="tone-authoritative" />
                  <Label htmlFor="tone-authoritative" className="font-normal cursor-pointer">Authoritative</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="warm" id="tone-warm" />
                  <Label htmlFor="tone-warm" className="font-normal cursor-pointer">Warm</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            size="lg"
            className="w-full text-lg h-14"
            onClick={handleGenerate}
            disabled={isGenerating || !inputText.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {generationStep}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Reel
              </>
            )}
          </Button>
        </Card>
      ) : (
        /* Results View */
        <div className="space-y-6">
          {/* Hooks */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Choose Your Hook</h2>
            <div className="space-y-3">
              {hooks.map((hook, index) => (
                <button
                  key={index}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    selectedHook === hook
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedHook(hook)}
                >
                  {hook}
                </button>
              ))}
            </div>
          </Card>

          {/* Script */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Script</h2>
            <p className="text-base leading-relaxed">{script}</p>
          </Card>

          {/* Video Preview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Video</h2>
            <div className="aspect-[9/16] max-w-[360px] mx-auto bg-muted rounded-lg flex items-center justify-center">
              {videoUrl ? (
                <video src={videoUrl} controls className="w-full h-full rounded-lg" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p>Video preview will appear here</p>
                </div>
              )}
            </div>
          </Card>

          {/* Caption */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Caption</h2>
              <Button variant="outline" size="sm" onClick={handleCopyCaption}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <p className="text-base leading-relaxed whitespace-pre-wrap">{caption}</p>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button size="lg" className="flex-1" onClick={handleDownload}>
              <Download className="mr-2 h-5 w-5" />
              Download Video
            </Button>
            <Button size="lg" variant="outline" onClick={handleRegenerate}>
              <RefreshCw className="mr-2 h-5 w-5" />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
