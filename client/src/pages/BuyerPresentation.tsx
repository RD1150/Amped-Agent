import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  UserCheck, ChevronRight, ChevronLeft, Loader2, CheckCircle2, ExternalLink,
  Copy, Trash2, Plus, X, Mail, Phone, Calendar, BarChart3, Home, FileText,
  Send, BookOpen,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

// ── Types ─────────────────────────────────────────────────────────────────────

type Testimonial = { author: string; text: string };

interface FormState {
  id?: number;
  title: string;
  // Step 1: Buyer Details
  buyerName: string;
  buyerType: string;
  priceRange: string;
  targetAreas: string[];
  desiredBedrooms: string;
  desiredBathrooms: string;
  mustHaves: string;
  niceToHaves: string;
  timeline: string;
  // Step 2: Market Snapshot
  marketCity: string;
  marketState: string;
  marketOverview: string;
  avgDaysOnMarket: string;
  avgListPrice: string;
  inventoryLevel: string;
  // Step 3: Financing
  financingNotes: string;
  lenderName: string;
  lenderContact: string;
  // Step 4: Agent Bio
  agentName: string;
  agentBio: string;
  agentStats: string;
  agentTestimonials: Testimonial[];
  // Step 5: Buying Process
  processSteps: string[];
  buyerConcerns: string;
  // Export
  exportFormat: "pdf" | "pptx";
}

const defaultForm = (): FormState => ({
  title: "Buyer Consultation",
  buyerName: "", buyerType: "first-time", priceRange: "",
  targetAreas: [], desiredBedrooms: "", desiredBathrooms: "",
  mustHaves: "", niceToHaves: "", timeline: "",
  marketCity: "", marketState: "", marketOverview: "",
  avgDaysOnMarket: "", avgListPrice: "", inventoryLevel: "balanced",
  financingNotes: "", lenderName: "", lenderContact: "",
  agentName: "", agentBio: "", agentStats: "",
  agentTestimonials: [{ author: "", text: "" }],
  processSteps: [
    "Get Pre-Approved", "Define Your Search Criteria", "Tour Homes",
    "Make an Offer", "Inspection & Due Diligence", "Final Walk-Through", "Close & Get Keys"
  ],
  buyerConcerns: "",
  exportFormat: "pptx",
});

const STEPS = [
  { label: "Buyer Details", icon: UserCheck },
  { label: "Market Snapshot", icon: BarChart3 },
  { label: "Financing", icon: Home },
  { label: "Agent Bio", icon: FileText },
  { label: "Buying Process", icon: BookOpen },
  { label: "Generate", icon: CheckCircle2 },
];

const BUYER_TYPES = [
  { value: "first-time", label: "First-Time Buyer" },
  { value: "move-up", label: "Move-Up Buyer" },
  { value: "investor", label: "Investor" },
  { value: "relocating", label: "Relocating" },
  { value: "downsizing", label: "Downsizing" },
  { value: "second-home", label: "Second Home / Vacation" },
];

const INVENTORY_LEVELS = [
  { value: "low", label: "Low Inventory (Seller's Market)" },
  { value: "balanced", label: "Balanced Market" },
  { value: "high", label: "High Inventory (Buyer's Market)" },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function BuyerPresentation() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [newArea, setNewArea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ gammaUrl: string; id: number } | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<{ id: number; gammaUrl: string; buyerName: string } | null>(null);
  const [sendEmail, setSendEmail] = useState("");
  const [sendPhone, setSendPhone] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: presentations, refetch } = trpc.buyerPresentation.list.useQuery();
  const saveDraftMutation = trpc.buyerPresentation.saveDraft.useMutation();
  const generateMutation = trpc.buyerPresentation.generate.useMutation();
  const deleteMutation = trpc.buyerPresentation.delete.useMutation();
  const { data: persona } = trpc.auth.me.useQuery();

  // Pre-fill agent info from persona
  useEffect(() => {
    if (persona && !form.agentName) {
      setForm(f => ({
        ...f,
        agentName: (persona as any).agentName ?? (persona as any).name ?? f.agentName,
        agentBio: (persona as any).bio ?? f.agentBio,
      }));
    }
  }, [persona]);

  const set = (key: keyof FormState, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }));

  // ── Auto-save draft on step advance ──────────────────────────────────────
  const saveDraft = async (formData: FormState) => {
    try {
      const result = await saveDraftMutation.mutateAsync({
        id: formData.id,
        title: formData.title || "Buyer Consultation",
        buyerName: formData.buyerName || undefined,
        buyerType: formData.buyerType || undefined,
        priceRange: formData.priceRange || undefined,
        targetAreas: formData.targetAreas.length ? JSON.stringify(formData.targetAreas) : undefined,
        desiredBedrooms: formData.desiredBedrooms || undefined,
        desiredBathrooms: formData.desiredBathrooms || undefined,
        mustHaves: formData.mustHaves || undefined,
        niceToHaves: formData.niceToHaves || undefined,
        timeline: formData.timeline || undefined,
        marketCity: formData.marketCity || undefined,
        marketState: formData.marketState || undefined,
        marketOverview: formData.marketOverview || undefined,
        avgDaysOnMarket: formData.avgDaysOnMarket || undefined,
        avgListPrice: formData.avgListPrice || undefined,
        inventoryLevel: formData.inventoryLevel || undefined,
        financingNotes: formData.financingNotes || undefined,
        lenderName: formData.lenderName || undefined,
        lenderContact: formData.lenderContact || undefined,
        agentName: formData.agentName || undefined,
        agentBio: formData.agentBio || undefined,
        agentStats: formData.agentStats || undefined,
        agentTestimonials: formData.agentTestimonials.filter(t => t.text).length
          ? JSON.stringify(formData.agentTestimonials.filter(t => t.text))
          : undefined,
        processSteps: formData.processSteps.filter(Boolean).length
          ? JSON.stringify(formData.processSteps.filter(Boolean))
          : undefined,
        buyerConcerns: formData.buyerConcerns || undefined,
        exportFormat: formData.exportFormat,
      });
      if (!formData.id) setForm(f => ({ ...f, id: result.id }));
      return result.id;
    } catch (err) {
      console.error("Draft save failed:", err);
    }
  };

  const nextStep = async () => {
    await saveDraft(form);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!form.buyerType) { toast.error("Please select a buyer type"); return; }
    if (!form.marketCity) { toast.error("Please enter the target market city"); return; }
    if (!form.agentName) { toast.error("Please enter your name in the Agent Bio step"); return; }

    setGenerating(true);
    try {
      const savedId = await saveDraft(form);
      const res = await generateMutation.mutateAsync({
        presentationId: savedId ?? form.id,
        buyerName: form.buyerName || undefined,
        buyerType: form.buyerType,
        priceRange: form.priceRange || undefined,
        targetAreas: form.targetAreas.length ? form.targetAreas : undefined,
        desiredBedrooms: form.desiredBedrooms || undefined,
        desiredBathrooms: form.desiredBathrooms || undefined,
        mustHaves: form.mustHaves || undefined,
        niceToHaves: form.niceToHaves || undefined,
        timeline: form.timeline || undefined,
        marketCity: form.marketCity,
        marketState: form.marketState || undefined,
        marketOverview: form.marketOverview || undefined,
        avgDaysOnMarket: form.avgDaysOnMarket || undefined,
        avgListPrice: form.avgListPrice || undefined,
        inventoryLevel: form.inventoryLevel || undefined,
        financingNotes: form.financingNotes || undefined,
        lenderName: form.lenderName || undefined,
        lenderContact: form.lenderContact || undefined,
        agentName: form.agentName,
        agentBio: form.agentBio || undefined,
        agentStats: form.agentStats || undefined,
        agentTestimonials: form.agentTestimonials.filter(t => t.text).length
          ? JSON.stringify(form.agentTestimonials.filter(t => t.text))
          : undefined,
        processSteps: form.processSteps.filter(Boolean).length ? form.processSteps.filter(Boolean) : undefined,
        buyerConcerns: form.buyerConcerns || undefined,
        exportFormat: form.exportFormat,
      });
      setResult({ gammaUrl: res.gammaUrl, id: res.id! });
      toast.success("Buyer presentation generated!");
      refetch();
    } catch (err: any) {
      toast.error(err.message ?? "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // ── Share helpers ─────────────────────────────────────────────────────────
  const brandedUrl = (id: number) => `${window.location.origin}/p/${id}`;

  const copyLink = (id: number) => {
    navigator.clipboard.writeText(brandedUrl(id));
    toast.success("Link copied to clipboard");
  };

  const openSendDialog = (pres: { id: number; gammaUrl: string; buyerName?: string | null }) => {
    setSendTarget({ id: pres.id, gammaUrl: pres.gammaUrl!, buyerName: pres.buyerName ?? "Your Buyer" });
    setSendEmail(""); setSendPhone("");
    setSendDialogOpen(true);
  };

  const sendEmail_ = () => {
    const url = brandedUrl(sendTarget!.id);
    const subject = encodeURIComponent(`Your Buyer Consultation — ${sendTarget!.buyerName}`);
    const body = encodeURIComponent(`Hi ${sendTarget!.buyerName},\n\nI've prepared a personalized buyer consultation presentation for you. Please click the link below to view it:\n\n${url}\n\nI'm looking forward to helping you find your perfect home. Please don't hesitate to reach out with any questions.\n\nBest,\n${form.agentName}`);
    window.open(`mailto:${sendEmail}?subject=${subject}&body=${body}`, "_blank");
    setSendDialogOpen(false);
    toast.success("Email client opened");
  };

  const sendSMS = () => {
    const url = brandedUrl(sendTarget!.id);
    const msg = encodeURIComponent(`Hi ${sendTarget!.buyerName}! I've prepared your buyer consultation presentation. View it here: ${url}`);
    window.open(`sms:${sendPhone}?body=${msg}`, "_blank");
    setSendDialogOpen(false);
    toast.success("SMS app opened");
  };

  const resumeDraft = (pres: any) => {
    const inp = pres.inputData ? JSON.parse(pres.inputData) : {};
    setForm({
      ...defaultForm(),
      id: pres.id,
      title: pres.title ?? "Buyer Consultation",
      buyerName: pres.buyerName ?? "",
      buyerType: pres.buyerType ?? "first-time",
      priceRange: pres.priceRange ?? "",
      targetAreas: pres.targetAreas ? JSON.parse(pres.targetAreas) : [],
      desiredBedrooms: pres.desiredBedrooms ?? "",
      desiredBathrooms: pres.desiredBathrooms ?? "",
      mustHaves: pres.mustHaves ?? "",
      niceToHaves: pres.niceToHaves ?? "",
      timeline: pres.timeline ?? "",
      marketCity: pres.marketCity ?? "",
      marketState: pres.marketState ?? "",
      marketOverview: pres.marketOverview ?? "",
      avgDaysOnMarket: pres.avgDaysOnMarket ?? "",
      avgListPrice: pres.avgListPrice ?? "",
      inventoryLevel: pres.inventoryLevel ?? "balanced",
      financingNotes: pres.financingNotes ?? "",
      lenderName: pres.lenderName ?? "",
      lenderContact: pres.lenderContact ?? "",
      agentName: pres.agentName ?? "",
      agentBio: pres.agentBio ?? "",
      agentStats: pres.agentStats ?? "",
      agentTestimonials: pres.agentTestimonials ? JSON.parse(pres.agentTestimonials) : [{ author: "", text: "" }],
      processSteps: pres.processSteps ? JSON.parse(pres.processSteps) : defaultForm().processSteps,
      buyerConcerns: pres.buyerConcerns ?? "",
      exportFormat: pres.exportFormat ?? "pptx",
    });
    setStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Draft loaded — continue where you left off");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-orange-500/10">
          <UserCheck className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buyer Presentation</h1>
          <p className="text-sm text-muted-foreground">AI-generated buyer consultation deck — branded and ready to share</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive ? "bg-orange-500 text-white" :
                  isDone ? "bg-orange-100 text-orange-700 cursor-pointer hover:bg-orange-200" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6 space-y-5">

          {/* ── Step 0: Buyer Details ─────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg">Buyer Details</CardTitle>
              </CardHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Buyer Name (optional)</Label>
                  <Input placeholder="e.g. John & Sarah Smith" value={form.buyerName} onChange={e => set("buyerName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Buyer Type *</Label>
                  <Select value={form.buyerType} onValueChange={v => set("buyerType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUYER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Price Range</Label>
                  <Input placeholder="e.g. $400,000 – $550,000" value={form.priceRange} onChange={e => set("priceRange", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Timeline</Label>
                  <Input placeholder="e.g. 60–90 days" value={form.timeline} onChange={e => set("timeline", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Desired Bedrooms</Label>
                  <Input placeholder="e.g. 3+" value={form.desiredBedrooms} onChange={e => set("desiredBedrooms", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Desired Bathrooms</Label>
                  <Input placeholder="e.g. 2+" value={form.desiredBathrooms} onChange={e => set("desiredBathrooms", e.target.value)} />
                </div>
              </div>

              {/* Target Areas */}
              <div className="space-y-1.5">
                <Label>Target Areas / Neighborhoods</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a neighborhood or zip code"
                    value={newArea}
                    onChange={e => setNewArea(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newArea.trim()) {
                        set("targetAreas", [...form.targetAreas, newArea.trim()]);
                        setNewArea("");
                      }
                    }}
                  />
                  <Button variant="outline" size="icon" onClick={() => {
                    if (newArea.trim()) {
                      set("targetAreas", [...form.targetAreas, newArea.trim()]);
                      setNewArea("");
                    }
                  }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {form.targetAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.targetAreas.map((area, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {area}
                        <button onClick={() => set("targetAreas", form.targetAreas.filter((_, j) => j !== i))}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Must-Haves</Label>
                <Textarea rows={3} placeholder="e.g. 3-car garage, pool, single story, no HOA..." value={form.mustHaves} onChange={e => set("mustHaves", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Nice-to-Haves</Label>
                <Textarea rows={2} placeholder="e.g. home office, updated kitchen, large backyard..." value={form.niceToHaves} onChange={e => set("niceToHaves", e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Step 1: Market Snapshot ───────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg">Market Snapshot</CardTitle>
              </CardHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Target City *</Label>
                  <Input placeholder="e.g. Austin" value={form.marketCity} onChange={e => set("marketCity", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input placeholder="e.g. TX" value={form.marketState} onChange={e => set("marketState", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Inventory Level</Label>
                <Select value={form.inventoryLevel} onValueChange={v => set("inventoryLevel", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVENTORY_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Average Days on Market</Label>
                  <Input placeholder="e.g. 18 days" value={form.avgDaysOnMarket} onChange={e => set("avgDaysOnMarket", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Average List Price</Label>
                  <Input placeholder="e.g. $485,000" value={form.avgListPrice} onChange={e => set("avgListPrice", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Market Overview (optional)</Label>
                <Textarea rows={4} placeholder="Describe current market conditions, competition, trends, what buyers should know..." value={form.marketOverview} onChange={e => set("marketOverview", e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Step 2: Financing ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg">Financing Overview</CardTitle>
              </CardHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Preferred Lender Name</Label>
                  <Input placeholder="e.g. Jane Doe at First National" value={form.lenderName} onChange={e => set("lenderName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Lender Contact / Phone</Label>
                  <Input placeholder="e.g. (512) 555-0100" value={form.lenderContact} onChange={e => set("lenderContact", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Financing Notes</Label>
                <Textarea rows={6} placeholder="Explain pre-approval importance, loan types (conventional, FHA, VA, USDA), down payment options, closing costs, what to expect during underwriting..." value={form.financingNotes} onChange={e => set("financingNotes", e.target.value)} />
                <p className="text-xs text-muted-foreground">This content will appear on the Financing 101 slide. Be as detailed as you like — the AI will format it beautifully.</p>
              </div>
            </div>
          )}

          {/* ── Step 3: Agent Bio ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg">Agent Bio & Stats</CardTitle>
              </CardHeader>

              <div className="space-y-1.5">
                <Label>Your Name *</Label>
                <Input placeholder="e.g. Sarah Johnson" value={form.agentName} onChange={e => set("agentName", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea rows={4} placeholder="Your professional background, specialties, years of experience, why buyers love working with you..." value={form.agentBio} onChange={e => set("agentBio", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Stats & Track Record</Label>
                <Textarea rows={3} placeholder="e.g. 12 years experience · 200+ buyers helped · 97% client satisfaction · Avg 21 days to close..." value={form.agentStats} onChange={e => set("agentStats", e.target.value)} />
              </div>

              {/* Testimonials */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Client Testimonials</Label>
                  <Button variant="outline" size="sm" onClick={() => set("agentTestimonials", [...form.agentTestimonials, { author: "", text: "" }])}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                {form.agentTestimonials.map((t, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Testimonial {i + 1}</span>
                      {form.agentTestimonials.length > 1 && (
                        <button onClick={() => set("agentTestimonials", form.agentTestimonials.filter((_, j) => j !== i))}>
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                    <Input
                      placeholder="Buyer name (e.g. Mike & Lisa T.)"
                      value={t.author}
                      onChange={e => {
                        const updated = [...form.agentTestimonials];
                        updated[i] = { ...updated[i], author: e.target.value };
                        set("agentTestimonials", updated);
                      }}
                    />
                    <Textarea
                      rows={2}
                      placeholder="What they said about working with you..."
                      value={t.text}
                      onChange={e => {
                        const updated = [...form.agentTestimonials];
                        updated[i] = { ...updated[i], text: e.target.value };
                        set("agentTestimonials", updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Buying Process ────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg">Buying Process</CardTitle>
              </CardHeader>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Process Steps</Label>
                  <Button variant="outline" size="sm" onClick={() => set("processSteps", [...form.processSteps, ""])}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Step
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Customize the steps you walk buyers through. These appear on the "Buying Process" slide.</p>
                {form.processSteps.map((step_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-6 text-right">{i + 1}.</span>
                    <Input
                      value={step_}
                      onChange={e => {
                        const updated = [...form.processSteps];
                        updated[i] = e.target.value;
                        set("processSteps", updated);
                      }}
                      placeholder={`Step ${i + 1}`}
                    />
                    {form.processSteps.length > 3 && (
                      <button onClick={() => set("processSteps", form.processSteps.filter((_, j) => j !== i))}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label>Common Buyer Concerns & How You Address Them</Label>
                <Textarea rows={4} placeholder="e.g. 'Am I paying too much?' — I pull fresh comps and negotiate hard on your behalf. 'What if there are issues in inspection?' — We have an inspection contingency to protect you..." value={form.buyerConcerns} onChange={e => set("buyerConcerns", e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Step 5: Generate ─────────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-6">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg">Generate Presentation</CardTitle>
              </CardHeader>

              {/* Summary */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
                <p className="font-semibold text-base mb-3">Presentation Summary</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {form.buyerName && <><span className="text-muted-foreground">Buyer</span><span className="font-medium">{form.buyerName}</span></>}
                  <span className="text-muted-foreground">Buyer Type</span>
                  <span className="font-medium">{BUYER_TYPES.find(t => t.value === form.buyerType)?.label ?? form.buyerType}</span>
                  {form.priceRange && <><span className="text-muted-foreground">Price Range</span><span className="font-medium">{form.priceRange}</span></>}
                  <span className="text-muted-foreground">Market</span>
                  <span className="font-medium">{form.marketCity}{form.marketState ? `, ${form.marketState}` : ""}</span>
                  {form.agentName && <><span className="text-muted-foreground">Agent</span><span className="font-medium">{form.agentName}</span></>}
                  <span className="text-muted-foreground">Process Steps</span>
                  <span className="font-medium">{form.processSteps.filter(Boolean).length} steps</span>
                </div>
              </div>

              {/* Export Format */}
              <div className="space-y-1.5">
                <Label>Export Format</Label>
                <Select value={form.exportFormat} onValueChange={v => set("exportFormat", v as "pdf" | "pptx")}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pptx">PowerPoint (.pptx)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {result ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    Presentation Ready!
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => window.open(brandedUrl(result.id), "_blank")} className="gap-2">
                      <ExternalLink className="h-4 w-4" /> View Presentation
                    </Button>
                    <Button variant="outline" onClick={() => copyLink(result.id)} className="gap-2">
                      <Copy className="h-4 w-4" /> Copy Link
                    </Button>
                    <Button variant="outline" onClick={() => openSendDialog({ id: result.id, gammaUrl: result.gammaUrl, buyerName: form.buyerName })} className="gap-2">
                      <Send className="h-4 w-4" /> Send to Buyer
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Generating… this takes 1–2 minutes</>
                  ) : (
                    <><CheckCircle2 className="h-5 w-5" /> Generate Buyer Presentation</>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={prevStep} disabled={step === 0} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 && (
              <Button onClick={nextStep} className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white">
                Save & Continue <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── My Presentations ─────────────────────────────────────────────── */}
      {presentations && presentations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">My Buyer Presentations</h2>
          <div className="grid gap-3">
            {presentations.map((pres) => (
              <Card key={pres.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {pres.thumbnailUrl ? (
                        <img src={pres.thumbnailUrl} alt="Thumbnail" className="w-16 h-12 object-cover rounded-md border shrink-0" />
                      ) : (
                        <div className="w-16 h-12 rounded-md border bg-muted flex items-center justify-center shrink-0">
                          <UserCheck className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{pres.title}</p>
                        {pres.buyerName && <p className="text-xs text-muted-foreground">{pres.buyerName}</p>}
                        {pres.marketCity && <p className="text-xs text-muted-foreground">{pres.marketCity}{pres.marketState ? `, ${pres.marketState}` : ""}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(pres.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={pres.status === "completed" ? "default" : pres.status === "generating" ? "secondary" : "outline"} className="text-xs">
                        {pres.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {pres.status === "completed" && pres.gammaUrl && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => window.open(brandedUrl(pres.id), "_blank")} className="gap-1.5 text-xs h-8">
                          <ExternalLink className="h-3.5 w-3.5" /> View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => copyLink(pres.id)} className="gap-1.5 text-xs h-8">
                          <Copy className="h-3.5 w-3.5" /> Copy Link
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openSendDialog({ id: pres.id, gammaUrl: pres.gammaUrl!, buyerName: pres.buyerName })} className="gap-1.5 text-xs h-8">
                          <Send className="h-3.5 w-3.5" /> Send to Buyer
                        </Button>
                      </>
                    )}
                    {pres.status === "draft" && (
                      <Button size="sm" variant="outline" onClick={() => resumeDraft(pres)} className="gap-1.5 text-xs h-8">
                        <ChevronRight className="h-3.5 w-3.5" /> Resume Draft
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(pres.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Send to Buyer Dialog ─────────────────────────────────────────── */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send to Buyer</DialogTitle>
            <DialogDescription>Share the branded presentation link with {sendTarget?.buyerName ?? "your buyer"}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-muted p-3 text-sm font-mono break-all text-muted-foreground">
              {sendTarget ? brandedUrl(sendTarget.id) : ""}
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Send via Email</Label>
                <div className="flex gap-2">
                  <Input placeholder="buyer@email.com" value={sendEmail} onChange={e => setSendEmail(e.target.value)} />
                  <Button onClick={sendEmail_} disabled={!sendEmail} className="shrink-0">Send</Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Send via SMS</Label>
                <div className="flex gap-2">
                  <Input placeholder="(555) 000-0000" value={sendPhone} onChange={e => setSendPhone(e.target.value)} />
                  <Button onClick={sendSMS} disabled={!sendPhone} className="shrink-0">Send</Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────── */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Presentation?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteConfirm) {
                  await deleteMutation.mutateAsync({ presentationId: deleteConfirm });
                  toast.success("Presentation deleted");
                  refetch();
                  setDeleteConfirm(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
