import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BookOpen,
  Home,
  Users,
  Upload,
  Plus,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CMAComp {
  address: string;
  salePrice: string;
  beds: string;
  baths: string;
  sqft: string;
  saleDate: string;
  adjustments?: string;
  notes?: string;
}

export default function GuideGenerator() {
  const [guideType, setGuideType] = useState<"sellers_manual" | "buyers_guide">("sellers_manual");
  const [clientName, setClientName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [cityArea, setCityArea] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [suggestedPriceRange, setSuggestedPriceRange] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [cmaComps, setCmaComps] = useState<CMAComp[]>([]);
  const [showCMA, setShowCMA] = useState(false);
  const [showAdvancedCMA, setShowAdvancedCMA] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.imageLibrary.upload.useMutation();

  const generateMutation = trpc.guidesGenerator.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedUrl(data.pdfUrl);
      toast.success(`Your branded ${guideType === "sellers_manual" ? "Seller's Manual" : "Buyer's Guide"} is ready to download.`);
    },
    onError: (err) => {
      toast.error("Generation failed: " + err.message);
    },
  });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          images: [{
            filename: file.name,
            mimeType: file.type,
            dataBase64: base64,
            sizeBytes: file.size,
          }],
        });
        const url = result.uploaded[0]?.url;
        if (url) {
          setCoverPhotoUrl(url);
          toast.success("Cover photo uploaded");
        }
        setCoverUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Upload failed");
      setCoverUploading(false);
    }
  };

  const addComp = () => {
    setCmaComps((prev) => [
      ...prev,
      { address: "", salePrice: "", beds: "", baths: "", sqft: "", saleDate: "", adjustments: "", notes: "" },
    ]);
  };

  const updateComp = (i: number, field: keyof CMAComp, value: string) => {
    setCmaComps((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  const removeComp = (i: number) => {
    setCmaComps((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleGenerate = () => {
    if (!cityArea.trim()) {
      toast.error("City/area is required");
      return;
    }
    generateMutation.mutate({
      guideType,
      clientName: clientName || undefined,
      propertyAddress: propertyAddress || undefined,
      cityArea,
      coverPhotoUrl: coverPhotoUrl || undefined,
      cmaComps: cmaComps.length > 0 ? cmaComps : undefined,
      suggestedPriceRange: suggestedPriceRange || undefined,
      customNotes: customNotes || undefined,
    });
  };

  const isSeller = guideType === "sellers_manual";

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <BookOpen className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Branded Guide Generator</h1>
          <p className="text-sm text-muted-foreground">
            Create a professional, print-ready PDF branded with your name, photo, and brokerage.
          </p>
        </div>
      </div>

      {/* Guide type selector */}
      <Tabs value={guideType} onValueChange={(v) => setGuideType(v as typeof guideType)}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="sellers_manual" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Seller's Manual
          </TabsTrigger>
          <TabsTrigger value="buyers_guide" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Buyer's Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sellers_manual">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground">
                An 8-chapter guide covering the full seller journey — from preparing the home to closing day.
                Branded with your photo, logo, and brokerage. Includes hyperlocal market data and optional CMA.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="buyers_guide">
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground">
                An 8-chapter guide covering the full buyer journey — from pre-approval to after the keys.
                Branded with your photo, logo, and brokerage. Includes hyperlocal market data for the buyer's target area.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customize Your Guide</CardTitle>
          <CardDescription>
            Your Authority Profile data (name, photo, brokerage, logo) will be applied automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Client name */}
          <div className="space-y-1.5">
            <Label htmlFor="clientName">Client Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="clientName"
              placeholder={isSeller ? "e.g. John & Mary Smith" : "e.g. The Johnson Family"}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Appears in your document history for easy reference.</p>
          </div>

          {/* Property address (sellers only) */}
          {isSeller && (
            <div className="space-y-1.5">
              <Label htmlFor="propertyAddress">Property Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="propertyAddress"
                placeholder="e.g. 123 Oak Street, Pasadena, CA"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
              />
            </div>
          )}

          {/* City / area */}
          <div className="space-y-1.5">
            <Label htmlFor="cityArea">
              {isSeller ? "Market Area" : "Buyer's Target Area"} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cityArea"
              placeholder={isSeller ? "e.g. Pasadena, CA" : "e.g. Los Angeles, CA"}
              value={cityArea}
              onChange={(e) => setCityArea(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used to pull hyperlocal market data for the guide's market snapshot page.
            </p>
          </div>

          {/* Cover photo */}
          <div className="space-y-1.5">
            <Label>Cover Photo <span className="text-muted-foreground text-xs">(optional — uses default if not uploaded)</span></Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={coverUploading}
                className="flex items-center gap-2"
              >
                {coverUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {coverUploading ? "Uploading..." : "Upload Photo"}
              </Button>
              {coverPhotoUrl && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Photo uploaded</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCoverPhotoUrl("")}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
            {coverPhotoUrl && (
              <img src={coverPhotoUrl} alt="Cover preview" className="mt-2 h-24 w-40 object-cover rounded-md border" />
            )}
          </div>

          {/* CMA Section (sellers only) */}
          {isSeller && (
            <Collapsible open={showCMA} onOpenChange={setShowCMA}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 w-full justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Add CMA (Comparable Market Analysis)
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  </span>
                  {showCMA ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Enter comparable sales from your MLS. The guide will format them into a professional CMA page.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedCMA(!showAdvancedCMA)}
                    className="text-xs text-muted-foreground"
                  >
                    {showAdvancedCMA ? "Simple mode" : "Advanced mode (adjustments)"}
                  </Button>
                </div>

                {cmaComps.map((comp, i) => (
                  <Card key={i} className="p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Comp #{i + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeComp(i)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Input
                        placeholder="Address"
                        value={comp.address}
                        onChange={(e) => updateComp(i, "address", e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Sale Price ($)"
                          value={comp.salePrice || ""}
                          onChange={(e) => updateComp(i, "salePrice", e.target.value)}
                        />
                        <Input
                          placeholder="Sale Date"
                          type="date"
                          value={comp.saleDate}
                          onChange={(e) => updateComp(i, "saleDate", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          placeholder="Beds"
                          value={comp.beds || ""}
                          onChange={(e) => updateComp(i, "beds", e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Baths"
                          value={comp.baths || ""}
                          onChange={(e) => updateComp(i, "baths", e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Sq Ft"
                          value={comp.sqft || ""}
                          onChange={(e) => updateComp(i, "sqft", e.target.value)}
                        />
                      </div>
                      {showAdvancedCMA && (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Adjustment (+/-)"
                            value={comp.adjustments ?? ""}
                            onChange={(e) => updateComp(i, "adjustments", e.target.value)}
                          />
                          <Input
                            placeholder="Notes (optional)"
                            value={comp.notes ?? ""}
                            onChange={(e) => updateComp(i, "notes", e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addComp}
                  disabled={cmaComps.length >= 6}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Comparable
                </Button>

                {cmaComps.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Suggested Price Range</Label>
                    <Input
                      placeholder="e.g. $850,000 – $875,000"
                      value={suggestedPriceRange}
                      onChange={(e) => setSuggestedPriceRange(e.target.value)}
                    />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Custom notes */}
          <div className="space-y-1.5">
            <Label htmlFor="customNotes">
              Custom Notes / Action Plan <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="customNotes"
              placeholder={
                isSeller
                  ? "e.g. Pricing strategy discussed: list at $875K. Staging: declutter living room, paint front door. Timeline: list in 3 weeks."
                  : "e.g. Buyer pre-approved at $650K. Preferred areas: Pasadena, Arcadia. Must-haves: 3 bed, 2 bath, garage."
              }
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Added as a personalized page at the back of the guide — great for post-appointment follow-up.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Generate button */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Costs <span className="font-medium text-foreground">10 credits</span> per generation. Re-downloads are always free.
        </p>
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || !cityArea.trim()}
          className="bg-amber-500 hover:bg-amber-600 text-white min-w-[160px]"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4 mr-2" />
              Generate Guide
            </>
          )}
        </Button>
      </div>

      {/* Result */}
      {generatedUrl && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-5 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Your guide is ready!</p>
                <p className="text-sm text-muted-foreground">
                  Download it and take it to your printer before the appointment.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="bg-green-600 hover:bg-green-700 text-white shrink-0"
            >
              <a href={generatedUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
