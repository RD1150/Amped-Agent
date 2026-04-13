import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FolderOpen,
  Download,
  Trash2,
  BookOpen,
  Users,
  Home,
  Calendar,
  MapPin,
  User,
  Plus,
} from "lucide-react";
import { useLocation } from "wouter";

export default function MyDocuments() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: guides, isLoading } = trpc.guidesGenerator.list.useQuery();

  const deleteMutation = trpc.guidesGenerator.delete.useMutation({
    onSuccess: () => {
      utils.guidesGenerator.list.invalidate();
      toast.success("Document deleted");
    },
    onError: (err) => {
      toast.error("Delete failed: " + err.message);
    },
  });

  const formatDate = (ts: Date | string | number | null) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <FolderOpen className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Documents</h1>
            <p className="text-sm text-muted-foreground">
              All your generated guides — re-download anytime at no extra cost.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setLocation("/guide-generator")}
          className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Guide
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-5 pb-4 h-20 bg-muted/30 rounded-lg" />
            </Card>
          ))}
        </div>
      ) : !guides || guides.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-muted">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">No documents yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate your first branded Seller's Manual or Buyer's Guide to get started.
              </p>
            </div>
            <Button
              onClick={() => setLocation("/guide-generator")}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Generate Your First Guide
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {guides.map((guide) => {
            const isSeller = guide.guideType === "sellers_manual";
            return (
              <Card key={guide.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: icon + details */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${isSeller ? "bg-amber-500/10" : "bg-blue-500/10"}`}>
                        {isSeller ? (
                          <Home className={`h-5 w-5 text-amber-500`} />
                        ) : (
                          <Users className={`h-5 w-5 text-blue-500`} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">
                            {isSeller ? "Seller's Manual" : "Buyer's Guide"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {isSeller ? "Seller" : "Buyer"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                          {guide.clientName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {guide.clientName}
                            </span>
                          )}
                          {guide.cityArea && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {guide.cityArea}
                            </span>
                          )}
                          {guide.propertyAddress && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <Home className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{guide.propertyAddress}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(guide.createdAt)}
                          </span>
                          {guide.suggestedPriceRange && (
                            <span className="text-green-600 font-medium">{guide.suggestedPriceRange}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        asChild
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        <a href={guide.pdfUrl} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4 mr-1.5" />
                          Download
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate({ id: guide.id })}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {guides && guides.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          {guides.length} document{guides.length !== 1 ? "s" : ""} — re-downloads are always free
        </p>
      )}
    </div>
  );
}
