import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Loader2,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Clock,
  Copy,
  GitBranch,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Stage = "new" | "contacted" | "nurturing" | "appointment_set" | "closed";

const STAGES: { key: Stage; label: string; color: string; bgColor: string }[] = [
  { key: "new", label: "New", color: "text-blue-600", bgColor: "bg-blue-500/10" },
  { key: "contacted", label: "Contacted", color: "text-yellow-600", bgColor: "bg-yellow-500/10" },
  { key: "nurturing", label: "Nurturing", color: "text-orange-600", bgColor: "bg-orange-500/10" },
  { key: "appointment_set", label: "Appointment Set", color: "text-purple-600", bgColor: "bg-purple-500/10" },
  { key: "closed", label: "Closed", color: "text-green-600", bgColor: "bg-green-500/10" },
];

const SOURCE_LABELS: Record<string, string> = {
  open_house: "Open House",
  lead_magnet: "Lead Magnet",
  referral: "Referral",
  social: "Social",
  website: "Website",
  manual: "Manual",
  other: "Other",
};

export default function CRMPipeline() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<number | null>(null);

  // Auto-open a specific lead when navigated from Open House with ?lead=<id>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const leadId = params.get("lead");
    if (leadId) {
      const id = parseInt(leadId, 10);
      if (!isNaN(id)) setSelectedLead(id);
      // Clean the URL without reloading
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);
  const [followUpDialog, setFollowUpDialog] = useState<{ id: number; name: string } | null>(null);
  const [followUpResult, setFollowUpResult] = useState<any>(null);
  const [dripSequenceId, setDripSequenceId] = useState<string>("");
  const [dripEnrolled, setDripEnrolled] = useState(false);
  const { data: sequences } = trpc.drip.listSequences.useQuery();
  const enrollDripMutation = trpc.drip.enroll.useMutation({
    onSuccess: () => { setDripEnrolled(true); toast("Enrolled in drip sequence!"); },
    onError: (err) => toast.error("Enroll failed", { description: err.message }),
  });
  const [newNote, setNewNote] = useState("");
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "manual" as const,
    sourceRef: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: leads, isLoading } = trpc.crm.getAll.useQuery();

  const createMutation = trpc.crm.create.useMutation({
    onSuccess: () => {
      utils.crm.getAll.invalidate();
      setShowAddForm(false);
      setAddForm({ name: "", email: "", phone: "", source: "manual", sourceRef: "", notes: "" });
      toast("Lead added!");
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const updateStageMutation = trpc.crm.updateStage.useMutation({
    onMutate: async ({ id, stage }) => {
      await utils.crm.getAll.cancel();
      const prev = utils.crm.getAll.getData();
      utils.crm.getAll.setData(undefined, (old) =>
        old?.map((l) => (l.id === id ? { ...l, stage } : l))
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) utils.crm.getAll.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.crm.getAll.invalidate(),
  });

  const archiveMutation = trpc.crm.archive.useMutation({
    onSuccess: () => utils.crm.getAll.invalidate(),
  });

  const addNoteMutation = trpc.crm.addNote.useMutation({
    onSuccess: () => {
      setNewNote("");
      utils.crm.get.invalidate({ id: selectedLead! });
      toast("Note added!");
    },
  });

  const generateFollowUpMutation = trpc.crm.generateFollowUp.useMutation({
    onSuccess: (data) => {
      setFollowUpResult(data);
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const { data: leadDetail } = trpc.crm.get.useQuery(
    { id: selectedLead! },
    { enabled: !!selectedLead }
  );

  const leadsInStage = (stage: Stage) =>
    (leads || []).filter((l) => l.stage === stage);

  const daysSince = (date: Date | null | undefined) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  };

  const moveStage = (id: number, currentStage: Stage, direction: "forward" | "back") => {
    const idx = STAGES.findIndex((s) => s.key === currentStage);
    const newIdx = direction === "forward" ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= STAGES.length) return;
    updateStageMutation.mutate({ id, stage: STAGES[newIdx].key });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <h1 className="text-2xl font-bold">CRM Pipeline</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Track every lead from first contact to closed deal.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Lead
        </Button>
      </div>

      {/* Add Lead Form */}
      {showAddForm && (
        <Card className="p-6 border-purple-500/20 bg-purple-500/5">
          <h3 className="font-semibold mb-4">New Lead</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input
                placeholder="Jane Smith"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="jane@email.com"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input
                placeholder="(555) 123-4567"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Source</label>
              <Select value={addForm.source} onValueChange={(v: any) => setAddForm({ ...addForm, source: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Source Detail</label>
              <Input
                placeholder="Open house address, referral name..."
                value={addForm.sourceRef}
                onChange={(e) => setAddForm({ ...addForm, sourceRef: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Input
                placeholder="First-time buyer, looking in 78701..."
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => createMutation.mutate(addForm)}
              disabled={createMutation.isPending || !addForm.name}
              className="gap-2"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Lead
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {STAGES.map((stage, stageIdx) => {
            const stageLeads = leadsInStage(stage.key);
            return (
              <div key={stage.key} className="min-w-[200px]">
                <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg ${stage.bgColor}`}>
                  <span className={`text-sm font-semibold ${stage.color}`}>{stage.label}</span>
                  <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageLeads.map((lead) => {
                    const days = daysSince(lead.lastContactedAt || lead.createdAt);
                    const isStale = stage.key !== "closed" && days !== null && days > 14;

                    return (
                      <Card
                        key={lead.id}
                        className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${isStale ? "border-orange-400/50" : ""}`}
                        onClick={() => setSelectedLead(lead.id)}
                      >
                        <p className="font-medium text-sm mb-1 truncate">{lead.name}</p>
                        {lead.email && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />{lead.email}
                          </p>
                        )}
                        {lead.phone && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />{lead.phone}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs h-4">
                            {SOURCE_LABELS[lead.source] || lead.source}
                          </Badge>
                          {isStale && (
                            <span className="text-xs text-orange-500 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />{days}d
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {stageIdx > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); moveStage(lead.id, stage.key, "back"); }}
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </Button>
                          )}
                          {stageIdx < STAGES.length - 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-auto"
                              onClick={(e) => { e.stopPropagation(); moveStage(lead.id, stage.key, "forward"); }}
                            >
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                  {stageLeads.length === 0 && (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => { setSelectedLead(null); setFollowUpResult(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {leadDetail && (
            <>
              <DialogHeader>
                <DialogTitle>{leadDetail.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {leadDetail.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{leadDetail.email}</span>
                    </div>
                  )}
                  {leadDetail.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{leadDetail.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stage Selector */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Stage</label>
                  <Select
                    value={leadDetail.stage}
                    onValueChange={(v: Stage) => updateStageMutation.mutate({ id: leadDetail.id, stage: v })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Source */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Source:</span>
                  <Badge variant="outline">{SOURCE_LABELS[leadDetail.source]}</Badge>
                  {leadDetail.sourceRef && <span className="text-muted-foreground text-xs">{leadDetail.sourceRef}</span>}
                </div>

                {/* AI Follow-Up Generator */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground">AI Follow-Up</label>
                    <div className="flex gap-1">
                      {(["email", "text", "call_script"] as const).map((ch) => (
                        <Button
                          key={ch}
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs gap-1"
                          onClick={() => generateFollowUpMutation.mutate({ leadId: leadDetail.id, channel: ch })}
                          disabled={generateFollowUpMutation.isPending}
                        >
                          {generateFollowUpMutation.isPending && generateFollowUpMutation.variables?.channel === ch ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          {ch === "call_script" ? "Call" : ch.charAt(0).toUpperCase() + ch.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {followUpResult && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      {followUpResult.subject && (
                        <p className="font-medium text-xs mb-1">Subject: {followUpResult.subject}</p>
                      )}
                      <p className="whitespace-pre-wrap text-xs">{followUpResult.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground italic">{followUpResult.tip}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(followUpResult.message);
                            toast("Copied!");
                          }}
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Activity Log</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
                    {leadDetail.notes?.map((note) => (
                      <div key={note.id} className="bg-muted/50 rounded p-2 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                          <Badge variant="outline" className="text-xs h-4">{note.noteType}</Badge>
                          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p>{note.content}</p>
                      </div>
                    ))}
                    {!leadDetail.notes?.length && (
                      <p className="text-xs text-muted-foreground">No activity yet.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="h-8 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newNote.trim()) {
                          addNoteMutation.mutate({ leadId: leadDetail.id, content: newNote });
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => newNote.trim() && addNoteMutation.mutate({ leadId: leadDetail.id, content: newNote })}
                      disabled={addNoteMutation.isPending || !newNote.trim()}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Drip Sequence Enrollment */}
                {leadDetail.email && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-purple-500" />
                        Email Drip Sequence
                      </label>
                      {dripEnrolled && (
                        <span className="text-xs text-green-600 font-medium">✓ Enrolled</span>
                      )}
                    </div>
                    {!sequences?.length ? (
                      <p className="text-xs text-muted-foreground">No sequences yet — <button className="underline text-purple-600" onClick={() => { setSelectedLead(null); }}>go to Drip Sequences</button> to create one.</p>
                    ) : (
                      <div className="flex gap-2">
                        <Select value={dripSequenceId} onValueChange={setDripSequenceId}>
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue placeholder="Choose a sequence…" />
                          </SelectTrigger>
                          <SelectContent>
                            {sequences.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)} className="text-xs">{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1 shrink-0"
                          disabled={!dripSequenceId || enrollDripMutation.isPending || dripEnrolled}
                          onClick={() => {
                            if (!dripSequenceId || !leadDetail.email) return;
                            enrollDripMutation.mutate({
                              sequenceId: Number(dripSequenceId),
                              contacts: [{ name: leadDetail.name, email: leadDetail.email! }],
                              startImmediately: true,
                            });
                          }}
                        >
                          {enrollDripMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <GitBranch className="w-3 h-3" />}
                          {dripEnrolled ? "Enrolled" : "Enroll"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Archive */}
                <div className="pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground gap-2 text-xs"
                    onClick={() => {
                      archiveMutation.mutate({ id: leadDetail.id });
                      setSelectedLead(null);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Archive Lead
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
