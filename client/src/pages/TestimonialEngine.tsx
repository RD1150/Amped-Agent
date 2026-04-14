import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Star,
  Plus,
  Loader2,
  Mail,
  Sparkles,
  Copy,
  Trash2,
  MessageSquareQuote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Tab = "request" | "add" | "list";

export default function TestimonialEngine() {
  const [tab, setTab] = useState<Tab>("list");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<Record<number, any>>({});

  // Request form
  const [reqForm, setReqForm] = useState({
    clientName: "",
    clientEmail: "",
    googleReviewUrl: "",
    zillowUrl: "",
    realtorUrl: "",
  });

  // Add form
  const [addForm, setAddForm] = useState({
    clientName: "",
    clientEmail: "",
    reviewText: "",
    rating: "5",
    source: "manual" as const,
  });

  const utils = trpc.useUtils();
  const { data: testimonials, isLoading } = trpc.testimonials.list.useQuery();

  const requestMutation = trpc.testimonials.requestReview.useMutation({
    onSuccess: () => {
      utils.testimonials.list.invalidate();
      toast("Review request sent!", { description: `Email sent to ${reqForm.clientEmail}` });
      setReqForm({ clientName: "", clientEmail: "", googleReviewUrl: "", zillowUrl: "", realtorUrl: "" });
      setTab("list");
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const saveMutation = trpc.testimonials.save.useMutation({
    onSuccess: () => {
      utils.testimonials.list.invalidate();
      toast("Testimonial saved!");
      setAddForm({ clientName: "", clientEmail: "", reviewText: "", rating: "5", source: "manual" });
      setTab("list");
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const generatePostMutation = trpc.testimonials.generatePost.useMutation({
    onSuccess: (data, variables) => {
      setGeneratedPosts((prev) => ({ ...prev, [variables.id]: data }));
      utils.testimonials.list.invalidate();
      toast("Social posts generated!");
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const deleteMutation = trpc.testimonials.delete.useMutation({
    onSuccess: () => utils.testimonials.list.invalidate(),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copied!`);
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
      />
    ));

  const statusColor: Record<string, string> = {
    requested: "secondary",
    received: "outline",
    published: "default",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <MessageSquareQuote className="w-5 h-5 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold">Testimonial Engine</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Turn happy clients into marketing assets — request reviews and generate social posts automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab("add")} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Review
          </Button>
          <Button onClick={() => setTab("request")} className="gap-2">
            <Mail className="w-4 h-4" />
            Request Review
          </Button>
        </div>
      </div>

      {/* Request Review Form */}
      {tab === "request" && (
        <Card className="p-6 border-yellow-500/20 bg-yellow-500/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Send Review Request Email
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Client Name *</label>
              <Input
                placeholder="Sarah Johnson"
                value={reqForm.clientName}
                onChange={(e) => setReqForm({ ...reqForm, clientName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Client Email *</label>
              <Input
                type="email"
                placeholder="sarah@email.com"
                value={reqForm.clientEmail}
                onChange={(e) => setReqForm({ ...reqForm, clientEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Google Review URL (optional)</label>
              <Input
                placeholder="https://g.page/r/..."
                value={reqForm.googleReviewUrl}
                onChange={(e) => setReqForm({ ...reqForm, googleReviewUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Zillow Profile URL (optional)</label>
              <Input
                placeholder="https://zillow.com/profile/..."
                value={reqForm.zillowUrl}
                onChange={(e) => setReqForm({ ...reqForm, zillowUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Realtor.com URL (optional)</label>
              <Input
                placeholder="https://realtor.com/realestateagents/..."
                value={reqForm.realtorUrl}
                onChange={(e) => setReqForm({ ...reqForm, realtorUrl: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => requestMutation.mutate(reqForm)}
              disabled={requestMutation.isPending || !reqForm.clientName || !reqForm.clientEmail}
              className="gap-2"
            >
              {requestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Request
            </Button>
            <Button variant="outline" onClick={() => setTab("list")}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Add Review Form */}
      {tab === "add" && (
        <Card className="p-6 border-yellow-500/20 bg-yellow-500/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4" />
            Add Received Review
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Client Name *</label>
              <Input
                placeholder="Sarah Johnson"
                value={addForm.clientName}
                onChange={(e) => setAddForm({ ...addForm, clientName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Client Email (optional)</label>
              <Input
                type="email"
                placeholder="sarah@email.com"
                value={addForm.clientEmail}
                onChange={(e) => setAddForm({ ...addForm, clientEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Rating</label>
              <Select value={addForm.rating} onValueChange={(v) => setAddForm({ ...addForm, rating: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <SelectItem key={r} value={String(r)}>
                      {"⭐".repeat(r)} ({r} stars)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Source</label>
              <Select value={addForm.source} onValueChange={(v: any) => setAddForm({ ...addForm, source: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="zillow">Zillow</SelectItem>
                  <SelectItem value="realtor">Realtor.com</SelectItem>
                  <SelectItem value="manual">Direct / Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Review Text *</label>
              <Textarea
                placeholder="Paste the client's review here..."
                value={addForm.reviewText}
                onChange={(e) => setAddForm({ ...addForm, reviewText: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => saveMutation.mutate({
                clientName: addForm.clientName,
                clientEmail: addForm.clientEmail || undefined,
                reviewText: addForm.reviewText,
                rating: parseInt(addForm.rating),
                source: addForm.source,
              })}
              disabled={saveMutation.isPending || !addForm.clientName || !addForm.reviewText}
              className="gap-2"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save Testimonial
            </Button>
            <Button variant="outline" onClick={() => setTab("list")}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Testimonials List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !testimonials?.length ? (
        <Card className="p-12 text-center border-dashed">
          <MessageSquareQuote className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No testimonials yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Request a review from a past client or add one you've already received.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setTab("add")} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Review
            </Button>
            <Button onClick={() => setTab("request")} className="gap-2">
              <Mail className="w-4 h-4" />
              Request Review
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => {
            const isExpanded = expandedId === t.id;
            const posts = generatedPosts[t.id] || (t.socialPostText ? JSON.parse(t.socialPostText) : null);

            return (
              <Card key={t.id} className="overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 text-sm font-semibold text-yellow-600">
                      {t.clientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{t.clientName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex">{renderStars(t.rating || 5)}</div>
                        <Badge variant={statusColor[t.status] as any} className="text-xs h-4">
                          {t.status}
                        </Badge>
                        {t.source !== "manual" && (
                          <span className="text-xs text-muted-foreground capitalize">{t.source}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: t.id }); }}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-4 space-y-4">
                    {t.reviewText && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm italic">"{t.reviewText}"</p>
                      </div>
                    )}

                    {!posts && t.reviewText && (
                      <Button
                        size="sm"
                        onClick={() => generatePostMutation.mutate({ id: t.id })}
                        disabled={generatePostMutation.isPending && generatePostMutation.variables?.id === t.id}
                        className="gap-2"
                      >
                        {generatePostMutation.isPending && generatePostMutation.variables?.id === t.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        Generate Social Posts
                      </Button>
                    )}

                    {posts && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                          Generated Social Posts
                        </h4>
                        {posts.instagramPost && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-muted-foreground">Instagram / Facebook</span>
                              <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => copyToClipboard(posts.instagramPost, "Instagram post")}>
                                <Copy className="w-3 h-3" /> Copy
                              </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{posts.instagramPost}</p>
                          </div>
                        )}
                        {posts.linkedinPost && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-muted-foreground">LinkedIn</span>
                              <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => copyToClipboard(posts.linkedinPost, "LinkedIn post")}>
                                <Copy className="w-3 h-3" /> Copy
                              </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{posts.linkedinPost}</p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generatePostMutation.mutate({ id: t.id })}
                          disabled={generatePostMutation.isPending}
                          className="gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Regenerate
                        </Button>
                      </div>
                    )}
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
