import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface BulkImportProps {
  onComplete?: () => void;
}

export default function BulkImport({ onComplete }: BulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const bulkGenerate = trpc.content.bulkGenerateFromCSV.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Read CSV file
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file must have at least a header row and one data row");
        setIsProcessing(false);
        return;
      }

      // Parse CSV (simple parser - assumes comma-separated)
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const topicIndex = headers.findIndex(h => h.includes("topic") || h.includes("subject") || h.includes("title"));
      const audienceIndex = headers.findIndex(h => h.includes("audience") || h.includes("target"));
      const templateIndex = headers.findIndex(h => h.includes("template") || h.includes("style"));

      if (topicIndex === -1) {
        toast.error("CSV must have a 'topic' column");
        setIsProcessing(false);
        return;
      }

      const topics: Array<{ topic: string; audience?: string; template?: string }> = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        if (values[topicIndex]) {
          topics.push({
            topic: values[topicIndex],
            audience: audienceIndex !== -1 ? values[audienceIndex] : undefined,
            template: templateIndex !== -1 ? values[templateIndex] : undefined,
          });
        }
      }

      // Generate posts in batches
      let successCount = 0;
      let failedCount = 0;
      const batchSize = 5;

      for (let i = 0; i < topics.length; i += batchSize) {
        const batch = topics.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (item) => {
            try {
              await bulkGenerate.mutateAsync({
                topic: item.topic,
                contentType: "market_report",
                format: "static_post",
                tone: "professional",
              });
              successCount++;
            } catch (error) {
              console.error(`Failed to generate post for: ${item.topic}`, error);
              failedCount++;
            }
          })
        );

        setProgress(Math.round(((i + batch.length) / topics.length) * 100));
      }

      setResults({ success: successCount, failed: failedCount });
      toast.success(`Bulk import complete! ${successCount} posts generated.`);
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Bulk import error:", error);
      toast.error("Failed to process CSV file");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Import Content
        </CardTitle>
        <CardDescription>
          Upload a CSV file with content topics to generate multiple posts at once. 
          CSV should have columns: topic, audience (optional), template (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isProcessing && !results && (
          <>
            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold">CSV Format Example:</p>
              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`topic,audience,template
"First-time buyer tips for 2026",buyers,buyer_first_time_tips
"Why your home didn't sell",expireds,expired_why_didnt_sell
"Quick sale options for relocating",urgent_sellers,urgent_moving_timeline`}
              </pre>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              className="w-full"
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload and Generate Posts
            </Button>
          </>
        )}

        {isProcessing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Generating posts from your CSV file. This may take a few minutes.
            </p>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-700">{results.success}</p>
                      <p className="text-sm text-green-600">Posts Generated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {results.failed > 0 && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold text-red-700">{results.failed}</p>
                        <p className="text-sm text-red-600">Failed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <Button
              onClick={() => {
                setFile(null);
                setResults(null);
                setProgress(0);
              }}
              variant="outline"
              className="w-full"
            >
              Import Another File
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
