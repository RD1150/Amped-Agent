import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Video, Loader2, Download, Trash2, Play, Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ImageCropModal } from "@/components/ImageCropModal";
import { compressVideo } from "@/lib/videoCompression";
import { MusicLibrary } from "@/components/MusicLibrary";

export default function PropertyTours() {
  const utils = trpc.useUtils();

  // Form state
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<"modern" | "luxury" | "cozy">("modern");
  const [duration, setDuration] = useState(30);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [generatingTourId, setGeneratingTourId] = useState<number | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [includeBranding, setIncludeBranding] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [musicTrack, setMusicTrack] = useState<string | undefined>(undefined);
  const [musicTrackUrl, setMusicTrackUrl] = useState<string | undefined>(undefined);
  const [musicVolume, setMusicVolume] = useState(50);
  const [cardTemplate, setCardTemplate] = useState<"modern" | "luxury" | "bold" | "classic" | "contemporary">("modern");
  const [includeIntroVideo, setIncludeIntroVideo] = useState(false);
  const [videoMode, setVideoMode] = useState<"standard" | "full-ai">("standard");
  const [enableVoiceover, setEnableVoiceover] = useState(false);
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM"); // Rachel - professional female
  const [showScriptEditor, setShowScriptEditor] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [customScript, setCustomScript] = useState("");
  const [customCameraPrompt, setCustomCameraPrompt] = useState("");
  const [perPhotoMovements, setPerPhotoMovements] = useState<string[]>([]);
  const [movementSpeed, setMovementSpeed] = useState<"slow" | "fast">("fast");
  const [enableAvatarOverlay, setEnableAvatarOverlay] = useState(false);
  const [avatarOverlayPosition, setAvatarOverlayPosition] = useState<"bottom-left" | "bottom-right">("bottom-left");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Queries
  const { data: tours, isLoading: toursLoading } = trpc.propertyTours.list.useQuery();
  const { data: creditCost } = trpc.credits.calculateCost.useQuery({ videoMode, enableVoiceover });
  const { data: balance } = trpc.credits.getBalance.useQuery();
  const { data: dailyUsage } = trpc.rateLimit.getDailyUsage.useQuery();

  // Mutations
  const uploadImages = trpc.propertyTours.uploadImages.useMutation();
  const createTour = trpc.propertyTours.create.useMutation();
  const generateVideo = trpc.propertyTours.generateVideo.useMutation();
  const deleteTour = trpc.propertyTours.delete.useMutation();
  const fetchPropertyData = trpc.propertyTours.fetchPropertyData.useMutation();

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newTotal = selectedFiles.length + files.length;
    
    // Enforce 10-file maximum
    if (newTotal > 10) {
      toast.error("Maximum 10 files allowed. For best results, select 5-10 of your best photos/videos showing key features.");
      return;
    }
    
    // Validate video files
    for (const file of files) {
      if (file.type.startsWith('video/')) {
        // Check file size (100MB limit)
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 100) {
          toast.error(`Video "${file.name}" is too large (${sizeMB.toFixed(1)}MB). Maximum size is 100MB.`);
          return;
        }
        
        // Check video duration (2 minutes = 120 seconds limit)
        try {
          const duration = await getVideoDuration(file);
          if (duration > 120) {
            toast.error(`Video "${file.name}" is too long (${Math.floor(duration)}s). Maximum duration is 2 minutes (120s).`);
            return;
          }
        } catch (error) {
          console.error('Error checking video duration:', error);
          // Continue anyway if duration check fails
        }
      }
    }
    
    setSelectedFiles((prev) => [...prev, ...files]);
  };
  
  // Helper function to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // Handle file upload to S3 using direct endpoint
  // Compress image on client side to bypass gateway limits
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize to max 1920px on longest side
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality (aggressive compression)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.7
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      reader.readAsDataURL(file);
    });
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one property image");
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      // Upload files ONE AT A TIME (compress images, upload videos directly)
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        let fileToUpload: File;
        
        // Check if file is a video
        if (file.type.startsWith('video/')) {
          // Videos: Compress if over 50MB
          const fileSizeMB = file.size / (1024 * 1024);
          if (fileSizeMB > 50) {
            toast.info(`Compressing video ${i + 1}/${selectedFiles.length}: ${file.name} (${fileSizeMB.toFixed(1)}MB)`);
            fileToUpload = await compressVideo(file, {
              maxSizeMB: 50,
              targetSizeMB: 35,
              onProgress: (progress) => {
                if (progress % 20 === 0) { // Update every 20%
                  toast.info(`Compressing: ${Math.round(progress)}%`);
                }
              }
            });
            const compressedSizeMB = fileToUpload.size / (1024 * 1024);
            toast.success(`Video compressed: ${fileSizeMB.toFixed(1)}MB → ${compressedSizeMB.toFixed(1)}MB`);
          } else {
            toast.info(`Uploading video ${i + 1}/${selectedFiles.length}: ${file.name}`);
            fileToUpload = file;
          }
        } else {
          // Images: Compress before upload
          toast.info(`Compressing ${i + 1}/${selectedFiles.length}: ${file.name}`);
          const compressedBlob = await compressImage(file);
          fileToUpload = new File([compressedBlob], file.name, { type: 'image/jpeg' });
          toast.info(`Uploading ${i + 1}/${selectedFiles.length}: ${file.name}`);
        }
        
        // Create FormData with file (compressed image or raw video)
        const formData = new FormData();
        formData.append("images", fileToUpload);

        // Upload via direct endpoint
        const response = await fetch("/api/upload-images", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        uploadedUrls.push(...data.urls);
        
        toast.success(`✅ Uploaded ${i + 1}/${selectedFiles.length}`);
      }
      
      setUploadedImageUrls(uploadedUrls);
      setSelectedFiles([]);

      toast.success(`✅ All ${uploadedUrls.length} images uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  // Generate voiceover script using LLM
  const generateScript = async (): Promise<string> => {
    const propertyDetails = `
Address: ${address}
Price: ${price || 'Not specified'}
Beds: ${beds || 'Not specified'}
Baths: ${baths || 'Not specified'}
Square Feet: ${sqft || 'Not specified'}
Property Type: ${propertyType || 'Not specified'}
Description: ${description || 'Not specified'}
`;

    const prompt = `Generate a professional, engaging ${duration}-second voiceover script for a real estate property tour video. The script should highlight the key features and create excitement about the property. Keep it natural and conversational.

Property Details:${propertyDetails}

Generate ONLY the script text, no additional commentary.`;

    try {
      const response = await fetch('/api/trpc/ai.generateScript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      return data.result?.script || "Welcome to this beautiful property. Let me show you around this amazing home.";
    } catch (error) {
      console.error('Failed to generate script:', error);
      return "Welcome to this beautiful property. Let me show you around this amazing home.";
    }
  };

  // Handle tour creation and video generation
  const handleCreateTour = async () => {
    if (!address) {
      toast.error("Please enter the property address");
      return;
    }

    // Validate manually uploaded photos
    if (uploadedImageUrls.length === 0) {
      toast.error("Please upload at least one property image");
      return;
    }

    // If voiceover is enabled and script not reviewed yet, show script editor
    if (enableVoiceover && !showScriptEditor && !customScript) {
      // Generate script first
      const script = await generateScript();
      setGeneratedScript(script);
      setCustomScript(script);
      setShowScriptEditor(true);
      return;
    }

    try {
      // Create tour
      const tour = await createTour.mutateAsync({
        address,
        price: price || undefined,
        beds: beds ? parseInt(beds) : undefined,
        baths: baths ? parseFloat(baths) : undefined,
        sqft: sqft ? parseInt(sqft) : undefined,
        propertyType: propertyType || undefined,
        description: description || undefined,
        imageUrls: uploadedImageUrls,
        template,
        duration,
        includeBranding,
        aspectRatio,
        musicTrack,
        cardTemplate,
        includeIntroVideo,
        videoMode,
        enableVoiceover,
        voiceId: enableVoiceover ? voiceId : undefined,
        customCameraPrompt: customCameraPrompt || undefined,
        voiceoverScript: customScript || undefined,
        perPhotoMovements: perPhotoMovements.length > 0 ? perPhotoMovements : undefined,
        movementSpeed,
        enableAvatarOverlay,
        avatarOverlayPosition,
      });

      // Set generating state
      setGeneratingTourId(tour.id);
      setGenerationProgress(10);
      setGenerationStatus("Submitting video to Shotstack...");

      // Generate video (returns renderId)
      await generateVideo.mutateAsync({ tourId: tour.id });

      setGenerationProgress(20);
      setGenerationStatus("Video queued for processing...");

      let pollCount = 0;
      const maxPolls = 60; // 5 minutes at 5s intervals

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          console.log(`[PropertyTours] Poll #${pollCount} for tour ${tour.id}`);
          const status = await utils.propertyTours.checkRenderStatus.fetch({ tourId: tour.id });
          console.log("[PropertyTours] Status response:", status);
          
          // Update progress based on status
          if (status.status === "fetching") {
            setGenerationProgress(30);
            setGenerationStatus("Fetching property images...");
          } else if (status.status === "rendering") {
            const renderProgress = Math.min(30 + (pollCount * 2), 80);
            setGenerationProgress(renderProgress);
            setGenerationStatus("Rendering video with Ken Burns effects...");
          } else if (status.status === "saving") {
            setGenerationProgress(90);
            setGenerationStatus("Finalizing video...");
          }
          
          if (status.status === "done" || status.status === "completed") {
            clearInterval(pollInterval);
            setGenerationProgress(100);
            setGenerationStatus("Video ready!");
            
            setTimeout(() => {
              setGeneratingTourId(null);
              setGenerationProgress(0);
              setGenerationStatus("");
            }, 2000);
            
            toast.success("Your property tour video is ready!");
            utils.propertyTours.list.invalidate();
          } else if (status.status === "failed") {
            clearInterval(pollInterval);
            setGeneratingTourId(null);
            setGenerationProgress(0);
            setGenerationStatus("");
            toast.error(status.error || "Video generation failed");
            utils.propertyTours.list.invalidate();
          }
          
          // Timeout after max polls
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setGeneratingTourId(null);
            setGenerationProgress(0);
            setGenerationStatus("");
            toast.error("Video generation timed out. Please try again.");
          }
        } catch (error) {
          clearInterval(pollInterval);
          setGeneratingTourId(null);
          setGenerationProgress(0);
          setGenerationStatus("");
          console.error("Polling error:", error);
        }
      }, 5000); // Poll every 5 seconds

      // Reset form
      setAddress("");
      setPrice("");
      setBeds("");
      setBaths("");
      setSqft("");
      setPropertyType("");
      setDescription("");
      setUploadedImageUrls([]);

      // Refresh tours list
      utils.propertyTours.list.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tour");
    }
  };

  // Handle tour deletion
  const handleDeleteTour = async (tourId: number) => {
    try {
      const result = await deleteTour.mutateAsync({ tourId });
      if (result.creditsRefunded) {
        toast.success("Property tour deleted and credits refunded");
      } else {
        toast.success("Property tour deleted");
      }
      utils.propertyTours.list.invalidate();
      utils.credits.getBalance.invalidate(); // Refresh credit balance
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete tour");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Property Tours</h1>
            <p className="text-muted-foreground">
              Create cinematic property tour videos with Ken Burns effects
            </p>
          </div>
          {dailyUsage && (
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Daily Videos</p>
                {dailyUsage.isUnlimited ? (
                  <>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ∞
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Unlimited</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                      Pro Plan
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {dailyUsage.remaining}/{dailyUsage.limit}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">remaining today</p>
                    {dailyUsage.remaining <= 2 && dailyUsage.remaining > 0 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                        Low limit!
                      </p>
                    )}
                    {dailyUsage.remaining === 0 && (
                      <p className="text-xs text-destructive mt-2 font-medium">
                        Limit reached
                      </p>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Example Videos Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Example Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          {/* Ken Burns Example */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black">
              <video
                controls
                className="w-full h-full"
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/ohpWbEfjCWjPNlIL.mp4"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">Ken Burns Effect Example</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Standard mode with smooth zoom and pan effects
              </p>
              <p className="text-xs text-muted-foreground italic">
                Note: "Your branding here" - your profile picture and contact info will appear when branding is enabled
              </p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create New Tour Form */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Create New Tour</h2>

          {/* Image Upload */}
          <div className="mb-6">
            <Label htmlFor="images">Property Images & Videos *</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Maximum 10 photos. For best results, select 5-10 of your best photos showing key features.
            </p>
            <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag & drop images or videos (mix photos with short clips for dynamic tours)
              </p>
              <Input
                id="images"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("images")?.click()}
              >
                Select Images/Videos
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium">
                  {selectedFiles.length} files selected ({selectedFiles.filter(f => f.type.startsWith('image')).length} images, {selectedFiles.filter(f => f.type.startsWith('video')).length} videos)
                </p>
                
                {/* Preview thumbnails of selected files */}
                <div className="grid grid-cols-3 gap-2">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="relative group">
                      {file.type.startsWith('image') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded border-2 border-dashed border-muted"
                        />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center bg-muted rounded border-2 border-dashed border-muted">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newFiles = selectedFiles.filter((_, index) => index !== i);
                          setSelectedFiles(newFiles);
                          toast.success("File removed from selection");
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
                
                <Button
                  onClick={handleUploadImages}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            )}

            {uploadedImageUrls.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">
                    {uploadedImageUrls.length} photo{uploadedImageUrls.length !== 1 ? 's' : ''} uploaded
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setUploadedImageUrls([]);
                      setSelectedFiles([]);
                      toast.success("All photos removed");
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {uploadedImageUrls.map((url, i) => (
                    <div key={i} className="space-y-2">
                      <div className="relative group">
                        <img
                          src={url}
                          alt={`Property ${i + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute top-1 left-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setCropImageIndex(i);
                            setCropModalOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const newUrls = uploadedImageUrls.filter((_, index) => index !== i);
                            const newFiles = selectedFiles.filter((_, index) => index !== i);
                            const newMovements = perPhotoMovements.filter((_, index) => index !== i);
                            setUploadedImageUrls(newUrls);
                            setSelectedFiles(newFiles);
                            setPerPhotoMovements(newMovements);
                            toast.success("Photo removed");
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Select
                        value={perPhotoMovements[i] || "auto"}
                        onValueChange={(value) => {
                          const newMovements = [...perPhotoMovements];
                          newMovements[i] = value;
                          setPerPhotoMovements(newMovements);
                        }}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Camera Movement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">🎬 Auto (Cycle)</SelectItem>
                          <SelectItem value="zoom-in-pan-right">🔍 Zoom In + Pan Right</SelectItem>
                          <SelectItem value="zoom-out-pan-left">🔎 Zoom Out + Pan Left</SelectItem>
                          <SelectItem value="pan-right-zoom">➡️ Pan Right + Zoom</SelectItem>
                          <SelectItem value="pan-left-zoom">⬅️ Pan Left + Zoom</SelectItem>
                          <SelectItem value="dramatic-zoom">⭐ Dramatic Zoom (Hero)</SelectItem>
                          <SelectItem value="pan-up-zoom">⬆️ Pan Up + Zoom</SelectItem>
                          <SelectItem value="pan-down-zoom">⬇️ Pan Down + Zoom</SelectItem>
                          <SelectItem value="diagonal-pan-zoom">↗️ Diagonal Pan + Zoom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="mlsId">MLS ID (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="mlsId"
                  placeholder="Enter MLS ID to auto-fill property details"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const mlsIdInput = (document.getElementById("mlsId") as HTMLInputElement)?.value;
                    if (!mlsIdInput?.trim()) {
                      toast.error("Please enter an MLS ID first");
                      return;
                    }
                    try {
                      toast.info("Fetching property data from MLS...");
                      const data = await fetchPropertyData.mutateAsync({ mlsId: mlsIdInput });
                      
                      // Auto-populate form fields
                      setAddress(data.address || "");
                      setPrice(data.price ? `$${data.price.toLocaleString()}` : "");
                      setBeds(data.beds.toString());
                      setBaths(data.baths.toString());
                      setSqft(data.sqft.toString());
                      setPropertyType(data.propertyType);
                      setDescription(data.description);
                      
                      toast.success("Property data loaded! Please upload your own photos.");
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Failed to fetch property data from MLS"
                      );
                    }
                  }}
                  disabled={fetchPropertyData.isPending}
                >
                  {fetchPropertyData.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Fetch Data"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter MLS ID and click "Fetch Data" to auto-populate property details (address, price, beds, baths, sqft)
              </p>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State 12345"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="$500,000"
                />
              </div>
              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <Input
                  id="propertyType"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  placeholder="Single Family"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="beds">Beds</Label>
                <Input
                  id="beds"
                  type="number"
                  value={beds}
                  onChange={(e) => setBeds(e.target.value)}
                  placeholder="3"
                />
              </div>
              <div>
                <Label htmlFor="baths">Baths</Label>
                <Input
                  id="baths"
                  type="number"
                  step="0.5"
                  value={baths}
                  onChange={(e) => setBaths(e.target.value)}
                  placeholder="2.5"
                />
              </div>
              <div>
                <Label htmlFor="sqft">Sq Ft</Label>
                <Input
                  id="sqft"
                  type="number"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  placeholder="2000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beautiful property with..."
                rows={3}
              />
            </div>

            {/* Agent Branding */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeBranding"
                checked={includeBranding}
                onCheckedChange={(checked) => setIncludeBranding(checked as boolean)}
              />
              <Label htmlFor="includeBranding" className="text-sm font-normal cursor-pointer">
                Include my branding (profile picture and contact info)
              </Label>
            </div>

            {/* Intro Video */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeIntroVideo"
                checked={includeIntroVideo}
                onCheckedChange={(checked) => setIncludeIntroVideo(checked as boolean)}
              />
              <Label htmlFor="includeIntroVideo" className="text-sm font-normal cursor-pointer">
                Prepend my intro video (adds personal intro before property tour)
              </Label>
            </div>

            {/* Video Generation Mode */}
            <div>
              <Label htmlFor="videoMode">Video Generation Mode</Label>
              <Select value={videoMode} onValueChange={(v: any) => setVideoMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    <div className="flex flex-col">
                      <span className="font-semibold">Standard (Free)</span>
                      <span className="text-xs text-muted-foreground">Ken Burns effects only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="full-ai">
                    <div className="flex flex-col">
                      <span className="font-semibold">Full Cinematic (75 credits)</span>
                      <span className="text-xs text-muted-foreground">Runway AI motion + optional voiceover (2/month max)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Camera Movement Prompt (for Full Cinematic mode) */}
            {videoMode === "full-ai" && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="promptTemplate">Camera Movement Preset</Label>
                  <Select
                    value={customCameraPrompt}
                    onValueChange={(value) => setCustomCameraPrompt(value === "custom" ? "" : value)}
                  >
                    <SelectTrigger id="promptTemplate">
                      <SelectValue placeholder="Choose a preset or write custom..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom (write your own)</SelectItem>
                      <SelectItem value="Aerial drone shot slowly revealing the entire property from above">🚁 Drone Shot - Aerial reveal</SelectItem>
                      <SelectItem value="Smooth dolly push moving forward through the space">🎬 Dolly Push - Forward movement</SelectItem>
                      <SelectItem value="Elegant crane shot descending to reveal the space from above">🏗️ Crane Shot - Descending reveal</SelectItem>
                      <SelectItem value="Tracking shot smoothly gliding through each area">📹 Tracking Shot - Smooth glide</SelectItem>
                      <SelectItem value="Slow pan across the space revealing details">↔️ Pan Across - Horizontal sweep</SelectItem>
                      <SelectItem value="Cinematic zoom slowly pushing into key details">🔍 Zoom In - Detail focus</SelectItem>
                      <SelectItem value="Wide pullback zoom revealing the full space">🔎 Zoom Out - Full reveal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="cameraPrompt">Or Write Custom Prompt</Label>
                  <Textarea
                    id="cameraPrompt"
                    placeholder="e.g., 'Drone shot flying over the property' or 'Slow dolly push through the front door' - Leave blank for auto-generated prompts"
                    value={customCameraPrompt}
                    onChange={(e) => setCustomCameraPrompt(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a preset above or write your own camera movement description
                  </p>
                </div>
              </div>
            )}

            {/* Movement Speed Preset */}
            <div className="space-y-2">
              <Label htmlFor="movementSpeed">Camera Movement Speed</Label>
              <Select value={movementSpeed} onValueChange={(value: "slow" | "fast") => setMovementSpeed(value)}>
                <SelectTrigger id="movementSpeed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">🎬 Slow & Dramatic (6-8s per photo)</SelectItem>
                  <SelectItem value="fast">⚡ Fast & Energetic (3-4s per photo)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {movementSpeed === "slow" 
                  ? "Cinematic, gentle movements perfect for luxury properties" 
                  : "Quick, dynamic pacing ideal for modern, energetic listings"}
              </p>
            </div>

            {/* Voiceover Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableVoiceover"
                  checked={enableVoiceover}
                  onCheckedChange={(checked) => setEnableVoiceover(checked as boolean)}
                />
                <Label htmlFor="enableVoiceover" className="text-sm font-normal cursor-pointer">
                  Enable AI Voiceover Narration
                </Label>
              </div>
              {enableVoiceover && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="voiceId">Voice Selection</Label>
                    <Select value={voiceId} onValueChange={setVoiceId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="21m00Tcm4TlvDq8ikWAM">Rachel - Professional Female</SelectItem>
                        <SelectItem value="pNInz6obpgDQGcFmaJgB">Adam - Professional Male</SelectItem>
                        <SelectItem value="EXAVITQu4vr4xnSDxMaL">Bella - Warm Female</SelectItem>
                        <SelectItem value="TxGEqnHWrfWFTfGW9XjX">Josh - Authoritative Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="voiceoverScript">Voiceover Script (Optional)</Label>
                    <Textarea
                      id="voiceoverScript"
                      placeholder="Leave blank to auto-generate script from property details, or paste/write your custom narration script here..."
                      value={customScript}
                      onChange={(e) => setCustomScript(e.target.value)}
                      rows={5}
                      className="resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Custom script will be narrated exactly as written. Leave blank for AI-generated script based on property details.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Agent Avatar Overlay */}
            {videoMode === "full-ai" && (
              <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableAvatarOverlay"
                    checked={enableAvatarOverlay}
                    onCheckedChange={(checked) => setEnableAvatarOverlay(checked as boolean)}
                  />
                  <Label htmlFor="enableAvatarOverlay" className="text-sm font-medium cursor-pointer">
                    AI Agent Avatar Overlay
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your AI twin appears in the corner narrating the tour. Set up your headshot and voice recording in{" "}
                  <a href="/account" className="underline text-primary">Account Settings</a> first.
                </p>
                {enableAvatarOverlay && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Avatar Position</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAvatarOverlayPosition("bottom-left")}
                        className={`flex-1 py-1.5 px-3 rounded text-xs border transition-colors ${
                          avatarOverlayPosition === "bottom-left"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        ↙ Bottom Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatarOverlayPosition("bottom-right")}
                        className={`flex-1 py-1.5 px-3 rounded text-xs border transition-colors ${
                          avatarOverlayPosition === "bottom-right"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        ↘ Bottom Right
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Video Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template">Video Template</Label>
                <Select value={template} onValueChange={(v: any) => setTemplate(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="cozy">Cozy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Video Duration</Label>
                <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds (Quick Reel)</SelectItem>
                    <SelectItem value="30">30 seconds (Standard)</SelectItem>
                    <SelectItem value="60">60 seconds (Detailed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Aspect Ratio & Music */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                    <SelectItem value="9:16">9:16 (Reels/TikTok)</SelectItem>
                    <SelectItem value="1:1">1:1 (Instagram)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Music Library */}
              <div className="col-span-2">
                <MusicLibrary
                  onSelectTrack={(trackId, trackUrl) => {
                    setMusicTrack(trackId);
                    setMusicTrackUrl(trackUrl);
                  }}
                  selectedTrackId={musicTrack}
                  propertyType={propertyType as 'luxury' | 'family' | 'modern' | 'commercial' | 'any' || 'any'}
                  volume={musicVolume}
                  onVolumeChange={setMusicVolume}
                  showVolumeControl={true}
                />
              </div>
            </div>

            {/* Card Template Selector */}
            {includeBranding && (
              <div className="space-y-3">
                <Label htmlFor="cardTemplate">Intro/Outro Card Style</Label>
                <Select value={cardTemplate} onValueChange={(v: any) => setCardTemplate(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">
                      <div className="flex flex-col">
                        <span className="font-semibold">Modern Minimalist</span>
                        <span className="text-xs text-muted-foreground">Clean lines, simple typography</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="luxury">
                      <div className="flex flex-col">
                        <span className="font-semibold">Luxury Elegant</span>
                        <span className="text-xs text-muted-foreground">Sophisticated gradients, serif fonts</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bold">
                      <div className="flex flex-col">
                        <span className="font-semibold">Bold & Dynamic</span>
                        <span className="text-xs text-muted-foreground">Vibrant colors, strong typography</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="classic">
                      <div className="flex flex-col">
                        <span className="font-semibold">Classic Professional</span>
                        <span className="text-xs text-muted-foreground">Traditional layout, conservative design</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="contemporary">
                      <div className="flex flex-col">
                        <span className="font-semibold">Contemporary Chic</span>
                        <span className="text-xs text-muted-foreground">Trendy design, modern aesthetics</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose a style for your intro and outro cards. Each template has matching designs for a cohesive look.
                </p>
              </div>
            )}

            {/* Credit Cost Display */}
            {creditCost && balance && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cost for this video:</span>
                  <span className="text-lg font-bold text-primary">{creditCost.totalCredits} credits</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {creditCost.breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.item}</span>
                      <span>{item.credits} credits</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-primary/20 flex items-center justify-between">
                  <span className="text-sm">Your balance:</span>
                  <span className={`font-semibold ${balance.balance < creditCost.totalCredits ? 'text-destructive' : 'text-primary'}`}>
                    {balance.balance} credits
                  </span>
                </div>
                {balance.balance < creditCost.totalCredits && (
                  <div className="mt-2 text-xs text-destructive">
                    Insufficient credits. <a href="/credits" className="underline font-medium">Purchase more credits</a>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleCreateTour}
                disabled={createTour.isPending || generateVideo.isPending || generatingTourId !== null || (balance && creditCost && balance.balance < creditCost.totalCredits)}
                className="w-full h-14 text-lg"
                size="lg"
              >
                {createTour.isPending || generateVideo.isPending || generatingTourId !== null ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Create Property Tour
                  </>
                )}
              </Button>
              
              {uploadedImageUrls.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Reset all form fields
                    setAddress("");
                    setPrice("");
                    setBeds("");
                    setBaths("");
                    setSqft("");
                    setPropertyType("");
                    setDescription("");
                    setUploadedImageUrls([]);
                    setSelectedFiles([]);
                    setTemplate("modern");
                    setDuration(30);
                    setIncludeBranding(true);
                    setAspectRatio("16:9");
                    setMusicTrack(undefined);
                    setCardTemplate("modern");
                    setIncludeIntroVideo(false);
                    setVideoMode("standard");
                    setEnableVoiceover(false);
                    setShowScriptEditor(false);
                    setGeneratedScript("");
                    setCustomScript("");
                    toast.success("Form cleared");
                  }}
                  disabled={createTour.isPending || generateVideo.isPending || generatingTourId !== null}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel & Clear Form
                </Button>
              )}
            </div>

            {/* Progress Indicator */}
            {generatingTourId !== null && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{generationStatus}</span>
                  <span className="font-medium">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Video generation may take up to 2 minutes
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={deleteTour.isPending}
                    onClick={async () => {
                      if (confirm("Cancel video generation? Your credits will be refunded.")) {
                        if (generatingTourId) {
                          try {
                            await deleteTour.mutateAsync({ tourId: generatingTourId });
                            setGeneratingTourId(null);
                            setGenerationProgress(0);
                            setGenerationStatus("");
                            toast.success("Video generation cancelled and credits refunded");
                            utils.propertyTours.list.invalidate();
                            utils.credits.getBalance.invalidate();
                          } catch (error) {
                            toast.error("Failed to cancel video generation");
                          }
                        }
                      }
                    }}
                  >
                    {deleteTour.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Cancel"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tours Library */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Your Property Tours</h2>

          {toursLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tours && tours.length > 0 ? (
            <div className="space-y-4">
              {tours.map((tour) => (
                <Card key={tour.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-24 bg-muted rounded flex items-center justify-center overflow-hidden relative group">
                      {tour.status === "completed" && tour.videoUrl ? (
                        <>
                          <video
                            src={tour.videoUrl}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </>
                      ) : tour.thumbnailUrl ? (
                        <img
                          src={tour.thumbnailUrl}
                          alt={tour.address}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Video className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{tour.address}</h3>
                      {tour.price && (
                        <p className="text-sm text-muted-foreground">{tour.price}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        {tour.beds && <span>{tour.beds} BD</span>}
                        {tour.baths && <span>| {tour.baths} BA</span>}
                        {tour.sqft && (
                          <span>| {parseInt(tour.sqft.toString()).toLocaleString()} SQ FT</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {tour.status === "completed" && tour.videoUrl ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <a href={tour.videoUrl} target="_blank" rel="noopener noreferrer">
                                <Play className="mr-2 h-4 w-4" />
                                Preview
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              asChild
                            >
                              <a href={tour.videoUrl} download>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={async () => {
                                const isProcessingOrFailed = tour.status === "processing" || tour.status === "failed";
                                const message = isProcessingOrFailed
                                  ? "Are you sure you want to delete this video? Your credits will be refunded."
                                  : "Are you sure you want to delete this video?";
                                if (confirm(message)) {
                                  await handleDeleteTour(tour.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </>
                        ) : tour.status === "processing" ? (
                          <span className="text-sm text-muted-foreground flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating video...
                          </span>
                        ) : tour.status === "failed" ? (
                          <span className="text-sm text-destructive">
                            Failed: {tour.errorMessage}
                          </span>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTour(tour.id)}
                          disabled={deleteTour.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No property tours yet. Create your first one!
              </p>
            </Card>
          )}
        </div>
      </div>
      {/* Script Editor Dialog */}
      {showScriptEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Review Voiceover Script</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Edit the script below to personalize your property tour narration. Estimated duration: {duration} seconds.
            </p>
            <Textarea
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              className="min-h-[200px] mb-4"
              placeholder="Voiceover script..."
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <span>{customScript.length} characters</span>
              <span>~{Math.ceil(customScript.split(' ').length / 150 * 60)} seconds</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowScriptEditor(false);
                  setCustomScript("");
                  setGeneratedScript("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowScriptEditor(false);
                  handleCreateTour();
                }}
                className="flex-1"
              >
                Continue with This Script
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Image Crop Modal */}
      {cropModalOpen && cropImageIndex !== null && (
        <ImageCropModal
          open={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setCropImageIndex(null);
          }}
          imageUrl={uploadedImageUrls[cropImageIndex]}
          onCropComplete={(croppedImageUrl) => {
            const newUrls = [...uploadedImageUrls];
            newUrls[cropImageIndex] = croppedImageUrl;
            setUploadedImageUrls(newUrls);
            toast.success("Photo cropped successfully");
          }}
        />
      )}
    </div>
  );
}
