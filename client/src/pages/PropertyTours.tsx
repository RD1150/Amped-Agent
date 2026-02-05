import { useState } from "react";
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
import { Upload, Video, Loader2, Download, Trash2, Play } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

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

  // Queries
  const { data: tours, isLoading: toursLoading } = trpc.propertyTours.list.useQuery();

  // Mutations
  const uploadImages = trpc.propertyTours.uploadImages.useMutation();
  const createTour = trpc.propertyTours.create.useMutation();
  const generateVideo = trpc.propertyTours.generateVideo.useMutation();
  const deleteTour = trpc.propertyTours.delete.useMutation();
  const fetchPropertyData = trpc.propertyTours.fetchPropertyData.useMutation();

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newTotal = selectedFiles.length + files.length;
    
    // Enforce 10-photo maximum
    if (newTotal > 10) {
      toast.error("Maximum 10 photos allowed. For best results, select 5-10 of your best photos showing key features.");
      return;
    }
    
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  // Handle file upload to S3
  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one property image");
      return;
    }

    setIsUploading(true);
    try {
      // Convert files to base64
      const imagePromises = selectedFiles.map(async (file) => {
        const reader = new FileReader();
        return new Promise<{ filename: string; data: string; mimeType: string }>(
          (resolve, reject) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(",")[1];
              resolve({
                filename: file.name,
                data: base64,
                mimeType: file.type,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }
        );
      });

      const images = await Promise.all(imagePromises);

      // Upload to S3
      const result = await uploadImages.mutateAsync({ images });
      setUploadedImageUrls(result.urls);
      setSelectedFiles([]);

      toast.success(`${result.urls.length} images uploaded successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload images");
    } finally {
      setIsUploading(false);
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
      await deleteTour.mutateAsync({ tourId });
      toast.success("Property tour deleted");
      utils.propertyTours.list.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete tour");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Property Tours</h1>
        <p className="text-muted-foreground">
          Create cinematic property tour videos with Ken Burns effects
        </p>
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
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  {selectedFiles.length} files selected ({selectedFiles.filter(f => f.type.startsWith('image')).length} images, {selectedFiles.filter(f => f.type.startsWith('video')).length} videos)
                </p>
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
                      Upload Images
                    </>
                  )}
                </Button>
              </div>
            )}

            {uploadedImageUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {uploadedImageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Property ${i + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                ))}
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
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  min="15"
                  max="120"
                />
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
              <div>
                <Label htmlFor="musicTrack">Background Music</Label>
                <Select value={musicTrack || "none"} onValueChange={(v) => setMusicTrack(v === "none" ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="No music" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No music</SelectItem>
                    <SelectItem value="upbeat">Upbeat & Modern</SelectItem>
                    <SelectItem value="elegant">Elegant & Sophisticated</SelectItem>
                    <SelectItem value="calm">Calm & Peaceful</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleCreateTour}
              disabled={createTour.isPending || generateVideo.isPending || generatingTourId !== null}
              className="w-full"
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

            {/* Progress Indicator */}
            {generatingTourId !== null && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{generationStatus}</span>
                  <span className="font-medium">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Video generation may take up to 2 minutes
                </p>
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
                    <div className="w-32 h-24 bg-muted rounded flex items-center justify-center overflow-hidden">
                      {tour.thumbnailUrl ? (
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
    </div>
  );
}
