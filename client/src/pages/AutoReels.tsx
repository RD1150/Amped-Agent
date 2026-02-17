import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Loader2, Video, Sparkles, Download, Copy, RefreshCw, Upload, User, Plus, X, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  
  // Avatar state
  const [useAvatarIntro, setUseAvatarIntro] = useState(false);
  const [avatarImage, setAvatarImage] = useState<File | null>(null);
  const [avatarImagePreview, setAvatarImagePreview] = useState<string>("");
  const [avatarVideoUrl, setAvatarVideoUrl] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

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
  const generateAvatarIntroMutation = trpc.autoreels.generateAvatarIntro.useMutation();
  const generateContentMutation = trpc.autoreels.generateContent.useMutation();
  const { data: customTemplates = [] } = trpc.autoreels.getCustomTemplates.useQuery();
  const createTemplateMutation = trpc.autoreels.createCustomTemplate.useMutation();
  const deleteTemplateMutation = trpc.autoreels.deleteCustomTemplate.useMutation();
  const utils = trpc.useUtils();
  
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newTemplateLabel, setNewTemplateLabel] = useState("");
  const [newTemplatePrompt, setNewTemplatePrompt] = useState("");

  const handleAvatarImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }
    
    setAvatarImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    toast.success("Avatar image selected");
  };

  const handleGenerateAvatarVideo = async () => {
    if (!avatarImage) {
      toast.error("Please upload an avatar image first");
      return;
    }
    
    if (!selectedHook) {
      toast.error("Please generate a reel first to create an avatar intro");
      return;
    }
    
    setIsGeneratingAvatar(true);
    
    try {
      // Upload image to S3
      const formData = new FormData();
      formData.append('file', avatarImage);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload avatar image');
      }
      
      const { url: imageUrl } = await uploadResponse.json();
      
      // Generate avatar video with D-ID
      const result = await generateAvatarIntroMutation.mutateAsync({
        avatarImageUrl: imageUrl,
        introScript: selectedHook
      });
      
      setAvatarVideoUrl(result.videoUrl);
      toast.success("Avatar intro video generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate avatar video");
      console.error(error);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

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
        caption: result.caption,
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
      console.error('[AutoReels] Generation error:', error);
      console.error('[AutoReels] Error details:', {
        message: error.message,
        data: error.data,
        cause: error.cause,
        stack: error.stack
      });
      
      const errorMessage = error.message || error.data?.message || "Failed to generate reel. Please try again.";
      toast.error(errorMessage);
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
          <h1 className="text-3xl font-bold">Authority Reels Engine</h1>
        </div>
        <p className="text-muted-foreground">
          Generate scroll-stopping vertical videos in under 60 seconds
        </p>
      </div>

      {!showResults ? (
        /* Input Form */
        <div className="space-y-6">
          {/* Avatar Upload Section */}
          <Card className="p-6 bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">AI Avatar Intro (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload your headshot to create a personalized AI avatar that introduces your reels. Your avatar will speak the hook at the beginning of your video.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Recommended Headshot Specs:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• <strong>Size:</strong> 512×512px (square, 1:1 ratio)</li>
                    <li>• <strong>Format:</strong> JPG or PNG, under 5MB</li>
                    <li>• <strong>Framing:</strong> Head and shoulders, face centered, looking at camera</li>
                    <li>• <strong>Quality:</strong> Well-lit, clear, professional headshot style</li>
                  </ul>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Avatar Image Upload */}
                  <div className="flex-1">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 hover:border-primary/50 transition-colors">
                        {avatarImagePreview ? (
                          <div className="flex items-center gap-3">
                            <img 
                              src={avatarImagePreview} 
                              alt="Avatar preview" 
                              className="h-16 w-16 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Avatar image uploaded</p>
                              <p className="text-xs text-muted-foreground">Click to change</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-center">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm font-medium">Upload Avatar Image</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                          </div>
                        )}
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarImageChange}
                      />
                    </Label>
                  </div>
                  
                  {/* Generate Avatar Video Button */}
                  {avatarImagePreview && selectedHook && (
                    <div className="flex-1 flex flex-col justify-center">
                      <Button
                        onClick={handleGenerateAvatarVideo}
                        disabled={isGeneratingAvatar}
                        className="w-full"
                      >
                        {isGeneratingAvatar ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Avatar Video...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Avatar Intro
                          </>
                        )}
                      </Button>
                      {avatarVideoUrl && (
                        <p className="text-xs text-green-600 mt-2 text-center">✓ Avatar intro ready!</p>
                      )}
                    </div>
                  )}
                </div>
                
                {avatarVideoUrl && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium mb-2 block">Avatar Intro Preview</Label>
                    <video 
                      src={avatarVideoUrl} 
                      controls 
                      className="w-full max-w-xs rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Main Input Form */}
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="input-text" className="text-base font-semibold">
                  Your Content
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const topic = prompt("What topic would you like to create content about?");
                    if (!topic) return;
                    
                    setIsGeneratingContent(true);
                    try {
                      const result = await generateContentMutation.mutateAsync({
                        topic,
                        inputMethod
                      });
                      setInputText(result.content);
                      toast.success("Content generated! Edit as needed.");
                    } catch (error) {
                      toast.error("Failed to generate content");
                      console.error(error);
                    } finally {
                      setIsGeneratingContent(false);
                    }
                  }}
                  disabled={isGeneratingContent}
                  className="gap-2"
                >
                  {isGeneratingContent ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
              
              {/* Quick Prompts */}
              <div className="space-y-3 mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Quick Prompts</p>
                  <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        <Plus className="h-3 w-3" />
                        Add Custom
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Custom Template</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="template-label">Template Name</Label>
                          <Input
                            id="template-label"
                            placeholder="e.g., Open House Promo"
                            value={newTemplateLabel}
                            onChange={(e) => setNewTemplateLabel(e.target.value)}
                            maxLength={100}
                          />
                        </div>
                        <div>
                          <Label htmlFor="template-prompt">Prompt</Label>
                          <Textarea
                            id="template-prompt"
                            placeholder="e.g., Create an engaging post about an upcoming open house event"
                            value={newTemplatePrompt}
                            onChange={(e) => setNewTemplatePrompt(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowTemplateDialog(false);
                            setNewTemplateLabel("");
                            setNewTemplatePrompt("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!newTemplateLabel.trim() || !newTemplatePrompt.trim()) {
                              toast.error("Please fill in both fields");
                              return;
                            }
                            try {
                              await createTemplateMutation.mutateAsync({
                                label: newTemplateLabel,
                                prompt: newTemplatePrompt,
                              });
                              await utils.autoreels.getCustomTemplates.invalidate();
                              toast.success("Template created!");
                              setShowTemplateDialog(false);
                              setNewTemplateLabel("");
                              setNewTemplatePrompt("");
                            } catch (error) {
                              toast.error("Failed to create template");
                            }
                          }}
                          disabled={createTemplateMutation.isPending}
                        >
                          {createTemplateMutation.isPending ? "Creating..." : "Create"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {/* Default templates */}
                  {[
                    { label: "Market Update", prompt: "Create a market update post about current real estate trends in my area" },
                    { label: "Listing Promo", prompt: "Create a promotional post for a new luxury listing" },
                    { label: "Buyer Tips", prompt: "Share 3 essential tips for first-time home buyers" },
                    { label: "Seller Advice", prompt: "Explain how to prepare a home for sale to maximize value" },
                    { label: "Neighborhood Spotlight", prompt: "Highlight the best features of a desirable neighborhood" },
                    { label: "Local Business Spotlight", prompt: "Spotlight a local business (shop, restaurant, or service) that makes our community special" },
                    { label: "Local Events", prompt: "Highlight upcoming local events, festivals, or community gatherings in my area" },
                    { label: "Community Charity", prompt: "Spotlight a local charity, nonprofit, or community cause that's making a difference" },
                    { label: "Hidden Gems", prompt: "Share hidden gems and lesser-known spots in my market that locals love" }
                  ].map((template) => (
                    <Button
                      key={template.label}
                      variant="secondary"
                      size="sm"
                      onClick={() => setInputText(template.prompt)}
                      className="text-xs"
                    >
                      {template.label}
                    </Button>
                  ))}
                  
                  {/* Custom templates */}
                  {customTemplates.map((template) => (
                    <div key={template.id} className="relative group">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setInputText(template.prompt)}
                        className="text-xs pr-8 border-2 border-primary/20"
                      >
                        {template.label}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await deleteTemplateMutation.mutateAsync({ id: template.id });
                            await utils.autoreels.getCustomTemplates.invalidate();
                            toast.success("Template deleted");
                          } catch (error) {
                            toast.error("Failed to delete template");
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
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
              onClick={handleGenerate} 
              disabled={isGenerating || !inputText.trim()}
              size="lg"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {generationStep || "Generating..."}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate My Reel
                </>
              )}
            </Button>
          </Card>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          {/* Video Preview */}
          {videoUrl && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Reel</h2>
              <div className="aspect-[9/16] max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
                <video src={videoUrl} controls className="w-full h-full" />
              </div>
              
              <div className="flex gap-3 mt-6 justify-center">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={handleRegenerate} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </Card>
          )}

          {/* Generated Content */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Hook */}
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Selected Hook</h3>
              <p className="text-sm">{selectedHook}</p>
            </Card>

            {/* Script */}
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Video Script</h3>
              <p className="text-sm whitespace-pre-wrap">{script}</p>
            </Card>
          </div>

          {/* Caption */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Caption</h3>
              <Button onClick={handleCopyCaption} variant="ghost" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <p className="text-sm whitespace-pre-wrap">{caption}</p>
          </Card>

          {/* Alternative Hooks */}
          {hooks.length > 1 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Alternative Hooks</h3>
              <div className="space-y-2">
                {hooks.filter(h => h !== selectedHook).map((hook, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                    {hook}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Start Over Button */}
          <Button 
            onClick={() => {
              setHooks([]);
              setSelectedHook("");
              setScript("");
              setCaption("");
              setVideoUrl("");
              setInputText("");
            }}
            variant="outline"
            className="w-full"
          >
            Start Over
          </Button>
        </div>
      )}
    </div>
  );
}
