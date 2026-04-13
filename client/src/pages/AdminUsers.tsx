import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Users, ChevronLeft, ChevronRight, Download, Mail, LogIn, AlertTriangle } from "lucide-react";
import { COOKIE_NAME } from "@shared/const";

const TIER_COLORS: Record<string, string> = {
  starter: "bg-gray-100 text-gray-700",
  pro: "bg-primary/10 text-primary",
  agency: "bg-primary/10 text-primary",
  premium: "bg-primary/10 text-primary",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  trialing: "bg-primary/10 text-primary/80",
  past_due: "bg-red-100 text-red-700",
  canceled: "bg-gray-100 text-gray-500",
  inactive: "bg-gray-100 text-gray-500",
};

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(date: Date | string | null | undefined) {
  if (!date) return "Never";
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Impersonate state
  const [impersonateTarget, setImpersonateTarget] = useState<{ id: number; name: string | null; email: string | null } | null>(null);
  const [impersonateConfirmOpen, setImpersonateConfirmOpen] = useState(false);

  // Email blast state
  const [blastOpen, setBlastOpen] = useState(false);
  const [blastSubject, setBlastSubject] = useState("");
  const [blastMessage, setBlastMessage] = useState("");
  const [blastTier, setBlastTier] = useState<"all" | "starter" | "pro" | "authority">("all");

  // Redirect if not admin
  if (user && user.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const { data, isLoading } = trpc.admin.getAllUsers.useQuery(
    { page, limit: 50 },
    { enabled: !!user && user.role === "admin" }
  );

  const { data: exportData } = trpc.admin.exportUsers.useQuery(undefined, {
    enabled: false,
  });

  const impersonateMutation = trpc.admin.impersonateUser.useMutation({
    onSuccess: (result) => {
      // Set the session cookie to the impersonation token
      document.cookie = `${COOKIE_NAME}=${result.sessionToken}; path=/; max-age=${60 * 60 * 4}`;
      toast.success(`Now viewing as ${result.user.name ?? result.user.email}. Refresh to apply.`);
      setImpersonateConfirmOpen(false);
      // Reload to apply new session
      setTimeout(() => window.location.href = "/dashboard", 800);
    },
    onError: (err) => {
      toast.error(err.message);
      setImpersonateConfirmOpen(false);
    },
  });

  const blastMutation = trpc.admin.emailBlast.useMutation({
    onSuccess: (result) => {
      toast.success(`Notification sent to ${result.sent} user${result.sent !== 1 ? "s" : ""}.`);
      setBlastOpen(false);
      setBlastSubject("");
      setBlastMessage("");
      setBlastTier("all");
    },
    onError: (err) => toast.error(err.message),
  });

  const utils = trpc.useUtils();

  const handleExportCSV = async () => {
    toast.info("Preparing CSV export...");
    const result = await utils.admin.exportUsers.fetch();
    if (!result?.users?.length) {
      toast.error("No users to export.");
      return;
    }
    const headers = ["ID", "Name", "Email", "Role", "Tier", "Status", "Trial Ends", "Signed Up", "Last Active", "Login Method"];
    const rows = result.users.map((u) => [
      u.id,
      u.name ?? "",
      u.email ?? "",
      u.role ?? "",
      u.subscriptionTier ?? "",
      u.subscriptionStatus ?? "",
      (u as any).trialEndsAt ? new Date((u as any).trialEndsAt).toISOString() : "",
      u.createdAt ? new Date(u.createdAt).toISOString() : "",
      u.lastSignedIn ? new Date(u.lastSignedIn).toISOString() : "",
      u.loginMethod ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ampedagent-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${result.users.length} users.`);
  };

  const filteredUsers = (data?.users ?? []).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 50);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Registered Users
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {data?.total ?? 0} total users
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput); }}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setSearch(searchInput)}>
              Search
            </Button>
            {search && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setSearchInput(""); }}>
                Clear
              </Button>
            )}
            {/* Export CSV */}
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            {/* Email Blast */}
            <Button variant="default" size="sm" onClick={() => setBlastOpen(true)} className="gap-1.5">
              <Mail className="h-4 w-4" />
              Email Blast
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total", value: data?.total ?? 0, color: "text-foreground" },
            { label: "Active Subs", value: (data?.users ?? []).filter(u => u.subscriptionStatus === "active").length, color: "text-primary" },
            { label: "Trialing", value: (data?.users ?? []).filter(u => u.subscriptionStatus === "trialing").length, color: "text-primary/70" },
            { label: "Admins", value: (data?.users ?? []).filter(u => u.role === "admin").length, color: "text-primary" },
          ].map((stat) => (
            <Card key={stat.label} className="border border-border/50">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {search ? `Results for "${search}" (${filteredUsers.length})` : `All Users (page ${page} of ${totalPages || 1})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tier</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trial Ends</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Signed Up</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Active</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Login</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <tr
                        key={u.id}
                        className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {(u.name ?? "?")[0]?.toUpperCase()}
                            </div>
                            <span>{u.name ?? "—"}</span>
                            {u.role === "admin" && (
                              <Badge className="text-xs bg-primary/10 text-primary border-0 py-0">admin</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[u.subscriptionTier ?? "starter"] ?? TIER_COLORS.starter}`}>
                            {u.subscriptionTier ?? "starter"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.subscriptionStatus ?? "inactive"] ?? STATUS_COLORS.inactive}`}>
                            {u.subscriptionStatus ?? "inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {(u as any).trialEndsAt ? (
                            <span className={`text-xs ${
                              new Date((u as any).trialEndsAt) < new Date()
                                ? 'text-red-500'
                                : new Date((u as any).trialEndsAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
                                  ? 'text-amber-500 font-medium'
                                  : 'text-muted-foreground'
                            }`}>
                              {new Date((u as any).trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{timeAgo(u.lastSignedIn)}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{u.loginMethod ?? "—"}</td>
                        <td className="px-4 py-3">
                          {u.role !== "admin" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs h-7"
                              onClick={() => {
                                setImpersonateTarget({ id: u.id, name: u.name, email: u.email });
                                setImpersonateConfirmOpen(true);
                              }}
                            >
                              <LogIn className="h-3 w-3" />
                              Impersonate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!search && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Impersonate Confirmation Dialog */}
      <Dialog open={impersonateConfirmOpen} onOpenChange={setImpersonateConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <AlertTriangle className="h-5 w-5" />
              Impersonate User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              You are about to log in as:
            </p>
            <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm">
              <p className="font-semibold text-foreground">{impersonateTarget?.name ?? "—"}</p>
              <p className="text-muted-foreground">{impersonateTarget?.email ?? "—"}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              A 4-hour session will be created. You will be redirected to their dashboard. To return to your admin account, log out and sign back in.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImpersonateConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-primary hover:bg-primary"
              disabled={impersonateMutation.isPending}
              onClick={() => impersonateTarget && impersonateMutation.mutate({ userId: impersonateTarget.id })}
            >
              {impersonateMutation.isPending ? "Switching..." : "Confirm & Switch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Blast Dialog */}
      <Dialog open={blastOpen} onOpenChange={setBlastOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Send Email Blast
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Send to</label>
              <Select value={blastTier} onValueChange={(v) => setBlastTier(v as typeof blastTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="starter">Starter tier only</SelectItem>
                  <SelectItem value="pro">Pro tier only</SelectItem>
                  <SelectItem value="authority">Authority tier only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="e.g. New feature announcement"
                value={blastSubject}
                onChange={(e) => setBlastSubject(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Write your message here..."
                value={blastMessage}
                onChange={(e) => setBlastMessage(e.target.value)}
                rows={6}
                maxLength={5000}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{blastMessage.length}/5000</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBlastOpen(false)}>Cancel</Button>
            <Button
              disabled={!blastSubject.trim() || !blastMessage.trim() || blastMutation.isPending}
              onClick={() => blastMutation.mutate({ subject: blastSubject, message: blastMessage, tier: blastTier })}
            >
              {blastMutation.isPending ? "Sending..." : "Send Blast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
