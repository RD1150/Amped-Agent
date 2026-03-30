import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Pencil,
  Save,
  Copy,
  ExternalLink
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ContentTemplates() {
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<number, { hook?: string; reelIdea?: string; script?: string }>>({});
  const [isUploading, setIsUploading] = useState(false);

  const { data: templates, refetch } = trpc.contentTemplates.list.useQuery({});
  const uploadCSV = trpc.contentTemplates.uploadCSV.useMutation();
  const [, setLocation] = useLocation();
  const deleteTemplate = trpc.contentTemplates.delete.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
        return;
      }
      setCSVFile(file);
    }
  };

  const handleUpload = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file to upload");
      return;
    }

    setIsUploading(true);

    try {
      const csvContent = await csvFile.text();
      
      const result = await uploadCSV.mutateAsync({
        csvContent,
        filename: csvFile.name,
      });

      toast.success(`CSV uploaded successfully! Imported ${result.count} content templates`);

      setCSVFile(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload CSV file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTemplate.mutateAsync({ id });
      toast.success("Content template has been removed");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
    }
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `Hook,Reel Idea,Script,Category,Platform,Content Type,Scheduled Date
"3 mistakes first-time buyers make","Show common pitfalls with text overlays","Create a 30-second reel highlighting the top 3 mistakes first-time homebuyers make. Use upbeat music and text overlays for each mistake.","buyer","Instagram","reel","2026-02-15"
"Market update for [Your City]","Local market trends analysis","Generate a market analysis post for [City] covering recent sales data, average prices, and inventory levels. Include a call-to-action to schedule a consultation.","market_update","LinkedIn","post","2026-02-16"
"Why now is the perfect time to sell","Seller motivation hook","Create a carousel post explaining why current market conditions favor sellers. Include 5 slides with data points and visuals.","seller","Facebook","carousel","2026-02-17"
"Hidden gems in [Neighborhood]","Neighborhood spotlight","Write a post highlighting lesser-known features and amenities in [Neighborhood]. Include local business recommendations and community insights.","local","Instagram","post","2026-02-18"`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content-templates-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Sample CSV downloaded - use this template to format your content ideas");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-primary/70" />;
      case 'generated':
      case 'published':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Content Templates</h1>
        <p className="text-muted-foreground">
          Upload CSV files with hooks, reel ideas, and scripts for automated content generation
        </p>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Upload CSV</h2>
              <p className="text-sm text-muted-foreground">
                Import bulk content templates from a CSV file
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleCSV}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Sample
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {csvFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!csvFile || isUploading}
              className="w-full gap-2"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload CSV
                </>
              )}
            </Button>
          </div>

          {/* CSV Format Guide */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV Format Guide
            </h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Required column:</strong> Hook</p>
              <p><strong>Optional columns:</strong> Reel Idea, Script, Category, Platform, Content Type, Scheduled Date</p>
              <p className="mt-2">
                <strong>Example:</strong> "3 mistakes first-time buyers make","Show common pitfalls","Create a 30-second reel..."
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Templates List */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Your Templates</h2>
              <p className="text-sm text-muted-foreground">
                {templates?.length || 0} templates ready for content generation
              </p>
            </div>
          </div>

          {templates && templates.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Hook</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(template.status || 'pending')}
                          <span className="text-sm capitalize">{template.status || 'pending'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="text-left hover:underline">
                              {template.hook.substring(0, 60)}
                              {template.hook.length > 60 && '...'}
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Template Details</DialogTitle>
                              <DialogDescription>
                                View full template content
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label>Hook</Label>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => {
                                      navigator.clipboard.writeText(editedValues[template.id]?.hook ?? template.hook);
                                      toast.success("Copied!");
                                    }}><Copy className="h-3 w-3" /></Button>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => {
                                      if (editingField === `hook-${template.id}`) {
                                        setEditingField(null);
                                      } else {
                                        setEditingField(`hook-${template.id}`);
                                        setEditedValues(prev => ({ ...prev, [template.id]: { ...prev[template.id], hook: prev[template.id]?.hook ?? template.hook } }));
                                      }
                                    }}>
                                      {editingField === `hook-${template.id}` ? <><Save className="h-3 w-3 mr-1" />Done</> : <><Pencil className="h-3 w-3 mr-1" />Edit</>}
                                    </Button>
                                  </div>
                                </div>
                                {editingField === `hook-${template.id}` ? (
                                  <Textarea value={editedValues[template.id]?.hook ?? template.hook} onChange={(e) => setEditedValues(prev => ({ ...prev, [template.id]: { ...prev[template.id], hook: e.target.value } }))} className="min-h-[60px] text-sm resize-y" autoFocus />
                                ) : (
                                  <p className="text-sm mt-1">{editedValues[template.id]?.hook ?? template.hook}</p>
                                )}
                              </div>
                              {template.reelIdea && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <Label>Reel Idea</Label>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => {
                                        navigator.clipboard.writeText(editedValues[template.id]?.reelIdea ?? template.reelIdea ?? "");
                                        toast.success("Copied!");
                                      }}><Copy className="h-3 w-3" /></Button>
                                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => {
                                        if (editingField === `reelIdea-${template.id}`) {
                                          setEditingField(null);
                                        } else {
                                          setEditingField(`reelIdea-${template.id}`);
                                          setEditedValues(prev => ({ ...prev, [template.id]: { ...prev[template.id], reelIdea: prev[template.id]?.reelIdea ?? template.reelIdea ?? "" } }));
                                        }
                                      }}>
                                        {editingField === `reelIdea-${template.id}` ? <><Save className="h-3 w-3 mr-1" />Done</> : <><Pencil className="h-3 w-3 mr-1" />Edit</>}
                                      </Button>
                                    </div>
                                  </div>
                                  {editingField === `reelIdea-${template.id}` ? (
                                    <Textarea value={editedValues[template.id]?.reelIdea ?? template.reelIdea ?? ""} onChange={(e) => setEditedValues(prev => ({ ...prev, [template.id]: { ...prev[template.id], reelIdea: e.target.value } }))} className="min-h-[60px] text-sm resize-y" />
                                  ) : (
                                    <p className="text-sm mt-1">{editedValues[template.id]?.reelIdea ?? template.reelIdea}</p>
                                  )}
                                </div>
                              )}
                              {template.script && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <Label>Script/Prompt</Label>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => {
                                        navigator.clipboard.writeText(editedValues[template.id]?.script ?? template.script ?? "");
                                        toast.success("Copied!");
                                      }}><Copy className="h-3 w-3" /></Button>
                                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => {
                                        if (editingField === `script-${template.id}`) {
                                          setEditingField(null);
                                        } else {
                                          setEditingField(`script-${template.id}`);
                                          setEditedValues(prev => ({ ...prev, [template.id]: { ...prev[template.id], script: prev[template.id]?.script ?? template.script ?? "" } }));
                                        }
                                      }}>
                                        {editingField === `script-${template.id}` ? <><Save className="h-3 w-3 mr-1" />Done</> : <><Pencil className="h-3 w-3 mr-1" />Edit</>}
                                      </Button>
                                    </div>
                                  </div>
                                  {editingField === `script-${template.id}` ? (
                                    <Textarea value={editedValues[template.id]?.script ?? template.script ?? ""} onChange={(e) => setEditedValues(prev => ({ ...prev, [template.id]: { ...prev[template.id], script: e.target.value } }))} className="min-h-[100px] text-sm resize-y" />
                                  ) : (
                                    <p className="text-sm mt-1 whitespace-pre-wrap">{editedValues[template.id]?.script ?? template.script}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{template.category || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{template.platform || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{template.contentType}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              const params = new URLSearchParams({
                                hook: template.hook ?? "",
                                topic: template.reelIdea ?? "",
                                platform: template.platform ?? "Instagram",
                                contentType: template.contentType ?? "carousel",
                              });
                              setLocation(`/generate?${params.toString()}`);
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open in Post Builder
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates yet. Upload a CSV file to get started.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
