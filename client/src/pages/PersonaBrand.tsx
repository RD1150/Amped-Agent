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
import { Check, User, Palette, Globe, Phone, Mail } from "lucide-react";
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
    brokerage: "",
    licenseNumber: "",
    serviceAreas: "",
    websiteUrl: "",
    phoneNumber: "",
    emailAddress: "",
    socialHandles: "",
  });

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
        brokerage: persona.brokerage || "",
        licenseNumber: persona.licenseNumber || "",
        serviceAreas: persona.serviceAreas || "",
        websiteUrl: persona.websiteUrl || "",
        phoneNumber: persona.phoneNumber || "",
        emailAddress: persona.emailAddress || "",
        socialHandles: persona.socialHandles || "",
      });
    }
  }, [persona]);

  const handleSave = () => {
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
              <Label htmlFor="brokerage">Brokerage</Label>
              <Input
                id="brokerage"
                placeholder="e.g., Your Brokerage Name"
                value={formData.brokerage}
                onChange={(e) => setFormData({ ...formData, brokerage: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                placeholder="e.g., DRE #01234567"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="headshotUrl">Headshot URL</Label>
            <Input
              id="headshotUrl"
              placeholder="https://example.com/headshot.jpg"
              value={formData.headshotUrl}
              onChange={(e) => setFormData({ ...formData, headshotUrl: e.target.value })}
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground">Upload your professional headshot to a service like Imgur and paste the URL here</p>
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
