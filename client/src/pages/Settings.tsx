import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Palette, LogOut, Mic, Play, Loader2, Trash2, CheckCircle, AlertCircle, Square, Upload, Video, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRef } from "react";
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

/**
 * OwnerPromoteCard — only shown to the platform owner who doesn't yet have admin role.
 * Lets them claim admin without needing direct DB access.
 */
function OwnerPromoteCard() {
  const utils = trpc.useUtils();
  const selfPromote = trpc.owner.selfPromoteToAdmin.useMutation({
    onSuccess: (res) => {
      if (res.alreadyAdmin) {
        toast.info("You already have admin access.");
      } else {
        toast.success("Admin access granted! Reload to apply.", {
          action: { label: "Reload", onClick: () => window.location.reload() },
          duration: 8000,
        });
      }
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card className="bg-card border-amber-500/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              Claim Admin Access
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              You are the platform owner. Click to promote your account to admin.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
            disabled={selfPromote.isPending}
            onClick={() => selfPromote.mutate()}
          >
            {selfPromote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim Admin"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();

  // Voice preference state
  const [selectedVoiceId, setSelectedVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [selectedStyle, setSelectedStyle] = useState<"professional" | "warm" | "luxury" | "casual">("professional");
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const { data: voicePref } = trpc.auth.getVoicePreference.useQuery();
  const saveVoicePref = trpc.auth.saveVoicePreference.useMutation();
  const previewVoice = trpc.propertyTours.previewVoice.useMutation();

  // My Avatar state
  const { data: currentUser, refetch: refetchUser } = trpc.auth.me.useQuery();
  const updateAvatarImageMutation = trpc.auth.updateAvatarImage.useMutation();
  const updateAvatarVideoMutation = trpc.auth.updateAvatarVideo.useMutation();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Compute days until avatar video expires (90-day D-ID limit)
  const avatarVideoAgeDays = currentUser?.avatarVideoSavedAt
    ? Math.floor((Date.now() - new Date(currentUser.avatarVideoSavedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const avatarVideoExpiringSoon = avatarVideoAgeDays !== null && avatarVideoAgeDays >= 75;
  const avatarVideoExpired = avatarVideoAgeDays !== null && avatarVideoAgeDays >= 90;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be less than 10MB'); return; }
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      await updateAvatarImageMutation.mutateAsync({ avatarImageUrl: url });
      await refetchUser();
      toast.success('Avatar image updated!');
    } catch {
      toast.error('Failed to upload avatar image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleClearAvatarVideo = async () => {
    // Clear the video URL by setting it to a placeholder then clearing — use updateAvatarVideo with a blank approach
    // We'll just clear locally and let user regenerate in AI Reels
    toast.info('Go to AI Reels to generate a new avatar intro video.');
  };

  // Voice cloning state
  const { data: clonedVoice, refetch: refetchClonedVoice } = trpc.auth.getClonedVoice.useQuery();
  const cloneVoiceMutation = trpc.auth.cloneAgentVoice.useMutation();
  const deleteClonedVoiceMutation = trpc.auth.deleteClonedVoice.useMutation();

  // Avatar Library
  const [showAddAvatar, setShowAddAvatar] = useState(false);
  const [newAvatarId, setNewAvatarId] = useState("");
  const [newAvatarNickname, setNewAvatarNickname] = useState("");
  const [editingNicknameId, setEditingNicknameId] = useState<number | null>(null);
  const [editingNicknameValue, setEditingNicknameValue] = useState("");
  const [lastAddedThumbnail, setLastAddedThumbnail] = useState<string | null>(null);
  const [testingAvatarId, setTestingAvatarId] = useState<number | null>(null);
  const [testAvatarVideoUrl, setTestAvatarVideoUrl] = useState<string | null>(null);

  const testAvatarMutation = trpc.fullAvatarVideo.testAvatar.useMutation({
    onSuccess: (data) => {
      setTestAvatarVideoUrl(data.videoUrl);
      toast.success("Test clip ready! Scroll down to preview it.");
    },
    onError: (e) => {
      setTestingAvatarId(null);
      toast.error(`Test failed: ${e.message}`);
    },
    onSettled: () => setTestingAvatarId(null),
  });

  const { data: avatarList, refetch: refetchAvatars } = trpc.fullAvatarVideo.listAvatars.useQuery();
  const addAvatarMutation = trpc.fullAvatarVideo.addAvatar.useMutation({
    onSuccess: (data) => {
      if (data.thumbnailUrl) {
        setLastAddedThumbnail(data.thumbnailUrl);
        toast.success("Avatar added — thumbnail found!");
      } else {
        setLastAddedThumbnail(null);
        toast.success("Avatar added to your library.");
      }
      setNewAvatarId("");
      setNewAvatarNickname("");
      setShowAddAvatar(false);
      refetchAvatars();
    },
    onError: (e) => toast.error(`Failed to add avatar: ${e.message}`),
  });
  const setDefaultAvatarMutation = trpc.fullAvatarVideo.setDefaultAvatar.useMutation({
    onSuccess: () => { toast.success("Default avatar updated."); refetchAvatars(); },
    onError: (e) => toast.error(`Failed to set default: ${e.message}`),
  });
  const updateNicknameMutation = trpc.fullAvatarVideo.updateAvatarNickname.useMutation({
    onSuccess: () => { toast.success("Nickname saved."); setEditingNicknameId(null); refetchAvatars(); },
    onError: (e) => toast.error(`Failed to save nickname: ${e.message}`),
  });
  const deleteAvatarByIdMutation = trpc.fullAvatarVideo.deleteAvatarById.useMutation({
    onSuccess: () => { toast.success("Avatar removed."); refetchAvatars(); },
    onError: (e) => toast.error(`Failed to remove avatar: ${e.message}`),
  });
  // Legacy single-avatar update (kept for backward compat)
  const resetOnboardingMutation = trpc.auth.resetOnboarding.useMutation({
    onSuccess: () => toast.success("Welcome tour reset!", {
      description: "Reload the page to see the welcome modal.",
      action: {
        label: "Reload now",
        onClick: () => window.location.reload(),
      },
      duration: 8000,
    }),
    onError: () => toast.error("Failed to reset tour."),
  });

  const setAvatarIdMutation = trpc.fullAvatarVideo.setAvatarId.useMutation({
    onSuccess: () => { toast.success("Avatar ID updated successfully."); refetchAvatars(); },
    onError: (e) => toast.error(`Failed to update avatar ID: ${e.message}`),
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [isCloningVoice, setIsCloningVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone access in your browser.");
    }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const handleCloneVoice = async () => {
    if (!recordedBlob) { toast.error("Please record a voice sample first."); return; }
    if (recordingSeconds < 15) { toast.error("Recording must be at least 15 seconds for best results."); return; }
    setIsUploadingRecording(true);
    try {
      // Upload to S3 via the existing upload endpoint
      const formData = new FormData();
      formData.append("file", recordedBlob, "voice-sample.webm");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url: audioUrl } = await uploadRes.json();
      setIsUploadingRecording(false);
      setIsCloningVoice(true);
      const result = await cloneVoiceMutation.mutateAsync({ audioUrl });
      await refetchClonedVoice();
      // Auto-set as preferred voice
      setSelectedVoiceId(result.voiceId);
      await saveVoicePref.mutateAsync({ voiceId: result.voiceId, voiceoverStyle: selectedStyle });
      toast.success(`Your voice "${result.voiceName}" has been cloned and set as your default voice!`);
      setRecordedBlob(null);
      setRecordedUrl(null);
      setRecordingSeconds(0);
    } catch (err: any) {
      toast.error(err.message || "Voice cloning failed. Please try again.");
    } finally {
      setIsUploadingRecording(false);
      setIsCloningVoice(false);
    }
  };

  const handleDeleteClonedVoice = async () => {
    try {
      await deleteClonedVoiceMutation.mutateAsync();
      await refetchClonedVoice();
      // Reset preferred voice to Rachel
      setSelectedVoiceId("21m00Tcm4TlvDq8ikWAM");
      toast.success("Cloned voice deleted. Preferred voice reset to Rachel.");
    } catch {
      toast.error("Failed to delete cloned voice.");
    }
  };

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

  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 flex items-center gap-2"
          onClick={() => setLocation("/authority-profile")}
        >
          <User className="h-4 w-4" />
          Authority Profile
        </Button>
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
            Amped Agent uses a premium dark theme by default.
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

      {/* Voice Cloning */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-violet-500" />
            Clone Your Voice
          </CardTitle>
          <CardDescription>
            Record 30–60 seconds of your natural speaking voice. Our AI will clone it and use it as your default narration voice across all videos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing cloned voice status */}
          {clonedVoice?.clonedVoiceId && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{clonedVoice.clonedVoiceName}</p>
                  <p className="text-xs text-muted-foreground">Active cloned voice · auto-selected in all videos</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDeleteClonedVoice}
                disabled={deleteClonedVoiceMutation.isPending}
              >
                {deleteClonedVoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {/* Recording tips */}
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3">
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">Tips for best results:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• Record in a quiet room with minimal background noise</li>
              <li>• Speak naturally at your normal pace — no need to perform</li>
              <li>• Aim for 30–60 seconds (minimum 15s required)</li>
              <li>• Read a property description or market update aloud</li>
            </ul>
          </div>

          {/* Recorder */}
          <div className="flex flex-col items-center gap-4">
            {!recordedUrl ? (
              <Button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                variant={isRecording ? "destructive" : "outline"}
                className="w-full"
                size="lg"
              >
                {isRecording ? (
                  <><Square className="h-4 w-4 mr-2 fill-current" /> Stop Recording ({recordingSeconds}s)</>
                ) : (
                  <><Mic className="h-4 w-4 mr-2" /> Start Recording</>
                )}
              </Button>
            ) : (
              <div className="w-full space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Recording complete ({recordingSeconds}s)</p>
                    <audio src={recordedUrl} controls className="w-full mt-1 h-8" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setRecordedBlob(null); setRecordedUrl(null); setRecordingSeconds(0); }}
                  >
                    Re-record
                  </Button>
                  <Button
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    onClick={handleCloneVoice}
                    disabled={isUploadingRecording || isCloningVoice || recordingSeconds < 15}
                  >
                    {isUploadingRecording ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                    ) : isCloningVoice ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cloning Voice...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" /> Clone My Voice</>
                    )}
                  </Button>
                </div>
                {recordingSeconds < 15 && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Need at least 15 seconds for voice cloning.
                  </p>
                )}
              </div>
            )}
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

      {/* My Avatar */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            My Avatar
          </CardTitle>
          <CardDescription>
            Your AI avatar headshot and intro video used in AI Reels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar image row */}
          <div className="flex items-center gap-4">
            {currentUser?.avatarImageUrl ? (
              <img
                src={currentUser.avatarImageUrl}
                alt="Avatar"
                className="h-20 w-20 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">
                {currentUser?.avatarImageUrl ? 'Avatar headshot saved' : 'No avatar headshot uploaded'}
              </p>
              {currentUser?.avatarImageUrl && (
                <p className="text-xs text-primary">✓ Saved to your profile — used in AI Reels</p>
              )}
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="h-3 w-3 mr-1" /> {currentUser?.avatarImageUrl ? 'Change Photo' : 'Upload Photo'}</>
                  )}
                </Button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Avatar video row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Avatar Intro Video</p>
              </div>
              {avatarVideoExpired && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                  <AlertTriangle className="h-3 w-3" /> Expired — regenerate in AI Reels
                </span>
              )}
              {!avatarVideoExpired && avatarVideoExpiringSoon && (
                <span className="flex items-center gap-1 text-xs text-primary font-medium">
                  <AlertTriangle className="h-3 w-3" /> Expires in {90 - (avatarVideoAgeDays ?? 0)} days
                </span>
              )}
              {!avatarVideoExpired && !avatarVideoExpiringSoon && avatarVideoAgeDays !== null && (
                <span className="text-xs text-primary">{90 - avatarVideoAgeDays} days remaining</span>
              )}
            </div>
            {currentUser?.avatarVideoUrl ? (
              <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video max-w-xs">
                <video
                  src={currentUser.avatarVideoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No avatar intro video yet. Go to AI Reels to generate one.</p>
            )}
            {(avatarVideoExpiringSoon || avatarVideoExpired) && (
              <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
                avatarVideoExpired
                  ? 'bg-red-500/10 border-red-500/20 text-red-600'
                  : 'bg-primary/10 border-primary/20 text-primary'
              }`}>
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    {avatarVideoExpired ? 'Avatar video has expired' : `Avatar video expires in ${90 - (avatarVideoAgeDays ?? 0)} days`}
                  </p>
                  <p className="text-xs mt-0.5 opacity-80">
                    Avatar videos are hosted for 90 days. Head to AI Reels to regenerate your avatar intro.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Avatar Library */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-muted-foreground" />
            My Avatar Library
          </CardTitle>
          <CardDescription>Manage your personal AI avatars. Each avatar can have a different look or outfit. The default avatar is used when generating videos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar list */}
          {avatarList && avatarList.length > 0 ? (
            <div className="space-y-2">
              {avatarList.map((avatar) => (
                <div key={avatar.id} className={`flex items-center gap-3 p-3 rounded-lg border ${avatar.isDefault ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/30'}`}>
                  {/* Thumbnail or icon */}
                  {avatar.thumbnailUrl ? (
                    <img src={avatar.thumbnailUrl} alt="Avatar" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  {/* Nickname / ID */}
                  <div className="flex-1 min-w-0">
                    {editingNicknameId === avatar.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editingNicknameValue}
                          onChange={(e) => setEditingNicknameValue(e.target.value)}
                          placeholder="e.g. Blazer — Office"
                          className="h-7 text-xs flex-1"
                          autoFocus
                        />
                        <Button size="sm" className="h-7 text-xs px-2" onClick={() => updateNicknameMutation.mutate({ avatarId: avatar.id, nickname: editingNicknameValue.trim() })} disabled={updateNicknameMutation.isPending}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditingNicknameId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium truncate">{avatar.nickname || 'My Avatar'} {avatar.isDefault && <span className="ml-1 text-xs text-primary font-normal">(default)</span>}</p>
                        <p className="text-xs text-muted-foreground truncate">{avatar.didAvatarId}</p>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!avatar.isDefault && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setDefaultAvatarMutation.mutate({ avatarId: avatar.id })} disabled={setDefaultAvatarMutation.isPending}>
                        Set Default
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setEditingNicknameId(avatar.id); setEditingNicknameValue(avatar.nickname || ''); }}>
                      Rename
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2 text-blue-600 hover:text-blue-700"
                      disabled={testAvatarMutation.isPending && testingAvatarId === avatar.id}
                      onClick={() => {
                        setTestAvatarVideoUrl(null);
                        setTestingAvatarId(avatar.id);
                        testAvatarMutation.mutate({ avatarId: avatar.id });
                      }}
                    >
                      {testAvatarMutation.isPending && testingAvatarId === avatar.id ? (
                        <><Loader2 className="h-3 w-3 animate-spin mr-1" />Testing…</>
                      ) : (
                        <><Play className="h-3 w-3 mr-1" />Test</>
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteAvatarByIdMutation.mutate({ avatarId: avatar.id })} disabled={deleteAvatarByIdMutation.isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No avatars in your library yet. Add one below.</p>
          )}

          {/* Test clip preview */}
          {testAvatarVideoUrl && (
            <div className="space-y-2 p-3 rounded-lg border border-blue-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-800">Test Clip Preview</p>
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-blue-600" onClick={() => setTestAvatarVideoUrl(null)}>Dismiss</Button>
              </div>
              <video
                src={testAvatarVideoUrl}
                controls
                autoPlay
                className="w-full rounded-md max-h-64 bg-black"
              />
            </div>
          )}

          {/* Add avatar */}
          {!showAddAvatar ? (
            <Button size="sm" variant="outline" onClick={() => setShowAddAvatar(true)} className="w-full">
              + Add Avatar
            </Button>
          ) : (
            <div className="space-y-3 p-3 rounded-lg border border-dashed border-border bg-muted/20">
              <p className="text-sm font-medium">Add Avatar to Library</p>
              <div className="space-y-2">
                <Label className="text-xs">Avatar ID</Label>
                <Input
                  value={newAvatarId}
                  onChange={(e) => setNewAvatarId(e.target.value)}
                  placeholder="Paste your avatar ID"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nickname (optional)</Label>
                <Input
                  value={newAvatarNickname}
                  onChange={(e) => setNewAvatarNickname(e.target.value)}
                  placeholder="e.g. Blazer — Office"
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-primary text-black font-semibold flex-1"
                  disabled={newAvatarId.length < 10 || addAvatarMutation.isPending}
                  onClick={() => addAvatarMutation.mutate({ avatarId: newAvatarId.trim(), nickname: newAvatarNickname.trim() || undefined, setAsDefault: !avatarList?.length })}
                >
                  {addAvatarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Library"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowAddAvatar(false); setNewAvatarId(""); setNewAvatarNickname(""); }}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Welcome Tour */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reset Welcome Tour</p>
              <p className="text-sm text-muted-foreground">Re-show the welcome modal and product tour on next page load</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={resetOnboardingMutation.isPending}
              onClick={() => resetOnboardingMutation.mutate()}
            >
              {resetOnboardingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Reset Tour
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Owner Self-Promotion — only visible to the platform owner who isn't yet admin */}
      {user && (user as any).isOwner === true && user.role !== "admin" && <OwnerPromoteCard />}

      {/* Sign Out */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">Sign out of your Amped Agent account</p>
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
