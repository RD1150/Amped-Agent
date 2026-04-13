import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  Copy,
  Download,
  ChevronRight,
  FileText,
  RefreshCw,
  Check,
  Mail,
  Home,
  Heart,
  Users,
  Target,
  Clock,
  BookOpen,
} from "lucide-react";

// ─── Category icons ───────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Distressed": <Heart className="h-4 w-4 text-rose-500" />,
  "Listing Opportunities": <Home className="h-4 w-4 text-amber-500" />,
  "Farm / Prospecting": <Target className="h-4 w-4 text-blue-500" />,
  "Relationship / Referral": <Users className="h-4 w-4 text-green-500" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Distressed": "border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900",
  "Listing Opportunities": "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900",
  "Farm / Prospecting": "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900",
  "Relationship / Referral": "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900",
};

const CATEGORY_BADGE: Record<string, string> = {
  "Distressed": "bg-rose-100 text-rose-700 border-rose-200",
  "Listing Opportunities": "bg-amber-100 text-amber-700 border-amber-200",
  "Farm / Prospecting": "bg-blue-100 text-blue-700 border-blue-200",
  "Relationship / Referral": "bg-green-100 text-green-700 border-green-200",
};

type LetterType = {
  key: string;
  label: string;
  category: string;
  tone: string;
  description: string;
  icon: string;
  inputLabel: string;
  inputPlaceholder: string;
};

export default function ProspectingLetters() {
  const [selectedType, setSelectedType] = useState<LetterType | null>(null);
  const [targetInput, setTargetInput] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [editedLetter, setEditedLetter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const { data: letterTypes, isLoading: typesLoading } = trpc.prospectingLetters.getLetterTypes.useQuery();

  const generateMutation = trpc.prospectingLetters.generate.useMutation({
    onSuccess: (data) => {
      const content = typeof data.content === "string" ? data.content : "";
      setGeneratedLetter(content);
      setEditedLetter(content);
      toast.success(`${data.letterLabel} generated — review and personalize before sending.`);
    },
    onError: (err) => {
      toast.error("Generation failed: " + err.message);
    },
  });

  // Group letter types by category
  const grouped = letterTypes
    ? letterTypes.reduce<Record<string, LetterType[]>>((acc, lt) => {
        if (!acc[lt.category]) acc[lt.category] = [];
        acc[lt.category].push(lt);
        return acc;
      }, {})
    : {};

  const categoryOrder = ["Distressed", "Listing Opportunities", "Farm / Prospecting", "Relationship / Referral"];

  const handleGenerate = () => {
    if (!selectedType) {
      toast.error("Please select a letter type first.");
      return;
    }
    generateMutation.mutate({
      letterType: selectedType.key,
      targetInput: targetInput.trim() || undefined,
      recipientName: recipientName.trim() || undefined,
      customContext: customContext.trim() || undefined,
    });
  };

  const handleCopy = async () => {
    const text = editedLetter ?? generatedLetter ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Letter copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = editedLetter ?? generatedLetter ?? "";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedType?.label ?? "letter"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Letter downloaded as .txt");
  };

  const pdfMutation = trpc.letterPdf.generate.useMutation({
    onSuccess: (data) => {
      const a = document.createElement("a");
      a.href = data.pdfUrl;
      a.download = `${selectedType?.label ?? "letter"}.pdf`;
      a.target = "_blank";
      a.click();
      toast.success("PDF downloaded — letterhead included.");
      setPdfDownloading(false);
    },
    onError: (err) => {
      toast.error("PDF generation failed: " + err.message);
      setPdfDownloading(false);
    },
  });

  const handleDownloadPdf = () => {
    const content = editedLetter ?? generatedLetter ?? "";
    if (!content || !selectedType) return;
    setPdfDownloading(true);
    pdfMutation.mutate({
      letterContent: content,
      letterLabel: selectedType.label,
      letterType: selectedType.key,
    });
  };

  const handleRegenerate = () => {
    setGeneratedLetter(null);
    setEditedLetter(null);
    handleGenerate();
  };

  const handleSelectType = (lt: LetterType) => {
    setSelectedType(lt);
    setGeneratedLetter(null);
    setEditedLetter(null);
    setTargetInput("");
    setRecipientName("");
    setCustomContext("");
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prospecting Letter Studio</h1>
            <p className="text-sm text-muted-foreground">
              AI-crafted letters for every situation — empathetic, professional, and personalized to your brand
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Letter type picker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Choose a letter type
          </div>
          {typesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-2">
                {categoryOrder.map((category) => {
                  const items = grouped[category];
                  if (!items?.length) return null;
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        {CATEGORY_ICONS[category]}
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {category}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map((lt) => (
                          <button
                            key={lt.key}
                            onClick={() => handleSelectType(lt)}
                            className={`w-full text-left rounded-xl border p-3 transition-all ${
                              selectedType?.key === lt.key
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/40 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{lt.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-foreground">{lt.label}</div>
                                <div className="text-xs text-muted-foreground truncate">{lt.description}</div>
                              </div>
                              {selectedType?.key === lt.key && (
                                <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Right: Input + Output */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedType ? (
            <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm max-w-xs">
                Select a letter type from the left to get started. Each letter is AI-crafted with the right tone for the situation.
              </p>
            </Card>
          ) : (
            <>
              {/* Letter type header */}
              <Card className={`p-4 border ${CATEGORY_COLORS[selectedType.category]}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{selectedType.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-base">{selectedType.label}</h2>
                      <Badge variant="outline" className={`text-xs ${CATEGORY_BADGE[selectedType.category]}`}>
                        {selectedType.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        <Clock className="h-3 w-3 mr-1" />
                        {selectedType.tone} tone
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{selectedType.description}</p>
                  </div>
                </div>
              </Card>

              {/* Input form */}
              <Card className="p-5 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Personalize your letter
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="target" className="text-xs">{selectedType.inputLabel}</Label>
                  <Input
                    id="target"
                    placeholder={selectedType.inputPlaceholder}
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="recipient" className="text-xs">Recipient name (optional)</Label>
                  <Input
                    id="recipient"
                    placeholder="e.g. John and Sarah, The Smith Family"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Leave blank for a general salutation (e.g., "Dear Neighbor,")</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="context" className="text-xs">Additional context (optional)</Label>
                  <Textarea
                    id="context"
                    placeholder="e.g. The home has been vacant for 6 months. The owner lives in another state. I sold the house next door last month for $485,000."
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground">The more context you give, the more specific and compelling the letter will be.</p>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="w-full"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Crafting your letter...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Letter
                    </>
                  )}
                </Button>
              </Card>

              {/* Generated letter output */}
              {generatedLetter && (
                <Card className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Your Letter
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                        Ready to personalize
                      </Badge>
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerate}
                        disabled={generateMutation.isPending}
                        className="text-xs"
                      >
                        <RefreshCw className="h-3 w-3 mr-1.5" />
                        Regenerate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="text-xs"
                      >
                        {copied ? (
                          <><Check className="h-3 w-3 mr-1.5 text-green-600" />Copied</>
                        ) : (
                          <><Copy className="h-3 w-3 mr-1.5" />Copy</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="text-xs"
                      >
                        <Download className="h-3 w-3 mr-1.5" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <strong>Review before sending:</strong> Replace any <code className="bg-amber-100 px-1 rounded">[PLACEHOLDER]</code> text with your specific details. The letter is a strong first draft — personalize it to make it yours.
                  </p>

                  <Textarea
                    ref={textareaRef}
                    value={editedLetter ?? ""}
                    onChange={(e) => setEditedLetter(e.target.value)}
                    className="min-h-[400px] text-sm font-mono leading-relaxed resize-y"
                  />

                  <div className="flex gap-2 pt-1">
                    <Button onClick={handleCopy} className="flex-1">
                      {copied ? (
                        <><Check className="h-4 w-4 mr-2 text-green-300" />Copied to Clipboard</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-2" />Copy to Clipboard</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadPdf}
                      disabled={pdfDownloading}
                    >
                      {pdfDownloading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating PDF...</>
                      ) : (
                        <><Download className="h-4 w-4 mr-2" />Download PDF</>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownload} className="text-xs text-muted-foreground">
                      .txt
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
