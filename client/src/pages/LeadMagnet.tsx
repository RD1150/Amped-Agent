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
  Eye,
  ChevronRight,
} from "lucide-react";

type MagnetType = "buyer_guide" | "neighborhood_report" | "market_update";

interface MagnetTypeConfig {
  id: MagnetType;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  accentColor: string;
  bgColor: string;
  previewLines: string[];
  extraFields?: string[];
}

const MAGNET_TYPES: MagnetTypeConfig[] = [
  {
    id: "buyer_guide",
    icon: BookOpen,
    label: "First-Time Buyer Guide",
    description: "A comprehensive step-by-step guide for first-time buyers in your market. Perfect for Facebook Lead Ads.",
    color: "text-blue-500",
    accentColor: "#2563eb",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    previewLines: ["Step 1: Get Pre-Approved", "Step 2: Find Your Home", "Step 3: Make an Offer", "Step 4: Close the Deal"],
    extraFields: [],
  },
  {
    id: "neighborhood_report",
    icon: MapPin,
    label: "Neighborhood Report",
    description: "An in-depth look at a specific neighborhood — schools, amenities, market data, and lifestyle.",
    color: "text-green-500",
    accentColor: "#16a34a",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    previewLines: ["Schools & Education", "Local Amenities", "Market Trends", "Lifestyle & Community"],
    extraFields: ["neighborhood"],
  },
  {
    id: "market_update",
    icon: BarChart3,
    label: "Market Update",
    description: "A monthly market snapshot with key stats, buyer/seller advice, and market outlook.",
    color: "text-amber-500",
    accentColor: "#d97706",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    previewLines: ["Median Home Price", "Days on Market", "Buyer vs Seller Market", "Market Outlook"],
    extraFields: ["month"],
  },
];

interface GeneratedResult {
  type: MagnetType;
  label: string;
  city: string;
  pdfUrl: string;
  agentName: string;
  agentPhone?: string;
  agentEmail?: string;
  agentBrokerage?: string;
  primaryColor?: string;
  content?: any;
}

// ── Template Thumbnail ──────────────────────────────────────────────────────
function TemplateThumbnail({ config, selected, onClick }: {
  config: MagnetTypeConfig;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = config.icon;
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-xl border-2 overflow-hidden transition-all group ${
        selected
          ? "border-primary shadow-md shadow-primary/20 ring-2 ring-primary/30"
          : "border-border hover:border-primary/50 hover:shadow-sm"
      }`}
    >
      {/* Mini PDF preview */}
      <div className={`${config.bgColor} p-4 pb-3`}>
        <div className="bg-white dark:bg-card rounded-lg shadow-sm p-3 space-y-2">
          {/* Header bar */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: config.accentColor + "20" }}>
              <Icon className="w-3 h-3" style={{ color: config.accentColor }} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: config.accentColor }} />
              <div className="h-1.5 rounded-full w-1/2 bg-muted" />
            </div>
          </div>
          {/* Content lines */}
          <div className="space-y-1.5 pt-1">
            {config.previewLines.map((line, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: config.accentColor }} />
                <div className="h-1.5 rounded-full bg-muted flex-1" style={{ width: `${60 + i * 8}%` }} />
              </div>
            ))}
          </div>
          {/* Footer bar */}
          <div className="pt-1 border-t border-border/50">
            <div className="h-1.5 rounded-full bg-muted w-2/3" />
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="p-3 bg-card">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-foreground leading-tight">{config.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{config.description}</p>
          </div>
          {selected && (
            <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          )}
        </div>
      </div>
    </button>
  );
}

// ── Live Content Preview ────────────────────────────────────────────────────
function ContentPreview({ result }: { result: GeneratedResult }) {
  const config = MAGNET_TYPES.find(t => t.id === result.type)!;
  const content = result.content;

  const renderSections = () => {
    if (!content) return null;

    if (result.type === "buyer_guide" && content.sections) {
      return content.sections.map((section: any, i: number) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: config.accentColor }}>
              {i + 1}
            </div>
            <h4 className="text-sm font-semibold text-foreground">{section.title || section.step}</h4>
          </div>
          <p className="text-xs text-muted-foreground pl-7 leading-relaxed">{section.content || section.description}</p>
        </div>
      ));
    }

    if (result.type === "neighborhood_report") {
      const sections = [
        { key: "overview", label: "Overview" },
        { key: "schools", label: "Schools & Education" },
        { key: "amenities", label: "Local Amenities" },
        { key: "market", label: "Market Data" },
        { key: "lifestyle", label: "Lifestyle" },
      ];
      return sections.map(({ key, label }) => content[key] ? (
        <div key={key} className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.accentColor }} />
            {label}
          </h4>
          <p className="text-xs text-muted-foreground pl-3.5 leading-relaxed">{content[key]}</p>
        </div>
      ) : null);
    }

    if (result.type === "market_update") {
      const sections = [
        { key: "summary", label: "Market Summary" },
        { key: "stats", label: "Key Statistics" },
        { key: "buyer_advice", label: "Advice for Buyers" },
        { key: "seller_advice", label: "Advice for Sellers" },
        { key: "outlook", label: "Market Outlook" },
      ];
      return sections.map(({ key, label }) => {
        const val = content[key];
        if (!val) return null;
        return (
          <div key={key} className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.accentColor }} />
              {label}
            </h4>
            <p className="text-xs text-muted-foreground pl-3.5 leading-relaxed">
              {typeof val === "object" ? JSON.stringify(val, null, 2) : val}
            </p>
          </div>
        );
      });
    }

    return null;
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm">
      {/* PDF Header */}
      <div className="p-5 text-white" style={{ backgroundColor: result.primaryColor || config.accentColor }}>
        <div className="flex items-center gap-2 mb-3">
          <config.icon className="w-5 h-5 opacity-80" />
          <Badge className="bg-white/20 text-white border-white/30 text-[10px]">Lead Magnet Preview</Badge>
        </div>
        <h2 className="text-base font-bold leading-tight">
          {content?.title || result.label}
        </h2>
        {content?.subtitle && (
          <p className="text-xs opacity-80 mt-1">{content.subtitle}</p>
        )}
        <p className="text-xs opacity-70 mt-1">{result.city}</p>
      </div>

      {/* Content Body */}
      <div className="p-5 space-y-4 bg-card max-h-96 overflow-y-auto">
        {content?.intro && (
          <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 pl-3" style={{ borderColor: config.accentColor }}>
            {content.intro}
          </p>
        )}
        {renderSections()}
        {content?.conclusion && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">{content.conclusion}</p>
          </div>
        )}
      </div>

      {/* Agent Footer */}
      <div className="px-5 py-3 bg-muted/40 border-t border-border flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-foreground">{result.agentName}</p>
          {result.agentBrokerage && <p className="text-[10px] text-muted-foreground">{result.agentBrokerage}</p>}
          <div className="flex gap-3 mt-0.5">
            {result.agentPhone && <p className="text-[10px] text-muted-foreground">{result.agentPhone}</p>}
            {result.agentEmail && <p className="text-[10px] text-muted-foreground">{result.agentEmail}</p>}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: result.primaryColor || config.accentColor }}>
          {result.agentName?.charAt(0) || "A"}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
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
  const [showPreview, setShowPreview] = useState(true);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: persona } = trpc.persona.get.useQuery();

  const effectiveName = agentName || (persona as any)?.agentName || user?.name || "";
  const effectiveCity = city || (persona as any)?.primaryCity || "";

  const generate = trpc.leadMagnet.generate.useMutation({
    onSuccess: (data) => {
      setResult(data as GeneratedResult);
      setShowPreview(true);
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
    setShowPreview(true);
  };

  const selectedConfig = MAGNET_TYPES.find((t) => t.id === selectedType);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Lead Magnet Generator</h1>
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">Premium</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Generate branded PDF lead magnets for Facebook Lead Ads, email opt-ins, and open house follow-ups.
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
      {!result && (
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
      )}

      {result ? (
        /* ── Result View with Preview ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Actions */}
          <div className="space-y-4">
            <Card className="border border-green-500/30 bg-green-500/5">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{result.label} Ready!</p>
                    <p className="text-sm text-muted-foreground">
                      Branded for {result.agentName} · {result.city}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button className="w-full gap-2" onClick={() => window.open(result.pdfUrl, "_blank")}>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(result.pdfUrl);
                      toast.success("PDF link copied to clipboard!");
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Copy Shareable Link
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-muted-foreground"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </Button>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-xs font-medium text-foreground mb-1">How to use this lead magnet:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />Upload to Facebook Ads as a downloadable offer to capture leads</li>
                    <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />Add the PDF link to your email signature or bio</li>
                    <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />Print and hand out at open houses</li>
                    <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />Include in your email nurture sequence</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Live Preview */}
          {showPreview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Content Preview</p>
                <Badge variant="outline" className="text-[10px]">Matches your PDF</Badge>
              </div>
              <ContentPreview result={result} />
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Template Thumbnail Picker ── */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Choose Your Template</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MAGNET_TYPES.map((type) => (
                <TemplateThumbnail
                  key={type.id}
                  config={type}
                  selected={selectedType === type.id}
                  onClick={() => setSelectedType(type.id)}
                />
              ))}
            </div>
          </div>

          {/* ── Form Fields ── */}
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

                {/* Neighborhood */}
                {selectedConfig?.extraFields?.includes("neighborhood") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="neighborhood" className="text-sm">Neighborhood Name</Label>
                    <Input
                      id="neighborhood"
                      placeholder="e.g. South Congress, Zilker, Hyde Park"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}

                {/* Month */}
                {selectedConfig?.extraFields?.includes("month") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="month" className="text-sm">Report Month</Label>
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
                  <p className="text-xs font-medium text-muted-foreground">Agent Details (shown in PDF footer)</p>
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
