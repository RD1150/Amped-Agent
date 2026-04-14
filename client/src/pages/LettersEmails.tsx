import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Search,
  Mail,
  FileText,
  Copy,
  Download,
  ChevronDown,
  ChevronRight,
  Star,
  Clock,
  Sparkles,
  X,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LetterCategory } from "../../../shared/letterTemplates";

// ─── Category groups for the sidebar ─────────────────────────────────────────
const CATEGORY_GROUPS: { label: string; categories: LetterCategory[] }[] = [
  {
    label: "Email Series / Drips",
    categories: [
      "Buyer Drip",
      "Seller Drip",
      "Post-Closing",
      "Expired Listing",
      "FSBO",
      "Open House",
      "New Listing",
      "Just Sold",
      "Sphere of Influence",
      "Recruiting",
    ],
  },
  {
    label: "General Topics",
    categories: [
      "Market Update",
      "First-Time Buyer",
      "Investor",
      "Renter to Owner",
    ],
  },
  {
    label: "Holiday & Events",
    categories: ["Holiday & Events"],
  },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Category pill colors ─────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  "Holiday & Events": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Buyer Drip": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Seller Drip": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Post-Closing": "bg-green-500/20 text-green-400 border-green-500/30",
  "Expired Listing": "bg-red-500/20 text-red-400 border-red-500/30",
  "FSBO": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Open House": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "New Listing": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Just Sold": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Sphere of Influence": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Market Update": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "First-Time Buyer": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Investor": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "Renter to Owner": "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "Recruiting": "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export default function LettersEmails() {
  // ─── Filter state ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "email" | "letter">("all");
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Email Series / Drips": true,
    "General Topics": true,
    "Holiday & Events": true,
  });

  // ─── Modal state ────────────────────────────────────────────────────────────
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [copied, setCopied] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────────
  const { data, isLoading } = trpc.lettersEmails.getTemplates.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    type: selectedType,
    month: selectedMonth,
    search: search || undefined,
  });

  const { data: personalizedData, isLoading: isPersonalizing } =
    trpc.lettersEmails.getPersonalized.useQuery(
      { templateId: selectedTemplateId!, recipientFirstName: recipientName || undefined },
      { enabled: !!selectedTemplateId }
    );

  useEffect(() => {
    if (personalizedData) {
      setEditedBody(personalizedData.personalizedBody);
    }
  }, [personalizedData?.id]);

  const saveUsedMutation = trpc.lettersEmails.saveUsed.useMutation();
  const { data: savedLetters } = trpc.lettersEmails.getSaved.useQuery();

  // ─── Derived state ──────────────────────────────────────────────────────────
  const templates = data?.templates ?? [];
  const totalCount = data?.total ?? 0;

  const recentlyUsedIds = useMemo(
    () => new Set((savedLetters ?? []).slice(0, 5).map((l) => l.letterType)),
    [savedLetters]
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────
  function toggleGroup(label: string) {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function selectCategory(cat: string) {
    setSelectedCategory(cat);
    setSelectedMonth(undefined);
  }

  function openTemplate(id: string) {
    setSelectedTemplateId(id);
    setRecipientName("");
    setEditedBody("");
    setCopied(false);
  }

  function closeModal() {
    setSelectedTemplateId(null);
    setEditedBody("");
    setCopied(false);
  }

  async function handleCopy() {
    const text = `Subject: ${personalizedData?.subject ?? ""}\n\n${editedBody}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    // Save usage
    if (personalizedData) {
      saveUsedMutation.mutate({
        templateId: personalizedData.id,
        templateTitle: personalizedData.title,
        templateCategory: personalizedData.category,
        content: editedBody,
        recipientName: recipientName || undefined,
      });
    }
    toast.success("Copied to clipboard! Paste it into your email client.");
  }

  function handleDownload() {
    if (!personalizedData) return;
    const text = `Subject: ${personalizedData.subject}\n\n${editedBody}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${personalizedData.title.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded! Letter saved as a text file.");
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">Letters & Emails</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{totalCount} templates</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {/* All */}
            <button
              onClick={() => { selectCategory("all"); setSelectedType("all"); }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                selectedCategory === "all" && !selectedMonth
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span>All Templates</span>
              <span className="text-xs">{data?.total ?? 0}</span>
            </button>

            {/* Type filter */}
            <div className="pt-2 pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                Type
              </p>
              {(["all", "email", "letter"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2",
                    selectedType === t
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {t === "email" ? <Mail className="w-3.5 h-3.5" /> : t === "letter" ? <FileText className="w-3.5 h-3.5" /> : null}
                  <span className="capitalize">{t === "all" ? "All Types" : t === "email" ? "Emails" : "Letters"}</span>
                </button>
              ))}
            </div>

            <Separator className="my-2" />

            {/* Category groups */}
            {CATEGORY_GROUPS.map((group) => (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full text-left px-3 py-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  <span>{group.label}</span>
                  {expandedGroups[group.label] ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>

                {expandedGroups[group.label] && (
                  <div className="space-y-0.5 mt-0.5">
                    {group.categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => selectCategory(cat)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                          selectedCategory === cat
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Month filter (only for Holiday & Events) */}
            {selectedCategory === "Holiday & Events" && (
              <>
                <Separator className="my-2" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                    Month
                  </p>
                  {MONTHS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMonth(selectedMonth === m ? undefined : m)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                        selectedMonth === m
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="email" className="text-xs px-3">
                <Mail className="w-3.5 h-3.5 mr-1" />Emails
              </TabsTrigger>
              <TabsTrigger value="letter" className="text-xs px-3">
                <FileText className="w-3.5 h-3.5 mr-1" />Letters
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {totalCount} found
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Recently used strip */}
            {savedLetters && savedLetters.length > 0 && selectedCategory === "all" && !search && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Recently Used
                  </h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {savedLetters.slice(0, 5).map((letter) => (
                    <button
                      key={letter.id}
                      onClick={() => openTemplate(letter.letterType)}
                      className="px-3 py-1.5 rounded-full border border-border bg-muted/30 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
                    >
                      <Star className="w-3 h-3 text-amber-400" />
                      {letter.letterLabel}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Section heading */}
            {selectedCategory !== "all" && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">{selectedCategory}</h2>
                {selectedMonth && (
                  <p className="text-sm text-muted-foreground">{selectedMonth}</p>
                )}
              </div>
            )}

            {/* Holiday grouping by month */}
            {selectedCategory === "Holiday & Events" && !selectedMonth ? (
              <div className="space-y-8">
                {MONTHS.map((month) => {
                  const monthTemplates = templates.filter((t) => t.month === month);
                  if (monthTemplates.length === 0) return null;
                  return (
                    <div key={month}>
                      <h3 className="text-base font-semibold text-foreground mb-3 border-b border-border pb-2">
                        {month}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {monthTemplates.map((t) => (
                          <TemplateCard
                            key={t.id}
                            template={t}
                            isRecent={recentlyUsedIds.has(t.id)}
                            onClick={() => openTemplate(t.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Standard grid */
              <div>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-40 rounded-lg bg-muted/30 animate-pulse" />
                    ))}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Mail className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No templates found.</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Try a different category or search term.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {templates.map((t) => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        isRecent={recentlyUsedIds.has(t.id)}
                        onClick={() => openTemplate(t.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Personalization modal ─────────────────────────────────────────────── */}
      <Dialog open={!!selectedTemplateId} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {personalizedData?.title ?? "Loading..."}
                </DialogTitle>
                {personalizedData && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn("text-xs border", CATEGORY_COLORS[personalizedData.category] ?? "")}>
                      {personalizedData.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {personalizedData.type}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            {isPersonalizing ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted/40 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted/40 rounded animate-pulse" />
                <div className="h-4 bg-muted/40 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-muted/40 rounded animate-pulse w-2/3" />
              </div>
            ) : personalizedData ? (
              <div className="space-y-4">
                {/* Subject line */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Subject Line</Label>
                  <div className="mt-1 px-3 py-2 rounded-md bg-muted/30 border border-border text-sm font-medium">
                    {personalizedData.subject}
                  </div>
                </div>

                {/* Recipient name */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Recipient First Name <span className="text-muted-foreground/50">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g. Sarah"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Personalizes the greeting with their name.
                  </p>
                </div>

                {/* Editable body */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Letter Body
                    </Label>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      Auto-personalized with your profile
                    </span>
                  </div>
                  <Textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={14}
                    className="font-mono text-sm resize-none"
                  />
                </div>

                {/* Agent info used */}
                <div className="rounded-md bg-muted/20 border border-border px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                  <p className="font-medium text-foreground mb-1">Personalized with your info:</p>
                  <p>Agent: {personalizedData.agentName}</p>
                  {personalizedData.brokerage && <p>Brokerage: {personalizedData.brokerage}</p>}
                  {personalizedData.city && <p>City: {personalizedData.city}</p>}
                  {personalizedData.phone && <p>Phone: {personalizedData.phone}</p>}
                  {personalizedData.agentEmail && <p>Email: {personalizedData.agentEmail}</p>}
                </div>
              </div>
            ) : null}
          </ScrollArea>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={closeModal}>
              <X className="w-4 h-4 mr-1" /> Close
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!personalizedData}>
                <Download className="w-4 h-4 mr-1.5" />
                Download
              </Button>
              <Button size="sm" onClick={handleCopy} disabled={!personalizedData || copied}>
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Template card component ──────────────────────────────────────────────────
function TemplateCard({
  template,
  isRecent,
  onClick,
}: {
  template: {
    id: string;
    title: string;
    subject: string;
    category: string;
    type: string;
    month?: string;
    date?: string;
    tags?: string[];
  };
  isRecent: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200 group bg-card border-border"
      onClick={onClick}
    >
      {/* Card header — dark band like the reference */}
      <div className="rounded-t-lg bg-[#2d3748] px-4 py-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium leading-snug line-clamp-2">
            {template.title}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {template.date && (
            <span className="text-xs text-slate-300 whitespace-nowrap">{template.date}</span>
          )}
          {template.type === "email" ? (
            <Mail className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>

      <CardContent className="px-4 py-3">
        <div className="flex items-start gap-1.5 mb-2">
          <span className="text-xs font-semibold text-muted-foreground shrink-0">Subject:</span>
          <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
            {template.subject}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] border px-1.5 py-0 h-5",
              CATEGORY_COLORS[template.category] ?? "bg-muted/30 text-muted-foreground"
            )}
          >
            {template.category}
          </Badge>
          <div className="flex items-center gap-1">
            {isRecent && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
            <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Use this →
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
