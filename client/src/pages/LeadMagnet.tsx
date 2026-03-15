import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  BarChart3,
  BookOpen,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

type MagnetType = "buyer_guide" | "neighborhood_report" | "market_update";

interface MagnetTypeConfig {
  id: MagnetType;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  extraFields?: string[];
}

const MAGNET_TYPES: MagnetTypeConfig[] = [
  {
    id: "buyer_guide",
    icon: BookOpen,
    label: "First-Time Buyer Guide",
    description: "A comprehensive step-by-step guide for first-time buyers in your market. Perfect for Facebook Lead Ads.",
    color: "text-blue-500",
    extraFields: [],
  },
  {
    id: "neighborhood_report",
    icon: MapPin,
    label: "Neighborhood Report",
    description: "An in-depth look at a specific neighborhood — schools, amenities, market data, and lifestyle.",
    color: "text-green-500",
    extraFields: ["neighborhood"],
  },
  {
    id: "market_update",
    icon: BarChart3,
    label: "Market Update",
    description: "A monthly market snapshot with key stats, buyer/seller advice, and market outlook.",
    color: "text-amber-500",
    extraFields: ["month"],
  },
];

interface GeneratedResult {
  type: MagnetType;
  label: string;
  city: string;
  pdfUrl: string;
  agentName: string;
}

export default function LeadMagnet() {
  const [selectedType, setSelectedType] = useState<MagnetType | null>(null);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [month, setMonth] = useState(
    new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
  );
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentBrokerage, setAgentBrokerage] = useState("");
  const [result, setResult] = useState<GeneratedResult | null>(null);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: persona } = trpc.persona.get.useQuery();

  // Pre-fill from persona when available
  const effectiveName = agentName || (persona as any)?.agentName || user?.name || "";
  const effectiveCity = city || (persona as any)?.primaryCity || "";

  const generate = trpc.leadMagnet.generate.useMutation({
    onSuccess: (data) => {
      setResult(data as GeneratedResult);
      toast.success(`${data.label} generated successfully!`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate lead magnet. Please try again.");
    },
  });

  const handleGenerate = () => {
    if (!selectedType) {
      toast.error("Please select a lead magnet type.");
      return;
    }
    if (!effectiveCity.trim()) {
      toast.error("Please enter your city.");
      return;
    }

    generate.mutate({
      type: selectedType,
      city: effectiveCity.trim(),
      agentName: effectiveName || undefined,
      agentPhone: agentPhone || undefined,
      agentEmail: agentEmail || user?.email || undefined,
      agentBrokerage: agentBrokerage || undefined,
      neighborhood: neighborhood || undefined,
      month: month || undefined,
    });
  };

  const handleReset = () => {
    setResult(null);
    setSelectedType(null);
  };

  const selectedConfig = MAGNET_TYPES.find((t) => t.id === selectedType);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Lead Magnet Generator</h1>
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">Premium</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Generate branded PDF lead magnets agents use for Facebook Lead Ads, email opt-ins, and open house follow-ups.
          </p>
        </div>
        {result && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
            <RefreshCw className="w-4 h-4" />
            Generate Another
          </Button>
        )}
      </div>

      {/* Value Prop */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Facebook Lead Ads", desc: "Use as opt-in offer" },
          { label: "Open House Follow-Up", desc: "Send to attendees" },
          { label: "Email Nurture", desc: "Add to drip campaigns" },
        ].map(({ label, desc }) => (
          <div key={label} className="p-3 rounded-lg bg-muted/40 border border-border text-center">
            <p className="text-xs font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Result View */}
      {result ? (
        <Card className="border border-green-500/30 bg-green-500/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{result.label} Generated!</p>
                <p className="text-sm text-muted-foreground">
                  Branded for {result.agentName} · {result.city}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 gap-2"
                onClick={() => window.open(result.pdfUrl, "_blank")}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(result.pdfUrl);
                  toast.success("PDF link copied to clipboard!");
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Copy Link
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <p className="text-xs font-medium text-foreground mb-1">How to use this lead magnet:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Upload to Facebook Ads as a downloadable offer to capture leads</li>
                <li>• Add the PDF link to your email signature or bio</li>
                <li>• Print and hand out at open houses</li>
                <li>• Include in your email nurture sequence</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Type Selection */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Choose Lead Magnet Type</h2>
            <div className="grid grid-cols-1 gap-3">
              {MAGNET_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${type.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">{type.label}</p>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields */}
          {selectedType && (
            <Card className="border border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Customize Your {selectedConfig?.label}
                </CardTitle>
                <CardDescription className="text-xs">
                  Fields marked with * are required. Others will be pulled from your persona settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* City */}
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-sm">
                    City / Market Area <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="e.g. Austin, TX"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Neighborhood (for neighborhood report) */}
                {selectedConfig?.extraFields?.includes("neighborhood") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="neighborhood" className="text-sm">
                      Neighborhood Name
                    </Label>
                    <Input
                      id="neighborhood"
                      placeholder="e.g. South Congress, Zilker, Hyde Park"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}

                {/* Month (for market update) */}
                {selectedConfig?.extraFields?.includes("month") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="month" className="text-sm">
                      Report Month
                    </Label>
                    <Input
                      id="month"
                      placeholder="e.g. March 2026"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}

                {/* Agent Details */}
                <div className="pt-2 border-t border-border space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Agent Details (shown in PDF footer)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="agentName" className="text-xs">Your Name</Label>
                      <Input
                        id="agentName"
                        placeholder={(persona as any)?.agentName || user?.name || "Agent Name"}
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="agentBrokerage" className="text-xs">Brokerage</Label>
                      <Input
                        id="agentBrokerage"
                        placeholder={(persona as any)?.brokerageName || "Brokerage Name"}
                        value={agentBrokerage}
                        onChange={(e) => setAgentBrokerage(e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="agentPhone" className="text-xs">Phone</Label>
                      <Input
                        id="agentPhone"
                        placeholder="(512) 555-0100"
                        value={agentPhone}
                        onChange={(e) => setAgentPhone(e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="agentEmail" className="text-xs">Email</Label>
                      <Input
                        id="agentEmail"
                        placeholder={user?.email || "agent@email.com"}
                        value={agentEmail}
                        onChange={(e) => setAgentEmail(e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generate.isPending || !effectiveCity.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {generate.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating PDF… (15–30 seconds)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate {selectedConfig?.label}
                    </>
                  )}
                </Button>

                {generate.isPending && (
                  <p className="text-xs text-center text-muted-foreground">
                    AI is writing your content and rendering the PDF. Please wait…
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
