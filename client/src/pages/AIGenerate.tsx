import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Home, 
  TrendingUp, 
  Newspaper, 
  Lightbulb, 
  MapPin,
  Copy,
  Check,
  Calendar,
  Image as ImageIcon,
  Loader2,
  Trash2,
  RefreshCw,
  Pencil,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { getFirstPost } from "@/lib/postFormatter";
import ComprehensiveTemplateSelector from "@/components/ComprehensiveTemplateSelector";
import { PostingDialog } from "@/components/PostingDialog";
import type { Template } from "../../../shared/templates";

type ContentType = "property_listing" | "market_report" | "trending_news" | "tips" | "neighborhood" | "custom";
type ContentFormat = "static_post" | "carousel" | "reel_script";
type BrandVoice = "professional" | "friendly" | "luxury" | "casual" | "authoritative";
type ImageStyle = "realistic" | "modern" | "luxury" | "minimal" | "vibrant";
type TemplateType = "property_card" | "just_listed" | "just_sold" | "open_house" | "market_update" | "testimonial";
type SelectedTemplate = Template | null;
type StockCategory = "property" | "interior" | "exterior" | "neighborhood" | "people" | "abstract";

export default function AIGenerate() {
  const [, setLocation] = useLocation();
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState<ContentType>("custom");
  const [contentFormat, setContentFormat] = useState<ContentFormat>("static_post");
  const [tone, setTone] = useState<BrandVoice>("professional");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate>(null);
  const [includeHeadshot, setIncludeHeadshot] = useState(true);
  const [customMessage, setCustomMessage] = useState("");
  const [customHook, setCustomHook] = useState("");
  const [includeCTA, setIncludeCTA] = useState(false);
  const [ctaText, setCtaText] = useState("");
  const [showPostingDialog, setShowPostingDialog] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);

  // Image generation states
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState<ImageStyle>("modern");
  const [templateType, setTemplateType] = useState<TemplateType>("property_card");
  const [stockQuery, setStockQuery] = useState("");
  const [stockCategory, setStockCategory] = useState<StockCategory>("property");
  const [stockImages, setStockImages] = useState<Array<{ url: string; index: number }>>([]);

  // Property listing fields
  const [propertyData, setPropertyData] = useState({
    address: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    description: "",
  });

  const { data: persona } = trpc.persona.get.useQuery();
  const utils = trpc.useUtils();

  const generateContent = trpc.content.generate.useMutation({
    onSuccess: (result) => {
      // Extract first clean post variation
      setGeneratedContent(getFirstPost(result.content));
      if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);
      }
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error("Failed to generate content: " + error.message);
      setIsGenerating(false);
    },
  });

  const generateImage = trpc.images.generate.useMutation({
    onSuccess: (result) => {
      setGeneratedImage(result.url || null);
      toast.success("Image generated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to generate image: " + error.message);
    },
  });

  const generateTemplate = trpc.images.generateTemplate.useMutation({
    onSuccess: (result) => {
      setGeneratedImage(result.url || null);
      toast.success("Template generated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to generate template: " + error.message);
    },
  });

  const searchStock = trpc.images.searchStock.useMutation({
    onSuccess: (result) => {
      setStockImages(result.images.map(img => ({ url: img.url || "", index: img.index })));
      toast.success(`Found ${result.images.length} stock images!`);
    },
    onError: (error) => {
      toast.error("Failed to search stock images: " + error.message);
    },
  });

  const createContent = trpc.content.create.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      toast.success("Content saved to drafts");
    },
  });

  const handleGenerate = async () => {
    if (!topic.trim() && contentType !== "property_listing") {
      toast.error("Please enter a topic");
      return;
    }

    if (contentType === "property_listing" && !propertyData.address && !propertyData.description) {
      toast.error("Please enter property details");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");
    setGeneratedImage(null);

    generateContent.mutate({
      topic: topic || propertyData.description || propertyData.address,
      contentType,
      format: contentFormat,
      tone: tone || (persona?.brandVoice as BrandVoice) || "professional",
      propertyData: contentType === "property_listing" ? {
        address: propertyData.address,
        price: propertyData.price ? parseInt(propertyData.price.replace(/[^0-9]/g, "")) : undefined,
        bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : undefined,
        bathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : undefined,
        sqft: propertyData.sqft ? parseInt(propertyData.sqft.replace(/[^0-9]/g, "")) : undefined,
        description: propertyData.description,
      } : undefined,
      ctaText: includeCTA ? ctaText : undefined,
    });
  };



  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) {
      toast.error("Please enter an image prompt");
      return;
    }
    generateImage.mutate({ prompt: imagePrompt, style: imageStyle });
  };

  const handleGenerateTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first");
      return;
    }

    if (!generatedContent) {
      toast.error("Please generate post content first (Content tab)");
      return;
    }

    try {
      setIsGenerating(true);
      const { renderTemplate } = await import("@/lib/templateRenderer");
      
      const imageUrl = await renderTemplate({
        template: selectedTemplate,
        postText: customMessage.trim() || generatedContent,
        customHook: customHook.trim() || undefined,
        businessName: persona?.businessName || undefined,
        tagline: persona?.tagline || undefined,
        headshotUrl: (includeHeadshot && persona?.headshotUrl) ? persona.headshotUrl : undefined,
        primaryColor: persona?.primaryColor || undefined,
        phone: persona?.phoneNumber || undefined,
        email: persona?.emailAddress || undefined,
        website: persona?.websiteUrl || undefined,
        agentName: persona?.agentName || undefined,
        licenseNumber: persona?.licenseNumber || undefined,
        brokerageName: persona?.brokerageName || undefined,
        brokerageDRE: persona?.brokerageDRE || undefined,
      });
      
      setGeneratedImage(imageUrl);
      toast.success("Template generated successfully!");
    } catch (error) {
      console.error("Template generation error:", error);
      toast.error("Failed to generate template");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearchStock = () => {
    if (!stockQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    searchStock.mutate({ query: stockQuery, category: stockCategory });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success("Content copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = () => {
    if (!generatedContent) {
      toast.error("No content to save");
      return;
    }

    createContent.mutate({
      content: generatedContent,
      contentType,
      status: "draft",
      imageUrl: generatedImage || undefined,
      aiGenerated: true,
    });
  };

  const contentTypeIcons = {
    property_listing: Home,
    market_report: TrendingUp,
    trending_news: Newspaper,
    tips: Lightbulb,
    neighborhood: MapPin,
    custom: Sparkles,
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Authority Post Builder</h1>
          <p className="text-muted-foreground mt-2">
            Build positioning power that converts content into closings
          </p>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Text Content</TabsTrigger>
            <TabsTrigger value="images">AI Images</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="stock">Stock Photos</TabsTrigger>
          </TabsList>

          {/* Text Content Generation */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex justify-center">
              <Card className="max-w-4xl w-full">
                <CardHeader>
                  <CardTitle>Generate Content</CardTitle>
                  <CardDescription>
                    Create engaging social media posts for your real estate business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                {/* Content Format Selector */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">What type of content do you want to create?</Label>
                  <div className="grid grid-cols-3 gap-6">
                    <button
                      onClick={() => setContentFormat("static_post")}
                      className={`flex flex-col items-center gap-4 p-8 rounded-lg border-2 transition-all hover:border-primary ${
                        contentFormat === "static_post" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="text-5xl">📝</div>
                      <div className="text-center">
                        <div className="font-semibold">Static Post</div>
                        <div className="text-xs text-muted-foreground mt-1">Image + Caption</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setContentFormat("carousel")}
                      className={`flex flex-col items-center gap-4 p-8 rounded-lg border-2 transition-all hover:border-primary ${
                        contentFormat === "carousel" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="text-5xl">📊</div>
                      <div className="text-center">
                        <div className="font-semibold">Carousel</div>
                        <div className="text-xs text-muted-foreground mt-1">Multi-slide post</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setContentFormat("reel_script")}
                      className={`flex flex-col items-center gap-4 p-8 rounded-lg border-2 transition-all hover:border-primary ${
                        contentFormat === "reel_script" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="text-5xl">🎬</div>
                      <div className="text-center">
                        <div className="font-semibold">Reel Script</div>
                        <div className="text-xs text-muted-foreground mt-1">Video script</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="property_listing">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            Property Listing
                          </div>
                        </SelectItem>
                        <SelectItem value="market_report">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Market Report
                          </div>
                        </SelectItem>
                        <SelectItem value="trending_news">
                          <div className="flex items-center gap-2">
                            <Newspaper className="h-4 w-4" />
                            Trending News
                          </div>
                        </SelectItem>
                        <SelectItem value="tips">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Tips & Advice
                          </div>
                        </SelectItem>
                        <SelectItem value="neighborhood">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Neighborhood Spotlight
                          </div>
                        </SelectItem>
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Custom
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select value={tone} onValueChange={(v) => setTone(v as BrandVoice)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {contentType === "property_listing" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          value={propertyData.address}
                          onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                          placeholder="123 Main St, City, State"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input
                          value={propertyData.price}
                          onChange={(e) => setPropertyData({ ...propertyData, price: e.target.value })}
                          placeholder="$500,000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Bedrooms</Label>
                        <Input
                          value={propertyData.bedrooms}
                          onChange={(e) => setPropertyData({ ...propertyData, bedrooms: e.target.value })}
                          placeholder="3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bathrooms</Label>
                        <Input
                          value={propertyData.bathrooms}
                          onChange={(e) => setPropertyData({ ...propertyData, bathrooms: e.target.value })}
                          placeholder="2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Square Feet</Label>
                        <Input
                          value={propertyData.sqft}
                          onChange={(e) => setPropertyData({ ...propertyData, sqft: e.target.value })}
                          placeholder="2000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={propertyData.description}
                        onChange={(e) => setPropertyData({ ...propertyData, description: e.target.value })}
                        placeholder="Describe the property's best features..."
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Topic</Label>
                    <Textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What would you like to write about?"
                      rows={3}
                    />
                  </div>
                )}

                {/* CTA Text Option */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeCTA"
                      checked={includeCTA}
                      onChange={(e) => setIncludeCTA(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="includeCTA" className="font-medium cursor-pointer">
                      Add custom call-to-action text
                    </Label>
                  </div>
                  
                  {includeCTA && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="ctaText">CTA Text</Label>
                      <Input
                        id="ctaText"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="e.g., Call Today! or Schedule a Tour"
                        maxLength={50}
                      />
                      <p className="text-xs text-muted-foreground">
                        This text will appear at the bottom of your post
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>

                {generatedContent && (
                  <div className="space-y-4">
                    {generatedImage && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <img src={generatedImage} alt="Generated content image" className="w-full rounded-lg mb-4" />
                        <Button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = generatedImage;
                            link.download = `realty-content-${Date.now()}.jpg`;
                            link.click();
                            toast.success('Image downloaded!');
                          }} 
                          variant="outline" 
                          className="w-full"
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Download Image
                        </Button>
                      </div>
                    )}
                    <div className="border rounded-lg p-4 bg-muted/50 relative">
                      {isEditingContent ? (
                        <Textarea
                          value={generatedContent}
                          onChange={(e) => setGeneratedContent(e.target.value)}
                          className="min-h-[200px] w-full text-sm font-normal resize-y border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          autoFocus
                        />
                      ) : (
                        <Streamdown>{generatedContent}</Streamdown>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsEditingContent(!isEditingContent)}
                        variant="outline"
                        className="flex-1"
                      >
                        {isEditingContent ? (
                          <><Save className="mr-2 h-4 w-4" />Done Editing</>
                        ) : (
                          <><Pencil className="mr-2 h-4 w-4" />Edit</>
                        )}
                      </Button>
                      <Button onClick={handleCopy} variant="outline" className="flex-1">
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button onClick={handleSaveDraft} variant="outline" className="flex-1">
                        <Calendar className="mr-2 h-4 w-4" />
                        Save to Drafts
                      </Button>
                      <Button 
                        onClick={() => {
                          setGeneratedContent("");
                          setGeneratedImage(null);
                          toast.success("Content discarded");
                        }} 
                        variant="outline" 
                        className="flex-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        onClick={() => {
                          setGeneratedContent("");
                          setGeneratedImage(null);
                          handleGenerate();
                        }} 
                        variant="outline" 
                        className="flex-1"
                        disabled={generateContent.isPending}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate
                      </Button>
                      {contentFormat === "reel_script" ? (
                        <Button 
                          onClick={() => {
                            // Navigate to Authority Reels Engine with script pre-filled
                            setLocation("/autoreels?script=" + encodeURIComponent(generatedContent));
                          }} 
                          className="flex-1"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Create Video from Script
                        </Button>
                      ) : (
                        <Button onClick={() => setShowPostingDialog(true)} className="flex-1">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Post to Social Media
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Image Generation */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Image Generation</CardTitle>
                <CardDescription>
                  Generate custom visuals for your real estate content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Image Prompt</Label>
                  <Textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={imageStyle} onValueChange={(v) => setImageStyle(v as ImageStyle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realistic">Realistic</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="vibrant">Vibrant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerateImage} 
                  disabled={generateImage.isPending}
                  className="w-full"
                  size="lg"
                >
                  {generateImage.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Image...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>

                {generatedImage && (
                  <div className="space-y-4">
                    <img 
                      src={generatedImage} 
                      alt="Generated" 
                      className="w-full rounded-lg border"
                    />
                    <Button 
                      onClick={() => window.open(generatedImage, '_blank')} 
                      variant="outline" 
                      className="w-full"
                    >
                      Open Full Size
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Template Generation */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Templates</CardTitle>
                <CardDescription>
                  Choose from 50 professionally designed templates for all content types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ComprehensiveTemplateSelector
                  selectedTemplateId={selectedTemplate?.id || null}
                  onSelectTemplate={(template) => setSelectedTemplate(template)}
                />

                {selectedTemplate && (
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary rounded-lg">
                      <h4 className="font-semibold mb-2">Selected Template</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>{selectedTemplate.name}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedTemplate.useCase}
                      </p>
                    </div>

                    {persona?.headshotUrl && (
                      <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                        <input
                          type="checkbox"
                          id="includeHeadshot"
                          checked={includeHeadshot}
                          onChange={(e) => setIncludeHeadshot(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <label htmlFor="includeHeadshot" className="text-sm cursor-pointer flex-1">
                          Include my headshot on this post
                        </label>
                        {!includeHeadshot && (
                          <span className="text-xs text-muted-foreground">💡 Branded posts get more engagement</span>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="customHook" className="text-sm font-medium">
                        Headline/Hook Text ✨
                      </Label>
                      <Input
                        id="customHook"
                        placeholder="e.g., JUST LISTED, MARKET UPDATE, YOUR DREAM HOME AWAITS..."
                        value={customHook}
                        onChange={(e) => setCustomHook(e.target.value)}
                        className="bg-secondary border-border text-lg font-semibold"
                        maxLength={80}
                      />
                      <p className="text-xs text-muted-foreground">
                        This text will appear prominently on your graphic. Leave blank for auto-generated headline.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customMessage" className="text-sm font-medium">
                        Customize Message (Optional)
                      </Label>
                      <Textarea
                        id="customMessage"
                        placeholder="Leave blank to use AI-generated content, or type your own message to appear on the graphic..."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={4}
                        className="bg-secondary border-border resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        {customMessage.trim() ? "Using your custom message" : "Using AI-generated content"}
                      </p>
                    </div>

                    <Button 
                      onClick={handleGenerateTemplate} 
                      disabled={generateTemplate.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {generateTemplate.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Template...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Generate {selectedTemplate.name}
                        </>
                      )}
                    </Button>

                    {generatedImage && (
                      <div className="space-y-4">
                        <img 
                          src={generatedImage} 
                          alt="Generated Template" 
                          className="w-full rounded-lg border"
                        />
                        <Button 
                          onClick={() => window.open(generatedImage, '_blank')} 
                          variant="outline" 
                          className="w-full"
                        >
                          Download Template
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {!selectedTemplate && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a template above to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock Photo Search */}
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock Photo Search</CardTitle>
                <CardDescription>
                  Find AI-generated stock photos for your content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Query</Label>
                  <Input
                    value={stockQuery}
                    onChange={(e) => setStockQuery(e.target.value)}
                    placeholder="e.g., modern kitchen, luxury home exterior..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={stockCategory} onValueChange={(v) => setStockCategory(v as StockCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="interior">Interior</SelectItem>
                      <SelectItem value="exterior">Exterior</SelectItem>
                      <SelectItem value="neighborhood">Neighborhood</SelectItem>
                      <SelectItem value="people">People</SelectItem>
                      <SelectItem value="abstract">Abstract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleSearchStock} 
                  disabled={searchStock.isPending}
                  className="w-full"
                  size="lg"
                >
                  {searchStock.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Search Stock Photos
                    </>
                  )}
                </Button>

                {stockImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {stockImages.map((img) => (
                      <div key={img.index} className="space-y-2">
                        <img 
                          src={img.url} 
                          alt={`Stock ${img.index}`} 
                          className="w-full aspect-square object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                          onClick={() => setGeneratedImage(img.url)}
                        />
                        <Button 
                          onClick={() => window.open(img.url, '_blank')} 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                        >
                          Use This
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PostingDialog
        open={showPostingDialog}
        onOpenChange={setShowPostingDialog}
        content={generatedContent}
        imageUrl={generatedImage}
        onSuccess={() => {
          toast.success("Content posted successfully!");
        }}
      />
    </>
  );
}
