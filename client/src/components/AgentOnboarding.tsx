import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Upload, User, Palette, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type BrandVoice = "professional" | "friendly" | "luxury" | "casual" | "authoritative";

export default function AgentOnboarding() {
  const [step, setStep] = useState(0);
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    agentName: "",
    licenseNumber: "", // Agent DRE
    brokerageName: "",
    brokerageDRE: "",
    phoneNumber: "",
    headshotUrl: "",
    brandVoice: "professional" as BrandVoice,
    primaryColor: "#C9A962",
  });

  const uploadHeadshot = trpc.uploads.uploadHeadshot.useMutation({
    onSuccess: (result) => {
      setFormData({ ...formData, headshotUrl: result.url });
      toast.success('Headshot uploaded successfully!');
      setIsUploading(false);
    },
    onError: () => {
      toast.error('Failed to upload headshot');
      setIsUploading(false);
    },
  });

  const upsertPersona = trpc.persona.upsert.useMutation({
    onSuccess: () => {
      toast.success("Welcome! Your profile is complete.");
      setLocation("/dashboard");
    },
    onError: () => {
      toast.error("Failed to save profile");
    },
  });

  const handleHeadshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setHeadshotFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setHeadshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadHeadshot = async () => {
    if (!headshotFile) {
      toast.error("Please select a headshot first");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      uploadHeadshot.mutate({
        fileName: headshotFile.name,
        fileData: base64,
        mimeType: headshotFile.type,
      });
    };
    reader.readAsDataURL(headshotFile);
  };

  const handleNext = () => {
    if (step === 2 && !formData.headshotUrl) {
      toast.error("Please upload your headshot first");
      return;
    }
    if (step === 3 && (!formData.agentName || !formData.licenseNumber || !formData.brokerageName || !formData.brokerageDRE || !formData.phoneNumber)) {
      toast.error("Please fill in all required fields");
      return;
    }
    setStep(step + 1);
  };

  const handleComplete = () => {
    upsertPersona.mutate({
      ...formData,
      isCompleted: true,
    });
  };

  const progress = step === 0 ? 0 : (step / 4) * 100;

  const brandVoiceOptions = [
    { value: "professional", label: "Professional", description: "Formal and trustworthy" },
    { value: "friendly", label: "Friendly", description: "Warm and approachable" },
    { value: "luxury", label: "Luxury", description: "Sophisticated and premium" },
    { value: "casual", label: "Casual", description: "Relaxed and informal" },
    { value: "authoritative", label: "Authoritative", description: "Expert and confident" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Welcome to Authority Content</CardTitle>
            </div>
            <span className="text-sm text-muted-foreground">Step {step > 0 ? step : 1} of 4</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 0 && (
            <div className="space-y-4 text-center py-8">
              <h2 className="text-2xl font-bold mb-6">Welcome to AuthorityContent!</h2>
              <div className="aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden bg-black">
                <video 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/aBgrJXfThsxtnLZz.mp4"
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              </div>
              <Button onClick={() => setStep(1)} size="lg" className="mt-6">
                Continue to Setup
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Let's Get You Set Up!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                In just a few steps, we'll personalize your content creation experience. 
                You'll upload your headshot, enter your business details, and choose your brand style.
              </p>
              <div className="grid gap-3 text-left max-w-md mx-auto mt-8">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <User className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Professional Headshot</p>
                    <p className="text-sm text-muted-foreground">Upload your photo to appear on posts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Palette className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Brand Identity</p>
                    <p className="text-sm text-muted-foreground">Set your business name, contact info, and style</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Start Creating</p>
                    <p className="text-sm text-muted-foreground">Generate beautiful posts in seconds</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleNext} size="lg" className="mt-8">
                Get Started
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Upload Your Professional Headshot</h2>
                <p className="text-muted-foreground">
                  This photo will appear on your posts when you choose to include it. You can change it anytime.
                </p>
              </div>

              <div className="flex flex-col items-center gap-6 py-8">
                {headshotPreview ? (
                  <div className="relative">
                    <img 
                      src={headshotPreview} 
                      alt="Headshot preview" 
                      className="w-40 h-40 rounded-full object-cover border-4 border-primary"
                    />
                    {formData.headshotUrl && (
                      <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-full border-4 border-dashed border-border flex items-center justify-center bg-secondary/50">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                <div className="w-full max-w-sm space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleHeadshotSelect}
                    className="bg-secondary border-border"
                  />
                  {headshotFile && !formData.headshotUrl && (
                    <Button 
                      onClick={handleUploadHeadshot} 
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? "Uploading..." : "Upload Headshot"}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    JPG, PNG, or WebP • Max 5MB
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(step - 1)} variant="outline" className="flex-1">
                  Back
                </Button>
                {!formData.headshotUrl && (
                  <Button 
                    onClick={() => {
                      toast.info("💡 Tip: Posts with your headshot get 40% more engagement! You can add it later in settings.", { duration: 5000 });
                      handleNext();
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Skip for Now
                  </Button>
                )}
                <Button 
                  onClick={handleNext} 
                  disabled={!formData.headshotUrl}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Enter Your Business Information</h2>
                <p className="text-muted-foreground">
                  This information will appear on your posts and help personalize your content.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentName">Your Full Name *</Label>
                  <Input
                    id="agentName"
                    placeholder="e.g., John Smith"
                    value={formData.agentName}
                    onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">Your DRE License # *</Label>
                    <Input
                      id="licenseNumber"
                      placeholder="e.g., 01234567"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="(555) 123-4567"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brokerageName">Brokerage Name *</Label>
                  <Input
                    id="brokerageName"
                    placeholder="e.g., Luxury Realty Group"
                    value={formData.brokerageName}
                    onChange={(e) => setFormData({ ...formData, brokerageName: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brokerageDRE">Brokerage DRE # *</Label>
                  <Input
                    id="brokerageDRE"
                    placeholder="e.g., 01234567"
                    value={formData.brokerageDRE}
                    onChange={(e) => setFormData({ ...formData, brokerageDRE: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(step - 1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Choose Your Brand Style</h2>
                <p className="text-muted-foreground">
                  Select a brand voice and color that represents your business personality.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand Voice</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {brandVoiceOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => setFormData({ ...formData, brandVoice: option.value as BrandVoice })}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          formData.brandVoice === option.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{option.label}</span>
                          {formData.brandVoice === option.value && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-16 h-10 p-1 bg-secondary border-border cursor-pointer"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#C9A962"
                      className="w-32 bg-secondary border-border"
                    />
                    <span className="text-sm text-muted-foreground">
                      This color will accent your content
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(step - 1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={upsertPersona.isPending}
                  className="flex-1"
                >
                  {upsertPersona.isPending ? "Saving..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
