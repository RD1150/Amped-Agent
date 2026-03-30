import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Youtube,
  Sparkles,
  Copy,
  Check,
  Tag,
  Clock,
  FileText,
  Pencil,
  Save,
  X,
  Upload,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface YouTubeSEOData {
  title: string;
  description: string;
  tags: string[];
  timestamps: { time: string; label: string }[];
}

interface YouTubeSEOPanelProps {
  tourId: number;
  videoUrl?: string | null;
  initialData?: {
    youtubeTitle?: string | null;
    youtubeDescription?: string | null;
    youtubeTags?: string | null;
    youtubeTimestamps?: string | null;
  };
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-muted-foreground hover:text-foreground">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

export default function YouTubeSEOPanel({ tourId, videoUrl, initialData }: YouTubeSEOPanelProps) {
  const utils = trpc.useUtils();

  // Parse initial data from DB
  const parseInitial = (): YouTubeSEOData | null => {
    if (!initialData?.youtubeTitle) return null;
    try {
      return {
        title: initialData.youtubeTitle || "",
        description: initialData.youtubeDescription || "",
        tags: initialData.youtubeTags ? JSON.parse(initialData.youtubeTags) : [],
        timestamps: initialData.youtubeTimestamps ? JSON.parse(initialData.youtubeTimestamps) : [],
      };
    } catch {
      return null;
    }
  };

  const [seoData, setSeoData] = useState<YouTubeSEOData | null>(parseInitial);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<YouTubeSEOData | null>(null);
  const [newTag, setNewTag] = useState("");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  // Check if YouTube is connected
  const { data: youtubeConnection } = trpc.youtube.getConnection.useQuery();

  const uploadToYoutubeMutation = trpc.youtube.uploadVideo.useMutation({
    onSuccess: (data) => {
      setPublishedUrl(data.videoUrl);
      toast.success("Video published to YouTube!", {
        action: { label: "View", onClick: () => window.open(data.videoUrl, "_blank") },
      });
    },
    onError: (error) => {
      toast.error(`YouTube upload failed: ${error.message}`);
    },
  });

  const handlePublishToYoutube = () => {
    if (!seoData || !videoUrl) return;
    uploadToYoutubeMutation.mutate({
      videoUrl,
      title: seoData.title,
      description: seoData.description,
      tags: seoData.tags,
      privacyStatus: "public",
    });
  };

  const generateMutation = trpc.propertyTours.generateYouTubeSEO.useMutation({
    onSuccess: (data) => {
      setSeoData(data);
      utils.propertyTours.list.invalidate();
      toast.success("YouTube SEO generated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to generate SEO: ${error.message}`);
    },
  });

  const saveMutation = trpc.propertyTours.saveYouTubeSEO.useMutation({
    onSuccess: () => {
      setSeoData(editData!);
      setIsEditing(false);
      setEditData(null);
      utils.propertyTours.list.invalidate();
      toast.success("YouTube SEO saved!");
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({ tourId });
  };

  const handleStartEdit = () => {
    if (!seoData) return;
    setEditData({ ...seoData, tags: [...seoData.tags], timestamps: seoData.timestamps.map(t => ({ ...t })) });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editData) return;
    saveMutation.mutate({
      tourId,
      title: editData.title,
      description: editData.description,
      tags: editData.tags,
      timestamps: editData.timestamps,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleAddTag = () => {
    if (!newTag.trim() || !editData) return;
    setEditData({ ...editData, tags: [...editData.tags, newTag.trim()] });
    setNewTag("");
  };

  const handleRemoveTag = (index: number) => {
    if (!editData) return;
    setEditData({ ...editData, tags: editData.tags.filter((_, i) => i !== index) });
  };

  const handleTimestampChange = (index: number, field: "time" | "label", value: string) => {
    if (!editData) return;
    const updated = editData.timestamps.map((t, i) => i === index ? { ...t, [field]: value } : t);
    setEditData({ ...editData, timestamps: updated });
  };

  const getTimestampsText = (timestamps: { time: string; label: string }[]) =>
    timestamps.map(t => `${t.time} ${t.label}`).join("\n");

  // If video not ready yet, show a disabled state
  if (!videoUrl) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <Youtube className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">YouTube SEO Available After Video Completes</p>
            <p className="text-xs text-muted-foreground mt-1">
              Once your property tour video is ready, generate an optimized title, description, tags, and chapter timestamps.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500/20 border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Youtube className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-base">YouTube SEO</CardTitle>
              <CardDescription className="text-xs">
                AI-optimized title, description, tags & chapters
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {seoData && !isEditing && (
              <Button variant="outline" size="sm" onClick={handleStartEdit} className="h-8 gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={handleCancelEdit} className="h-8 gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="h-8 gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </>
            )}
            {!isEditing && (
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="h-8 gap-1.5 bg-red-500 hover:bg-red-600 text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {generateMutation.isPending ? "Generating..." : seoData ? "Regenerate" : "Generate SEO"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {seoData && (
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Video Title
                <span className={`text-xs ml-1 ${((isEditing ? editData?.title : seoData.title)?.length ?? 0) > 90 ? "text-primary/70" : "text-muted-foreground"}`}>
                  ({(isEditing ? editData?.title : seoData.title)?.length || 0}/100)
                </span>
              </div>
              {!isEditing && <CopyButton text={seoData.title} label="Title" />}
            </div>
            {isEditing ? (
              <Input
                value={editData?.title || ""}
                onChange={(e) => setEditData(d => d ? { ...d, title: e.target.value } : d)}
                maxLength={100}
                className="text-sm"
              />
            ) : (
              <p className="text-sm bg-muted/50 rounded-md px-3 py-2 leading-relaxed">{seoData.title}</p>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Description
              </div>
              {!isEditing && <CopyButton text={seoData.description} label="Description" />}
            </div>
            {isEditing ? (
              <Textarea
                value={editData?.description || ""}
                onChange={(e) => setEditData(d => d ? { ...d, description: e.target.value } : d)}
                rows={6}
                className="text-sm resize-none"
              />
            ) : (
              <p className="text-sm bg-muted/50 rounded-md px-3 py-2 leading-relaxed whitespace-pre-wrap">{seoData.description}</p>
            )}
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Tags
                <span className="text-xs text-muted-foreground ml-1">({(isEditing ? editData?.tags : seoData.tags)?.length || 0} tags)</span>
              </div>
              {!isEditing && (
                <CopyButton text={(seoData.tags || []).join(", ")} label="Tags" />
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(isEditing ? editData?.tags : seoData.tags)?.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs gap-1">
                  {tag}
                  {isEditing && (
                    <button onClick={() => handleRemoveTag(i)} className="ml-0.5 hover:text-destructive">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2 mt-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  placeholder="Add a tag..."
                  className="text-sm h-8"
                />
                <Button variant="outline" size="sm" onClick={handleAddTag} className="h-8">
                  Add
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Timestamps / Chapters */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Chapter Timestamps
              </div>
              {!isEditing && (
                <CopyButton
                  text={getTimestampsText(seoData.timestamps)}
                  label="Timestamps"
                />
              )}
            </div>
            <div className="space-y-1">
              {(isEditing ? (editData?.timestamps ?? []) : seoData.timestamps).map((ts, i) => (
                <div key={i} className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Input
                        value={ts.time}
                        onChange={(e) => handleTimestampChange(i, "time", e.target.value)}
                        className="text-xs h-7 w-16 font-mono"
                        placeholder="0:00"
                      />
                      <Input
                        value={ts.label}
                        onChange={(e) => handleTimestampChange(i, "label", e.target.value)}
                        className="text-xs h-7 flex-1"
                      />
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground w-10">{ts.time}</span>
                      <span>{ts.label}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}

      {/* Publish to YouTube button */}
      {seoData && !isEditing && youtubeConnection?.connected && (
        <CardContent className="pt-0">
          {publishedUrl ? (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-green-600/10 border border-green-500/30 text-green-500 text-sm font-medium hover:bg-green-600/20 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View on YouTube
            </a>
          ) : (
            <Button
              onClick={handlePublishToYoutube}
              disabled={uploadToYoutubeMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploadToYoutubeMutation.isPending ? "Uploading to YouTube..." : "Publish to YouTube"}
            </Button>
          )}
        </CardContent>
      )}

      {seoData && !isEditing && !youtubeConnection?.connected && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground text-center">
            Connect your YouTube channel in{" "}
            <a href="/integrations" className="text-red-500 hover:underline">Integrations</a>{" "}
            to publish directly from here.
          </p>
        </CardContent>
      )}

      {!seoData && !generateMutation.isPending && (
        <CardContent>
          <div className="text-center py-4 text-muted-foreground text-sm">
            <p>Click <strong>Generate SEO</strong> to create an AI-optimized YouTube title, description, tags, and chapter timestamps for this property tour.</p>
          </div>
        </CardContent>
      )}

      {generateMutation.isPending && (
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm space-y-2">
            <Sparkles className="h-8 w-8 mx-auto animate-pulse text-red-500" />
            <p>Generating YouTube SEO metadata...</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
