import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Upload, 
  Image, 
  FileText, 
  FileSpreadsheet, 
  File,
  MoreHorizontal,
  Trash2,
  Download,
  Eye
} from "lucide-react";
import { toast } from "sonner";

export default function Uploads() {
  const [isUploading, setIsUploading] = useState(false);
  const { data: uploads = [], isLoading } = trpc.uploads.list.useQuery();
  const utils = trpc.useUtils();

  const deleteUpload = trpc.uploads.delete.useMutation({
    onSuccess: () => {
      utils.uploads.list.invalidate();
      toast.success("File deleted");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // In a real implementation, this would upload to S3
    toast.info("File upload coming soon! This feature requires S3 integration.");
    
    setIsUploading(false);
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case "image":
        return <Image className="h-5 w-5 text-green-400" />;
      case "document":
        return <FileText className="h-5 w-5 text-primary/70" />;
      case "csv":
        return <FileSpreadsheet className="h-5 w-5 text-primary/70" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "image":
        return <Badge className="bg-primary/15 text-green-400">Image</Badge>;
      case "document":
        return <Badge className="bg-primary/15 text-primary/70">Document</Badge>;
      case "csv":
        return <Badge className="bg-primary/10 text-primary/70">CSV</Badge>;
      default:
        return <Badge variant="secondary">Other</Badge>;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Uploads</h1>
          <p className="text-muted-foreground mt-1">
            Manage your images, documents, and other files
          </p>
        </div>
        <div>
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            accept="image/*,.pdf,.doc,.docx,.csv"
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={isUploading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload File"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <label htmlFor="file-upload-drag" className="cursor-pointer block">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-drag"
              accept="image/*,.pdf,.doc,.docx,.csv"
            />
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors m-4">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Drag and drop files here</p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Supports: Images, PDFs, Documents, CSV files
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
          <CardDescription>
            All uploaded files for your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No files uploaded yet</p>
              <p className="text-sm mt-1">Upload images and documents to use in your content</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(upload.category || "other")}
                        <span className="font-medium truncate max-w-[200px]">
                          {upload.fileName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(upload.category || "other")}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFileSize(upload.fileSize)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(upload.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(upload.fileUrl, "_blank")}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(upload.fileUrl, "_blank")}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteUpload.mutate({ id: upload.id })}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Storage Used</p>
              <p className="text-xs text-muted-foreground">
                {uploads.length} files uploaded
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-primary">
                {formatFileSize(uploads.reduce((acc, u) => acc + (u.fileSize || 0), 0))}
              </p>
              <p className="text-xs text-muted-foreground">Total size</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
