import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Megaphone,
  Link2,
  Upload,
  X,
  Loader2,
  Sparkles,
  Download,
  RefreshCw,
  ImageIcon,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type AdFormat = "instagram_square" | "instagram_story" | "facebook_feed" | "banner";
type Tone = "professional" | "friendly" | "urgent" | "inspirational";

interface AdResult {
  headline: string;
  primaryText: string;
  cta: string;
  adImageUrl: string;
  imagePrompt: string;
}

interface PhotoState {
  file: File | null;
  preview: string;
  url: string; // S3 URL after upload
  uploading: boolean;
}

const AD_FORMATS: { value: AdFormat; label: string; size: string }[] = [
  { value: "instagram_square", label: "Instagram Square", size: "1080×1080" },
  { value: "instagram_story", label: "Instagram Story", size: "1080×1920" },
  { value: "facebook_feed", label: "Facebook Feed", size: "1200×628" },
  { value: "banner", label: "Web Banner", size: "728×90" },
];

const TONES: { value: Tone; label: string; desc: string }[] = [
  { value: "professional", label: "Professional", desc: "Polished & trustworthy" },
  { value: "friendly", label: "Friendly", desc: "Warm & approachable" },
  { value: "urgent", label: "Urgent", desc: "Time-sensitive & action-driven" },
  { value: "inspirational", label: "Inspirational", desc: "Motivating & aspirational" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdGenerator() {
  const [url, setUrl] = useState("");
  const [pageData, setPageData] = useState<{ title: string; description: string; bodyText: string; ogImage: string } | null>(null);
  const [scraping, setScraping] = useState(false);

  const [photo1, setPhoto1] = useState<PhotoState>({ file: null, preview: "", url: "", uploading: false });
  const [photo2, setPhoto2] = useState<PhotoState>({ file: null, preview: "", url: "", uploading: false });

  const [adFormat, setAdFormat] = useState<AdFormat>("instagram_square");
  const [tone, setTone] = useState<Tone>("professional");
  const [goal, setGoal] = useState("");

  const [result, setResult] = useState<AdResult | null>(null);
  const [generating, setGenerating] = useState(false);

  // Editable fields
  const [editHeadline, setEditHeadline] = useState("");
  const [editPrimaryText, setEditPrimaryText] = useState("");
  const [editCta, setEditCta] = useState("");

  const photo1Ref = useRef<HTMLInputElement>(null);
  const photo2Ref = useRef<HTMLInputElement>(null);

  const scrapeUrl = trpc.adGenerator.scrapeUrl.useMutation();
  const uploadPhoto = trpc.adGenerator.uploadPhoto.useMutation();
  const generateAd = trpc.adGenerator.generate.useMutation();

  // ── URL Scraping ────────────────────────────────────────────────────────────
  const handleScrape = async () => {
    if (!url.trim()) return;
    let scrapeUrl2 = url.trim();
    if (!scrapeUrl2.startsWith("http")) scrapeUrl2 = "https://" + scrapeUrl2;
    setScraping(true);
    try {
      const data = await scrapeUrl.mutateAsync({ url: scrapeUrl2 });
      setPageData(data);
      toast.success("Page content loaded");
    } catch {
      toast.error("Could not read that URL. You can still fill in the details manually.");
      setPageData({ title: "", description: "", bodyText: "", ogImage: "" });
    } finally {
      setScraping(false);
    }
  };

  // ── Photo Upload ────────────────────────────────────────────────────────────
  const handlePhotoSelect = useCallback(
    async (file: File, slot: 1 | 2) => {
      const preview = URL.createObjectURL(file);
      const setter = slot === 1 ? setPhoto1 : setPhoto2;
      setter((p) => ({ ...p, file, preview, uploading: true, url: "" }));

      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        try {
          const { url: s3Url } = await uploadPhoto.mutateAsync({
            fileName: file.name,
            fileData,
            mimeType: file.type,
          });
          setter((p) => ({ ...p, url: s3Url, uploading: false }));
        } catch {
          toast.error("Photo upload failed. Please try again.");
          setter((p) => ({ ...p, uploading: false }));
        }
      };
      reader.readAsDataURL(file);
    },
    [uploadPhoto]
  );

  const clearPhoto = (slot: 1 | 2) => {
    if (slot === 1) setPhoto1({ file: null, preview: "", url: "", uploading: false });
    else setPhoto2({ file: null, preview: "", url: "", uploading: false });
  };

  // ── Generate Ad ─────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!photo1.url) {
      toast.error("Please upload at least one photo first.");
      return;
    }
    if (!pageData) {
      toast.error("Please load a URL first.");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await generateAd.mutateAsync({
        pageTitle: pageData.title,
        pageDescription: pageData.description,
        pageBodyText: pageData.bodyText,
        photo1Url: photo1.url,
        photo2Url: photo2.url || undefined,
        adFormat,
        tone,
        goal: goal.trim() || undefined,
      });
      setResult(res);
      setEditHeadline(res.headline);
      setEditPrimaryText(res.primaryText);
      setEditCta(res.cta);
    } catch (err: any) {
      toast.error(err?.message || "Ad generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Download ────────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!result?.adImageUrl) return;
    const a = document.createElement("a");
    a.href = result.adImageUrl;
    a.download = `ad-${adFormat}-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const canGenerate = !!photo1.url && !photo1.uploading && !!pageData && !generating;

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#FF6A00]/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-[#FF6A00]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111111]">Ad Generator</h1>
            <p className="text-sm text-[#6B7280]">
              Paste any URL + upload photos → get a polished, ready-to-run ad
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        {/* ── Left: Input Panel ──────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Step 1: URL */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-[#FF6A00] text-white text-xs font-bold flex items-center justify-center">1</span>
              <h2 className="font-semibold text-[#111111]">Paste a URL</h2>
            </div>
            <p className="text-sm text-[#6B7280] mb-4">
              Any URL — a listing, your book, a service page, an event, anything.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <Input
                  className="pl-9 border-[#E5E7EB] focus-visible:ring-[#FF6A00]"
                  placeholder="https://yourwebsite.com/listing"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                />
              </div>
              <Button
                onClick={handleScrape}
                disabled={!url.trim() || scraping}
                className="bg-[#FF6A00] hover:bg-[#E55F00] text-white"
              >
                {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>

            {pageData && (
              <div className="mt-4 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#111111] truncate">{pageData.title || "Page loaded"}</p>
                    {pageData.description && (
                      <p className="text-xs text-[#6B7280] line-clamp-2 mt-0.5">{pageData.description}</p>
                    )}
                  </div>
                </div>
                {/* Editable override */}
                <div className="mt-3 space-y-2">
                  <div>
                    <Label className="text-xs text-[#6B7280]">Title (edit if needed)</Label>
                    <Input
                      className="mt-1 text-sm border-[#E5E7EB]"
                      value={pageData.title}
                      onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#6B7280]">Description (edit if needed)</Label>
                    <Textarea
                      className="mt-1 text-sm border-[#E5E7EB] resize-none"
                      rows={2}
                      value={pageData.description}
                      onChange={(e) => setPageData({ ...pageData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Photos */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-[#FF6A00] text-white text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="font-semibold text-[#111111]">Upload Photos</h2>
              <Badge variant="outline" className="text-xs text-[#6B7280]">Up to 2</Badge>
            </div>
            <p className="text-sm text-[#6B7280] mb-4">
              Your photos will be analyzed and incorporated into the ad image.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((slot) => {
                const photo = slot === 1 ? photo1 : photo2;
                const ref = slot === 1 ? photo1Ref : photo2Ref;
                return (
                  <div key={slot}>
                    <input
                      ref={ref}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePhotoSelect(f, slot as 1 | 2);
                      }}
                    />
                    {photo.preview ? (
                      <div className="relative rounded-xl overflow-hidden border border-[#E5E7EB] aspect-square">
                        <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                        {photo.uploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                        {!photo.uploading && (
                          <button
                            onClick={() => clearPhoto(slot as 1 | 2)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        )}
                        {photo.url && (
                          <div className="absolute bottom-2 left-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => ref.current?.click()}
                        className="w-full aspect-square rounded-xl border-2 border-dashed border-[#E5E7EB] hover:border-[#FF6A00] hover:bg-[#FFF3E8] transition-all flex flex-col items-center justify-center gap-2 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#F3F4F6] group-hover:bg-[#FF6A00]/10 flex items-center justify-center transition-colors">
                          <Upload className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FF6A00] transition-colors" />
                        </div>
                        <span className="text-xs text-[#9CA3AF] group-hover:text-[#FF6A00] transition-colors">
                          Photo {slot}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Ad Settings */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-[#FF6A00] text-white text-xs font-bold flex items-center justify-center">3</span>
              <h2 className="font-semibold text-[#111111]">Ad Settings</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-[#374151] mb-1.5 block">Format</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AD_FORMATS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setAdFormat(f.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        adFormat === f.value
                          ? "border-[#FF6A00] bg-[#FFF3E8]"
                          : "border-[#E5E7EB] hover:border-[#FF6A00]/50"
                      }`}
                    >
                      <p className={`text-sm font-medium ${adFormat === f.value ? "text-[#FF6A00]" : "text-[#111111]"}`}>
                        {f.label}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">{f.size}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm text-[#374151] mb-1.5 block">Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                  <SelectTrigger className="border-[#E5E7EB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="font-medium">{t.label}</span>
                        <span className="text-[#6B7280] ml-2 text-xs">{t.desc}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-[#374151] mb-1.5 block">
                  Ad Goal <span className="text-[#9CA3AF] font-normal">(optional)</span>
                </Label>
                <Input
                  className="border-[#E5E7EB]"
                  placeholder="e.g. generate leads, sell my book, promote open house"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full h-12 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-semibold text-base rounded-xl shadow-md disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Generating your ad…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Ad
              </>
            )}
          </Button>
        </div>

        {/* ── Right: Output Panel ────────────────────────────────────────────── */}
        <div>
          {!result && !generating && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-[#D1D5DB]" />
              </div>
              <p className="text-[#374151] font-medium mb-1">Your ad will appear here</p>
              <p className="text-sm text-[#9CA3AF]">
                Load a URL, upload photos, and click Generate Ad
              </p>
            </div>
          )}

          {generating && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
              <Loader2 className="w-10 h-10 text-[#FF6A00] animate-spin mb-4" />
              <p className="text-[#374151] font-medium mb-1">Creating your ad…</p>
              <p className="text-sm text-[#9CA3AF]">Analyzing photos and generating copy</p>
            </div>
          )}

          {result && !generating && (
            <div className="space-y-4">
              {/* Ad Image */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-sm font-medium text-[#374151]">Ad Image</span>
                    <Badge variant="outline" className="text-xs">
                      {AD_FORMATS.find((f) => f.value === adFormat)?.label}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      className="text-xs border-[#E5E7EB]"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDownload}
                      className="text-xs bg-[#FF6A00] hover:bg-[#E55F00] text-white"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                {result.adImageUrl ? (
                  <img
                    src={result.adImageUrl}
                    alt="Generated ad"
                    className="w-full object-contain max-h-[500px]"
                  />
                ) : (
                  <div className="p-8 text-center text-sm text-[#9CA3AF]">
                    Image generation is processing — copy is ready below.
                  </div>
                )}
              </div>

              {/* Editable Copy */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-[#111111] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF6A00]" />
                  Ad Copy
                  <span className="text-xs text-[#9CA3AF] font-normal ml-1">Edit before using</span>
                </h3>

                <div>
                  <Label className="text-xs text-[#6B7280] uppercase tracking-wide mb-1.5 block">Headline</Label>
                  <Input
                    className="font-semibold text-[#111111] border-[#E5E7EB] focus-visible:ring-[#FF6A00]"
                    value={editHeadline}
                    onChange={(e) => setEditHeadline(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#6B7280] uppercase tracking-wide mb-1.5 block">Primary Text</Label>
                  <Textarea
                    className="text-sm text-[#374151] border-[#E5E7EB] focus-visible:ring-[#FF6A00] resize-none"
                    rows={3}
                    value={editPrimaryText}
                    onChange={(e) => setEditPrimaryText(e.target.value)}
                  />
                  <p className="text-xs text-[#9CA3AF] mt-1">{editPrimaryText.length} / 125 chars</p>
                </div>

                <div>
                  <Label className="text-xs text-[#6B7280] uppercase tracking-wide mb-1.5 block">Call to Action</Label>
                  <Input
                    className="font-medium text-[#FF6A00] border-[#E5E7EB] focus-visible:ring-[#FF6A00]"
                    value={editCta}
                    onChange={(e) => setEditCta(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-[#E5E7EB] text-sm"
                    onClick={() => {
                      const text = `${editHeadline}\n\n${editPrimaryText}\n\n${editCta}`;
                      navigator.clipboard.writeText(text);
                      toast.success("Ad copy copied to clipboard");
                    }}
                  >
                    Copy All Text
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="flex-1 bg-[#FF6A00] hover:bg-[#E55F00] text-white text-sm"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Download Image
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
