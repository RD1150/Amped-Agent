import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, User, Palette, Globe, Phone, Mail, Mic, Camera, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type BrandVoice = "professional" | "friendly" | "luxury" | "casual" | "authoritative";

export default function PersonaBrand() {
  const [formData, setFormData] = useState({
    businessName: "",
    tagline: "",
    targetAudience: "",
    brandVoice: "professional" as BrandVoice,
    primaryColor: "#C9A962",
    logoUrl: "",
    headshotUrl: "",
    bio: "",
    agentName: "",
    licenseNumber: "",
    brokerageName: "",
    brokerageDRE: "",
    brokerage: "",
    serviceAreas: "",
    websiteUrl: "",
    phoneNumber: "",
    emailAddress: "",
    socialHandles: "",
    klingAvatarHeadshotUrl: "",
    klingAvatarVoiceUrl: "",
  });
  const [isUploadingHeadshot, setIsUploadingHeadshot] = useState(false);
  const [isUploadingAvatarHeadshot, setIsUploadingAvatarHeadshot] = useState(false);
  const [isUploadingAvatarVoice, setIsUploadingAvatarVoice] = useState(false);
  const [voiceSampleUrl, setVoiceSampleUrl] = useState("");
  const [isUploadingVoiceSample, setIsUploadingVoiceSample] = useState(false);

  const { data: persona, isLoading } = trpc.persona.get.useQuery();
  const utils = trpc.useUtils();

  const upsertPersona = trpc.persona.upsert.useMutation({
    onSuccess: () => {
      utils.persona.get.invalidate();
      toast.success("Brand settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save brand settings");
    },
  });

  const cloneVoiceMutation = trpc.persona.cloneVoice.useMutation({
    onSuccess: (data) => {
      utils.persona.get.invalidate();
      toast.success(`Voice cloned successfully as "${data.voiceName}"! Your AI twin will now narrate tours in your voice.`);
    },
    onError: (err) => {
      toast.error(`Voice cloning failed: ${err.message}`);
    },
  });

  const deleteVoiceCloneMutation = trpc.persona.deleteVoiceClone.useMutation({
    onSuccess: () => {
      utils.persona.get.invalidate();
      toast.success("Voice clone deleted.");
    },
    onError: () => {
      toast.error("Failed to delete voice clone.");
    },
  });

  const uploadHeadshot = trpc.uploads.uploadHeadshot.useMutation({
    onSuccess: (result) => {
      setFormData({ ...formData, headshotUrl: result.url });
      toast.success('Headshot uploaded successfully!');
    },
    onError: () => {
      toast.error('Failed to upload headshot');
    },
  });

  useEffect(() => {
    if (persona) {
      setFormData({
        businessName: persona.businessName || "",
        tagline: persona.tagline || "",
        targetAudience: persona.targetAudience || "",
        brandVoice: (persona.brandVoice as BrandVoice) || "professional",
        primaryColor: persona.primaryColor || "#C9A962",
        logoUrl: persona.logoUrl || "",
        headshotUrl: persona.headshotUrl || "",
        bio: persona.bio || "",
        agentName: persona.agentName || "",
        licenseNumber: persona.licenseNumber || "",
        brokerageName: persona.brokerageName || "",
        brokerageDRE: persona.brokerageDRE || "",
        brokerage: persona.brokerage || "",
        serviceAreas: persona.serviceAreas || "",
        websiteUrl: persona.websiteUrl || "",
        phoneNumber: persona.phoneNumber || "",
        emailAddress: persona.emailAddress || "",
        socialHandles: persona.socialHandles || "",
        klingAvatarHeadshotUrl: (persona as any).klingAvatarHeadshotUrl || "",
        klingAvatarVoiceUrl: (persona as any).klingAvatarVoiceUrl || "",
      });
      setVoiceSampleUrl((persona as any).voiceSampleUrl || "");
    }
  }, [persona]);

  const handleHeadshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingHeadshot(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Upload to S3 via tRPC
        uploadHeadshot.mutate({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload headshot');
    } finally {
      setIsUploadingHeadshot(false);
    }
  };

  const handleSave = () => {
    // Send all fields — including empty strings — so clearing a value persists to the DB
    upsertPersona.mutate({
      ...formData,
      isCompleted: true,
    });
  };

  const brandVoiceOptions = [
    { value: "professional", label: "Professional", description: "Formal, authoritative, and trustworthy" },
    { value: "friendly", label: "Friendly", description: "Warm, approachable, and conversational" },
    { value: "luxury", label: "Luxury", description: "Sophisticated, exclusive, and premium" },
    { value: "casual", label: "Casual", description: "Relaxed, informal, and down-to-earth" },
    { value: "authoritative", label: "Authoritative", description: "Expert, confident, and knowledgeable" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Persona & Brand</h1>
          <p className="text-muted-foreground mt-1">
            Define your brand identity to personalize your content
          </p>
        </div>
        {persona?.isCompleted && (
          <Badge className="bg-green-500/20 text-green-400">
            <Check className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )}
      </div>

      {/* Business Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Business Information
          </CardTitle>
          <CardDescription>
            Tell us about your real estate business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="e.g., Luxury Homes Realty"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="e.g., Your Dream Home Awaits"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agentName">Agent Full Name</Label>
              <Input
                id="agentName"
                placeholder="e.g., Reena Dutta"
                value={formData.agentName}
                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Agent DRE License</Label>
              <Input
                id="licenseNumber"
                placeholder="e.g., 02194500"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brokerageName">Brokerage Name</Label>
              <Input
                id="brokerageName"
                placeholder="e.g., Y Realty"
                value={formData.brokerageName}
                onChange={(e) => setFormData({ ...formData, brokerageName: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brokerageDRE">Brokerage DRE License</Label>
              <Input
                id="brokerageDRE"
                placeholder="e.g., 02202700"
                value={formData.brokerageDRE}
                onChange={(e) => setFormData({ ...formData, brokerageDRE: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="headshot">Professional Headshot</Label>
            <div className="flex items-center gap-4">
              {formData.headshotUrl && (
                <img 
                  src={formData.headshotUrl} 
                  alt="Headshot preview" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                />
              )}
              <div className="flex-1">
                <Input
                  id="headshot"
                  type="file"
                  accept="image/*"
                  onChange={handleHeadshotUpload}
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">Upload a professional headshot (JPG, PNG, or WebP)</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio / About</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself and your real estate experience..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="bg-secondary border-border min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceAreas">Service Areas</Label>
            <Textarea
              id="serviceAreas"
              placeholder="e.g., San Francisco, Oakland, Berkeley, Marin County"
              value={formData.serviceAreas}
              onChange={(e) => setFormData({ ...formData, serviceAreas: e.target.value })}
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground">List the cities, neighborhoods, or regions you serve</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Textarea
              id="targetAudience"
              placeholder="Describe your ideal clients (e.g., First-time homebuyers in the 25-40 age range, luxury property investors, empty nesters looking to downsize...)"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              className="bg-secondary border-border min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brand Voice */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Brand Voice & Style
          </CardTitle>
          <CardDescription>
            Choose how your content should sound
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Brand Voice</Label>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
                      <Check className="h-4 w-4 text-primary" />
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
                This color will be used in your content themes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Contact & Social
          </CardTitle>
          <CardDescription>
            Your contact details for content generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website URL
              </Label>
              <Input
                id="websiteUrl"
                placeholder="https://yourwebsite.com"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                placeholder="(555) 123-4567"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emailAddress" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="emailAddress"
                type="email"
                placeholder="contact@yourwebsite.com"
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialHandles">Social Media Handles</Label>
              <Input
                id="socialHandles"
                placeholder="@yourbusiness (comma-separated)"
                value={formData.socialHandles}
                onChange={(e) => setFormData({ ...formData, socialHandles: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Avatar Setup */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            AI Agent Avatar Setup
          </CardTitle>
          <CardDescription>
            Upload your headshot and a voice recording to enable the AI Avatar Overlay on property tour videos.
            Your AI twin will appear in the corner narrating tours in your voice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Avatar Headshot</Label>
            <p className="text-xs text-muted-foreground">Upload a clear, front-facing photo (JPG or PNG). This will be used to generate your AI twin.</p>
            {formData.klingAvatarHeadshotUrl && (
              <img src={formData.klingAvatarHeadshotUrl} alt="Avatar headshot" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              id="avatarHeadshotInput"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploadingAvatarHeadshot(true);
                try {
                  const fd = new FormData();
                  fd.append("images", file);
                  const res = await fetch("/api/upload-images", { method: "POST", body: fd });
                  const data = await res.json();
                  setFormData(prev => ({ ...prev, klingAvatarHeadshotUrl: data.urls[0] }));
                  toast.success("Avatar headshot uploaded");
                } catch {
                  toast.error("Failed to upload headshot");
                } finally {
                  setIsUploadingAvatarHeadshot(false);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("avatarHeadshotInput")?.click()}
              disabled={isUploadingAvatarHeadshot}
            >
              {isUploadingAvatarHeadshot ? "Uploading..." : formData.klingAvatarHeadshotUrl ? "Change Headshot" : "Upload Headshot"}
            </Button>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mic className="h-4 w-4" /> Voice Recording (for Kling Avatar)</Label>
            <p className="text-xs text-muted-foreground">Upload a 15–30 second audio clip of your voice (MP3 or WAV). Used for the AI avatar overlay animation.</p>
            {formData.klingAvatarVoiceUrl && (
              <audio controls src={formData.klingAvatarVoiceUrl} className="w-full mt-1" />
            )}
            <input
              type="file"
              accept="audio/mpeg,audio/wav,audio/mp4,audio/webm"
              className="hidden"
              id="avatarVoiceInput"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploadingAvatarVoice(true);
                try {
                  const fd = new FormData();
                  fd.append("images", file);
                  const res = await fetch("/api/upload-images", { method: "POST", body: fd });
                  const data = await res.json();
                  setFormData(prev => ({ ...prev, klingAvatarVoiceUrl: data.urls[0] }));
                  toast.success("Voice recording uploaded");
                } catch {
                  toast.error("Failed to upload voice recording");
                } finally {
                  setIsUploadingAvatarVoice(false);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("avatarVoiceInput")?.click()}
              disabled={isUploadingAvatarVoice}
            >
              {isUploadingAvatarVoice ? "Uploading..." : formData.klingAvatarVoiceUrl ? "Change Recording" : "Upload Voice Recording"}
            </Button>
          </div>

          {/* ElevenLabs Voice Clone Section */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Mic className="h-4 w-4 text-primary" />
                  AI Voice Clone (for Voiceover Narration)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a 15-second to 5-minute voice sample. ElevenLabs will clone your voice and use it to narrate property tours automatically.
                </p>
              </div>
              {(persona as any)?.elevenlabsVoiceId && (
                <Badge variant="outline" className="text-green-600 border-green-600 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="h-3 w-3" /> Voice Cloned
                </Badge>
              )}
            </div>

            {(persona as any)?.elevenlabsVoiceName && (
              <p className="text-xs text-muted-foreground">
                Current clone: <span className="font-medium text-foreground">{(persona as any).elevenlabsVoiceName}</span>
              </p>
            )}

            {voiceSampleUrl && (
              <audio controls src={voiceSampleUrl} className="w-full" />
            )}

            <div className="flex gap-2 flex-wrap">
              <input
                type="file"
                accept="audio/mpeg,audio/wav,audio/mp4,audio/webm,audio/ogg"
                className="hidden"
                id="voiceSampleInput"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploadingVoiceSample(true);
                  try {
                    const fd = new FormData();
                    fd.append("images", file);
                    const res = await fetch("/api/upload-images", { method: "POST", body: fd });
                    const data = await res.json();
                    setVoiceSampleUrl(data.urls[0]);
                    toast.success("Voice sample uploaded — click \"Clone My Voice\" to create your AI voice.");
                  } catch {
                    toast.error("Failed to upload voice sample");
                  } finally {
                    setIsUploadingVoiceSample(false);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("voiceSampleInput")?.click()}
                disabled={isUploadingVoiceSample}
              >
                {isUploadingVoiceSample ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                {voiceSampleUrl ? "Change Sample" : "Upload Voice Sample"}
              </Button>

              {voiceSampleUrl && (
                <Button
                  type="button"
                  size="sm"
                  className="bg-primary text-primary-foreground"
                  disabled={cloneVoiceMutation.isPending}
                  onClick={() => cloneVoiceMutation.mutate({ voiceSampleUrl })}
                >
                  {cloneVoiceMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Cloning Voice...</>
                  ) : (
                    <><Mic className="h-4 w-4 mr-1" /> Clone My Voice</>
                  )}
                </Button>
              )}

              {(persona as any)?.elevenlabsVoiceId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={deleteVoiceCloneMutation.isPending}
                  onClick={() => {
                    if (confirm("Delete your voice clone? This cannot be undone and voiceovers will use a default voice.")) {
                      deleteVoiceCloneMutation.mutate();
                    }
                  }}
                >
                  {deleteVoiceCloneMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={upsertPersona.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {upsertPersona.isPending ? "Saving..." : "Save Brand Settings"}
        </Button>
      </div>
    </div>
  );
}
