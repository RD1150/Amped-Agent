import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Video,
  FileText,
  Building2,
  Info,
  X
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
// Auth context will be added

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const saveStepMutation = trpc.auth.saveOnboardingStep.useMutation();
  
  // Load saved onboarding step on mount
  useEffect(() => {
    if (user?.onboardingStep && user.onboardingStep > 1 && user.onboardingStep <= 5) {
      setCurrentStep(user.onboardingStep as OnboardingStep);
    }
  }, [user]);
  
  // Step 1: Profile
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState("");
  const [userLocation, setUserLocation] = useState("");
  
  // Step 2: Headshot
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string>("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  // Step 3: Content type
  const [selectedContentType, setSelectedContentType] = useState<"post" | "reel" | "tour" | null>(null);
  
  // Step 4: First content
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const completeOnboardingMutation = trpc.auth.completeOnboarding.useMutation();
  
  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleHeadshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to 512x512
    canvas.width = 512;
    canvas.height = 512;

    // Draw rotated and cropped image
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-256, -256);

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      512,
      512
    );

    ctx.restore();

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !imageToCrop) return;

    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels, rotation);
      const croppedFile = new File([croppedBlob], 'headshot.jpg', { type: 'image/jpeg' });
      
      setHeadshotFile(croppedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeadshotPreview(reader.result as string);
      };
      reader.readAsDataURL(croppedFile);
      
      setShowCropModal(false);
      toast.success('Headshot cropped and resized to 512×512px');
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image');
    }
  };

  const handleNext = async () => {
    // Validate current step
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error("Please enter your name");
        return;
      }
      
      // Save profile
      try {
        await updateProfileMutation.mutateAsync({
          name: name.trim(),
          bio: bio.trim() || undefined,
          location: userLocation.trim() || undefined,
        });
        toast.success("Profile saved!");
      } catch (error) {
        toast.error("Failed to save profile");
        return;
      }
    }
    
    if (currentStep === 3 && !selectedContentType) {
      toast.error("Please select a content type");
      return;
    }
    
    // Move to next step and save progress
    if (currentStep < 5) {
      const nextStep = (currentStep + 1) as OnboardingStep;
      setCurrentStep(nextStep);
      // Save progress
      try {
        await saveStepMutation.mutateAsync({ step: nextStep });
      } catch (error) {
        console.error("Failed to save onboarding progress:", error);
      }
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  };
  
  const handleSkip = () => {
    if (confirm("Are you sure you want to skip onboarding? You can always complete your profile later.")) {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await completeOnboardingMutation.mutateAsync();
      toast.success("Welcome to Authority Content!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to complete onboarding");
    }
  };

  const handleGenerateContent = () => {
    setIsGenerating(true);
    
    // Simulate content generation
    setTimeout(() => {
      if (selectedContentType === "post") {
        setGeneratedContent("🏡 Just listed! This stunning 3BR/2BA home in [Location] features modern updates, open floor plan, and a beautiful backyard. Perfect for first-time buyers! 💫 #RealEstate #NewListing");
      } else if (selectedContentType === "reel") {
        setGeneratedContent("Hook: 'The #1 mistake home buyers make...'\n\nScript: Most buyers focus only on the price, but the real cost is in the hidden repairs. Always get a thorough inspection before you buy!\n\nCTA: Save this for later! 📌");
      } else {
        setGeneratedContent("Welcome to 123 Main Street! This beautiful property features 3 bedrooms, 2 bathrooms, and over 2,000 square feet of living space...");
      }
      setIsGenerating(false);
      toast.success("Content generated!");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Welcome to Authority Content!</h1>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip for now
            </Button>
          </div>
          <p className="text-muted-foreground mb-4">
            Let's get you set up in just a few steps
          </p>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Step 1: Profile Setup */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Tell us about yourself</h2>
                <p className="text-sm text-muted-foreground">
                  This helps us personalize your content
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  placeholder="Austin, TX"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Where do you work? This helps generate location-specific content.
                </p>
              </div>

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself and your real estate business..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Headshot Upload */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold">Upload your headshot</h2>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className="h-5 w-5 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                      aria-label="Image requirements"
                    >
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </button>
                    {showTooltip && (
                      <div className="absolute left-0 top-7 z-50 w-72 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-3 text-sm">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-medium text-xs">Image Requirements:</p>
                          <button
                            type="button"
                            onClick={() => setShowTooltip(false)}
                            className="h-4 w-4 rounded hover:bg-muted flex items-center justify-center"
                            aria-label="Close"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <ul className="space-y-1 text-xs">
                          <li>• <strong>Format:</strong> JPG or PNG, under 10MB</li>
                          <li>• <strong>Framing:</strong> Head and shoulders, face centered</li>
                          <li>• <strong>Quality:</strong> Well-lit, professional headshot</li>
                          <li>• <strong>Auto-resize:</strong> Will be cropped to 512×512px for AI</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Optional, but recommended for AI avatar videos
                </p>
              </div>
            </div>



            <Label htmlFor="headshot-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 hover:border-primary/50 transition-colors text-center">
                {headshotPreview ? (
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={headshotPreview}
                      alt="Headshot preview"
                      className="h-32 w-32 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">Headshot uploaded!</p>
                      <p className="text-xs text-muted-foreground">Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Click to upload headshot</p>
                      <p className="text-xs text-muted-foreground">Or drag and drop</p>
                    </div>
                  </div>
                )}
              </div>
              <Input
                id="headshot-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHeadshotChange}
              />
            </Label>

            <p className="text-xs text-center text-muted-foreground">
              You can skip this step and add your headshot later in settings
            </p>
          </div>
        )}

        {/* Step 3: Choose Content Type */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">What would you like to create first?</h2>
                <p className="text-sm text-muted-foreground">
                  We'll guide you through generating your first piece of content
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setSelectedContentType("post")}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  selectedContentType === "post"
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Authority Post</h3>
                    <p className="text-sm text-muted-foreground">
                      Create engaging social media posts with AI-generated content and professional templates
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedContentType("reel")}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  selectedContentType === "reel"
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Video className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Authority Reel</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate scroll-stopping vertical videos with AI-powered scripts and visuals
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedContentType("tour")}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  selectedContentType === "tour"
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Property Tour</h3>
                    <p className="text-sm text-muted-foreground">
                      Create professional property tour videos with AI narration and smooth transitions
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Generate First Content */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Let's create your first {selectedContentType}!</h2>
                <p className="text-sm text-muted-foreground">
                  Click the button below to see how easy it is
                </p>
              </div>
            </div>

            <div className="text-center py-8">
              {!generatedContent ? (
                <Button
                  size="lg"
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  className="px-8"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin mr-2">⚡</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Sample {selectedContentType === "post" ? "Post" : selectedContentType === "reel" ? "Reel" : "Tour"}
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-left">
                    <p className="text-sm font-medium mb-2">Your Generated Content:</p>
                    <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Great! This is just a sample. You'll be able to customize and generate unlimited content once you're in the dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {currentStep === 5 && (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-2">You're all set!</h2>
              <p className="text-muted-foreground mb-8">
                Welcome to Authority Content. Let's start creating amazing content!
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 text-left space-y-3">
              <h3 className="font-semibold mb-3">What you can do now:</h3>
              <div className="space-y-2 text-sm">
                <p>✓ Generate unlimited social media posts</p>
                <p>✓ Create scroll-stopping vertical videos</p>
                <p>✓ Build professional property tours</p>
                <p>✓ Schedule content across all platforms</p>
                <p>✓ Access Premium features (Newsletter Builder)</p>
              </div>
            </div>

            <Button size="lg" onClick={completeOnboarding} className="px-8">
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        {currentStep < 5 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button onClick={handleNext}>
              {currentStep === 4 && !generatedContent ? "Skip" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Crop Modal */}
        <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adjust Your Headshot</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Zoom</label>
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.1}
                    onValueChange={(value) => setZoom(value[0])}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Rotation</label>
                  <Slider
                    value={[rotation]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={(value) => setRotation(value[0])}
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  ℹ️ Your image will be automatically resized to 512×512px for optimal AI video quality.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCropModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCropSave}>
                Apply Crop
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}
