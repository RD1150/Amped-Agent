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
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type ContentType = "property_listing" | "market_report" | "trending_news" | "tips" | "neighborhood" | "custom";
type BrandVoice = "professional" | "friendly" | "luxury" | "casual" | "authoritative";

export default function AIGenerate() {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState<ContentType>("custom");
  const [tone, setTone] = useState<BrandVoice>("professional");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

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
      setGeneratedContent(result.content);
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error("Failed to generate content: " + error.message);
      setIsGenerating(false);
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

    generateContent.mutate({
      topic: topic || propertyData.description || propertyData.address,
      contentType,
      tone: tone || (persona?.brandVoice as BrandVoice) || "professional",
      propertyData: contentType === "property_listing" ? {
        address: propertyData.address,
        price: propertyData.price ? parseInt(propertyData.price.replace(/[^0-9]/g, "")) : undefined,
        bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : undefined,
        bathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : undefined,
        sqft: propertyData.sqft ? parseInt(propertyData.sqft.replace(/[^0-9]/g, "")) : undefined,
        description: propertyData.description,
      } : undefined,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = () => {
    createContent.mutate({
      title: topic || propertyData.address || "AI Generated Content",
      content: generatedContent,
      contentType,
      status: "draft",
      aiGenerated: true,
      propertyAddress: propertyData.address || undefined,
      propertyPrice: propertyData.price ? parseInt(propertyData.price.replace(/[^0-9]/g, "")) : undefined,
      propertyBedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : undefined,
      propertyBathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : undefined,
      propertySqft: propertyData.sqft ? parseInt(propertyData.sqft.replace(/[^0-9]/g, "")) : undefined,
    });
  };

  const contentTypes = [
    { value: "property_listing", label: "Property Listing", icon: Home, description: "Create engaging property posts" },
    { value: "market_report", label: "Market Report", icon: TrendingUp, description: "Share market insights" },
    { value: "trending_news", label: "Trending News", icon: Newspaper, description: "Comment on real estate news" },
    { value: "tips", label: "Tips & Advice", icon: Lightbulb, description: "Share helpful tips" },
    { value: "neighborhood", label: "Neighborhood", icon: MapPin, description: "Spotlight local areas" },
    { value: "custom", label: "Custom", icon: Sparkles, description: "Write about anything" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Content Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create engaging real estate content with AI assistance
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Content Type Selection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Content Type</CardTitle>
              <CardDescription>Choose what type of content to generate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {contentTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setContentType(type.value as ContentType)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      contentType === type.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <type.icon className={`h-5 w-5 mb-2 ${contentType === type.value ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Input */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contentType === "property_listing" ? (
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Property Details</TabsTrigger>
                    <TabsTrigger value="description">Description</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Property Address</Label>
                      <Input
                        placeholder="123 Main Street, City, State"
                        value={propertyData.address}
                        onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input
                          placeholder="$500,000"
                          value={propertyData.price}
                          onChange={(e) => setPropertyData({ ...propertyData, price: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Square Feet</Label>
                        <Input
                          placeholder="2,500"
                          value={propertyData.sqft}
                          onChange={(e) => setPropertyData({ ...propertyData, sqft: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bedrooms</Label>
                        <Input
                          placeholder="4"
                          value={propertyData.bedrooms}
                          onChange={(e) => setPropertyData({ ...propertyData, bedrooms: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bathrooms</Label>
                        <Input
                          placeholder="3"
                          value={propertyData.bathrooms}
                          onChange={(e) => setPropertyData({ ...propertyData, bathrooms: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="description" className="mt-4">
                    <div className="space-y-2">
                      <Label>Property Description</Label>
                      <Textarea
                        placeholder="Describe the property's best features, recent updates, neighborhood highlights..."
                        value={propertyData.description}
                        onChange={(e) => setPropertyData({ ...propertyData, description: e.target.value })}
                        className="bg-secondary border-border min-h-[150px]"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="space-y-2">
                  <Label>Topic or Idea</Label>
                  <Textarea
                    placeholder={
                      contentType === "market_report" ? "e.g., Q4 2024 housing market trends in California" :
                      contentType === "trending_news" ? "e.g., New mortgage rate changes and what they mean for buyers" :
                      contentType === "tips" ? "e.g., 5 things first-time homebuyers should know" :
                      contentType === "neighborhood" ? "e.g., Why families love living in Westside" :
                      "Enter your topic or idea..."
                    }
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-secondary border-border min-h-[120px]"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Tone of Voice</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as BrandVoice)}>
                  <SelectTrigger className="bg-secondary border-border">
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

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <Card className="bg-card border-border h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Content</CardTitle>
              {generatedContent && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border min-h-[300px]">
                  <Streamdown>{generatedContent}</Streamdown>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveDraft} variant="outline" className="flex-1">
                    Save as Draft
                  </Button>
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Post
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="h-16 w-16 text-primary/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Your generated content will appear here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in the details and click Generate
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
