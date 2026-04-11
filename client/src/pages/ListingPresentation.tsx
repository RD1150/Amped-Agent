import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Presentation, Sparkles, Download, ExternalLink, Trash2, Loader2,
  FileText, CheckCircle2, AlertCircle, Clock, Upload, X, Plus,
  Home, User, BarChart2, Megaphone, Settings2, Zap, ImageIcon,
  BookmarkCheck, RefreshCw, ChevronRight, Copy, Link,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Comp = {
  address: string;
  price: string;
  sqft: string;
  pricePerSqft: string;
  daysOnMarket: string;
  soldDate: string;
};

type Testimonial = { author: string; text: string };

type FormData = {
  // Step 1 — Property Details
  propertyAddress: string;
  listingPrice: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  lotSize: string;
  yearBuilt: string;
  propertyType: string;
  hoaFee: string;
  listingDescription: string;
  keyFeatures: string;
  // Step 2 — Photos
  photoUrls: string[];
  // Step 3 — CMA & Pricing
  comparableSales: Comp[];
  marketOverview: string;
  suggestedPriceRange: string;
  pricingRationale: string;
  // Step 4 — Agent Bio
  agentName: string;
  agentBio: string;
  agentStats: string;
  agentTestimonials: Testimonial[];
  // Step 5 — Marketing Plan
  marketingChannels: string[];
  marketingDetails: string;
  openHouseStrategy: string;
  timelineToList: string;
  // Step 6 — Export
  exportFormat: "pdf" | "pptx";
  themeId: string;
};

const MARKETING_CHANNEL_OPTIONS = [
  "MLS (Multiple Listing Service)",
  "Zillow & Realtor.com",
  "Social Media (Instagram, Facebook, LinkedIn)",
  "Email Campaign to Buyer Database",
  "Open House (Broker Preview + Public)",
  "Property Tour Video",
  "Avatar Video Announcement",
  "Print / Direct Mail",
  "Yard Sign & Lockbox",
  "Paid Digital Advertising",
  "YouTube Listing Video",
  "Neighborhood Door Knocking",
];

const EMPTY_COMP: Comp = { address: "", price: "", sqft: "", pricePerSqft: "", daysOnMarket: "", soldDate: "" };
const EMPTY_TESTIMONIAL: Testimonial = { author: "", text: "" };

const DEFAULT_FORM: FormData = {
  propertyAddress: "",
  listingPrice: "",
  bedrooms: "",
  bathrooms: "",
  squareFeet: "",
  lotSize: "",
  yearBuilt: "",
  propertyType: "",
  hoaFee: "",
  listingDescription: "",
  keyFeatures: "",
  photoUrls: [],
  comparableSales: [{ ...EMPTY_COMP }],
  marketOverview: "",
  suggestedPriceRange: "",
  pricingRationale: "",
  agentName: "",
  agentBio: "",
  agentStats: "",
  agentTestimonials: [{ ...EMPTY_TESTIMONIAL }],
  marketingChannels: ["MLS (Multiple Listing Service)", "Zillow & Realtor.com", "Social Media (Instagram, Facebook, LinkedIn)", "Open House (Broker Preview + Public)", "Property Tour Video"],
  marketingDetails: "",
  openHouseStrategy: "",
  timelineToList: "",
  exportFormat: "pptx",
  themeId: "",
};

const STEPS = [
  { label: "Property", icon: Home },
  { label: "Photos", icon: ImageIcon },
  { label: "CMA & Pricing", icon: BarChart2 },
  { label: "Agent Bio", icon: User },
  { label: "Marketing", icon: Megaphone },
  { label: "Generate", icon: Zap },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 size={11} className="mr-1" />Ready</Badge>;
  if (status === "generating") return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock size={11} className="mr-1 animate-spin" />Generating</Badge>;
  if (status === "draft") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><FileText size={11} className="mr-1" />Draft</Badge>;
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle size={11} className="mr-1" />Failed</Badge>;
}

function parseJsonSafe<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val) as T; } catch { return fallback; }
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ListingPresentationPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>({ ...DEFAULT_FORM, agentName: user?.name ?? "" });
  const [generating, setGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  const utils = trpc.useUtils();
  const { data: presentations = [] } = trpc.listingPresentation.list.useQuery();
  const { data: themes = [] } = trpc.listingPresentation.getThemes.useQuery();
  const { data: persona } = trpc.persona.get.useQuery();

  // Auto-fill agent info from persona
  useEffect(() => {
    if (persona) {
      setForm((f) => ({
        ...f,
        agentName: f.agentName || persona.agentName || user?.name || "",
        agentBio: f.agentBio || persona.bio || "",
        themeId: f.themeId || persona.gammaThemeId || "",
      }));
    }
  }, [persona, user?.name]);

  const saveGammaThemeMutation = trpc.persona.saveGammaThemeId.useMutation({
    onSuccess: () => toast.success("Default theme saved."),
    onError: (err) => toast.error(err.message),
  });

  const saveDraftMutation = trpc.listingPresentation.saveDraft.useMutation({
    onSuccess: (data) => {
      setSavingDraft(false);
      setActiveDraftId(data.id);
      utils.listingPresentation.list.invalidate();
    },
    onError: (err) => {
      setSavingDraft(false);
      toast.error("Failed to save draft: " + err.message);
    },
  });

  const getBrandedUrl = (id: number) => `${window.location.origin}/p/${id}`;

  const copyLink = (id: number) => {
    navigator.clipboard.writeText(getBrandedUrl(id));
    toast.success("Link copied to clipboard!");
  };

  const generateMutation = trpc.listingPresentation.generate.useMutation({
    onSuccess: (data) => {
      setGenerating(false);
      toast.success("Presentation ready!", {
        description: "Your branded link is ready to share.",
        action: { label: "Copy Link", onClick: () => copyLink(data.id) },
      });
      utils.listingPresentation.list.invalidate();
      // Open via branded URL to keep Gamma hidden
      window.open(getBrandedUrl(data.id), "_blank");
      setActiveDraftId(null);
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

  const update = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  // ── Auto-save draft on step advance ──────────────────────────────────────────
  const handleSaveDraft = useCallback(() => {
    setSavingDraft(true);
    saveDraftMutation.mutate({
      id: activeDraftId ?? undefined,
      title: form.propertyAddress
        ? `Listing Presentation — ${form.propertyAddress}`
        : `Listing Presentation — Draft ${new Date().toLocaleDateString()}`,
      propertyAddress: form.propertyAddress || undefined,
      listingPrice: form.listingPrice || undefined,
      bedrooms: form.bedrooms || undefined,
      bathrooms: form.bathrooms || undefined,
      squareFeet: form.squareFeet || undefined,
      lotSize: form.lotSize || undefined,
      yearBuilt: form.yearBuilt || undefined,
      propertyType: form.propertyType || undefined,
      hoaFee: form.hoaFee || undefined,
      listingDescription: form.listingDescription || undefined,
      keyFeatures: form.keyFeatures || undefined,
      photoUrls: JSON.stringify(form.photoUrls),
      comparableSales: JSON.stringify(form.comparableSales),
      marketOverview: form.marketOverview || undefined,
      suggestedPriceRange: form.suggestedPriceRange || undefined,
      pricingRationale: form.pricingRationale || undefined,
      agentName: form.agentName || undefined,
      agentBio: form.agentBio || undefined,
      agentStats: form.agentStats || undefined,
      agentTestimonials: JSON.stringify(form.agentTestimonials),
      marketingChannels: JSON.stringify(form.marketingChannels),
      marketingDetails: form.marketingDetails || undefined,
      openHouseStrategy: form.openHouseStrategy || undefined,
      timelineToList: form.timelineToList || undefined,
      exportFormat: form.exportFormat,
      themeId: form.themeId || undefined,
    });
  }, [form, activeDraftId, saveDraftMutation]);

  const advanceStep = () => {
    handleSaveDraft();
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  // ── Resume a draft ────────────────────────────────────────────────────────────
  const resumeDraft = (p: typeof presentations[0]) => {
    setActiveDraftId(p.id);
    // Try to recover themeId from stored inputData
    const savedInput = parseJsonSafe<{ themeId?: string }>(p.inputData, {});
    setForm({
      propertyAddress: p.propertyAddress ?? "",
      listingPrice: p.listingPrice ?? "",
      bedrooms: p.bedrooms ?? "",
      bathrooms: p.bathrooms ?? "",
      squareFeet: p.squareFeet ?? "",
      lotSize: p.lotSize ?? "",
      yearBuilt: p.yearBuilt ?? "",
      propertyType: p.propertyType ?? "",
      hoaFee: p.hoaFee ?? "",
      listingDescription: p.listingDescription ?? "",
      keyFeatures: p.keyFeatures ?? "",
      photoUrls: parseJsonSafe<string[]>(p.photoUrls, []),
      comparableSales: parseJsonSafe<Comp[]>(p.comparableSales, [{ ...EMPTY_COMP }]),
      marketOverview: p.marketOverview ?? "",
      suggestedPriceRange: p.suggestedPriceRange ?? "",
      pricingRationale: p.pricingRationale ?? "",
      agentName: p.agentName ?? user?.name ?? "",
      agentBio: p.agentBio ?? "",
      agentStats: p.agentStats ?? "",
      agentTestimonials: parseJsonSafe<Testimonial[]>(p.agentTestimonials, [{ ...EMPTY_TESTIMONIAL }]),
      marketingChannels: parseJsonSafe<string[]>(p.marketingChannels, DEFAULT_FORM.marketingChannels),
      marketingDetails: p.marketingDetails ?? "",
      openHouseStrategy: p.openHouseStrategy ?? "",
      timelineToList: p.timelineToList ?? "",
      exportFormat: (p.exportFormat as "pdf" | "pptx") ?? "pptx",
      themeId: savedInput.themeId ?? "",
    });
    setStep(0);
    setShowHistory(false);
    toast.success("Draft loaded — pick up where you left off.");
  };

  // ── Photo upload ──────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (form.photoUrls.length + files.length > 20) {
      toast.error("Maximum 20 photos allowed.");
      return;
    }
    setUploadingPhotos(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch("/api/upload-images", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        if (data.urls?.[0]) uploaded.push(data.urls[0]);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    if (uploaded.length > 0) {
      update("photoUrls", [...form.photoUrls, ...uploaded]);
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded`);
    }
    setUploadingPhotos(false);
  };

  const removePhoto = (idx: number) => {
    update("photoUrls", form.photoUrls.filter((_, i) => i !== idx));
  };

  // ── CMA helpers ───────────────────────────────────────────────────────────────
  const updateComp = (idx: number, field: keyof Comp, value: string) => {
    const updated = form.comparableSales.map((c, i) => i === idx ? { ...c, [field]: value } : c);
    update("comparableSales", updated);
  };
  const addComp = () => update("comparableSales", [...form.comparableSales, { ...EMPTY_COMP }]);
  const removeComp = (idx: number) => update("comparableSales", form.comparableSales.filter((_, i) => i !== idx));

  // ── Testimonial helpers ───────────────────────────────────────────────────────
  const updateTestimonial = (idx: number, field: keyof Testimonial, value: string) => {
    const updated = form.agentTestimonials.map((t, i) => i === idx ? { ...t, [field]: value } : t);
    update("agentTestimonials", updated);
  };
  const addTestimonial = () => update("agentTestimonials", [...form.agentTestimonials, { ...EMPTY_TESTIMONIAL }]);
  const removeTestimonial = (idx: number) => update("agentTestimonials", form.agentTestimonials.filter((_, i) => i !== idx));

  // ── Marketing channel toggle ──────────────────────────────────────────────────
  const toggleChannel = (ch: string) => {
    if (form.marketingChannels.includes(ch)) {
      update("marketingChannels", form.marketingChannels.filter((c) => c !== ch));
    } else {
      update("marketingChannels", [...form.marketingChannels, ch]);
    }
  };

  // ── Generate ──────────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    setGenerating(true);
    generateMutation.mutate({
      presentationId: activeDraftId ?? undefined,
      propertyAddress: form.propertyAddress,
      listingPrice: form.listingPrice,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      squareFeet: form.squareFeet,
      lotSize: form.lotSize,
      yearBuilt: form.yearBuilt,
      propertyType: form.propertyType,
      hoaFee: form.hoaFee,
      listingDescription: form.listingDescription,
      keyFeatures: form.keyFeatures,
      photoUrls: form.photoUrls,
      comparableSales: JSON.stringify(form.comparableSales),
      marketOverview: form.marketOverview,
      suggestedPriceRange: form.suggestedPriceRange,
      pricingRationale: form.pricingRationale,
      agentName: form.agentName,
      agentBio: form.agentBio,
      agentStats: form.agentStats,
      agentTestimonials: JSON.stringify(form.agentTestimonials),
      marketingChannels: form.marketingChannels,
      marketingDetails: form.marketingDetails,
      openHouseStrategy: form.openHouseStrategy,
      timelineToList: form.timelineToList,
      exportFormat: form.exportFormat,
      themeId: form.themeId || undefined,
    });
  };

  const canAdvance = () => {
    if (step === 0) return form.propertyAddress.length > 4 && form.listingPrice.length > 0;
    if (step === 3) return form.agentName.length > 1;
    return true;
  };

  const drafts = presentations.filter((p) => p.status === "draft");
  const completed = presentations.filter((p) => p.status !== "draft");

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Presentation className="text-amber-400" size={24} />
            Listing Presentation Builder
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Build a 15-slide listing appointment deck that wins the room — powered by Gamma AI.
          </p>
        </div>
        <div className="flex gap-2">
          {activeDraftId && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs px-3 py-1">
              {savingDraft ? <><Loader2 size={10} className="animate-spin mr-1" />Saving...</> : "Draft saved"}
            </Badge>
          )}
          <Button variant="outline" size="sm" className="border-white/20 text-white/70 bg-transparent"
            onClick={() => setShowHistory(true)}>
            <FileText size={14} className="mr-1" /> My Presentations ({presentations.length})
          </Button>
          <Button variant="outline" size="sm" className="border-white/20 text-white/70 bg-transparent"
            onClick={() => { setActiveDraftId(null); setStep(0); setForm({ ...DEFAULT_FORM, agentName: user?.name ?? "" }); }}>
            <Plus size={14} className="mr-1" /> New
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  i === step ? "bg-amber-400 text-black" :
                  i < step ? "bg-amber-400/20 text-amber-400 cursor-pointer hover:bg-amber-400/30" :
                  "bg-white/5 text-white/40 cursor-default"
                }`}
              >
                {i < step ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={14} className={i < step ? "text-amber-400/50" : "text-white/10"} />}
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 max-w-3xl">

        {/* ── Step 0: Property Details ── */}
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Home size={18} className="text-amber-400" />Property Details</h2>
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
                  <Label className="text-white/70 text-sm">Property Type</Label>
                  <Select value={form.propertyType} onValueChange={(v) => update("propertyType", v)}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
                      {["Single Family Home", "Condo / Townhome", "Multi-Family", "Luxury Estate", "Land / Lot", "Commercial"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-white/70 text-sm">Bedrooms</Label>
                  <Input value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} placeholder="4"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Bathrooms</Label>
                  <Input value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} placeholder="3.5"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Square Feet</Label>
                  <Input value={form.squareFeet} onChange={(e) => update("squareFeet", e.target.value)} placeholder="3,200"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-white/70 text-sm">Lot Size</Label>
                  <Input value={form.lotSize} onChange={(e) => update("lotSize", e.target.value)} placeholder="0.35 acres"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Year Built</Label>
                  <Input value={form.yearBuilt} onChange={(e) => update("yearBuilt", e.target.value)} placeholder="2018"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">HOA Fee</Label>
                  <Input value={form.hoaFee} onChange={(e) => update("hoaFee", e.target.value)} placeholder="$350/mo"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
              </div>
              <div>
                <Label className="text-white/70 text-sm">Listing Description</Label>
                <Textarea value={form.listingDescription} onChange={(e) => update("listingDescription", e.target.value)}
                  placeholder="Stunning modern estate nestled in the hills with panoramic views, chef's kitchen, resort-style pool..."
                  rows={3} className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none" />
              </div>
              <div>
                <Label className="text-white/70 text-sm">Key Features & Highlights</Label>
                <Textarea value={form.keyFeatures} onChange={(e) => update("keyFeatures", e.target.value)}
                  placeholder="Chef's kitchen with Thermador appliances, resort-style pool, 3-car garage, mountain views, recently renovated master suite..."
                  rows={4} className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none" />
                <p className="text-white/30 text-xs mt-1">List the top selling points — the AI will turn these into compelling slides.</p>
              </div>
            </div>
          </>
        )}

        {/* ── Step 1: Photos ── */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><ImageIcon size={18} className="text-amber-400" />Property Photos</h2>
            <p className="text-white/50 text-sm">Upload up to 20 photos. The best 3–4 will be featured on the cover and photo gallery slides.</p>

            {/* Upload Zone */}
            <div
              className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400/50 transition-colors"
              onClick={() => photoInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handlePhotoUpload(e.dataTransfer.files); }}
            >
              {uploadingPhotos ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={32} className="animate-spin text-amber-400" />
                  <p className="text-white/50 text-sm">Uploading photos...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={32} className="text-white/30" />
                  <p className="text-white/70 text-sm font-medium">Drop photos here or click to browse</p>
                  <p className="text-white/30 text-xs">JPG, PNG, WEBP — up to 20 photos, 10MB each</p>
                </div>
              )}
              <input ref={photoInputRef} type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files)} />
            </div>

            {/* Photo Grid */}
            {form.photoUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {form.photoUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden aspect-video bg-white/5">
                    <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => removePhoto(idx)} className="p-1 bg-red-500 rounded-full">
                        <X size={12} />
                      </button>
                    </div>
                    {idx === 0 && (
                      <div className="absolute bottom-1 left-1 bg-amber-400 text-black text-xs px-1.5 py-0.5 rounded font-semibold">Cover</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {form.photoUrls.length === 0 && (
              <p className="text-white/30 text-sm text-center">No photos yet — you can skip this step and add photos later.</p>
            )}
          </>
        )}

        {/* ── Step 2: CMA & Pricing ── */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><BarChart2 size={18} className="text-amber-400" />CMA & Pricing Strategy</h2>

            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm">Market Overview</Label>
                <Textarea value={form.marketOverview} onChange={(e) => update("marketOverview", e.target.value)}
                  placeholder="Current market conditions: seller's market with 1.8 months of inventory. Median price up 7% YoY. Average 18 days on market..."
                  rows={3} className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-white/70 text-sm">Comparable Sales (CMA)</Label>
                  <Button size="sm" variant="outline" className="border-white/20 text-white/60 bg-transparent text-xs" onClick={addComp}>
                    <Plus size={12} className="mr-1" /> Add Comp
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.comparableSales.map((comp, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Comp #{idx + 1}</span>
                        {form.comparableSales.length > 1 && (
                          <button onClick={() => removeComp(idx)} className="text-red-400/60 hover:text-red-400">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div>
                        <Input value={comp.address} onChange={(e) => updateComp(idx, "address", e.target.value)}
                          placeholder="456 Oak Ave, Beverly Hills, CA"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <Label className="text-white/40 text-xs">Sale Price</Label>
                          <Input value={comp.price} onChange={(e) => updateComp(idx, "price", e.target.value)}
                            placeholder="$1,100,000" className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm" />
                        </div>
                        <div>
                          <Label className="text-white/40 text-xs">Sq Ft</Label>
                          <Input value={comp.sqft} onChange={(e) => updateComp(idx, "sqft", e.target.value)}
                            placeholder="2,850" className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm" />
                        </div>
                        <div>
                          <Label className="text-white/40 text-xs">Days on Market</Label>
                          <Input value={comp.daysOnMarket} onChange={(e) => updateComp(idx, "daysOnMarket", e.target.value)}
                            placeholder="22" className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm" />
                        </div>
                        <div>
                          <Label className="text-white/40 text-xs">Sold Date</Label>
                          <Input value={comp.soldDate} onChange={(e) => updateComp(idx, "soldDate", e.target.value)}
                            placeholder="Mar 2025" className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70 text-sm">Suggested List Price Range</Label>
                  <Input value={form.suggestedPriceRange} onChange={(e) => update("suggestedPriceRange", e.target.value)}
                    placeholder="$1,195,000 – $1,250,000"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Pricing Rationale</Label>
                  <Input value={form.pricingRationale} onChange={(e) => update("pricingRationale", e.target.value)}
                    placeholder="Priced to generate multiple offers in 14 days"
                    className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Step 3: Agent Bio ── */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><User size={18} className="text-amber-400" />Agent Bio & Stats</h2>
            <p className="text-white/40 text-sm">Auto-filled from your Authority Profile — edit as needed for this presentation.</p>

            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm">Your Name *</Label>
                <Input value={form.agentName} onChange={(e) => update("agentName", e.target.value)}
                  placeholder="Sarah Johnson" className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30" />
              </div>
              <div>
                <Label className="text-white/70 text-sm">Agent Bio</Label>
                <Textarea value={form.agentBio} onChange={(e) => update("agentBio", e.target.value)}
                  placeholder="With 12 years of experience in Beverly Hills luxury real estate, I've helped over 200 families achieve their real estate goals..."
                  rows={4} className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none" />
              </div>
              <div>
                <Label className="text-white/70 text-sm">Stats & Track Record</Label>
                <Textarea value={form.agentStats} onChange={(e) => update("agentStats", e.target.value)}
                  placeholder="Top 1% in Beverly Hills for 5 consecutive years • 127 homes sold in 2024 • Average 98.5% of list price • 14-day average days on market • $180M in career sales volume"
                  rows={3} className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none" />
                <p className="text-white/30 text-xs mt-1">Numbers win listing appointments. Be specific.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-white/70 text-sm">Client Testimonials</Label>
                  <Button size="sm" variant="outline" className="border-white/20 text-white/60 bg-transparent text-xs" onClick={addTestimonial}>
                    <Plus size={12} className="mr-1" /> Add Testimonial
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.agentTestimonials.map((t, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-white/40 text-xs">Testimonial #{idx + 1}</Label>
                        {form.agentTestimonials.length > 1 && (
                          <button onClick={() => removeTestimonial(idx)} className="text-red-400/60 hover:text-red-400">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <Input value={t.author} onChange={(e) => updateTestimonial(idx, "author", e.target.value)}
                        placeholder="John & Mary Smith, Seller" className="bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm" />
                      <Textarea value={t.text} onChange={(e) => updateTestimonial(idx, "text", e.target.value)}
                        placeholder="Sarah sold our home in 8 days for $50,000 over asking. Her marketing strategy was unlike anything we'd seen..."
                        rows={2} className="bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm resize-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Step 4: Marketing Plan ── */}
        {step === 4 && (
          <>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Megaphone size={18} className="text-amber-400" />Marketing Plan</h2>

            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm mb-3 block">Marketing Channels</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MARKETING_CHANNEL_OPTIONS.map((ch) => (
                    <label key={ch} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:border-amber-400/30 transition-colors">
                      <Checkbox
                        checked={form.marketingChannels.includes(ch)}
                        onCheckedChange={() => toggleChannel(ch)}
                        className="border-white/30 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400"
                      />
                      <span className="text-white/70 text-sm">{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white/70 text-sm">Marketing Details & Differentiators</Label>
                <Textarea value={form.marketingDetails} onChange={(e) => update("marketingDetails", e.target.value)}
                  placeholder="Professional photography on Day 1. Drone footage. 3D Matterport tour. Targeted Facebook & Instagram ads to 50,000+ buyers in the area. Featured in Luxury Homes magazine..."
                  rows={4} className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none" />
              </div>

              <div>
                <Label className="text-white/70 text-sm">Open House Strategy</Label>
                <Textarea value={form.openHouseStrategy} onChange={(e) => update("openHouseStrategy", e.target.value)}
                  placeholder="Broker preview on Day 3. Public open house on Day 5 & 6. Catered event with staging. Targeted invitations to 200 active buyers in the neighborhood..."
                  rows={3} className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none" />
              </div>

              <div>
                <Label className="text-white/70 text-sm">Timeline to List</Label>
                <Textarea value={form.timelineToList} onChange={(e) => update("timelineToList", e.target.value)}
                  placeholder="Week 1: Sign listing agreement, professional photos & video. Week 2: MLS launch, social media blitz, broker preview. Week 3: Public open house, offer review..."
                  rows={3} className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none" />
              </div>
            </div>
          </>
        )}

        {/* ── Step 5: Generate ── */}
        {step === 5 && (
          <>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Zap size={18} className="text-amber-400" />Generate Presentation</h2>

            {/* Summary */}
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-5 space-y-3">
              <p className="text-amber-400 text-sm font-semibold">Presentation Summary</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-white/40">Property:</span> <span className="text-white/80">{form.propertyAddress || "—"}</span></div>
                <div><span className="text-white/40">Price:</span> <span className="text-white/80">{form.listingPrice || "—"}</span></div>
                <div><span className="text-white/40">Size:</span> <span className="text-white/80">{[form.bedrooms && `${form.bedrooms}bd`, form.bathrooms && `${form.bathrooms}ba`, form.squareFeet && `${form.squareFeet} sqft`].filter(Boolean).join(" · ") || "—"}</span></div>
                <div><span className="text-white/40">Photos:</span> <span className="text-white/80">{form.photoUrls.length} uploaded</span></div>
                <div><span className="text-white/40">Comps:</span> <span className="text-white/80">{form.comparableSales.filter(c => c.address).length} comparable sales</span></div>
                <div><span className="text-white/40">Agent:</span> <span className="text-white/80">{form.agentName || "—"}</span></div>
                <div><span className="text-white/40">Channels:</span> <span className="text-white/80">{form.marketingChannels.length} selected</span></div>
                <div><span className="text-white/40">Testimonials:</span> <span className="text-white/80">{form.agentTestimonials.filter(t => t.text).length} added</span></div>
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm">Export Format</Label>
                <Select value={form.exportFormat} onValueChange={(v) => update("exportFormat", v as "pdf" | "pptx")}>
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
                  {form.themeId && (
                    <Button type="button" size="sm" variant="outline"
                      className="mt-2 text-xs border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                      onClick={() => saveGammaThemeMutation.mutate({ themeId: form.themeId })}
                      disabled={saveGammaThemeMutation.isPending}>
                      <BookmarkCheck size={12} className="mr-1" />
                      {saveGammaThemeMutation.isPending ? "Saving..." : "Save as Default Theme"}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/50 text-xs">Gamma AI will generate a 15-slide presentation from all your data. This takes 1–3 minutes. You'll get a shareable link and a download button when it's ready.</p>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2 border-t border-white/10">
          <Button variant="outline" className="border-white/20 text-white/60 bg-transparent"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || generating}>
            ← Back
          </Button>
          <div className="flex gap-2">
            {step < STEPS.length - 1 && (
              <Button variant="outline" size="sm" className="border-white/20 text-white/50 bg-transparent text-xs"
                onClick={handleSaveDraft} disabled={savingDraft}>
                {savingDraft ? <><Loader2 size={12} className="animate-spin mr-1" />Saving...</> : "Save Draft"}
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button className="bg-amber-400 hover:bg-amber-500 text-black font-semibold"
                onClick={advanceStep}
                disabled={!canAdvance()}>
                Continue →
              </Button>
            ) : (
              <Button className="bg-amber-400 hover:bg-amber-500 text-black font-semibold min-w-[180px]"
                onClick={handleGenerate}
                disabled={generating}>
                {generating ? (
                  <><Loader2 size={16} className="animate-spin mr-2" />Generating (1–3 min)...</>
                ) : (
                  <><Sparkles size={16} className="mr-2" />Generate 15-Slide Deck</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl bg-[#0F0F0F] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">My Presentations</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {drafts.length > 0 && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Drafts — Resume Anytime</p>
                <div className="space-y-2">
                  {drafts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={p.status} />
                          <span className="text-white/40 text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-3 shrink-0">
                        <Button size="sm" className="bg-amber-400 hover:bg-amber-500 text-black text-xs"
                          onClick={() => resumeDraft(p)}>
                          <RefreshCw size={12} className="mr-1" /> Resume
                        </Button>
                        <Button size="sm" variant="outline"
                          className="border-red-400/30 text-red-400 bg-transparent hover:bg-red-400/10 px-2"
                          onClick={() => deleteMutation.mutate({ presentationId: p.id })}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Completed Presentations</p>
                <div className="space-y-2">
                  {completed.map((p) => (
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
                        {p.status === "completed" && (
                          <>
                            <Button size="sm" variant="outline"
                              className="border-white/20 text-white/70 bg-transparent hover:text-amber-400"
                              onClick={() => window.open(getBrandedUrl(p.id), "_blank")}>
                              <ExternalLink size={12} className="mr-1" /> View
                            </Button>
                            <Button size="sm" variant="outline"
                              className="border-white/20 text-white/70 bg-transparent hover:text-amber-400 px-2"
                              title="Copy shareable link"
                              onClick={() => copyLink(p.id)}>
                              <Copy size={12} />
                            </Button>
                          </>
                        )}
                        {p.exportUrl && (
                          <Button size="sm" variant="outline"
                            className="border-white/20 text-white/70 bg-transparent hover:text-amber-400 px-2"
                            title="Download file"
                            onClick={() => window.open(p.exportUrl!, "_blank")}>
                            <Download size={12} />
                          </Button>
                        )}
                        {p.status === "draft" && (
                          <Button size="sm" variant="outline"
                            className="border-amber-400/30 text-amber-400 bg-transparent hover:bg-amber-400/10"
                            onClick={() => resumeDraft(p)}>
                            <RefreshCw size={12} className="mr-1" /> Resume
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
              </div>
            )}

            {presentations.length === 0 && (
              <p className="text-white/40 text-center py-8">No presentations yet. Start building your first one!</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
