import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users, Plus, Loader2, Mail, Phone, Sparkles, Trash2, Clock, Copy,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

type Stage = "new" | "contacted" | "nurturing" | "appointment_set" | "closed";

const STAGES: { key: Stage; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { key: "new",             label: "New",             color: "text-blue-600",   bgColor: "bg-blue-50",   borderColor: "border-blue-200" },
  { key: "contacted",       label: "Contacted",       color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
  { key: "nurturing",       label: "Nurturing",       color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  { key: "appointment_set", label: "Appointment Set", color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  { key: "closed",          label: "Closed",          color: "text-green-600",  bgColor: "bg-green-50",  borderColor: "border-green-200" },
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

const SOURCE_COLORS: Record<string, string> = {
  open_house:   "bg-blue-100 text-blue-700",
  lead_magnet:  "bg-pink-100 text-pink-700",
  referral:     "bg-green-100 text-green-700",
  social:       "bg-purple-100 text-purple-700",
  website:      "bg-cyan-100 text-cyan-700",
  manual:       "bg-gray-100 text-gray-700",
  other:        "bg-slate-100 text-slate-700",
};

// ── Droppable column ────────────────────────────────────────────────────────
function DroppableColumn({
  stage,
  children,
  isOver,
}: {
  stage: Stage;
  children: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] space-y-2 rounded-lg transition-colors ${isOver ? "bg-primary/5 ring-2 ring-primary/20" : ""}`}
    >
      {children}
    </div>
  );
}

// ── Draggable lead card ─────────────────────────────────────────────────────
type LeadRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  stage: Stage;
  lastContactedAt: Date | null;
  createdAt: Date;
};

function LeadCard({
  lead,
  isStale,
  daysSince,
  onClick,
  isDragging,
}: {
  lead: LeadRow;
  isStale: boolean;
  daysSince: number | null;
  onClick: () => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none ${
        isStale ? "border-orange-300 bg-orange-50/50" : ""
      } ${isDragging ? "opacity-50" : ""}`}
      onClick={(e) => {
        // Only open detail if not dragging
        if (!transform) onClick();
      }}
    >
      <p className="font-semibold text-sm mb-1 truncate">{lead.name}</p>
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
      <div className="flex items-center justify-between mt-2 gap-1">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${SOURCE_COLORS[lead.source] ?? "bg-gray-100 text-gray-700"}`}>
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </span>
        {isStale && daysSince !== null && (
          <span className="text-[10px] text-orange-500 flex items-center gap-0.5 shrink-0">
            <Clock className="w-3 h-3" />{daysSince}d
          </span>
        )}
      </div>
    </Card>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function CRMPipeline() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [followUpResult, setFollowUpResult] = useState<any>(null);
  const [newNote, setNewNote] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overColumn, setOverColumn] = useState<Stage | null>(null);
  const [addForm, setAddForm] = useState({
    name: "", email: "", phone: "", source: "manual" as string, sourceRef: "", notes: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const utils = trpc.useUtils();
  const { data: leads = [], isLoading } = trpc.crm.getAll.useQuery();

  const createMutation = trpc.crm.create.useMutation({
    onSuccess: () => {
      utils.crm.getAll.invalidate();
      setShowAddForm(false);
      setAddForm({ name: "", email: "", phone: "", source: "manual", sourceRef: "", notes: "" });
      toast.success("Lead added!");
    },
    onError: (err) => toast.error(err.message),
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
      toast.success("Note added!");
    },
  });

  const generateFollowUpMutation = trpc.crm.generateFollowUp.useMutation({
    onSuccess: (data) => setFollowUpResult(data),
    onError: (err) => toast.error(err.message),
  });

  const { data: leadDetail } = trpc.crm.get.useQuery(
    { id: selectedLead! },
    { enabled: !!selectedLead }
  );

  const daysSince = useCallback((date: Date | null | undefined) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  }, []);

  const leadsInStage = (stage: Stage) =>
    leads.filter((l) => l.stage === stage);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as number);
  }

  function handleDragOver(event: any) {
    const { over } = event;
    if (over) setOverColumn(over.id as Stage);
    else setOverColumn(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverColumn(null);
    if (!over) return;
    const leadId = active.id as number;
    const newStage = over.id as Stage;
    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.stage !== newStage) {
      updateStageMutation.mutate({ id: leadId, stage: newStage });
    }
  }

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
            Drag leads between stages. Click any card to add notes or generate a follow-up.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />Add Lead
        </Button>
      </div>

      {/* Add Lead Form */}
      {showAddForm && (
        <Card className="p-6 border-purple-500/20 bg-purple-500/5">
          <h3 className="font-semibold mb-4">New Lead</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input placeholder="Jane Smith" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input type="email" placeholder="jane@email.com" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input placeholder="(555) 123-4567" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Source</label>
              <Select value={addForm.source} onValueChange={(v) => setAddForm({ ...addForm, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Source Detail</label>
              <Input placeholder="e.g. 123 Main St open house" value={addForm.sourceRef} onChange={(e) => setAddForm({ ...addForm, sourceRef: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Input placeholder="First impression..." value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => createMutation.mutate({ ...addForm, source: addForm.source as any })}
              disabled={!addForm.name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Lead
            </Button>
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => {
              const stageLeads = leadsInStage(stage.key);
              return (
                <div key={stage.key} className="min-w-[200px]">
                  {/* Column header */}
                  <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg border ${stage.bgColor} ${stage.borderColor}`}>
                    <span className={`text-sm font-semibold ${stage.color}`}>{stage.label}</span>
                    <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                  </div>
                  {/* Droppable area */}
                  <DroppableColumn stage={stage.key} isOver={overColumn === stage.key}>
                    {stageLeads.map((lead) => {
                      const days = daysSince(lead.lastContactedAt || lead.createdAt);
                      const isStale = stage.key !== "closed" && days !== null && days > 14;
                      return (
                        <LeadCard
                          key={lead.id}
                          lead={lead as LeadRow}
                          isStale={isStale}
                          daysSince={days}
                          onClick={() => { setSelectedLead(lead.id); setFollowUpResult(null); }}
                          isDragging={activeId === lead.id}
                        />
                      );
                    })}
                    {stageLeads.length === 0 && (
                      <div className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                        Drop leads here
                      </div>
                    )}
                  </DroppableColumn>
                </div>
              );
            })}
          </div>

          {/* Drag overlay (ghost card) */}
          <DragOverlay>
            {activeLead ? (
              <Card className="p-3 shadow-xl ring-2 ring-primary/30 rotate-2 opacity-90 w-48">
                <p className="font-semibold text-sm truncate">{activeLead.name}</p>
                {activeLead.email && (
                  <p className="text-xs text-muted-foreground truncate">{activeLead.email}</p>
                )}
                <span className={`mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${SOURCE_COLORS[activeLead.source] ?? "bg-gray-100 text-gray-700"}`}>
                  {SOURCE_LABELS[activeLead.source] ?? activeLead.source}
                </span>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
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
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
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
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SOURCE_COLORS[leadDetail.source] ?? "bg-gray-100 text-gray-700"}`}>
                    {SOURCE_LABELS[leadDetail.source] ?? leadDetail.source}
                  </span>
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
                            toast.success("Copied!");
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
                    <Trash2 className="w-3.5 h-3.5" />Archive Lead
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
