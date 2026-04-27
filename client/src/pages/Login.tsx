import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Gift, Ticket, CheckCircle2, XCircle } from "lucide-react";

export default function Login() {
  // Read ?ref=, ?tab=, and ?invite= from URL
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get("ref") || "";
  const urlInviteCode = params.get("invite") || "";
  const defaultTab = params.get("tab") === "register" ? "register" : "signin";

  useEffect(() => {
    if (params.get("error") === "google_failed") {
      toast.error("Google sign-in failed. Please try again or use email/password.");
    }
  }, []);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // Beta agreement checkbox
  const [agreedToBeta, setAgreedToBeta] = useState(false);

  // Invite code state
  const [inviteCode, setInviteCode] = useState(urlInviteCode);
  const [inviteValidating, setInviteValidating] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "valid" | "invalid">(
    urlInviteCode ? "idle" : "idle"
  );
  const [inviteLabel, setInviteLabel] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    // Pass ref code through state param so callback can apply it
    const state = refCode ? `ref_${refCode}` : undefined;
    const url = state ? `/api/auth/google?state=${encodeURIComponent(state)}` : "/api/auth/google";
    window.location.href = url;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) return;
    setSignInLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid email or password.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSignInLoading(false);
    }
  };

  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setInviteStatus("idle");
      setInviteLabel(null);
      return;
    }
    setInviteValidating(true);
    try {
      const res = await fetch("/api/auth/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setInviteStatus("valid");
        setInviteLabel(data.label || null);
      } else {
        setInviteStatus("invalid");
        setInviteLabel(null);
      }
    } catch {
      setInviteStatus("idle");
    } finally {
      setInviteValidating(false);
    }
  };

  const handleInviteCodeBlur = () => {
    if (inviteCode.trim()) {
      validateInviteCode(inviteCode);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regConfirm) return;
    if (regPassword !== regConfirm) {
      toast.error("Passwords don't match. Please make sure both passwords are identical.");
      return;
    }
    if (regPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          referralCode: refCode || undefined,
          inviteCode: inviteCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong.");
        return;
      }
      if (data.inviteCodeApplied) {
        toast.success("🎉 Beta invite code accepted — you have full Authority access!");
      } else if (data.referralApplied) {
        toast.success("🎁 Bonus credits added — welcome gift from your referral!");
      }
      window.location.href = "/dashboard";
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Amped<span className="text-primary"> Agent</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">AI-Powered Real Estate Authority Platform</p>
          </a>
        </div>

        {/* Referral bonus banner */}
        {refCode && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            <Gift size={16} className="shrink-0" />
            <span>You were invited! Create an account to receive <strong>bonus credits</strong>.</span>
          </div>
        )}

        {/* Beta invite banner (from URL param) */}
        {urlInviteCode && !refCode && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            <Ticket size={16} className="shrink-0" />
            <span>You have a <strong>beta invite code</strong>! Create an account to unlock full Authority access.</span>
          </div>
        )}

        <Card className="border-border/50 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full h-11 gap-3 bg-background hover:bg-muted/50"
              onClick={handleGoogleLogin}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Email/Password Tabs */}
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="mt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                      >
                        {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <a
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={signInLoading}>
                    {signInLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Jane Smith"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showRegPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm">Confirm Password</Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  {/* Beta Invite Code field */}
                  <div className="space-y-2">
                    <Label htmlFor="reg-invite" className="flex items-center gap-1.5">
                      <Ticket size={13} className="text-amber-500" />
                      Beta Invite Code
                      <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="reg-invite"
                        type="text"
                        placeholder="XXXX-XXXX"
                        value={inviteCode}
                        onChange={(e) => {
                          setInviteCode(e.target.value.toUpperCase());
                          setInviteStatus("idle");
                          setInviteLabel(null);
                        }}
                        onBlur={handleInviteCodeBlur}
                        autoComplete="off"
                        className={`pr-10 font-mono tracking-widest ${
                          inviteStatus === "valid"
                            ? "border-green-500 focus-visible:ring-green-500/30"
                            : inviteStatus === "invalid"
                            ? "border-red-500 focus-visible:ring-red-500/30"
                            : ""
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {inviteValidating && <Loader2 size={15} className="animate-spin text-muted-foreground" />}
                        {!inviteValidating && inviteStatus === "valid" && <CheckCircle2 size={15} className="text-green-500" />}
                        {!inviteValidating && inviteStatus === "invalid" && <XCircle size={15} className="text-red-500" />}
                      </div>
                    </div>
                    {inviteStatus === "valid" && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        Valid beta invite{inviteLabel ? ` — ${inviteLabel}` : ""}! You'll get full Authority access.
                      </p>
                    )}
                    {inviteStatus === "invalid" && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle size={11} />
                        Invalid, expired, or already used invite code.
                      </p>
                    )}
                  </div>

                  {/* Beta Tester Agreement checkbox */}
                  <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                    <Checkbox
                      id="reg-beta-agree"
                      checked={agreedToBeta}
                      onCheckedChange={(v) => setAgreedToBeta(!!v)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="reg-beta-agree"
                      className="text-xs leading-snug cursor-pointer text-muted-foreground"
                    >
                      I agree to the{" "}
                      <a
                        href="/terms-of-service"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80"
                      >
                        Beta Tester Agreement &amp; Terms of Service
                      </a>
                      , including confidentiality, no reverse-engineering, and feedback ownership clauses.
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={regLoading || !agreedToBeta}>
                    {regLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
