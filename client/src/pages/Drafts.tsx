import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Drafts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedDrafts, setSelectedDrafts] = useState<Set<number>>(new Set());

  const { data: drafts, isLoading, refetch } = trpc.drafts.list.useQuery();
  const deleteDraft = trpc.drafts.delete.useMutation({
    onSuccess: () => {
      toast.success("Draft deleted");
      refetch();
    },
  });
  const bulkDeleteDrafts = trpc.drafts.bulkDelete.useMutation({
    onSuccess: () => {
      toast.success(`${selectedDrafts.size} drafts deleted`);
      setSelectedDrafts(new Set());
      refetch();
    },
  });

  const filteredDrafts = drafts?.filter((draft: any) => {
    const matchesSearch = draft.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || draft.type === filterType;
    return matchesSearch && matchesType;
  });

  const toggleDraftSelection = (draftId: number) => {
    const newSelection = new Set(selectedDrafts);
    if (newSelection.has(draftId)) {
      newSelection.delete(draftId);
    } else {
      newSelection.add(draftId);
    }
    setSelectedDrafts(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedDrafts.size === filteredDrafts?.length) {
      setSelectedDrafts(new Set());
    } else {
      setSelectedDrafts(new Set(filteredDrafts?.map((d: any) => d.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedDrafts.size === 0) return;
    if (confirm(`Delete ${selectedDrafts.size} selected drafts?`)) {
      bulkDeleteDrafts.mutate({ draftIds: Array.from(selectedDrafts) });
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Drafts</h1>
          <p className="text-muted-foreground">
            Manage your saved content drafts
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drafts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="post">Posts</SelectItem>
              <SelectItem value="reel">Reels</SelectItem>
              <SelectItem value="tour">Property Tours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedDrafts.size > 0 && (
          <div className="flex items-center gap-4 mb-4 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedDrafts.size} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteDrafts.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDrafts && filteredDrafts.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                checked={selectedDrafts.size === filteredDrafts.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
            {filteredDrafts.map((draft: any) => (
              <Card key={draft.id}>
                <CardHeader className="flex flex-row items-start gap-4">
                  <Checkbox
                    checked={selectedDrafts.has(draft.id)}
                    onCheckedChange={() => toggleDraftSelection(draft.id)}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {draft.type === "post" && "📝"}
                      {draft.type === "reel" && "🎬"}
                      {draft.type === "tour" && "🏠"}
                      <span className="capitalize">{draft.type}</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Saved {format(new Date(draft.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement edit functionality
                        toast.info("Edit functionality coming soon");
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this draft?")) {
                          deleteDraft.mutate({ draftId: draft.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-3">{draft.content}</p>
                  {draft.imageUrl && (
                    <img
                      src={draft.imageUrl}
                      alt="Draft preview"
                      className="mt-4 rounded-lg max-h-48 object-cover"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery || filterType !== "all"
                  ? "No drafts match your filters"
                  : "No drafts saved yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
