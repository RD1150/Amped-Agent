import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Presentation, Sparkles, Download, ExternalLink, Trash2, Loader2,
  FileText, CheckCircle2, AlertCircle, Clock,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { BookmarkCheck } from "lucide-react";

const STEP_LABELS = ["Property Details", "Agent Info", "Market Data", "Export Settings"];

type FormData = {
  propertyAddress: string;
  listingPrice: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  keyFeatures: string;
  agentName: string;
  agentStats: string;
  marketData: string;
  exportFormat: "pdf" | "pptx";
  themeId: string;
};

const DEFAULT_FORM: FormData = {
  propertyAddress: "",
  listingPrice: "",
  bedrooms: "",
  bathrooms: "",
  squareFeet: "",
  keyFeatures: "",
  agentName: "",
  agentStats: "",
  marketData: "",
  exportFormat: "pptx",
  themeId: "",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 size={11} className="mr-1" />Ready</Badge>;
  if (status === "generating") return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock size={11} className="mr-1 animate-spin" />Generating</Badge>;
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle size={11} className="mr-1" />Failed</Badge>;
}

export default function ListingPresentationPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({ ...DEFAULT_FORM, agentName: user?.name ?? "" });
  const [generating, setGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const utils = trpc.useUtils();
  const { data: presentations = [] } = trpc.listingPresentation.list.useQuery();
  const { data: themes = [] } = trpc.listingPresentation.getThemes.useQuery();
  const { data: persona } = trpc.persona.get.useQuery();

  // Auto-load saved default theme on mount
  useEffect(() => {
    if (persona?.gammaThemeId) {
      setForm((f) => ({ ...f, themeId: persona.gammaThemeId! }));
    }
  }, [persona?.gammaThemeId]);

  const saveGammaThemeMutation = trpc.persona.saveGammaThemeId.useMutation({
    onSuccess: () => toast.success("Default theme saved — will auto-apply to future presentations."),
    onError: (err) => toast.error(err.message),
  });

  const generateMutation = trpc.listingPresentation.generate.useMutation({
    onSuccess: (data) => {
      setGenerating(false);
      toast.success("Presentation ready! Opening now...");
      utils.listingPresentation.list.invalidate();
      if (data.gammaUrl) window.open(data.gammaUrl, "_blank");
      else if (data.exportUrl) window.open(data.exportUrl, "_blank");
      setStep(0);
      setForm({ ...DEFAULT_FORM, agentName: user?.name ?? "" });
    },
    onError: (err) => {
      setGenerating(false);
      toast.error(err.message);
    },
  });

  const deleteMutation = trpc.listingPresentation.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); utils.listingPresentation.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const update = (field: keyof FormData, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const canAdvance = () => {
    if (step === 0) return form.propertyAddress.length > 4 && form.listingPrice.length > 0 && form.keyFeatures.length > 10;
    if (step === 1) return form.agentName.length > 1;
    return true;
  };

  const handleGenerate = () => {
    setGenerating(true);
    generateMutation.mutate({
      propertyAddress: form.propertyAddress,
      listingPrice: form.listingPrice,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      squareFeet: form.squareFeet,
      keyFeatures: form.keyFeatures,
      agentName: form.agentName,
      agentStats: form.agentStats || undefined,
      marketData: form.marketData || undefined,
      exportFormat: form.exportFormat,
      themeId: form.themeId || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Presentation className="text-amber-400" size={24} />
            Listing Presentation Builder
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Generate a polished 10-slide listing appointment deck in minutes — powered by Gamma AI.
          </p>
        </div>
        <div className="flex gap-2">
          {presentations.length > 0 && (
            <Button variant="outline" size="sm" className="border-white/20 text-white/70 bg-transparent"
              onClick={() => setShowHistory(true)}>
              <FileText size={14} className="mr-1" /> My Presentations ({presentations.length})
            </Button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              i === step ? "bg-amber-400 text-black" :
              i < step ? "bg-amber-400/20 text-amber-400" :
              "bg-white/5 text-white/40"
            }`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-current/20">
                {i < step ? "✓" : i + 1}
              </span>
              {label}
            </div>
            {i < STEP_LABELS.length - 1 && <div className={`h-px w-6 ${i < step ? "bg-amber-400/50" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5 max-w-2xl">
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold text-white">Property Details</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm">Property Address *</Label>
                <Input value={form.propertyAddress} onChange={(e) => update("propertyAddress", e.target.value)}
                  placeholder="123 Maple Street, Beverly Hills, CA 90210"
                  className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70 text-sm">Listing Price *</Label>
                  <Input value={form.listingPrice} onChange={(e) => update("listingPrice", e.target.value)}
                    placeholder="$1,250,000"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Square Feet</Label>
                  <Input value={form.squareFeet} onChange={(e) => update("squareFeet", e.target.value)}
                    placeholder="3,200 sq ft"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70 text-sm">Bedrooms</Label>
                  <Input value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)}
                    placeholder="4"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Bathrooms</Label>
                  <Input value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)}
                    placeholder="3.5"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
              </div>
              <div>
                <Label className="text-white/70 text-sm">Key Features & Highlights *</Label>
                <Textarea value={form.keyFeatures} onChange={(e) => update("keyFeatures", e.target.value)}
                  placeholder="Chef's kitchen with Thermador appliances, resort-style pool, 3-car garage, mountain views, recently renovated master suite..."
                  rows={4}
                  className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none" />
                <p className="text-white/30 text-xs mt-1">List the top selling points — the AI will turn these into compelling slides.</p>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-white">Agent Information</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm">Your Name *</Label>
                <Input value={form.agentName} onChange={(e) => update("agentName", e.target.value)}
                  placeholder="Sarah Johnson"
                  className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
              </div>
              <div>
                <Label className="text-white/70 text-sm">Your Stats & Track Record</Label>
                <Textarea value={form.agentStats} onChange={(e) => update("agentStats", e.target.value)}
                  placeholder="Top 1% in Beverly Hills for 5 consecutive years. 127 homes sold in 2024. Average 98% of list price. 14-day average days on market..."
                  rows={4}
                  className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none" />
                <p className="text-white/30 text-xs mt-1">Numbers and achievements that prove why sellers should choose you.</p>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-white">Market Data</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm">Comparable Sales & Market Data</Label>
                <Textarea value={form.marketData} onChange={(e) => update("marketData", e.target.value)}
                  placeholder="123 Oak Ave sold for $1.1M in 45 days. 456 Pine Rd sold for $1.3M in 12 days. Current inventory: 2.1 months. Median price up 8% YoY..."
                  rows={6}
                  className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none" />
                <p className="text-white/30 text-xs mt-1">Optional but powerful — comps and market trends that justify your pricing strategy.</p>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-white">Export Settings</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm">Export Format</Label>
                <Select value={form.exportFormat} onValueChange={(v) => update("exportFormat", v)}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
                    <SelectItem value="pptx">PowerPoint (.pptx) — Editable in Keynote or PowerPoint</SelectItem>
                    <SelectItem value="pdf">PDF — Best for printing or emailing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {themes.length > 0 && (
                <div>
                  <Label className="text-white/70 text-sm">Gamma Theme (optional)</Label>
                  <Select value={form.themeId} onValueChange={(v) => update("themeId", v)}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Default theme" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
                      <SelectItem value="">Default theme</SelectItem>
                      {themes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-white/30 text-xs flex-1">Apply your branded Gamma workspace theme for consistent styling.</p>
                    {form.themeId && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs border-amber-400/30 text-amber-400 hover:bg-amber-400/10 shrink-0"
                        onClick={() => saveGammaThemeMutation.mutate({ themeId: form.themeId })}
                        disabled={saveGammaThemeMutation.isPending}
                      >
                        <BookmarkCheck size={12} className="mr-1" />
                        {saveGammaThemeMutation.isPending ? "Saving..." : "Save as Default"}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 space-y-2">
                <p className="text-amber-400 text-sm font-semibold">Ready to generate</p>
                <div className="text-white/60 text-sm space-y-1">
                  <p><span className="text-white/40">Property:</span> {form.propertyAddress}</p>
                  <p><span className="text-white/40">Price:</span> {form.listingPrice}</p>
                  <p><span className="text-white/40">Agent:</span> {form.agentName}</p>
                  <p><span className="text-white/40">Format:</span> {form.exportFormat.toUpperCase()}</p>
                </div>
                <p className="text-white/40 text-xs">Gamma will generate a 10-slide presentation. This takes 1–3 minutes.</p>
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" className="border-white/20 text-white/60 bg-transparent"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || generating}>
            Back
          </Button>
          {step < STEP_LABELS.length - 1 ? (
            <Button className="bg-amber-400 hover:bg-amber-500 text-black font-semibold"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}>
              Continue →
            </Button>
          ) : (
            <Button className="bg-amber-400 hover:bg-amber-500 text-black font-semibold min-w-[160px]"
              onClick={handleGenerate}
              disabled={generating}>
              {generating ? (
                <><Loader2 size={16} className="animate-spin mr-2" />Generating (1–3 min)...</>
              ) : (
                <><Sparkles size={16} className="mr-2" />Generate Presentation</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl bg-[#0F0F0F] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">My Presentations</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {presentations.length === 0 ? (
              <p className="text-white/40 text-center py-8">No presentations yet.</p>
            ) : presentations.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={p.status} />
                    <span className="text-white/40 text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
                    <Badge variant="outline" className="text-xs border-white/20 text-white/50">{(p.exportFormat ?? "pptx").toUpperCase()}</Badge>
                  </div>
                </div>
                <div className="flex gap-2 ml-3 shrink-0">
                  {p.gammaUrl && (
                    <Button size="sm" variant="outline"
                      className="border-white/20 text-white/70 bg-transparent hover:text-amber-400"
                      onClick={() => window.open(p.gammaUrl!, "_blank")}>
                      <ExternalLink size={12} className="mr-1" /> Open
                    </Button>
                  )}
                  {p.exportUrl && (
                    <Button size="sm" variant="outline"
                      className="border-white/20 text-white/70 bg-transparent hover:text-amber-400"
                      onClick={() => window.open(p.exportUrl!, "_blank")}>
                      <Download size={12} className="mr-1" /> Download
                    </Button>
                  )}
                  <Button size="sm" variant="outline"
                    className="border-red-400/30 text-red-400 bg-transparent hover:bg-red-400/10 px-2"
                    onClick={() => deleteMutation.mutate({ presentationId: p.id })}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
