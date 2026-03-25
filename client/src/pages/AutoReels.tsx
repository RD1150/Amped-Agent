import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Loader2, Video, Sparkles, Download, Copy, RefreshCw, Upload, User, Plus, X, Edit2, Share2, Pencil, Save, Mic, Play, Square, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ImageCropModal } from "@/components/ImageCropModal";
import { MARKET_VIEW_OPTIONS, DEFAULT_MARKET_VIEW, type MarketView } from "../../../shared/marketView";

type InputMethod = "bullets" | "caption" | "blog" | "listing";
type VideoLength = "30" | "60";
type Tone = "calm" | "bold" | "authoritative" | "warm";
type CaptionSize = "normal" | "large";
type CaptionStyle = "white" | "yellow" | "gold" | "none";

export default function AutoReels() {
  const [, navigate] = useLocation();
  // Check URL for pre-filled script
  const urlParams = new URLSearchParams(window.location.search);
  const scriptParam = urlParams.get('script');
  
  const [inputMethod, setInputMethod] = useState<InputMethod>("bullets");
  const [inputText, setInputText] = useState(scriptParam || "");
  const [videoLength, setVideoLength] = useState<VideoLength>("30");
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
  
  // Edit states for generated content
  const [isEditingHook, setIsEditingHook] = useState(false);
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);

  // Avatar state
  const [useAvatarIntro, setUseAvatarIntro] = useState(false);
  const [avatarImage, setAvatarImage] = useState<File | null>(null);
  const [avatarImagePreview, setAvatarImagePreview] = useState<string>("");
  const [avatarVideoUrl, setAvatarVideoUrl] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [showAvatarCropModal, setShowAvatarCropModal] = useState(false);
  const [avatarImageToCrop, setAvatarImageToCrop] = useState<string>("");

  // Background photos state (agent's own listing photos)
  const [backgroundPhotos, setBackgroundPhotos] = useState<string[]>([]); // S3 URLs
  const [backgroundPhotoFiles, setBackgroundPhotoFiles] = useState<File[]>([]); // local previews
  const [backgroundPhotoPreviews, setBackgroundPhotoPreviews] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  // Caption controls
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionSize, setCaptionSize] = useState<CaptionSize>("normal");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("white");

  // Voiceover state
  const [enableVoiceover, setEnableVoiceover] = useState(false);
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM"); // Default: Rachel
  const [voiceoverStyle, setVoiceoverStyle] = useState<"professional" | "warm" | "luxury" | "casual">("professional");
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [voicePreviewAudio, setVoicePreviewAudio] = useState<{ [key: string]: string }>({});
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Load saved voice preferences
  const { data: voicePref } = trpc.auth.getVoicePreference.useQuery();
  const { data: personaData } = trpc.persona.get.useQuery();
  const previewVoiceMutation = trpc.propertyTours.previewVoice.useMutation();

  // Load saved avatar from user profile
  const { data: currentUser } = trpc.auth.me.useQuery();
  const updateAvatarImageMutation = trpc.auth.updateAvatarImage.useMutation();
  const updateAvatarVideoMutation = trpc.auth.updateAvatarVideo.useMutation();

  // Auto-populate from saved preferences
  // Prefer cloned voice if agent has one
  useEffect(() => {
    if (personaData && (personaData as any).elevenlabsVoiceId) {
      setVoiceId((personaData as any).elevenlabsVoiceId);
    } else if (voicePref?.voiceId) {
      setVoiceId(voicePref.voiceId);
    }
    if (voicePref?.voiceoverStyle) setVoiceoverStyle(voicePref.voiceoverStyle as any);
  }, [voicePref, personaData]);

  // Restore saved avatar image and video on mount
  useEffect(() => {
    if (currentUser?.avatarImageUrl && !avatarImagePreview) {
      setAvatarImagePreview(currentUser.avatarImageUrl);
    }
    if (currentUser?.avatarVideoUrl && !avatarVideoUrl) {
      setAvatarVideoUrl(currentUser.avatarVideoUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Market Update mode state
  const [isMarketUpdateMode, setIsMarketUpdateMode] = useState(false);
  const [marketLocation, setMarketLocation] = useState("");
  const [marketData, setMarketData] = useState<any>(null);
  const [isFetchingMarket, setIsFetchingMarket] = useState(false);
  const [marketView, setMarketView] = useState<MarketView>(DEFAULT_MARKET_VIEW);

  const getMarketDataMutation = trpc.marketStats.getMarketData.useMutation();
  const generateMarketVideoMutation = trpc.marketStats.generateMarketVideo.useMutation();

  const generateMutation = trpc.autoreels.generate.useMutation();
  const renderVideoMutation = trpc.autoreels.renderVideo.useMutation();
  const saveCompletedReelMutation = trpc.autoreels.saveCompletedReel.useMutation();
  const generateAvatarIntroMutation = trpc.autoreels.generateAvatarIntro.useMutation();
  const generateContentMutation = trpc.autoreels.generateContent.useMutation();
  const { data: customTemplates = [] } = trpc.autoreels.getCustomTemplates.useQuery();
  const createTemplateMutation = trpc.autoreels.createCustomTemplate.useMutation();
  const deleteTemplateMutation = trpc.autoreels.deleteCustomTemplate.useMutation();
  const utils = trpc.useUtils();

  // Job recovery: check for any in-progress render on page load
  const { data: pendingReel } = trpc.autoreels.getLatestPendingReel.useQuery(undefined, {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!pendingReel?.shotstackRenderId || videoUrl || isGenerating) return;
    const renderId = pendingReel.shotstackRenderId;
    setIsGenerating(true);
    setGenerationStep("Resuming your video render — checking status…");
    (async () => {
      for (let i = 0; i < 72; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        try {
          await utils.autoreels.checkRenderStatus.invalidate({ renderId });
          const status = await utils.autoreels.checkRenderStatus.fetch({ renderId });
          if (status.status === "done" && status.url) {
            setVideoUrl(status.url);
            setIsGenerating(false);
            setGenerationStep("");
            toast.success("Your reel is ready!");
            // Persist the completed video URL to the database
            saveCompletedReelMutation.mutate({ renderId, videoUrl: status.url });
            return;
          }
          if (status.status === "failed") {
            setIsGenerating(false);
            setGenerationStep("");
            toast.error("The previous render failed. Please try generating again.");
            return;
          }
          setGenerationStep(`Resuming render… ${(i + 1) * 5}s elapsed`);
        } catch {
          // Network blip — keep trying
        }
      }
      setIsGenerating(false);
      setGenerationStep("");
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReel]);
  
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newTemplateLabel, setNewTemplateLabel] = useState("");
  const [newTemplatePrompt, setNewTemplatePrompt] = useState("");

  const handleBackgroundPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 20 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      toast.error('Some files were skipped (images only, max 20MB each)');
    }
    // Preview locally first
    const newPreviews: string[] = [];
    for (const file of validFiles) {
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setBackgroundPhotoFiles(prev => [...prev, ...validFiles].slice(0, 4));
    setBackgroundPhotoPreviews(prev => [...prev, ...newPreviews].slice(0, 4));
    // Upload to S3 via existing upload-images endpoint
    setIsUploadingPhotos(true);
    try {
      const formData = new FormData();
      for (const file of validFiles.slice(0, 4)) {
        formData.append('images', file);
      }
      const res = await fetch('/api/upload-images', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { urls } = await res.json();
      setBackgroundPhotos(prev => [...prev, ...urls].slice(0, 4));
      toast.success(`${urls.length} photo${urls.length > 1 ? 's' : ''} uploaded!`);
    } catch (err) {
      toast.error('Failed to upload photos. Please try again.');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const removeBackgroundPhoto = (index: number) => {
    setBackgroundPhotos(prev => prev.filter((_, i) => i !== index));
    setBackgroundPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    setBackgroundPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

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
    
    // Create preview for cropping
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarImageToCrop(reader.result as string);
      setShowAvatarCropModal(true);
    };
    reader.readAsDataURL(file);
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
      // Persist the generated video URL to user profile
      try {
        await updateAvatarVideoMutation.mutateAsync({ avatarVideoUrl: result.videoUrl });
      } catch {
        // Non-blocking
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate avatar video");
      console.error(error);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleFetchMarketData = async () => {
    if (!marketLocation.trim()) return;
    setIsFetchingMarket(true);
    try {
      const data = await getMarketDataMutation.mutateAsync({ location: marketLocation.trim(), marketView });
      setMarketData(data);
      toast.success(`Market data loaded for ${marketLocation}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch market data. Try a different location format (e.g. 'Austin, TX').");
    } finally {
      setIsFetchingMarket(false);
    }
  };

  const handleGenerateMarketVideo = async () => {
    if (!marketData) {
      toast.error("Please fetch market data first");
      return;
    }
    setIsGenerating(true);
    setGenerationStep("Generating voiceover and rendering market update video...");
    try {
      const result = await generateMarketVideoMutation.mutateAsync({
        location: marketLocation,
        medianPrice: marketData.medianPrice,
        priceChange: marketData.priceChange,
        daysOnMarket: marketData.daysOnMarket,
        activeListings: marketData.activeListings,
        inventoryChange: marketData.inventoryChange ?? 0,
        pricePerSqft: marketData.pricePerSqft,
        marketTemperature: marketData.marketTemperature,
        enableVoiceover,
        voiceId: enableVoiceover ? voiceId : undefined,
        marketView,
      });
      const renderId = result.renderId;
      if (!renderId) throw new Error('No render ID returned');
      // Poll for completion
      const maxAttempts = 72;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        setGenerationStep(`Rendering market update video... (${Math.floor((attempt + 1) * 5)}s)`);
        await utils.autoreels.checkRenderStatus.invalidate({ renderId });
        const status = await utils.autoreels.checkRenderStatus.fetch({ renderId });
        if (status.status === 'done' && status.url) {
          setVideoUrl(status.url);
          setHooks([`${marketLocation} Market Update`]);
          setSelectedHook(`${marketLocation} Market Update`);
          setScript(`Market update for ${marketLocation}: Median price $${(marketData.medianPrice / 1000).toFixed(0)}K, ${marketData.daysOnMarket} days on market, ${marketData.activeListings} active listings.`);
          const mvLabel = MARKET_VIEW_OPTIONS.find(o => o.value === marketView)?.statLabel ?? 'MoM';
          setCaption(`📊 ${marketLocation} Real Estate Market Update\n\nMedian Price: $${(marketData.medianPrice / 1000).toFixed(0)}K ${marketData.priceChange > 0 ? '↑' : '↓'} ${Math.abs(marketData.priceChange).toFixed(1)}% ${mvLabel}\nDays on Market: ${marketData.daysOnMarket}\nActive Listings: ${marketData.activeListings?.toLocaleString()}\nPrice/Sq Ft: $${marketData.pricePerSqft}\n\nFollow for weekly market updates! #RealEstate #${marketLocation.replace(/[^a-zA-Z]/g, '')} #MarketUpdate`);
          toast.success("Market update video is ready!");
          // Persist the completed video URL to the database so it appears in My Content
          saveCompletedReelMutation.mutate({ renderId, videoUrl: status.url });
          return;
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Video rendering failed');
        }
      }
      throw new Error('Video rendering timed out. Please try again.');
    } catch (error: any) {
      toast.error(error.message || "Failed to generate market update video");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter some content to generate your reel");
      return;
    }

    setIsGenerating(true);
    setGenerationStep("Generating hooks and script...");
    
    try {
      // Generate content only (no video rendering yet)
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
      
      toast.success("Script generated! Review and click 'Generate Video' when ready.");
    } catch (error: any) {
      console.error('[AutoReels] Generation error:', error);
      const errorMessage = error.message || error.data?.message || "Failed to generate script. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleRenderVideo = async () => {
    if (!selectedHook || !script || !caption) {
      toast.error("Please generate a script first");
      return;
    }

    setIsGenerating(true);
    setGenerationStep("Rendering your video...");
    
    try {
      const renderResult = await renderVideoMutation.mutateAsync({
        hook: selectedHook,
        script: script,
        caption: caption,
        videoLength,
        tone,
        enableVoiceover,
        voiceId: enableVoiceover ? voiceId : undefined,
        voiceoverStyle: enableVoiceover ? voiceoverStyle : undefined,
        backgroundImages: backgroundPhotos.length > 0 ? backgroundPhotos : undefined,
        captionsEnabled,
        captionSize,
        captionStyle,
      });
      
      if (renderResult.status === 'failed') {
        throw new Error(renderResult.error || 'Video rendering failed');
      }
      
      // Step 3: Poll for completion (while loop — avoids recursive stack overflow)
      const renderId = renderResult.renderId;
      if (!renderId) {
        throw new Error('Render submission failed — no render ID returned. Please try again.');
      }
      const maxAttempts = 72; // 6 minutes max (5s intervals)
      let done = false;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        setGenerationStep(`Rendering your video... (${Math.floor((attempt + 1) * 5)}s)`);

        // Force a fresh network request by invalidating cache before fetching
        await utils.autoreels.checkRenderStatus.invalidate({ renderId });
        const status = await utils.autoreels.checkRenderStatus.fetch({ renderId });

        if (status.status === 'done' && status.url) {
          setVideoUrl(status.url);
          toast.success("Your reel is ready!");
          done = true;
          // Persist the completed video URL to the database so it appears in My Content
          saveCompletedReelMutation.mutate({ renderId, videoUrl: status.url });
          break;
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Video rendering failed');
        }
      }

      if (!done) {
        throw new Error('Video rendering timed out after 6 minutes. Please try again.');
      }
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
          <h1 className="text-3xl font-bold">AI Reels</h1>
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
                              <p className="text-sm font-medium">Avatar image saved</p>
                              <p className="text-xs text-green-600">✓ Saved to your profile</p>
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
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm font-medium mb-2 block">Avatar Intro Preview</Label>
                    <video 
                      src={avatarVideoUrl} 
                      controls 
                      className="w-full max-w-xs rounded-lg border"
                    />
                    {/* Expiry warning */}
                    {(() => {
                      const savedAt = currentUser?.avatarVideoSavedAt;
                      if (!savedAt) return null;
                      const ageDays = Math.floor((Date.now() - new Date(savedAt).getTime()) / (1000 * 60 * 60 * 24));
                      if (ageDays >= 90) return (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600">
                          <span className="font-medium">⚠ Avatar video has expired (90 days).</span>
                          <span>Please generate a new one below.</span>
                        </div>
                      );
                      if (ageDays >= 75) return (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600">
                          <span className="font-medium">⚠ Expires in {90 - ageDays} days.</span>
                          <span>Consider regenerating your avatar intro soon.</span>
                        </div>
                      );
                      return (
                        <p className="text-xs text-green-600">✓ Valid for {90 - ageDays} more days</p>
                      );
                    })()}
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
                    { label: "Market Update", prompt: "__MARKET_UPDATE__" },
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
                      onClick={() => {
                        if (template.prompt === "__MARKET_UPDATE__") {
                          setIsMarketUpdateMode(true);
                          setEnableVoiceover(true);
                        } else {
                          setIsMarketUpdateMode(false);
                          setInputText(template.prompt);
                        }
                      }}
                      className={`text-xs ${template.prompt === "__MARKET_UPDATE__" ? "border-2 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300" : ""}`}
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
              
              {isMarketUpdateMode ? (
                <div className="space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-amber-700 dark:text-amber-300">📊 Market Update Reel</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Fetches real MLS data for your market and generates a professional stat-slide video with voiceover.</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setIsMarketUpdateMode(false); setMarketData(null); setMarketLocation(""); }}>
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                  </div>
                  {/* Market View selector */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Market View</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MARKET_VIEW_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMarketView(opt.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            marketView === opt.value
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-background border-border text-muted-foreground hover:border-amber-500/50 hover:text-foreground'
                          }`}
                          title={opt.description}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {MARKET_VIEW_OPTIONS.find(o => o.value === marketView)?.description}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Conejo Valley, CA or Austin, TX"
                      value={marketLocation}
                      onChange={(e) => setMarketLocation(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => { if (e.key === 'Enter' && marketLocation.trim()) handleFetchMarketData(); }}
                    />
                    <Button
                      onClick={handleFetchMarketData}
                      disabled={!marketLocation.trim() || isFetchingMarket}
                      className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isFetchingMarket ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {isFetchingMarket ? "Fetching..." : "Get Data"}
                    </Button>
                  </div>
                  {marketData && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {[
                        { label: "Median Price", value: `$${(marketData.medianPrice / 1000).toFixed(0)}K`, sub: `${marketData.priceChange > 0 ? '↑' : '↓'} ${Math.abs(marketData.priceChange).toFixed(1)}% ${marketData.statLabel ?? MARKET_VIEW_OPTIONS.find(o => o.value === marketView)?.statLabel ?? 'MoM'}` },
                        { label: "Days on Market", value: `${marketData.daysOnMarket}`, sub: "avg. days" },
                        { label: "Active Listings", value: `${marketData.activeListings?.toLocaleString()}`, sub: "homes for sale" },
                        { label: "Price / Sq Ft", value: `$${marketData.pricePerSqft}`, sub: "per sq ft" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-background border p-3 text-center">
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.sub}</p>
                        </div>
                      ))}
                      <div className="col-span-2 rounded-lg bg-background border p-3 text-center">
                        <p className="text-xs text-muted-foreground">Market Temperature</p>
                        <p className="text-lg font-bold">
                          {marketData.marketTemperature === 'hot' ? "🔥 Seller's Market" : marketData.marketTemperature === 'cold' ? "❄️ Buyer's Market" : "⚖️ Balanced Market"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Textarea
                  id="input-text"
                  placeholder={inputMethodPlaceholders[inputMethod]}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[200px] text-base"
                />
              )}
            </div>

            {/* Video Settings */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Video Length */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Video Length</Label>
                <RadioGroup value={videoLength} onValueChange={(v) => setVideoLength(v as VideoLength)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30" id="length-30" />
                    <Label htmlFor="length-30" className="font-normal cursor-pointer">30 seconds <span className="text-xs text-muted-foreground">(recommended)</span></Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="60" id="length-60" />
                    <Label htmlFor="length-60" className="font-normal cursor-pointer">60 seconds</Label>
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

            {/* Caption Controls */}
            <div className="border rounded-xl p-5 space-y-5 bg-gradient-to-br from-sky-500/5 to-sky-500/10 border-sky-500/20 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                    <span className="text-sky-500 font-bold text-sm">CC</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Caption Settings</h3>
                    <p className="text-xs text-muted-foreground">Control how subtitles appear on your reel</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="captions-toggle" className="text-sm text-muted-foreground">{captionsEnabled ? 'On' : 'Off'}</Label>
                  <Switch
                    id="captions-toggle"
                    checked={captionsEnabled}
                    onCheckedChange={setCaptionsEnabled}
                  />
                </div>
              </div>

              {captionsEnabled && (
                <div className="grid grid-cols-2 gap-5">
                  {/* Caption Size */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Caption Size</Label>
                    <div className="flex gap-2">
                      {(['normal', 'large'] as CaptionSize[]).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setCaptionSize(sz)}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                            captionSize === sz
                              ? 'border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-400'
                              : 'border-border bg-background text-muted-foreground hover:border-sky-400'
                          }`}
                        >
                          {sz === 'normal' ? 'Normal' : 'Large'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Caption Style */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Caption Style</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: 'white', label: 'White', preview: 'bg-black/70 text-white' },
                        { value: 'yellow', label: 'Yellow', preview: 'bg-black/70 text-yellow-300' },
                        { value: 'gold', label: 'Gold', preview: 'bg-black/60 text-amber-400' },
                        { value: 'none', label: 'No BG', preview: 'text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]' },
                      ] as { value: CaptionStyle; label: string; preview: string }[]).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setCaptionStyle(opt.value as CaptionStyle)}
                          className={`relative py-2 px-2 rounded-lg border text-xs font-medium transition-all overflow-hidden ${
                            captionStyle === opt.value
                              ? 'border-sky-500 ring-1 ring-sky-500'
                              : 'border-border hover:border-sky-400'
                          }`}
                        >
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${opt.preview}`}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Voiceover Add-On */}
            <div className="border rounded-xl p-5 space-y-4 bg-gradient-to-br from-violet-500/5 to-violet-500/10 border-violet-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Mic className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">AI Voiceover Narration</h3>
                      <span className="text-xs bg-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium">+5 credits</span>
                    </div>
                    <p className="text-xs text-muted-foreground">AI narration synced to your reel</p>
                  </div>
                </div>
                <Switch
                  checked={enableVoiceover}
                  onCheckedChange={setEnableVoiceover}
                />
              </div>

              {enableVoiceover && (
                <div className="space-y-4 pt-2">
                  {/* Voice Selector */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Voice</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Cloned voice option — shown first if agent has one */}
                      {(personaData as any)?.elevenlabsVoiceId && (
                        <div
                          className={`relative rounded-lg border p-3 cursor-pointer transition-all col-span-2 ${
                            voiceId === (personaData as any).elevenlabsVoiceId
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-border hover:border-violet-500/50"
                          }`}
                          onClick={() => setVoiceId((personaData as any).elevenlabsVoiceId)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{(personaData as any).elevenlabsVoiceName || "My Voice"}</p>
                              <p className="text-xs text-muted-foreground">Your Cloned Voice</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">Cloned</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const vid = (personaData as any).elevenlabsVoiceId;
                                  if (playingVoiceId === vid) {
                                    audioRef.current?.pause();
                                    setPlayingVoiceId(null);
                                    return;
                                  }
                                  if (voicePreviewAudio[vid]) {
                                    const audio = new Audio(voicePreviewAudio[vid]);
                                    audioRef.current = audio;
                                    audio.play();
                                    setPlayingVoiceId(vid);
                                    audio.onended = () => setPlayingVoiceId(null);
                                    return;
                                  }
                                  setPreviewingVoice(vid);
                                  try {
                                    const result = await previewVoiceMutation.mutateAsync({
                                      voiceId: vid,
                                      sampleText: "Welcome to this stunning property. I'm excited to show you around.",
                                    });
                                    setVoicePreviewAudio(prev => ({ ...prev, [vid]: result.url }));
                                    const audio = new Audio(result.url);
                                    audioRef.current = audio;
                                    audio.play();
                                    setPlayingVoiceId(vid);
                                    audio.onended = () => setPlayingVoiceId(null);
                                  } catch {
                                    toast.error("Preview failed");
                                  } finally {
                                    setPreviewingVoice(null);
                                  }
                                }}
                                disabled={previewingVoice === (personaData as any).elevenlabsVoiceId}
                              >
                                {previewingVoice === (personaData as any).elevenlabsVoiceId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : playingVoiceId === (personaData as any).elevenlabsVoiceId ? (
                                  <Square className="h-3.5 w-3.5 fill-current" />
                                ) : (
                                  <Play className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      {[
                        { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", desc: "Calm · Female" },
                        { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", desc: "Warm · Female" },
                        { id: "ErXwobaYiN019PkySvjV", name: "Antoni", desc: "Smooth · Male" },
                        { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", desc: "Deep · Male" },
                      ].map((voice) => (
                        <div
                          key={voice.id}
                          className={`relative rounded-lg border p-3 cursor-pointer transition-all ${
                            voiceId === voice.id
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-border hover:border-violet-500/50"
                          }`}
                          onClick={() => setVoiceId(voice.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{voice.name}</p>
                              <p className="text-xs text-muted-foreground">{voice.desc}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (playingVoiceId === voice.id) {
                                  audioRef.current?.pause();
                                  setPlayingVoiceId(null);
                                  return;
                                }
                                if (voicePreviewAudio[voice.id]) {
                                  const audio = new Audio(voicePreviewAudio[voice.id]);
                                  audioRef.current = audio;
                                  audio.play();
                                  setPlayingVoiceId(voice.id);
                                  audio.onended = () => setPlayingVoiceId(null);
                                  return;
                                }
                                setPreviewingVoice(voice.id);
                                try {
                                  const result = await previewVoiceMutation.mutateAsync({
                                    voiceId: voice.id,
                                    sampleText: "Welcome to this stunning property. I'm excited to show you around.",
                                  });
                                  setVoicePreviewAudio(prev => ({ ...prev, [voice.id]: result.url }));
                                  const audio = new Audio(result.url);
                                  audioRef.current = audio;
                                  audio.play();
                                  setPlayingVoiceId(voice.id);
                                  audio.onended = () => setPlayingVoiceId(null);
                                } catch {
                                  toast.error("Preview failed");
                                } finally {
                                  setPreviewingVoice(null);
                                }
                              }}
                              disabled={previewingVoice === voice.id}
                            >
                              {previewingVoice === voice.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : playingVoiceId === voice.id ? (
                                <Square className="h-3.5 w-3.5 fill-current" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Narration Style */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Narration Style</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "professional" as const, label: "Professional", desc: "Clear, credible, authoritative" },
                        { value: "warm" as const, label: "Warm", desc: "Friendly, approachable, inviting" },
                        { value: "luxury" as const, label: "Luxury", desc: "Elegant, refined, aspirational" },
                        { value: "casual" as const, label: "Casual", desc: "Conversational, relatable, fun" },
                      ].map((style) => (
                        <div
                          key={style.value}
                          className={`rounded-lg border p-3 cursor-pointer transition-all ${
                            voiceoverStyle === style.value
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-border hover:border-violet-500/50"
                          }`}
                          onClick={() => setVoiceoverStyle(style.value)}
                        >
                          <p className="text-sm font-medium">{style.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{style.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Background Photos Uploader */}
            <div className="border rounded-xl p-5 space-y-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Background Photos (Optional)</h3>
                    <p className="text-xs text-muted-foreground">Use your own listing photos as the reel background</p>
                  </div>
                </div>
              </div>

              {backgroundPhotoPreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {backgroundPhotoPreviews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={preview}
                        alt={`Background ${idx + 1}`}
                        className="h-20 w-20 object-cover rounded-lg border-2 border-blue-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => removeBackgroundPhoto(idx)}
                        className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {backgroundPhotoPreviews.length < 4 && (
                    <Label htmlFor="bg-photo-upload" className="cursor-pointer">
                      <div className="h-20 w-20 border-2 border-dashed border-blue-500/30 rounded-lg flex flex-col items-center justify-center hover:border-blue-500/60 transition-colors">
                        <Plus className="h-5 w-5 text-blue-500" />
                        <span className="text-xs text-muted-foreground mt-1">Add more</span>
                      </div>
                    </Label>
                  )}
                </div>
              )}

              {backgroundPhotoPreviews.length === 0 && (
                <Label htmlFor="bg-photo-upload" className="cursor-pointer block">
                  <div className="border-2 border-dashed border-blue-500/20 rounded-lg p-6 hover:border-blue-500/50 transition-colors text-center">
                    {isUploadingPhotos ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p className="text-sm text-muted-foreground">Uploading photos...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-blue-500/60" />
                        <p className="text-sm font-medium">Upload listing photos (up to 4)</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG — or leave empty to use our real estate backgrounds</p>
                      </div>
                    )}
                  </div>
                </Label>
              )}

              <input
                id="bg-photo-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleBackgroundPhotoChange}
                disabled={isUploadingPhotos || backgroundPhotoPreviews.length >= 4}
              />
            </div>

            {/* Generate Button */}
            <Button 
              onClick={isMarketUpdateMode ? handleGenerateMarketVideo : handleGenerate} 
              disabled={isGenerating || (isMarketUpdateMode ? !marketData : !inputText.trim())}
              size="lg"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {generationStep || "Generating..."}
                </>
              ) : isMarketUpdateMode ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {marketData ? `Generate ${marketLocation} Market Video` : "Fetch Market Data First"}
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
            <Card className="overflow-hidden border-2 border-green-500/40 shadow-lg">
              {/* Ready banner */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-white flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-bold text-lg">Your Reel is Ready!</p>
                  <p className="text-green-100 text-sm">Download it and post to Instagram, TikTok, or YouTube Shorts</p>
                </div>
              </div>

              <div className="p-6">
                {/* Vertical video player */}
                <div className="aspect-[9/16] max-w-[280px] mx-auto bg-black rounded-xl overflow-hidden shadow-xl">
                  <video src={videoUrl} controls className="w-full h-full" playsInline />
                </div>

                {/* Primary actions */}
                <div className="grid grid-cols-2 gap-3 mt-6 max-w-sm mx-auto">
                  <Button onClick={handleDownload} size="lg" className="gap-2 h-12">
                    <Download className="h-5 w-5" />
                    Download
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 h-12"
                    onClick={() => {
                      navigator.clipboard.writeText(videoUrl);
                      toast.success("Video link copied!");
                    }}
                  >
                    <Copy className="h-5 w-5" />
                    Copy Link
                  </Button>
                </div>

                {/* Secondary actions */}
                <div className="flex gap-3 mt-3 justify-center flex-wrap">
                  <Button onClick={handleRegenerate} variant="ghost" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      toast.info("Social posting coming soon! For now, download and post manually.");
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Post to Social
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Generated Content */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Hook */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Selected Hook</h3>
                <Button
                  onClick={() => setIsEditingHook(!isEditingHook)}
                  variant="ghost"
                  size="sm"
                >
                  {isEditingHook ? (
                    <><Save className="mr-2 h-4 w-4" />Done</>
                  ) : (
                    <><Pencil className="mr-2 h-4 w-4" />Edit</>
                  )}
                </Button>
              </div>
              {isEditingHook ? (
                <Textarea
                  value={selectedHook}
                  onChange={(e) => setSelectedHook(e.target.value)}
                  className="min-h-[80px] text-sm resize-y"
                  autoFocus
                />
              ) : (
                <p className="text-sm">{selectedHook}</p>
              )}
            </Card>

            {/* Script */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Video Script</h3>
                <Button
                  onClick={() => setIsEditingScript(!isEditingScript)}
                  variant="ghost"
                  size="sm"
                >
                  {isEditingScript ? (
                    <><Save className="mr-2 h-4 w-4" />Done</>
                  ) : (
                    <><Pencil className="mr-2 h-4 w-4" />Edit</>
                  )}
                </Button>
              </div>
              {isEditingScript ? (
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="min-h-[120px] text-sm resize-y"
                  autoFocus
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{script}</p>
              )}
            </Card>
          </div>

          {/* Caption */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Caption</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsEditingCaption(!isEditingCaption)}
                  variant="ghost"
                  size="sm"
                >
                  {isEditingCaption ? (
                    <><Save className="mr-2 h-4 w-4" />Done</>
                  ) : (
                    <><Pencil className="mr-2 h-4 w-4" />Edit</>
                  )}
                </Button>
                <Button onClick={handleCopyCaption} variant="ghost" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
            {isEditingCaption ? (
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[120px] text-sm resize-y"
                autoFocus
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{caption}</p>
            )}
          </Card>

          {/* Alternative Hooks */}
          {hooks.length > 1 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Alternative Hooks</h3>
              <p className="text-xs text-muted-foreground mb-3">Click any hook below to use it in your video</p>
              <div className="space-y-2">
                {hooks.map((hook, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedHook(hook)}
                    className={`w-full p-3 rounded-lg text-sm text-left transition-all ${
                      hook === selectedHook
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                        : 'bg-muted hover:bg-muted/80 cursor-pointer'
                    }`}
                  >
                    {hook === selectedHook && (
                      <span className="inline-block mr-2">✓</span>
                    )}
                    {hook}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 flex-wrap">
            <Button
              variant="outline"
              className="gap-2 text-amber-600 border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={() => {
                const params = new URLSearchParams({
                  topic: inputText.slice(0, 100) || "AI Reel",
                  body: script || inputText,
                });
                navigate(`/repurpose?${params.toString()}`);
              }}
              disabled={!script}
            >
              <Repeat2 className="h-4 w-4" />
              Repurpose Script
            </Button>
            <Button 
              onClick={handleRenderVideo}
              disabled={isGenerating}
              className="flex-1"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {generationStep || "Generating..."}
                </>
              ) : (
                <>
                  <Video className="mr-2 h-5 w-5" />
                  Generate Video
                </>
              )}
            </Button>
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
              disabled={isGenerating}
            >
              Start Over
            </Button>
          </div>
        </div>
      )}

      {/* Avatar Crop Modal */}
      <ImageCropModal
        open={showAvatarCropModal}
        onClose={() => {
          setShowAvatarCropModal(false);
          setAvatarImageToCrop("");
        }}
        imageUrl={avatarImageToCrop}
        onCropComplete={async (croppedImageUrl) => {
          // Convert base64 to File
          const response = await fetch(croppedImageUrl);
          const blob = await response.blob();
          const file = new File([blob], "avatar.png", { type: "image/png" });
          
          setAvatarImage(file);
          setAvatarImagePreview(croppedImageUrl);
          setShowAvatarCropModal(false);
          setAvatarImageToCrop("");
          toast.success("Avatar image cropped and ready!");

          // Upload to S3 and persist to user profile
          try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (uploadRes.ok) {
              const { url: s3Url } = await uploadRes.json();
              setAvatarImagePreview(s3Url);
              await updateAvatarImageMutation.mutateAsync({ avatarImageUrl: s3Url });
              toast.success("Avatar saved to your profile!");
            }
          } catch {
            // Non-blocking — avatar still works for this session
          }
        }}
      />
    </div>
  );
}
