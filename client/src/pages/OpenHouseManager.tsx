import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Home,
  Plus,
  Loader2,
  QrCode,
  Users,
  ChevronDown,
  ChevronUp,
  Copy,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Zap,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function OpenHouseManager() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [qrDialog, setQrDialog] = useState<{ url: string; address: string } | null>(null);
  const [form, setForm] = useState({
    address: "",
    city: "",
    date: "",
    startTime: "",
    endTime: "",
    price: "",
    followUpSequence: "3email" as "none" | "3email" | "5email",
  });

  const utils = trpc.useUtils();
  const { data: openHouses, isLoading } = trpc.openHouse.list.useQuery();
  const { data: zapierHooks } = trpc.zapierWebhooks.getAll.useQuery(undefined, { retry: false });
  const openHouseZapierActive = (zapierHooks as Array<{ eventType: string; configured: boolean; isEnabled: boolean }> | undefined)
    ?.some((w) => w.eventType === "open_house_lead" && w.configured && w.isEnabled) ?? false;
  const openHouseZapierConfigured = (zapierHooks as Array<{ eventType: string; configured: boolean }> | undefined)
    ?.some((w) => w.eventType === "open_house_lead" && w.configured) ?? false;

  const createMutation = trpc.openHouse.create.useMutation({
    onSuccess: (data) => {
      utils.openHouse.list.invalidate();
      setShowForm(false);
      setForm({ address: "", city: "", date: "", startTime: "", endTime: "", price: "", followUpSequence: "3email" });
      setQrDialog({ url: data.qrUrl, address: form.address });
      toast("Open house created!", { description: "Your QR code is ready to print." });
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const deactivateMutation = trpc.openHouse.deactivate.useMutation({
    onSuccess: () => utils.openHouse.list.invalidate(),
  });

  const sendFollowUpMutation = trpc.openHouse.sendFollowUp.useMutation({
    onSuccess: () => toast("Follow-up sent!"),
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast("Sign-in link copied!");
  };

  // Leads sub-component
  function LeadsPanel({ openHouseId }: { openHouseId: number }) {
    const { data: leads, isLoading } = trpc.openHouse.getLeads.useQuery({ openHouseId });
    const { data: sequences } = trpc.drip.listSequences.useQuery();
    const enrollMutation = trpc.drip.enroll.useMutation({
      onSuccess: (data) => toast(`Enrolled in drip sequence — ${data.enrolled} contact(s) added.`),
      onError: (err) => toast.error("Enroll failed", { description: err.message }),
    });
    type LeadRow = NonNullable<typeof leads>[number];
    const [dripDialog, setDripDialog] = useState<{ lead: LeadRow } | null>(null);
    const [selectedSeqId, setSelectedSeqId] = useState<string>("");

    if (isLoading) return <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>;
    if (!leads?.length) return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No sign-ins yet. Share the QR code at your open house.
      </div>
    );

    return (
      <>
      <div className="divide-y">
        {leads.map((lead) => (
          <div key={lead.id} className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold shrink-0">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{lead.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                  {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                  {lead.timeframe && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lead.timeframe}</span>}
                  {lead.preApproved && <Badge variant="default" className="text-xs h-4">Pre-Approved</Badge>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">{lead.emailsSent || 0} emails sent</Badge>
              {lead.email && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7"
                  onClick={() => sendFollowUpMutation.mutate({ leadId: lead.id, emailNumber: (lead.emailsSent || 0) + 1 })}
                  disabled={sendFollowUpMutation.isPending}
                >
                  <Mail className="w-3 h-3" />
                  Follow Up
                </Button>
              )}
              {lead.crmLeadId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
                  onClick={() => setLocation(`/crm?lead=${lead.crmLeadId}`)}
                >
                  <ExternalLink className="w-3 h-3" />
                  View in CRM
                </Button>
              )}
              {lead.email && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/30"
                  onClick={() => { setDripDialog({ lead }); setSelectedSeqId(""); }}
                >
                  <GitBranch className="w-3 h-3" />
                  Drip
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Drip Enrollment Dialog */}
      {dripDialog && (
        <Dialog open onOpenChange={() => setDripDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-500" />
                Enroll in Drip Sequence
              </DialogTitle>
              <DialogDescription>
                Add <strong>{dripDialog.lead.name}</strong> to an email nurture sequence.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {!sequences?.length ? (
                <p className="text-sm text-muted-foreground">
                  No sequences yet.{" "}
                  <button className="underline text-purple-600" onClick={() => { setDripDialog(null); setLocation("/drip-sequences"); }}>Create one first</button>
                </p>
              ) : (
                <>
                  <Select value={selectedSeqId} onValueChange={setSelectedSeqId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a sequence…" />
                    </SelectTrigger>
                    <SelectContent>
                      {sequences.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setDripDialog(null)}>Cancel</Button>
                    <Button
                      size="sm"
                      disabled={!selectedSeqId || enrollMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        if (!selectedSeqId || !dripDialog.lead.email) return;
                        enrollMutation.mutate({
                          sequenceId: Number(selectedSeqId),
                          contacts: [{ name: dripDialog.lead.name, email: dripDialog.lead.email! }],
                          startImmediately: true,
                        }, { onSuccess: () => setDripDialog(null) });
                      }}
                    >
                      {enrollMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enroll"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Home className="w-5 h-5 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">Open House Manager</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Generate a QR sign-in sheet and auto-send follow-up emails to every visitor.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Open House
        </Button>
      </div>

      {/* Zapier Status Banner */}
      {!openHouseZapierActive && (
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
          openHouseZapierConfigured
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-slate-50 border-slate-200 text-slate-600"
        }`}>
          <Zap className={`h-4 w-4 shrink-0 ${openHouseZapierConfigured ? "text-amber-500" : "text-slate-400"}`} />
          <span className="flex-1">
            {openHouseZapierConfigured
              ? "Zapier webhook is configured but currently disabled. Enable it to auto-send leads to your CRM."
              : "Connect Zapier to automatically send every sign-in to your CRM or email tool."}
          </span>
          <button
            onClick={() => setLocation("/settings/zapier")}
            className={`font-semibold underline underline-offset-2 shrink-0 hover:opacity-80 transition-opacity ${
              openHouseZapierConfigured ? "text-amber-700" : "text-[#FF6A00]"
            }`}
          >
            {openHouseZapierConfigured ? "Re-enable" : "Set Up Zapier"}
          </button>
        </div>
      )}
      {openHouseZapierActive && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="flex-1">Zapier is active — every sign-in will be sent to your connected app automatically.</span>
          <button
            onClick={() => setLocation("/settings/zapier")}
            className="text-emerald-700 font-semibold underline underline-offset-2 shrink-0 hover:opacity-80 transition-opacity"
          >
            Manage
          </button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <Card className="p-6 border-green-500/20 bg-green-500/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Home className="w-4 h-4" />
            Open House Details
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
              <label className="text-sm font-medium mb-1 block">List Price</label>
              <Input
                placeholder="$750,000"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date *</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Start Time</label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">End Time</label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Follow-Up Sequence</label>
              <Select value={form.followUpSequence} onValueChange={(v: any) => setForm({ ...form, followUpSequence: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3email">3-Email Sequence (recommended)</SelectItem>
                  <SelectItem value="5email">5-Email Sequence</SelectItem>
                  <SelectItem value="none">No Follow-Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.address || !form.date}
              className="gap-2"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              Create & Get QR Code
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Open Houses List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !openHouses?.length ? (
        <Card className="p-12 text-center border-dashed">
          <QrCode className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No open houses yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create an open house to get a QR sign-in code and automatic follow-up emails.
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Open House
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {openHouses.map((oh) => {
            const isExpanded = expandedId === oh.id;
            const signInUrl = `https://ampedagent.app/open-house/${(oh as any).publicSlug || oh.id}`;

            return (
              <Card key={oh.id} className="overflow-hidden">
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : oh.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${oh.isActive ? "bg-green-500/10" : "bg-muted"}`}>
                      <Home className={`w-4 h-4 ${oh.isActive ? "text-green-500" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{oh.address}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-muted-foreground">
                        <span>{new Date(oh.date).toLocaleDateString()}</span>
                        {oh.startTime && <span>{oh.startTime}{oh.endTime ? ` – ${oh.endTime}` : ""}</span>}
                        {oh.price && <span>{oh.price}</span>}
                        <Badge variant={oh.isActive ? "default" : "secondary"} className="text-xs h-4">
                          {oh.isActive ? "Active" : "Closed"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs h-7"
                      onClick={(e) => { e.stopPropagation(); copyUrl(signInUrl); }}
                    >
                      <Copy className="w-3 h-3" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs h-7"
                      onClick={(e) => { e.stopPropagation(); setQrDialog({ url: signInUrl, address: oh.address }); }}
                    >
                      <QrCode className="w-3 h-3" />
                      QR Code
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t">
                    <div className="p-4 bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Sign-In List</span>
                      </div>
                      {oh.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => deactivateMutation.mutate({ id: oh.id })}
                        >
                          Close Open House
                        </Button>
                      )}
                    </div>
                    <LeadsPanel openHouseId={oh.id} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={!!qrDialog} onOpenChange={() => setQrDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Open House Sign-In QR Code</DialogTitle>
            <DialogDescription>{qrDialog?.address}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg flex items-center justify-center">
              {qrDialog && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrDialog.url)}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Or share the sign-in link directly:</p>
              <div className="flex gap-2">
                <Input value={qrDialog?.url || ""} readOnly className="text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => qrDialog && copyUrl(qrDialog.url)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Print this QR code and place it at your open house. Visitors scan it to sign in — no app required.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
