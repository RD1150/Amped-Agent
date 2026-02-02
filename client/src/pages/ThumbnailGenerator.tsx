import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Download, Sparkles } from "lucide-react";

export default function ThumbnailGenerator() {

  const [mainText, setMainText] = useState("");
  const [subText, setSubText] = useState("");
  const [topic, setTopic] = useState("");
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);

  const generateThumbnail = trpc.thumbnail.generate.useMutation({
    onSuccess: (data: { imageUrl: string; mainText: string; subText: string }) => {
      setGeneratedThumbnail(data.imageUrl);
      toast.success("Thumbnail generated! Ready to download.");
    },
    onError: (error: any) => {
      toast.error(`Generation failed: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!mainText && !topic) {
      toast.error("Please provide either main text or a topic for AI generation.");
      return;
    }

    generateThumbnail.mutate({
      mainText: mainText || undefined,
      subText: subText || undefined,
      topic: topic || undefined,
    });
  };

  const handleDownload = () => {
    if (!generatedThumbnail) return;

    const link = document.createElement("a");
    link.href = generatedThumbnail;
    link.download = `thumbnail-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Thumbnail downloaded!");
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">YouTube Thumbnail Generator</h1>
        <p className="text-muted-foreground">
          Create eye-catching thumbnails for your YouTube videos in seconds
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Thumbnail Details</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="topic">AI Generation (Optional)</Label>
              <Textarea
                id="topic"
                placeholder="e.g., 'Top 5 luxury homes in Beverly Hills' - AI will generate thumbnail text for you"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                className="mt-1.5"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Let AI create compelling thumbnail text based on your video topic
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or customize manually
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="mainText">Main Text</Label>
              <Input
                id="mainText"
                placeholder="e.g., 'TOP 5 LUXURY HOMES'"
                value={mainText}
                onChange={(e) => setMainText(e.target.value)}
                className="mt-1.5"
                maxLength={50}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {mainText.length}/50 characters
              </p>
            </div>

            <div>
              <Label htmlFor="subText">Subtitle (Optional)</Label>
              <Input
                id="subText"
                placeholder="e.g., 'Beverly Hills Edition'"
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                className="mt-1.5"
                maxLength={40}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {subText.length}/40 characters
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateThumbnail.isPending}
              className="w-full"
              size="lg"
            >
              {generateThumbnail.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Thumbnail
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Preview Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>

          {generatedThumbnail ? (
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={generatedThumbnail}
                  alt="Generated thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  className="flex-1"
                  size="lg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  onClick={() => {
                    setGeneratedThumbnail(null);
                    setMainText("");
                    setSubText("");
                    setTopic("");
                  }}
                  variant="outline"
                  size="lg"
                >
                  New Thumbnail
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>✓ Optimized for YouTube (1280x720px)</p>
                <p>✓ High contrast for mobile viewing</p>
                <p>✓ Professional design</p>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Your thumbnail will appear here</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="mt-6 p-6">
        <h3 className="font-semibold mb-3">💡 Thumbnail Best Practices</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Keep it simple:</strong> Use 3-5 words max for main text. Viewers should understand your video topic in 1 second.
          </div>
          <div>
            <strong>High contrast:</strong> Bold text with clear backgrounds ensures readability on all devices, especially mobile.
          </div>
          <div>
            <strong>Consistent branding:</strong> Use similar styles across thumbnails to build brand recognition in your niche.
          </div>
        </div>
      </Card>
    </div>
  );
}
