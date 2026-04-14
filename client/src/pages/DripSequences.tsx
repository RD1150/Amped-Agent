import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Mail,
  Plus,
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function DripSequences() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [enrollDialog, setEnrollDialog] = useState<number | null>(null);
  const [enrollContacts, setEnrollContacts] = useState("");

  const utils = trpc.useUtils();
  const { data: sequences, isLoading } = trpc.drip.listSequences.useQuery();
  const { data: starters } = trpc.drip.getStarterSequences.useQuery();

  const createFromStarterMutation = trpc.drip.createFromStarter.useMutation({
    onSuccess: () => {
      utils.drip.listSequences.invalidate();
      toast("Sequence added!");
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const enrollMutation = trpc.drip.enroll.useMutation({
    onSuccess: (data) => {
      utils.drip.listEnrollments.invalidate();
      setEnrollDialog(null);
      setEnrollContacts("");
      toast(`${data.enrolled} contact${data.enrolled !== 1 ? "s" : ""} enrolled!`);
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const handleEnroll = () => {
    if (!enrollDialog) return;
    const lines = enrollContacts
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const contacts: { name: string; email: string }[] = [];
    for (const line of lines) {
      // Accept "Name, email@example.com" or just "email@example.com"
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        contacts.push({ name: parts[0], email: parts[1] });
      } else if (parts[0].includes("@")) {
        contacts.push({ name: parts[0].split("@")[0], email: parts[0] });
      }
    }

    if (!contacts.length) {
      toast.error("No valid contacts found", { description: "Use format: Name, email@example.com" });
      return;
    }

    enrollMutation.mutate({ sequenceId: enrollDialog, contacts });
  };

  const { data: allEnrollments } = trpc.drip.listEnrollments.useQuery({});

  const getEnrollmentCount = (seqId: number) =>
    allEnrollments?.filter((e) => e.sequenceId === seqId).length || 0;

  const getActiveCount = (seqId: number) =>
    allEnrollments?.filter((e) => e.sequenceId === seqId && e.status === "active").length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold">Email Drip Sequences</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Automated multi-step email sequences that nurture leads while you sleep.
          </p>
        </div>
      </div>

      {/* Starter Sequences */}
      {starters && starters.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Add a Pre-Built Sequence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {starters.map((starter) => {
              const alreadyAdded = sequences?.some((s) => s.name === starter.name);
              return (
                <Card key={starter.key} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{starter.name}</h4>
                    {alreadyAdded ? (
                      <Badge variant="secondary" className="text-xs shrink-0">Added</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs gap-1 shrink-0"
                        onClick={() => createFromStarterMutation.mutate({ starterKey: starter.key })}
                        disabled={createFromStarterMutation.isPending}
                      >
                        {createFromStarterMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        Add
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{starter.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    {starter.stepCount} emails
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* My Sequences */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          My Sequences
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !sequences?.length ? (
          <Card className="p-12 text-center border-dashed">
            <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No sequences yet</h3>
            <p className="text-sm text-muted-foreground">
              Add a pre-built sequence above to get started.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sequences.map((seq) => {
              const isExpanded = expandedId === seq.id;
              const steps = seq.steps ? JSON.parse(seq.steps) : [];
              const totalEnrolled = getEnrollmentCount(seq.id);
              const activeCount = getActiveCount(seq.id);

              return (
                <Card key={seq.id} className="overflow-hidden">
                  <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : seq.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
                        <Zap className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{seq.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{steps.length} emails</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{totalEnrolled} enrolled</span>
                          {activeCount > 0 && (
                            <span className="flex items-center gap-1 text-green-600"><Play className="w-3 h-3" />{activeCount} active</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Button
                        size="sm"
                        className="gap-1 text-xs h-7"
                        onClick={(e) => { e.stopPropagation(); setEnrollDialog(seq.id); }}
                      >
                        <Users className="w-3 h-3" />
                        Enroll
                      </Button>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t p-5 space-y-4">
                      {seq.description && (
                        <p className="text-sm text-muted-foreground">{seq.description}</p>
                      )}

                      {/* Steps Timeline */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Email Sequence</h4>
                        <div className="space-y-3">
                          {steps.map((step: any, i: number) => (
                            <div key={i} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-semibold text-blue-600 shrink-0">
                                  {i + 1}
                                </div>
                                {i < steps.length - 1 && (
                                  <div className="w-0.5 h-full bg-border mt-1" />
                                )}
                              </div>
                              <div className="pb-3 flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium truncate">{step.subject}</p>
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {step.delayDays === 0 ? "Day 0" : `+${step.delayDays} days`}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{step.body}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Enrollments */}
                      {totalEnrolled > 0 && (
                        <EnrollmentList sequenceId={seq.id} />
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Enroll Dialog */}
      <Dialog open={!!enrollDialog} onOpenChange={() => { setEnrollDialog(null); setEnrollContacts(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Contacts</DialogTitle>
            <DialogDescription>
              Enter one contact per line. Format: Name, email@example.com
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              className="w-full h-40 p-3 text-sm border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={"Sarah Johnson, sarah@email.com\nMike Davis, mike@email.com\njohn@email.com"}
              value={enrollContacts}
              onChange={(e) => setEnrollContacts(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Contacts will receive emails automatically on the sequence schedule.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleEnroll}
                disabled={enrollMutation.isPending || !enrollContacts.trim()}
                className="gap-2"
              >
                {enrollMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Sequence
              </Button>
              <Button variant="outline" onClick={() => { setEnrollDialog(null); setEnrollContacts(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EnrollmentList({ sequenceId }: { sequenceId: number }) {
  const { data: enrollments } = trpc.drip.listEnrollments.useQuery({ sequenceId });
  const utils = trpc.useUtils();

  const unenrollMutation = trpc.drip.unenroll.useMutation({
    onSuccess: () => {
      utils.drip.listEnrollments.invalidate();
      toast("Unenrolled");
    },
  });

  if (!enrollments?.length) return null;

  const statusColor: Record<string, string> = {
    active: "text-green-600",
    completed: "text-muted-foreground",
    unsubscribed: "text-destructive",
    paused: "text-yellow-600",
  };

  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">Enrolled Contacts ({enrollments.length})</h4>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {enrollments.map((e) => (
          <div key={e.id} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
            <div className="min-w-0">
              <span className="font-medium">{e.contactName}</span>
              <span className="text-muted-foreground ml-1">({e.contactEmail})</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className={statusColor[e.status] || ""}>{e.status}</span>
              <span className="text-muted-foreground">Step {e.currentStep + 1}</span>
              {e.status === "active" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => unenrollMutation.mutate({ enrollmentId: e.id })}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
