import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Palette, LogOut, Mic, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const VOICE_OPTIONS = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", desc: "Professional Female", tag: "Popular" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam",   desc: "Professional Male",   tag: "" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella",  desc: "Warm Female",         tag: "" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh",   desc: "Authoritative Male",  tag: "" },
];

const STYLE_OPTIONS = [
  { value: "professional" as const, label: "Professional", desc: "Authoritative & polished" },
  { value: "warm"         as const, label: "Warm",         desc: "Friendly & welcoming" },
  { value: "luxury"       as const, label: "Luxury",       desc: "Elegant & exclusive" },
  { value: "casual"       as const, label: "Casual",       desc: "Relaxed & conversational" },
];

export default function Settings() {
  const { user, logout } = useAuth();

  // Voice preference state
  const [selectedVoiceId, setSelectedVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [selectedStyle, setSelectedStyle] = useState<"professional" | "warm" | "luxury" | "casual">("professional");
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const { data: voicePref } = trpc.auth.getVoicePreference.useQuery();
  const saveVoicePref = trpc.auth.saveVoicePreference.useMutation();
  const previewVoice = trpc.propertyTours.previewVoice.useMutation();

  // Load saved preferences
  useEffect(() => {
    if (voicePref) {
      setSelectedVoiceId(voicePref.voiceId);
      setSelectedStyle(voicePref.voiceoverStyle);
    }
  }, [voicePref]);

  const handleSaveVoicePreference = async () => {
    try {
      await saveVoicePref.mutateAsync({ voiceId: selectedVoiceId, voiceoverStyle: selectedStyle });
      toast.success("Voice preferences saved — they'll auto-populate in Property Tours and AutoReels.");
    } catch {
      toast.error("Failed to save voice preferences. Please try again.");
    }
  };

  const handleVoicePreview = async (vId: string) => {
    if (previewingVoiceId === vId) return;
    setPreviewingVoiceId(vId);
    try {
      const result = await previewVoice.mutateAsync({ voiceId: vId });
      const audio = new Audio(result.url);
      audio.play().catch(() => {});
    } catch {
      toast.error("Could not load voice preview. Please try again.");
    } finally {
      setPreviewingVoiceId(null);
    }
  };

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={user?.name || ""}
                disabled
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Profile information is managed through your authentication provider.
          </p>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates about your scheduled posts</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Post Reminders</p>
              <p className="text-sm text-muted-foreground">Get reminded before scheduled posts go live</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Summary</p>
              <p className="text-sm text-muted-foreground">Receive a weekly content performance summary</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
            </div>
            <Switch defaultChecked disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            Authority Content uses a premium dark theme by default.
          </p>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Manage your data and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data Analytics</p>
              <p className="text-sm text-muted-foreground">Allow anonymous usage analytics</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium">Export Data</p>
            <p className="text-sm text-muted-foreground">Download all your content and settings</p>
            <Button variant="outline" size="sm">
              Export All Data
            </Button>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium text-destructive">Danger Zone</p>
            <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voiceover Preferences */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voiceover Preferences
          </CardTitle>
          <CardDescription>
            Your default AI voice and narration style for Property Tours and AutoReels. These will auto-populate whenever you enable voiceover.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Narration Style */}
          <div>
            <Label className="text-sm font-medium">Narration Style</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSelectedStyle(s.value)}
                  className={`text-left p-2.5 rounded-md border text-xs transition-colors ${
                    selectedStyle === s.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold">{s.label}</div>
                  <div className="text-muted-foreground">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Voice Selection */}
          <div>
            <Label className="text-sm font-medium">Preferred Voice</Label>
            <div className="space-y-2 mt-2">
              {VOICE_OPTIONS.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVoiceId(v.id)}
                  className={`flex items-center justify-between p-2.5 rounded-md border cursor-pointer transition-colors ${
                    selectedVoiceId === v.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                      selectedVoiceId === v.id ? "border-primary bg-primary" : "border-muted-foreground"
                    }`} />
                    <div>
                      <span className="text-sm font-medium">{v.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">{v.desc}</span>
                      {v.tag && (
                        <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">{v.tag}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleVoicePreview(v.id); }}
                    disabled={previewingVoiceId === v.id}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary border border-border hover:border-primary/50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    {previewingVoiceId === v.id ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Loading...</>
                    ) : (
                      <><Play className="w-3 h-3" /> Preview</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSaveVoicePreference}
            disabled={saveVoicePref.isPending}
            className="w-full"
          >
            {saveVoicePref.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              "Save Voice Preferences"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">Sign out of your Authority Content account</p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
