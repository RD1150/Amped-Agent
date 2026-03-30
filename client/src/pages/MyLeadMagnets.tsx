import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileText, Download, Trash2, Plus, MapPin, Calendar, Building2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const TYPE_LABELS: Record<string, string> = {
  first_time_buyer_guide: "First-Time Buyer Guide",
  neighborhood_report: "Neighborhood Report",
  market_update: "Market Update",
};

const TYPE_COLORS: Record<string, string> = {
  first_time_buyer_guide: "bg-primary/10 text-primary border-primary/20",
  neighborhood_report: "bg-primary/10 text-green-400 border-primary/20",
  market_update: "bg-primary/10 text-primary/80 border-primary/20",
};

const TYPE_ICONS: Record<string, string> = {
  first_time_buyer_guide: "🏠",
  neighborhood_report: "🗺️",
  market_update: "📊",
};

export default function MyLeadMagnets() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: magnets, isLoading } = trpc.leadMagnet.getMyLeadMagnets.useQuery();

  const deleteMutation = trpc.leadMagnet.deleteLeadMagnet.useMutation({
    onSuccess: () => {
      toast.success("Lead magnet deleted");
      utils.leadMagnet.getMyLeadMagnets.invalidate();
    },
    onError: () => {
      toast.error("Failed to delete lead magnet");
    },
  });

  const handleDownload = (pdfUrl: string, title: string) => {
    window.open(pdfUrl, "_blank");
  };

  const handleCopyLink = (pdfUrl: string) => {
    navigator.clipboard.writeText(pdfUrl).then(() => {
      toast.success("Link copied to clipboard");
    });
  };

  const handleShareEmail = (magnet: { title: string; city: string; agentName: string | null; pdfUrl: string }) => {
    const subject = encodeURIComponent(`Your Free ${magnet.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI put together a free resource just for you — ${magnet.title} for ${magnet.city}.\n\nClick the link below to download your copy:\n${magnet.pdfUrl}\n\nFeel free to reach out if you have any questions!\n\n${magnet.agentName || ""}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Lead Magnets</h1>
            <p className="text-muted-foreground mt-1">
              Your generated PDF lead magnets — ready to share and download
            </p>
          </div>
          <Button
            onClick={() => setLocation("/lead-magnet")}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-6" />
                  <div className="h-8 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!magnets || magnets.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No lead magnets yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Generate your first branded PDF lead magnet — First-Time Buyer Guide, Neighborhood Report, or Market Update.
            </p>
            <Button onClick={() => setLocation("/lead-magnet")} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Lead Magnet
            </Button>
          </div>
        )}

        {/* Lead magnets grid */}
        {!isLoading && magnets && magnets.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {magnets.length} lead magnet{magnets.length !== 1 ? "s" : ""} generated
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {magnets.map((magnet) => (
                <Card
                  key={magnet.id}
                  className="border border-border/50 hover:border-border transition-colors group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{TYPE_ICONS[magnet.type] || "📄"}</span>
                        <div className="min-w-0">
                          <Badge
                            variant="outline"
                            className={`text-xs mb-1 ${TYPE_COLORS[magnet.type] || ""}`}
                          >
                            {TYPE_LABELS[magnet.type] || magnet.type}
                          </Badge>
                          <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
                            {magnet.title}
                          </CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {/* Meta info */}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{magnet.city}</span>
                      </div>
                      {magnet.agentName && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{magnet.agentName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{formatDate(magnet.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5 text-xs"
                        onClick={() => handleDownload(magnet.pdfUrl, magnet.title)}
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1.5 text-xs"
                        onClick={() => handleShareEmail(magnet)}
                        title="Share via Email"
                      >
                        <Mail className="w-3 h-3" />
                        Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1.5 text-xs"
                        onClick={() => handleCopyLink(magnet.pdfUrl)}
                      >
                        Copy Link
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Lead Magnet?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{magnet.title}". The PDF file will remain accessible via its URL but will no longer appear in your library.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ id: magnet.id })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
