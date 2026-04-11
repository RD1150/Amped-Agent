import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  LayoutGrid, Home, UserCheck, Gift, FileText, ExternalLink, Copy,
  Search, Plus, ChevronRight, Loader2, Send,
} from "lucide-react";

// ── Asset type config ─────────────────────────────────────────────────────────

const ASSET_TYPES = [
  { key: "all", label: "All Assets", icon: LayoutGrid },
  { key: "listing", label: "Listing Presentations", icon: Home },
  { key: "buyer", label: "Buyer Presentations", icon: UserCheck },
  { key: "leadMagnet", label: "Lead Magnets", icon: Gift },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function AssetsHub() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: listingPresentations, isLoading: loadingListing } =
    trpc.listingPresentation.list.useQuery();
  const { data: buyerPresentations, isLoading: loadingBuyer } =
    trpc.buyerPresentation.list.useQuery();
  const { data: leadMagnets, isLoading: loadingLeadMagnets } =
    trpc.leadMagnet.getMyLeadMagnets.useQuery();

  const isLoading = loadingListing || loadingBuyer || loadingLeadMagnets;

  const brandedUrl = (id: number) => `${window.location.origin}/p/${id}`;

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  // ── Normalize assets into a unified shape ─────────────────────────────────

  type AssetItem = {
    id: string;
    type: "listing" | "buyer" | "leadMagnet";
    title: string;
    subtitle?: string;
    status: string;
    createdAt: Date | string | number;
    shareUrl?: string;
    thumbnailUrl?: string;
    externalUrl?: string;
  };

  const allAssets: AssetItem[] = [
    ...(listingPresentations ?? []).map((p) => ({
      id: `listing-${p.id}`,
      type: "listing" as const,
      title: p.title ?? "Listing Presentation",
      subtitle: p.propertyAddress ?? undefined,
      status: p.status ?? "draft",
      createdAt: p.createdAt,
      shareUrl: p.gammaUrl ? brandedUrl(p.id) : undefined,
      thumbnailUrl: p.thumbnailUrl ?? undefined,
    })),
    ...(buyerPresentations ?? []).map((p) => ({
      id: `buyer-${p.id}`,
      type: "buyer" as const,
      title: p.title ?? "Buyer Presentation",
      subtitle: (p as any).buyerName ?? (p as any).marketCity ?? undefined,
      status: p.status ?? "draft",
      createdAt: p.createdAt,
      shareUrl: p.gammaUrl ? brandedUrl(p.id) : undefined,
      thumbnailUrl: (p as any).thumbnailUrl ?? undefined,
    })),
    ...(leadMagnets ?? []).map((lm: any) => ({
      id: `leadmagnet-${lm.id}`,
      type: "leadMagnet" as const,
      title: lm.title ?? "Lead Magnet",
      subtitle: lm.topic ?? undefined,
      status: lm.status ?? "completed",
      createdAt: lm.createdAt,
      shareUrl: lm.pdfUrl ?? undefined,
      externalUrl: lm.pdfUrl ?? undefined,
    })),
  ];

  // ── Filter + search ───────────────────────────────────────────────────────

  const filtered = allAssets
    .filter((a) => filter === "all" || a.type === filter)
    .filter((a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.subtitle ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // ── Type badge config ─────────────────────────────────────────────────────

  const typeConfig = {
    listing: { label: "Listing", color: "bg-blue-100 text-blue-700", icon: Home },
    buyer: { label: "Buyer", color: "bg-orange-100 text-orange-700", icon: UserCheck },
    leadMagnet: { label: "Lead Magnet", color: "bg-green-100 text-green-700", icon: Gift },
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "generating") return "bg-yellow-100 text-yellow-700";
    if (status === "failed") return "bg-red-100 text-red-700";
    return "bg-muted text-muted-foreground";
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assets Hub</h1>
            <p className="text-sm text-muted-foreground">All your externally-facing content — presentations, lead magnets, and more</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/listing-presentation">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Listing Presentation
            </Button>
          </Link>
          <Link href="/buyer-presentation">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Buyer Presentation
            </Button>
          </Link>
          <Link href="/lead-magnet">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Lead Magnet
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Assets", value: allAssets.length, icon: LayoutGrid, color: "text-primary" },
          { label: "Listing Presentations", value: (listingPresentations ?? []).filter(p => p.status === "completed").length, icon: Home, color: "text-blue-500" },
          { label: "Buyer Presentations", value: (buyerPresentations ?? []).filter(p => p.status === "completed").length, icon: UserCheck, color: "text-orange-500" },
          { label: "Lead Magnets", value: (leadMagnets ?? []).length, icon: Gift, color: "text-green-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${stat.color} shrink-0`} />
                <div>
                  <p className="text-2xl font-bold leading-none">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {ASSET_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  filter === t.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Asset Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading assets…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <LayoutGrid className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">
            {search ? "No assets match your search." : "No assets yet. Create your first presentation or lead magnet."}
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/listing-presentation">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Home className="h-3.5 w-3.5" /> Listing Presentation
              </Button>
            </Link>
            <Link href="/buyer-presentation">
              <Button variant="outline" size="sm" className="gap-1.5">
                <UserCheck className="h-3.5 w-3.5" /> Buyer Presentation
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((asset) => {
            const tc = typeConfig[asset.type];
            const TypeIcon = tc.icon;
            return (
              <Card key={asset.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                {asset.thumbnailUrl ? (
                  <div className="h-32 overflow-hidden bg-muted">
                    <img src={asset.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <TypeIcon className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}

                <CardContent className="p-4 space-y-3">
                  {/* Type + Status badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${tc.color}`}>
                      <TypeIcon className="h-3 w-3" /> {tc.label}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>

                  {/* Title + subtitle */}
                  <div>
                    <p className="font-medium text-sm leading-snug line-clamp-2">{asset.title}</p>
                    {asset.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{asset.subtitle}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  {asset.shareUrl && asset.status === "completed" && (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-7 flex-1"
                        onClick={() => window.open(asset.shareUrl!, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-7"
                        onClick={() => copyLink(asset.shareUrl!)}
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                  )}
                  {asset.status === "draft" && (
                    <Link href={asset.type === "listing" ? "/listing-presentation" : asset.type === "buyer" ? "/buyer-presentation" : "/lead-magnet"}>
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7 w-full">
                        <ChevronRight className="h-3 w-3" /> Resume Draft
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
