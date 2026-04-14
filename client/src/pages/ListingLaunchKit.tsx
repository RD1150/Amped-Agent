import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Rocket,
  Plus,
  Loader2,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  Trash2,
  Video,
  Mail,
  Share2,
  FileText,
  Sparkles,
  Home,
} from "lucide-react";

export default function ListingLaunchKit() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [expandedKit, setExpandedKit] = useState<number | null>(null);
  const [form, setForm] = useState({
    address: "",
    city: "",
    state: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    description: "",
  });

  const utils = trpc.useUtils();
  const { data: kits, isLoading } = trpc.listingKit.list.useQuery();

  const createMutation = trpc.listingKit.create.useMutation({
    onSuccess: (data) => {
      utils.listingKit.list.invalidate();
      setShowForm(false);
      setForm({ address: "", city: "", state: "", price: "", bedrooms: "", bathrooms: "", sqft: "", description: "" });
      // Auto-generate
      generateMutation.mutate({ id: data.id });
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const generateMutation = trpc.listingKit.generate.useMutation({
    onSuccess: () => {
      utils.listingKit.list.invalidate();
      toast("Kit ready!", { description: "Your listing assets have been generated." });
    },
    onError: (err) => {
      utils.listingKit.list.invalidate();
      toast.error("Generation failed", { description: err.message });
    },
  });

  const deleteMutation = trpc.listingKit.delete.useMutation({
    onSuccess: () => utils.listingKit.list.invalidate(),
  });

  const handleSubmit = () => {
    if (!form.address.trim()) {
      toast.error("Address required");
      return;
    }
    createMutation.mutate({
      address: form.address,
      city: form.city || undefined,
      state: form.state || undefined,
      price: form.price || undefined,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
      bathrooms: form.bathrooms || undefined,
      sqft: form.sqft ? parseInt(form.sqft) : undefined,
      description: form.description || undefined,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copied!`);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      draft: { label: "Draft", variant: "outline" },
      generating: { label: "Generating…", variant: "secondary" },
      ready: { label: "Ready", variant: "default" },
      failed: { label: "Failed", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "outline" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Rocket className="w-5 h-5 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold">Listing Launch Kit</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Enter one listing → get social posts, email blast, and more in seconds.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Listing
        </Button>
      </div>

      {/* New Listing Form */}
      {showForm && (
        <Card className="p-6 border-orange-500/20 bg-orange-500/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Home className="w-4 h-4" />
            Listing Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Property Address *</label>
              <Input
                placeholder="123 Main Street"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">City</label>
              <Input
                placeholder="Austin"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">State</label>
              <Input
                placeholder="TX"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">List Price</label>
              <Input
                placeholder="$750,000"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Bedrooms</label>
              <Input
                type="number"
                placeholder="4"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Bathrooms</label>
              <Input
                placeholder="2.5"
                value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Square Footage</label>
              <Input
                type="number"
                placeholder="2400"
                value={form.sqft}
                onChange={(e) => setForm({ ...form, sqft: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Property Description (optional)</label>
              <Textarea
                placeholder="Stunning 4-bed home in the heart of the neighborhood. Renovated kitchen, open floor plan, large backyard..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || generateMutation.isPending}
              className="gap-2"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Everything
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Kits List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !kits?.length ? (
        <Card className="p-12 text-center border-dashed">
          <Rocket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No listing kits yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first kit and get all your listing assets in one click.
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create First Kit
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {kits.map((kit) => {
            const isExpanded = expandedKit === kit.id;
            const isGenerating = kit.status === "generating" || (generateMutation.isPending && generateMutation.variables?.id === kit.id);
            const socialPosts = kit.socialPosts ? JSON.parse(kit.socialPosts) : [];
            const emailBlast = kit.emailBlast ? JSON.parse(kit.emailBlast) : null;

            return (
              <Card key={kit.id} className="overflow-hidden">
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedKit(isExpanded ? null : kit.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-orange-500/10 shrink-0">
                      <Home className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{kit.address}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {statusBadge(isGenerating ? "generating" : kit.status)}
                        {kit.price && <span className="text-xs text-muted-foreground">{kit.price}</span>}
                        {kit.bedrooms && <span className="text-xs text-muted-foreground">{kit.bedrooms} bed</span>}
                        {kit.bathrooms && <span className="text-xs text-muted-foreground">{kit.bathrooms} bath</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: kit.id }); }}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && kit.status === "ready" && (
                  <div className="border-t">
                    {/* Social Posts */}
                    {socialPosts.length > 0 && (
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Share2 className="w-4 h-4 text-blue-500" />
                          <h4 className="font-semibold text-sm">Social Posts ({socialPosts.length})</h4>
                        </div>
                        <div className="space-y-3">
                          {socialPosts.map((post: any, i: number) => (
                            <div key={i} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-xs">{post.angle || `Post ${i + 1}`}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 gap-1 text-xs"
                                  onClick={() => copyToClipboard(`${post.content}\n\n${post.hashtags}`, "Post")}
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </Button>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                              {post.hashtags && (
                                <p className="text-xs text-blue-500 mt-1">{post.hashtags}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Email Blast */}
                    {emailBlast && (
                      <>
                        <Separator />
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Mail className="w-4 h-4 text-green-500" />
                            <h4 className="font-semibold text-sm">Email Blast</h4>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-muted-foreground">Subject: {emailBlast.subject}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => copyToClipboard(
                                  `Subject: ${emailBlast.subject}\n\n${emailBlast.body}\n\n${emailBlast.cta}`,
                                  "Email"
                                )}
                              >
                                <Copy className="w-3 h-3" />
                                Copy
                              </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{emailBlast.body}</p>
                            {emailBlast.cta && (
                              <p className="text-sm font-medium mt-2 text-primary">{emailBlast.cta}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Quick Actions */}
                    <Separator />
                    <div className="p-5">
                      <h4 className="font-semibold text-sm mb-3">Create More Assets</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setLocation(`/property-tours?address=${encodeURIComponent(kit.address)}`)}
                        >
                          <Video className="w-3.5 h-3.5" />
                          Property Tour Video
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setLocation(`/listing-presentation?address=${encodeURIComponent(kit.address)}`)}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Listing Presentation
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setLocation(`/lead-magnet?address=${encodeURIComponent(kit.address)}`)}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Lead Magnet PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {isExpanded && kit.status === "failed" && (
                  <div className="border-t p-5">
                    <p className="text-sm text-destructive mb-3">
                      Generation failed: {kit.errorMessage || "Unknown error"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateMutation.mutate({ id: kit.id })}
                      disabled={generateMutation.isPending}
                      className="gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Retry Generation
                    </Button>
                  </div>
                )}

                {isExpanded && isGenerating && (
                  <div className="border-t p-5 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                    <p className="text-sm text-muted-foreground">
                      Generating your listing assets… This takes about 15–30 seconds.
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
