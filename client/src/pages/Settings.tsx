import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Palette, LogOut, Mic, Play, Loader2, Trash2, CheckCircle, AlertCircle, Square, Upload, Video, AlertTriangle, RefreshCw } from "lucide-react";
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

      {/* Voice Cloning */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-violet-500" />
            Clone Your Voice
          </CardTitle>
          <CardDescription>
            Record 30–60 seconds of your natural speaking voice. ElevenLabs will clone it and use it as your default narration voice across all videos.
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
                    D-ID avatar videos are hosted for 90 days. Head to AI Reels to regenerate your avatar intro.
                  </p>
                </div>
              </div>
            )}
          </div>
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
