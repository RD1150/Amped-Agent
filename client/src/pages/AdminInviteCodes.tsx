import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check, Trash2, Ban, Plus, RefreshCw, Download } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copy code">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

export default function AdminInviteCodes() {
  const [count, setCount] = useState(10);
  const [label, setLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | "">("");

  const { data: codes, refetch, isLoading } = trpc.admin.listInviteCodes.useQuery();
  const generateMutation = trpc.admin.generateInviteCodes.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.codes.length} invite code${data.codes.length > 1 ? "s" : ""}`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const revokeMutation = trpc.admin.revokeInviteCode.useMutation({
    onSuccess: () => { toast.success("Code revoked"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.admin.deleteInviteCode.useMutation({
    onSuccess: () => { toast.success("Code deleted"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      count,
      label: label.trim() || undefined,
      expiresInDays: expiresInDays !== "" ? Number(expiresInDays) : undefined,
    });
  };

  const handleCopyAll = () => {
    if (!codes) return;
    const unused = codes.filter((c) => !c.usedByUserId && !c.isRevoked);
    const text = unused.map((c) => c.code).join("\n");
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${unused.length} unused codes to clipboard`);
  };

  const handleDownloadCSV = () => {
    if (!codes) return;
    const header = "Code,Label,Status,Used By,Used At,Expires At,Created At";
    const rows = codes.map((c) => [
      c.code,
      c.label ?? "",
      c.isRevoked ? "Revoked" : c.usedByUserId ? "Used" : "Available",
      c.usedByEmail ?? c.usedByName ?? "",
      c.usedAt ? new Date(c.usedAt).toLocaleDateString() : "",
      c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never",
      new Date(c.createdAt).toLocaleDateString(),
    ].map((v) => `"${v}"`).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invite-codes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const available = codes?.filter((c) => !c.usedByUserId && !c.isRevoked).length ?? 0;
  const used = codes?.filter((c) => !!c.usedByUserId).length ?? 0;
  const revoked = codes?.filter((c) => c.isRevoked).length ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Beta Invite Codes</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate and manage invite codes for closed beta testers.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-green-500">{available}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-blue-500">{used}</div>
              <div className="text-xs text-muted-foreground">Redeemed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-muted-foreground">{revoked}</div>
              <div className="text-xs text-muted-foreground">Revoked</div>
            </CardContent>
          </Card>
        </div>

        {/* Generate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate New Codes</CardTitle>
            <CardDescription>Create a batch of unique invite codes for beta testers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Number of codes</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>Label (optional)</Label>
                <Input
                  placeholder="e.g. Beta Wave 1"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Expires in days (optional)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  placeholder="Never"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="gap-2">
              <Plus className="h-4 w-4" />
              {generateMutation.isPending ? "Generating..." : `Generate ${count} Code${count !== 1 ? "s" : ""}`}
            </Button>
          </CardContent>
        </Card>

        {/* Code List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">All Invite Codes</CardTitle>
              <CardDescription>{codes?.length ?? 0} total codes</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyAll}>
                <Copy className="h-3.5 w-3.5" /> Copy Unused
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadCSV}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Loading...</div>
            ) : !codes?.length ? (
              <div className="text-sm text-muted-foreground py-8 text-center">No invite codes yet. Generate some above.</div>
            ) : (
              <div className="space-y-2">
                {codes.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${c.isRevoked ? "opacity-50 bg-muted/30" : c.usedByUserId ? "bg-blue-500/5 border-blue-500/20" : "bg-green-500/5 border-green-500/20"}`}
                  >
                    <code className="font-mono text-sm font-semibold tracking-wider flex-shrink-0">{c.code}</code>
                    <CopyButton text={c.code} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground truncate">{c.label}</div>
                      {c.usedByEmail && (
                        <div className="text-xs text-blue-400 truncate">{c.usedByName ?? c.usedByEmail}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {c.expiresAt && (
                        <span className="text-xs text-muted-foreground">
                          exp {new Date(c.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                      {c.isRevoked ? (
                        <Badge variant="secondary" className="text-xs">Revoked</Badge>
                      ) : c.usedByUserId ? (
                        <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Used {c.usedAt ? new Date(c.usedAt).toLocaleDateString() : ""}
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Available</Badge>
                      )}
                      {!c.isRevoked && !c.usedByUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-amber-500 hover:text-amber-400"
                          onClick={() => revokeMutation.mutate({ id: c.id })}
                          title="Revoke"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ id: c.id })}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
