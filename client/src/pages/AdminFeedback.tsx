import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Star, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";

const RATING_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: "Okay", color: "text-yellow-600 bg-yellow-50", emoji: "😐" },
  2: { label: "Good", color: "text-blue-600 bg-blue-50", emoji: "😊" },
  3: { label: "Love it", color: "text-green-600 bg-green-50", emoji: "🔥" },
};

export default function AdminFeedback() {
  const { data: allFeedback, refetch } = trpc.feedback.list.useQuery();
  const approveMutation = trpc.feedback.approve.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast.error("Failed to update feedback status.");
    },
  });

  const pending = allFeedback?.filter((f) => !f.approved) ?? [];
  const approved = allFeedback?.filter((f) => f.approved) ?? [];

  const handleApprove = (id: number, approved: boolean) => {
    approveMutation.mutate({ id, approved });
    if (approved) {
      toast.success("Approved — this testimonial will appear on the landing page.");
    } else {
      toast("Removed from landing page.");
    }
  };

  const FeedbackCard = ({ item, showActions }: { item: any; showActions: boolean }) => {
    const ratingInfo = RATING_LABELS[item.rating] ?? RATING_LABELS[1];
    return (
      <Card className="border border-gray-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${ratingInfo.color}`}>
                  {ratingInfo.emoji} {ratingInfo.label}
                </span>
                <span className="text-xs text-gray-400">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
              {item.quote ? (
                <blockquote className="text-sm text-gray-700 italic border-l-2 border-gray-200 pl-3 mb-2">
                  "{item.quote}"
                </blockquote>
              ) : (
                <p className="text-xs text-gray-400 italic mb-2">No written quote provided.</p>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="font-medium text-gray-700">{item.agentName}</span>
                {item.agentTitle && <span>· {item.agentTitle}</span>}
              </div>
            </div>
            {showActions && (
              <div className="flex flex-col gap-2 shrink-0">
                {!item.approved ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50 text-xs h-8"
                    onClick={() => handleApprove(item.id, true)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Approve
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 border-red-200 hover:bg-red-50 text-xs h-8"
                    onClick={() => handleApprove(item.id, false)}
                    disabled={approveMutation.isPending}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Agent Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve agent ratings to display as testimonials on the landing page.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border border-gray-200">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{allFeedback?.length ?? 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Total Ratings</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{pending.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Pending Review</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-green-600">{approved.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Live on Site</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Pending
              {pending.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                  {pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Approved
              {approved.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                  {approved.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pending.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No pending feedback yet.</p>
                <p className="text-xs mt-1">Ratings submitted by agents will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((item) => (
                  <FeedbackCard key={item.id} item={item} showActions={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approved.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Star className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No approved testimonials yet.</p>
                <p className="text-xs mt-1">Approve feedback from the Pending tab to display it on the landing page.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approved.map((item) => (
                  <FeedbackCard key={item.id} item={item} showActions={true} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
