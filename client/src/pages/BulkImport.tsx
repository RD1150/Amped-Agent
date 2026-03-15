import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Sparkles,
  Info,
  Table,
  Zap,
  Play,
  Loader2,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";

export default function BulkImport() {
  const [, setLocation] = useLocation();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<"carousel" | "native" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch generation job state
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [generatingBatchId, setGeneratingBatchId] = useState<string | null>(null);

  const uploadCSV = trpc.contentTemplates.uploadCSV.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setCsvFile(null);
      setDetectedFormat(null);
      refetchTemplates();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to import CSV");
    },
  });

  const { data: allTemplates, refetch: refetchTemplates } = trpc.contentTemplates.list.useQuery({ limit: 500 });

  // Poll job progress when a job is running
  const { data: jobProgress } = trpc.contentTemplates.getJobProgress.useQuery(
    { jobId: activeJobId! },
    {
      enabled: !!activeJobId,
      refetchInterval: activeJobId ? 2000 : false,
    }
  );

  // Handle job completion
  useEffect(() => {
    if (!jobProgress) return;
    if (jobProgress.status === "done") {
      const count = jobProgress.completed;
      toast.success(`${count} post${count !== 1 ? "s" : ""} generated and saved to Drafts!`, {
        action: {
          label: "View Drafts",
          onClick: () => setLocation("/drafts"),
        },
        duration: 8000,
      });
      setActiveJobId(null);
      setGeneratingBatchId(null);
      refetchTemplates();
    } else if (jobProgress.status === "failed") {
      toast.error("Generation failed. Please try again.");
      setActiveJobId(null);
      setGeneratingBatchId(null);
    }
  }, [jobProgress?.status]);

  const generateAllPosts = trpc.contentTemplates.generateAllPosts.useMutation({
    onSuccess: (result) => {
      setActiveJobId(result.jobId);
      toast.info(`Generating ${result.total} posts in the background…`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start generation");
      setGeneratingBatchId(null);
    },
  });

  // Derive batch history from templates
  const batches = allTemplates
    ? Object.values(
        allTemplates.reduce(
          (
            acc: Record<
              string,
              {
                importBatchId: string;
                count: number;
                pendingCount: number;
                generatedCount: number;
                importedAt: number;
              }
            >,
            t: any
          ) => {
            if (!t.importBatchId) return acc;
            if (!acc[t.importBatchId]) {
              acc[t.importBatchId] = {
                importBatchId: t.importBatchId,
                count: 0,
                pendingCount: 0,
                generatedCount: 0,
                importedAt: t.createdAt ?? Date.now(),
              };
            }
            acc[t.importBatchId].count++;
            if (t.status === "pending") acc[t.importBatchId].pendingCount++;
            if (t.status === "generated") acc[t.importBatchId].generatedCount++;
            return acc;
          },
          {}
        )
      )
        .sort((a: any, b: any) => b.importedAt - a.importedAt)
        .slice(0, 10)
    : [];

  const pendingTotal = allTemplates ? allTemplates.filter((t: any) => t.status === "pending").length : 0;

  const detectFormat = (content: string) => {
    const firstLine = content.split("\n")[0].toLowerCase();
    const headers = firstLine.split(",").map((h) => h.trim().replace(/"/g, ""));
    if (headers.includes("topic")) return "carousel";
    if (headers.includes("hook")) return "native";
    return null;
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    setCsvFile(file);
    const text = await file.text();
    setDetectedFormat(detectFormat(text));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!csvFile) return;
    const csvContent = await csvFile.text();
    uploadCSV.mutate({ csvContent, filename: csvFile.name });
  };

  const handleGenerateAll = (batchId?: string) => {
    setGeneratingBatchId(batchId ?? "all");
    generateAllPosts.mutate({ batchId });
  };

  const downloadCarouselSample = () => {
    const sample = `ID,Topic,Description,Category,Subcategory,Tags,Difficulty,Target Audience,Seasonal,Key Points
1,Unlocking the Door to Your Dream Home,Helps buyers understand the home buying process,Buying,First-Time Buyers,homebuying;realestate;firsttimehomebuyer,Beginner,First-Time Buyers,No,Get Pre-Approved;Find Your Agent;Make an Offer;Close the Deal
2,5 Red Flags in a Home Inspection,What buyers should watch out for during inspections,Buying,Home Inspection,homeinspection;realestate;buyingtips,Intermediate,Home Buyers,No,Foundation Cracks;Roof Age;Electrical Issues;Water Damage;HVAC Condition
`;
    const blob = new Blob([sample], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "carousel-import-sample.csv";
    a.click();
  };

  const downloadNativeSample = () => {
    const sample = `Hook,Reel Idea,Script,Category,Platform,Content Type,Scheduled Date
"Most buyers skip this step — and it costs them thousands","Walk through the 5 steps every buyer must take before making an offer","Step 1: Get pre-approved...",Buying,Instagram,carousel,
"Your home is worth more than you think — here's why","Show 3 value-boosting upgrades under $500","Upgrade 1: Fresh paint...",Selling,Facebook,post,
`;
    const blob = new Blob([sample], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "native-import-sample.csv";
    a.click();
  };

  const isJobRunning = !!activeJobId && jobProgress?.status === "running";
  const jobPercent =
    isJobRunning && jobProgress && jobProgress.total > 0
      ? Math.round((jobProgress.completed / jobProgress.total) * 100)
      : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bulk Import</h1>
        <p className="text-muted-foreground mt-1">
          Upload a CSV to import dozens of content ideas at once. Hooks are auto-generated by AI when missing.
        </p>
      </div>

      {/* Active Job Progress Banner */}
      {isJobRunning && jobProgress && (
        <Card className="border border-primary/40 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="font-semibold text-foreground text-sm">Generating posts…</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {jobProgress.completed} / {jobProgress.total} complete
              </span>
            </div>
            <Progress value={jobPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Each post is being written by AI with your brand voice. You can navigate away — this runs in the background.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generate All Posts CTA — shown when there are pending templates */}
      {pendingTotal > 0 && !isJobRunning && (
        <Card className="border border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {pendingTotal} template{pendingTotal !== 1 ? "s" : ""} ready to generate
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click below to generate full carousel post copy for all pending templates at once.
                    Posts will be saved to your Drafts automatically.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleGenerateAll()}
                disabled={generateAllPosts.isPending}
                className="gap-2 shrink-0"
              >
                {generateAllPosts.isPending && generatingBatchId === "all" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate All {pendingTotal} Posts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Format Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Carousel Format</CardTitle>
              <Badge variant="secondary" className="text-xs">Auto-hook</Badge>
            </div>
            <CardDescription className="text-xs">
              Your existing carousel library CSV. Hooks are generated automatically from Topic + Description.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="text-xs text-muted-foreground font-mono bg-muted/50 rounded p-2 leading-relaxed">
              ID, Topic, Description, Category,<br />
              Subcategory, Tags, Key Points
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={downloadCarouselSample}>
              <Download className="w-3 h-3 mr-1" /> Download Sample
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold">Native Format</CardTitle>
              <Badge variant="outline" className="text-xs">Full control</Badge>
            </div>
            <CardDescription className="text-xs">
              Provide your own hooks, reel ideas, and scripts directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="text-xs text-muted-foreground font-mono bg-muted/50 rounded p-2 leading-relaxed">
              Hook, Reel Idea, Script, Category,<br />
              Platform, Content Type, Scheduled Date
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={downloadNativeSample}>
              <Download className="w-3 h-3 mr-1" /> Download Sample
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upload Zone */}
      <Card className="border-2 border-dashed border-border bg-card">
        <CardContent className="p-0">
          <div
            className={`flex flex-col items-center justify-center gap-4 p-10 rounded-lg transition-colors cursor-pointer ${
              isDragging ? "bg-primary/5 border-primary" : "hover:bg-muted/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            {csvFile ? (
              <div className="text-center">
                <p className="font-medium text-foreground flex items-center gap-2 justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                  {csvFile.name}
                </p>
                {detectedFormat && (
                  <div className="flex items-center gap-1.5 justify-center mt-2">
                    {detectedFormat === "carousel" ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs text-amber-600 font-medium">
                          Carousel format detected — AI will generate hooks automatically
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">
                          Native format detected — hooks will be imported as-is
                        </span>
                      </>
                    )}
                  </div>
                )}
                {detectedFormat === null && (
                  <div className="flex items-center gap-1.5 justify-center mt-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs text-amber-600">
                      Could not detect format — ensure CSV has a 'Topic' or 'Hook' column
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="font-medium text-foreground">Drop your CSV here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">Supports Carousel and Native formats</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {csvFile && (
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={uploadCSV.isPending || detectedFormat === null}
            className="flex-1"
          >
            {uploadCSV.isPending ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                {detectedFormat === "carousel" ? "Generating hooks & importing…" : "Importing…"}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {detectedFormat === "carousel" ? "with AI Hooks" : "CSV"}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => { setCsvFile(null); setDetectedFormat(null); }}
            disabled={uploadCSV.isPending}
          >
            Clear
          </Button>
        </div>
      )}

      {/* AI Hook Note */}
      {detectedFormat === "carousel" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            AI will generate a scroll-stopping hook for each row using the Topic and Description. This may take 10–20 seconds for large files.
          </span>
        </div>
      )}

      {/* Import History */}
      {batches && batches.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Recent Imports</h2>
          <div className="space-y-2">
            {batches.map((batch: any) => (
              <div
                key={batch.importBatchId}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card gap-3 flex-wrap"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {batch.count} templates imported
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Batch {batch.importBatchId.slice(0, 8)}… · {new Date(batch.importedAt).toLocaleDateString()}
                      {batch.generatedCount > 0 && (
                        <span className="ml-2 text-green-600">· {batch.generatedCount} generated</span>
                      )}
                      {batch.pendingCount > 0 && (
                        <span className="ml-2 text-amber-600">· {batch.pendingCount} pending</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {batch.pendingCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-7"
                      disabled={isJobRunning || generateAllPosts.isPending}
                      onClick={() => handleGenerateAll(batch.importBatchId)}
                    >
                      {generateAllPosts.isPending && generatingBatchId === batch.importBatchId ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      Generate {batch.pendingCount}
                    </Button>
                  )}
                  {batch.generatedCount > 0 && batch.pendingCount === 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-xs h-7"
                      onClick={() => setLocation("/drafts")}
                    >
                      View Drafts <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {batch.count} items
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
