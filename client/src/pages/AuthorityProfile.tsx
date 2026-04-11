import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  Target,
  Sparkles,
  TrendingUp,
  Save,
  Mic,
  Upload,
  CheckCircle,
  Trash2,
  Play,
  Square,
  Info,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Volume2,
  Video,
  User,
  ArrowRight,
  Calendar,
} from "lucide-react";

function PhotoAvatarCard() {
  const { data: twinStatus, isLoading, refetch: refetchTwin } = trpc.fullAvatarVideo.getCustomAvatarStatus.useQuery(undefined, {
    refetchInterval: (query) => (query.state.data?.status === "training" ? 10000 : false),
  });
  const retryTrainingMutation = trpc.fullAvatarVideo.retryAvatarTraining.useMutation({
    onSuccess: () => { toast.success("Training re-triggered!"); refetchTwin(); },
    onError: (e) => toast.error(`Retry failed: ${e.message}`),
  });
  const deleteAvatarMutation = trpc.fullAvatarVideo.deleteCustomAvatar.useMutation({
    onSuccess: () => { toast.success("Avatar deleted. Head to Avatar Video to upload a new headshot."); refetchTwin(); },
    onError: (e) => toast.error(`Delete failed: ${e.message}`),
  });

  if (isLoading) return null;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
        <Video className="h-5 w-5" />
        AI Photo Avatar
        <span className="text-xs font-normal text-muted-foreground ml-1">Avatar Video</span>
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Your personal AI avatar that speaks your scripts in Avatar Videos.
      </p>

      {twinStatus?.status === "ready" ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0">
            {twinStatus.thumbnailUrl || twinStatus.trainingVideoUrl ? (
              <img
                src={twinStatus.thumbnailUrl ?? twinStatus.trainingVideoUrl ?? undefined}
                alt="Your Photo Avatar"
                className="h-20 w-20 rounded-full object-cover border-2 border-green-500"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center border-2 border-green-500">
                <User className="h-8 w-8 text-primary" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
              <CheckCircle className="h-3.5 w-3.5 text-white" />
            </span>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-primary dark:text-green-400">Avatar ready</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Created {twinStatus.trainedAt ? new Date(twinStatus.trainedAt).toLocaleDateString() : "recently"}.
              Used automatically when you select "Your Photo Avatar" in Avatar Video.
            </p>
          </div>
          {/* Action */}
          <Link href="/full-avatar-video">
            <Button size="sm" className="bg-muted0 hover:bg-primary text-black font-semibold whitespace-nowrap flex-shrink-0">
              <Video className="h-3.5 w-3.5 mr-1.5" />
              Generate Video
            </Button>
          </Link>
        </div>
      ) : twinStatus?.status === "training" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <Loader2 className="h-6 w-6 text-primary animate-spin flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Avatar training in progress…</p>
              <p className="text-xs text-muted-foreground mt-0.5">Usually takes 2–5 minutes. Auto-refreshing every 10s.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => retryTrainingMutation.mutate()} disabled={retryTrainingMutation.isPending} className="text-xs">
              {retryTrainingMutation.isPending ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Retrying…</> : "Stuck? Retry Training"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => deleteAvatarMutation.mutate()} disabled={deleteAvatarMutation.isPending} className="text-xs text-destructive hover:text-destructive">
              {deleteAvatarMutation.isPending ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Deleting…</> : "Delete & Start Over"}
            </Button>
          </div>
        </div>
      ) : twinStatus?.status === "failed" ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <span className="text-xl leading-none mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-sm text-destructive">Avatar creation failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">The avatar creation didn't complete. No credits were charged. Please delete and try again from Avatar Video.</p>
            </div>
          </div>
          <Button size="sm" variant="destructive" onClick={() => deleteAvatarMutation.mutate()} disabled={deleteAvatarMutation.isPending} className="text-xs w-full">
            {deleteAvatarMutation.isPending ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Clearing…</> : "🗑️ Delete & Start Over"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-muted/40 border border-dashed border-border">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <User className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">No avatar set up yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload a headshot photo in Avatar Video to create your personal AI avatar.
            </p>
          </div>
          <Link href="/full-avatar-video">
            <Button size="sm" variant="outline" className="whitespace-nowrap flex-shrink-0">
              Set Up Avatar
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

const VOICE_CLONE_SCRIPT = `Hi, my name is [Your Name] and I'm a real estate agent serving [Your City and surrounding areas].

I've been helping buyers and sellers navigate the local market for [X] years, and I'm passionate about making the process as smooth and stress-free as possible.

Whether you're a first-time buyer looking for your dream home, a seller ready to maximize your property's value, or an investor searching for your next opportunity — I'm here to guide you every step of the way.

The real estate market is always moving, and having the right agent in your corner makes all the difference. I stay on top of local trends, pricing, and neighborhood insights so you don't have to.

I believe every client deserves personalized attention, honest advice, and a strategy tailored to their unique goals. My job isn't done until you're completely satisfied with the outcome.

If you're thinking about buying or selling, I'd love to connect. Let's talk about your goals and put together a plan that works for you.

Thank you for taking the time to learn more about me. I look forward to earning your trust and your business.`;

function VoiceDirections({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const steps = [
    {
      num: 1,
      title: "Find a quiet space",
      detail: "Close doors, turn off fans or music, and move away from windows. Even a closet works great — clothes absorb echo.",
    },
    {
      num: 2,
      title: "Position your microphone",
      detail: "Hold your phone 6–8 inches from your mouth, or sit close to your laptop mic. Avoid holding it directly in front of your lips to prevent plosives (popping sounds).",
    },
    {
      num: 3,
      title: "Read the script below naturally",
      detail: "Speak at your normal conversational pace — not too fast, not too slow. Vary your tone as if talking to a client. Avoid rushing or reading in a monotone voice.",
    },
    {
      num: 4,
      title: "Record or upload your audio",
      detail: "Use Option A to record directly in your browser, or Option B to upload a pre-recorded file. Aim for at least 60 seconds — 90 seconds or more gives the best results.",
    },
    {
      num: 5,
      title: "Click \"Clone My Voice\"",
      detail: "ElevenLabs will process your audio and create a custom voice model. This takes about 30 seconds. Once done, your cloned voice is automatically used in all Property Tours and Auto Reels.",
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-semibold flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">?</span>
          How to clone your voice — 5 easy steps
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <ol className="space-y-3">
            {steps.map((step) => (
              <li key={step.num} className="flex gap-3">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold shrink-0 mt-0.5">{step.num}</span>
                <div>
                  <p className="text-xs font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function VoiceScript() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(VOICE_CLONE_SCRIPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold">Read this script aloud to clone your voice</p>
          <p className="text-xs text-muted-foreground mt-0.5">Replace the bracketed placeholders with your own details, then record or upload yourself reading it.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-1.5 shrink-0 ml-3"
        >
          {copied ? (
            <><Check className="h-3.5 w-3.5 text-primary" /> Copied!</>
          ) : (
            <><Copy className="h-3.5 w-3.5" /> Copy Script</>
          )}
        </Button>
      </div>
      <div className="bg-background/70 rounded-md p-3 max-h-52 overflow-y-auto">
        <p className="text-xs leading-relaxed text-foreground whitespace-pre-line font-mono">{VOICE_CLONE_SCRIPT}</p>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
        <Info className="h-3 w-3 shrink-0" />
        Reading this full script (~90 seconds) gives ElevenLabs enough variety to produce a high-quality clone.
      </p>
    </div>
  );
}

export default function AuthorityProfile() {
  const { data: persona, isLoading, refetch: refetchPersona } = trpc.persona.get.useQuery();
  
  // Customer Avatar
  const [avatarType, setAvatarType] = useState("");
  const [avatarDescription, setAvatarDescription] = useState("");
  
  // Brand Values
  const [brandValues, setBrandValues] = useState<string[]>([]);
  const [newBrandValue, setNewBrandValue] = useState("");
  
  // Market Context
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [marketType, setMarketType] = useState("");
  const [keyTrends, setKeyTrends] = useState<string[]>([]);
  const [newTrend, setNewTrend] = useState("");

  // Booking URL
  const [bookingUrl, setBookingUrl] = useState("");

  // Voice Cloning state
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voiceUploadUrl, setVoiceUploadUrl] = useState<string>("");
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isCloningVoice, setIsCloningVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [postClonePreviewUrl, setPostClonePreviewUrl] = useState<string | null>(null);
  const [isPreviewingClone, setIsPreviewingClone] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceFileInputRef = useRef<HTMLInputElement>(null);
  const previewVoiceMutation = trpc.propertyTours.previewVoice.useMutation();

  useEffect(() => {
    if (persona) {
      // Parse customer avatar
      if (persona.customerAvatar) {
        try {
          const avatar = JSON.parse(persona.customerAvatar);
          setAvatarType(avatar.type || "");
          setAvatarDescription(avatar.description || "");
        } catch (e) {
          console.error("Failed to parse customerAvatar", e);
        }
      }
      
      // Parse brand values
      if (persona.brandValues) {
        try {
          const values = JSON.parse(persona.brandValues);
          setBrandValues(Array.isArray(values) ? values : []);
        } catch (e) {
          console.error("Failed to parse brandValues", e);
        }
      }
      
      // Booking URL
      setBookingUrl(persona.bookingUrl || "");

      // Parse market context
      if (persona.marketContext) {
        try {
          const market = JSON.parse(persona.marketContext);
          setCity(market.city || "");
          setState(market.state || "");
          setMarketType(market.marketType || "");
          setKeyTrends(Array.isArray(market.keyTrends) ? market.keyTrends : []);
        } catch (e) {
          console.error("Failed to parse marketContext", e);
        }
      }
    }
  }, [persona]);

  const updateProfile = trpc.persona.updateAuthorityProfile.useMutation({
    onSuccess: () => {
      toast.success("Authority Profile updated!");
    },
    onError: (error: any) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const cloneVoiceMutation = trpc.persona.cloneVoice.useMutation({
    onSuccess: async (data) => {
      toast.success(`Voice cloned as "${data.voiceName}"! Generating a preview...`);
      refetchPersona();
      setVoiceFile(null);
      setVoiceUploadUrl("");
      setRecordedBlob(null);
      setRecordedBlobUrl(null);
      setVoiceName("");
      // Auto-play a short preview of the cloned voice
      setIsPreviewingClone(true);
      try {
        const result = await previewVoiceMutation.mutateAsync({
          voiceId: data.voice_id,
          sampleText: "Hi, this is my cloned voice. It will now be used for all my property tour voiceovers and AI reels.",
        });
        setPostClonePreviewUrl(result.url);
        const audio = new Audio(result.url);
        audio.play().catch(() => {});
      } catch {
        // Preview failure is non-critical
      } finally {
        setIsPreviewingClone(false);
      }
    },
    onError: (error: any) => {
      toast.error(`Voice cloning failed: ${error.message}`);
    },
  });

  const deleteVoiceMutation = trpc.persona.deleteVoiceClone.useMutation({
    onSuccess: () => {
      toast.success("Cloned voice removed.");
      refetchPersona();
    },
    onError: (error: any) => {
      toast.error(`Failed to remove voice: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!avatarType) {
      toast.error("Please select a customer avatar type");
      return;
    }

    updateProfile.mutate({
      customerAvatar: JSON.stringify({
        type: avatarType,
        description: avatarDescription,
      }),
      brandValues: JSON.stringify(brandValues),
      marketContext: JSON.stringify({
        city,
        state,
        marketType,
        keyTrends,
      }),
      bookingUrl: bookingUrl || undefined,
    });
  };

  const addBrandValue = () => {
    if (newBrandValue.trim() && brandValues.length < 5) {
      setBrandValues([...brandValues, newBrandValue.trim()]);
      setNewBrandValue("");
    }
  };

  const removeBrandValue = (index: number) => {
    setBrandValues(brandValues.filter((_, i) => i !== index));
  };

  const addTrend = () => {
    if (newTrend.trim() && keyTrends.length < 5) {
      setKeyTrends([...keyTrends, newTrend.trim()]);
      setNewTrend("");
    }
  };

  const removeTrend = (index: number) => {
    setKeyTrends(keyTrends.filter((_, i) => i !== index));
  };

  // Voice recording helpers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      toast.error("Microphone access denied. Please allow microphone access and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const uploadAudioFile = async (file: File | Blob, filename = "voice-sample.webm"): Promise<string> => {
    const formData = new FormData();
    formData.append("audio", file, filename);
    const response = await fetch("/api/upload-audio", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Upload failed");
    }
    const data = await response.json();
    return data.url as string;
  };

  const handleVoiceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      toast.error("File too large. Please use a recording under 25MB (about 25 minutes).");
      return;
    }
    setVoiceFile(file);
    setRecordedBlob(null);
    setVoiceUploadUrl("");
  };

  const handleCloneVoice = async () => {
    const source = recordedBlob || voiceFile;
    if (!source) {
      toast.error("Please record or upload a voice sample first.");
      return;
    }

    setIsUploadingVoice(true);
    let url = voiceUploadUrl;
    try {
      if (!url) {
        const filename = voiceFile ? voiceFile.name : "voice-recording.webm";
        url = await uploadAudioFile(source, filename);
        setVoiceUploadUrl(url);
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
      setIsUploadingVoice(false);
      return;
    }
    setIsUploadingVoice(false);

    setIsCloningVoice(true);
    try {
      await cloneVoiceMutation.mutateAsync({
        voiceSampleUrl: url,
        voiceName: voiceName.trim() || undefined,
      });
    } finally {
      setIsCloningVoice(false);
    }
  };

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const hasClonedVoice = !!(persona as any)?.elevenlabsVoiceId;
  const clonedVoiceName = (persona as any)?.elevenlabsVoiceName;

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Authority Profile</h1>
        <p className="text-muted-foreground">
          Define your customer avatar, brand values, and market context to get personalized content analysis from the Performance Coach
        </p>
      </div>

      <div className="space-y-6">
        {/* AI Photo Avatar Status */}
        <PhotoAvatarCard />

        {/* Customer Avatar */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Customer Avatar
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Who are you trying to reach with your content?
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="avatarType">Primary Audience</Label>
              <Select value={avatarType} onValueChange={setAvatarType}>
                <SelectTrigger id="avatarType" className="mt-1.5">
                  <SelectValue placeholder="Select your target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first-time-buyers">First-Time Home Buyers</SelectItem>
                  <SelectItem value="luxury-sellers">Luxury Sellers</SelectItem>
                  <SelectItem value="investors">Real Estate Investors</SelectItem>
                  <SelectItem value="relocators">Relocating Families</SelectItem>
                  <SelectItem value="downsizers">Downsizers/Empty Nesters</SelectItem>
                  <SelectItem value="move-up-buyers">Move-Up Buyers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="avatarDescription">Audience Description</Label>
              <Textarea
                id="avatarDescription"
                placeholder="Describe your ideal client in detail (e.g., 'Young professionals, 28-35, first-time buyers, tech industry, value modern design and walkability')"
                value={avatarDescription}
                onChange={(e) => setAvatarDescription(e.target.value)}
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
        </Card>

        {/* Brand Values */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Brand Values
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            What core values define your personal brand? (Max 5)
          </p>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Trust, Local Expertise, Family-Focused"
                value={newBrandValue}
                onChange={(e) => setNewBrandValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addBrandValue()}
                disabled={brandValues.length >= 5}
              />
              <Button onClick={addBrandValue} disabled={brandValues.length >= 5}>
                Add
              </Button>
            </div>

            {brandValues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {brandValues.map((value, index) => (
                  <div
                    key={index}
                    className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                  >
                    {value}
                    <button
                      onClick={() => removeBrandValue(index)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Market Context */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Market Context
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tell us about your local market
          </p>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., San Francisco"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="e.g., CA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="marketType">Market Type</Label>
              <Select value={marketType} onValueChange={setMarketType}>
                <SelectTrigger id="marketType" className="mt-1.5">
                  <SelectValue placeholder="Select market type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">Hot Market (Seller's Market)</SelectItem>
                  <SelectItem value="balanced">Balanced Market</SelectItem>
                  <SelectItem value="buyers">Buyer's Market</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Key Market Trends (Max 5)</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  placeholder="e.g., Rising inventory, Tech layoffs, New construction boom"
                  value={newTrend}
                  onChange={(e) => setNewTrend(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTrend()}
                  disabled={keyTrends.length >= 5}
                />
                <Button onClick={addTrend} disabled={keyTrends.length >= 5}>
                  Add
                </Button>
              </div>

              {keyTrends.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {keyTrends.map((trend, index) => (
                    <div
                      key={index}
                      className="bg-muted px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                    >
                      {trend}
                      <button
                        onClick={() => removeTrend(index)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Voice Cloning */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <Mic className="h-5 w-5" />
            AI Voice Clone
            <Badge variant="secondary" className="text-xs font-normal">ElevenLabs</Badge>
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Clone your voice so every AI voiceover in Property Tours and Auto Reels sounds like <em>you</em>. Record 30 seconds to 5 minutes of clear speech, or upload an existing audio file.
          </p>

          {/* Existing cloned voice status */}
          {hasClonedVoice && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-5">
              <div className="flex items-center gap-2 text-primary dark:text-green-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Voice clone active: <span className="font-semibold">{clonedVoiceName}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">Used automatically for all AI voiceovers</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteVoiceMutation.mutate()}
                disabled={deleteVoiceMutation.isPending}
              >
                {deleteVoiceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          <div className="space-y-5">
            {/* Step-by-step directions — collapsed by default if voice already cloned */}
            <VoiceDirections defaultOpen={!hasClonedVoice} />

            {/* Standard reading script */}
            <VoiceScript />

            {/* Option 1: Record in browser */}
            <div className="space-y-3">
              <Label className="text-sm font-medium block">Record your voice sample</Label>

              {/* Idle: show Start Recording */}
              {!isRecording && !recordedBlob && (
                <Button
                  onClick={startRecording}
                  disabled={isCloningVoice || isUploadingVoice}
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-white" />
                  Start Recording
                </Button>
              )}

              {/* Recording in progress */}
              {isRecording && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-end gap-0.5 h-6">
                      {[0.4,0.7,1,0.6,0.9,0.5,0.8,0.4,0.7,1].map((h, i) => (
                        <span
                          key={i}
                          className="inline-block w-1 rounded-full bg-red-500 animate-pulse"
                          style={{ height: `${h * 100}%`, animationDelay: `${i * 0.07}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-mono text-red-500 tabular-nums min-w-[3.5rem]">{formatSeconds(recordingSeconds)}</span>
                    <Button
                      variant="outline"
                      onClick={stopRecording}
                      className="gap-2 border-red-500 text-red-500 hover:bg-red-500/10 ml-auto"
                    >
                      <Square className="h-4 w-4" />
                      Stop Recording
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Recording… read the script above naturally. Aim for at least 60 seconds.
                  </p>
                </div>
              )}

              {/* Done: playback preview + re-record */}
              {!isRecording && recordedBlob && recordedBlobUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-green-700 dark:text-green-400">
                      Recording captured — {formatSeconds(recordingSeconds)}
                    </span>
                    {recordingSeconds < 30 && (
                      <span className="text-xs text-primary dark:text-primary/80">
                        (too short — aim for 60+ seconds)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Listen back before cloning:</p>
                  <audio controls src={recordedBlobUrl} className="w-full h-10 rounded" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRecordedBlob(null);
                      setRecordedBlobUrl(null);
                      setVoiceUploadUrl("");
                    }}
                    disabled={isCloningVoice || isUploadingVoice}
                    className="gap-2 text-muted-foreground"
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                    Re-record
                  </Button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Option 2: Upload file */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Option B — Upload audio file</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => voiceFileInputRef.current?.click()}
                  disabled={isCloningVoice || isUploadingVoice}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </Button>
                <input
                  ref={voiceFileInputRef}
                  id="voiceSampleFile"
                  name="voiceSampleFile"
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.webm"
                  className="hidden"
                  onChange={handleVoiceFileSelect}
                />
                {voiceFile && (
                  <span className="text-sm text-primary dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {voiceFile.name} ({(voiceFile.size / 1024 / 1024).toFixed(1)}MB)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Supported: MP3, WAV, M4A, OGG, FLAC, WebM — max 25MB
              </p>
            </div>

            {/* Tips */}
            <div className="bg-muted/50 rounded-lg p-3 flex gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                For best results: record in a quiet room, speak at a natural pace, and include varied sentence lengths. Avoid background music or echo. 1–3 minutes of clear speech produces the most natural clone.
              </span>
            </div>

            {/* Voice name input */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Give your voice a name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                placeholder={`e.g. "${(persona as any)?.agentName || "Sarah"}'s Voice"`}
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                maxLength={64}
                disabled={isCloningVoice || isUploadingVoice}
              />
              <p className="text-[11px] text-muted-foreground mt-1">This label appears in the voice picker in Property Tours and Auto Reels.</p>
            </div>

            {/* Post-clone preview */}
            {postClonePreviewUrl && (
              <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Voice cloned! Here's how it sounds:</p>
                  <audio controls src={postClonePreviewUrl} className="mt-1.5 w-full h-8" />
                </div>
              </div>
            )}
            {isPreviewingClone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating voice preview…
              </div>
            )}

            {/* Clone button */}
            <Button
              onClick={handleCloneVoice}
              disabled={(!voiceFile && !recordedBlob) || isCloningVoice || isUploadingVoice}
              className="w-full gap-2"
            >
              {isUploadingVoice ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading sample…
                </>
              ) : isCloningVoice ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cloning voice with ElevenLabs… (15–30 seconds)
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  {hasClonedVoice ? "Replace Voice Clone" : "Clone My Voice"}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Booking / Calendar URL */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Link
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Paste your Calendly, Cal.com, or CRM booking URL here. It will appear as a "Schedule a Call" button on every presentation landing page you share with sellers and buyers.
          </p>
          <div className="space-y-2">
            <Label htmlFor="bookingUrl">Booking / Calendar URL</Label>
            <Input
              id="bookingUrl"
              type="url"
              placeholder="https://calendly.com/yourname"
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Works with Calendly, Cal.com, Acuity, HubSpot, GHL, or any booking link.</p>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          size="lg"
          className="w-full"
        >
          {updateProfile.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Authority Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
