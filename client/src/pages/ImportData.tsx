import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  Clock,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

type CSVRow = {
  address?: string;
  price?: string;
  bedrooms?: string;
  bathrooms?: string;
  sqft?: string;
  description?: string;
  listingType?: string;
};

export default function ImportData() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [postsPerWeek, setPostsPerWeek] = useState("3");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const utils = trpc.useUtils();
  const { data: importJobs = [] } = trpc.importJobs.list.useQuery();

  const createImportJob = trpc.importJobs.create.useMutation();
  const processCSV = trpc.importJobs.processCSV.useMutation({
    onSuccess: (result) => {
      utils.importJobs.list.invalidate();
      utils.content.list.invalidate();
      utils.calendar.list.invalidate();
      toast.success(`Successfully generated ${result.postsCreated} posts!`);
      setIsProcessing(false);
      setCsvData([]);
      setFile(null);
    },
    onError: (error) => {
      toast.error("Failed to process import: " + error.message);
      setIsProcessing(false);
    },
  });

  const parseCSV = useCallback((text: string): CSVRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const row: CSVRow = {};

      headers.forEach((header, index) => {
        const value = values[index] || "";
        if (header.includes("address")) row.address = value;
        else if (header.includes("price")) row.price = value;
        else if (header.includes("bed")) row.bedrooms = value;
        else if (header.includes("bath")) row.bathrooms = value;
        else if (header.includes("sqft") || header.includes("square")) row.sqft = value;
        else if (header.includes("desc")) row.description = value;
        else if (header.includes("type") || header.includes("listing")) row.listingType = value;
      });

      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    }

    return rows;
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);

    const text = await selectedFile.text();
    const parsed = parseCSV(text);
    
    if (parsed.length === 0) {
      toast.error("No valid data found in CSV");
      return;
    }

    setCsvData(parsed);
    toast.success(`Loaded ${parsed.length} properties from CSV`);
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      toast.error("No data to import");
      return;
    }

    setIsProcessing(true);

    try {
      const job = await createImportJob.mutateAsync({
        fileName: file?.name,
        importType: "csv",
        settings: JSON.stringify({
          postsPerWeek: parseInt(postsPerWeek),
          startDate,
        }),
      });

      await processCSV.mutateAsync({
        jobId: job.id,
        csvData,
        settings: {
          postsPerWeek: parseInt(postsPerWeek),
          contentTypes: ["property_listing", "tips", "market_report"],
          startDate,
        },
      });
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-primary/15 text-green-400">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
      case "processing":
        return <Badge className="bg-primary/10 text-primary">Processing</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import Data</h1>
        <p className="text-muted-foreground mt-1">
          Upload a CSV file or Google Doc to auto-generate content for the month
        </p>
      </div>

      {/* Upload Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              CSV Import
            </CardTitle>
            <CardDescription>
              Upload a CSV file with property listings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {file ? file.name : "Click to upload CSV"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: address, price, bedrooms, bathrooms, sqft, description
                </p>
              </label>
            </div>

            {csvData.length > 0 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-green-400">
                  ✓ Loaded {csvData.length} properties ready for import
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Google Docs Import
            </CardTitle>
            <CardDescription>
              Import from a Google Doc (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center opacity-50">
              <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium">Google Docs Integration</p>
              <p className="text-xs text-muted-foreground mt-1">
                Coming soon - Connect your Google account
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Settings */}
      {csvData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Auto-Generation Settings
            </CardTitle>
            <CardDescription>
              Configure how content will be generated and scheduled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Posts Per Week</Label>
                <Select value={postsPerWeek} onValueChange={setPostsPerWeek}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 posts/week</SelectItem>
                    <SelectItem value="3">3 posts/week</SelectItem>
                    <SelectItem value="4">4 posts/week</SelectItem>
                    <SelectItem value="5">5 posts/week</SelectItem>
                    <SelectItem value="7">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Duration</Label>
                <div className="h-10 flex items-center px-3 rounded-md bg-secondary border border-border text-sm">
                  ~{Math.ceil(csvData.length / parseInt(postsPerWeek))} weeks
                </div>
              </div>
            </div>

            {/* Preview Table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Address</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Beds</TableHead>
                    <TableHead>Baths</TableHead>
                    <TableHead>Sqft</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.address || "-"}</TableCell>
                      <TableCell>{row.price || "-"}</TableCell>
                      <TableCell>{row.bedrooms || "-"}</TableCell>
                      <TableCell>{row.bathrooms || "-"}</TableCell>
                      <TableCell>{row.sqft || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {csvData.length > 5 && (
                <div className="p-2 text-center text-sm text-muted-foreground bg-secondary/30">
                  +{csvData.length - 5} more properties
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleImport}
                disabled={isProcessing}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate {csvData.length} Posts
                  </>
                )}
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={33} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  AI is generating content for your properties...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>
            Previous import jobs and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No imports yet. Upload a CSV to get started!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Posts Generated</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status || "pending")}
                        {job.fileName || "Unnamed"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.importType.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status || "pending")}</TableCell>
                    <TableCell>{job.totalRows || 0}</TableCell>
                    <TableCell>{job.generatedPosts || 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
