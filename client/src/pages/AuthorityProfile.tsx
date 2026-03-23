import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

const VOICE_CLONE_SCRIPT = `Hi, my name is [Your Name] and I'm a real estate agent serving [Your City and surrounding areas].

I've been helping buyers and sellers navigate the local market for [X] years, and I'm passionate about making the process as smooth and stress-free as possible.

Whether you're a first-time buyer looking for your dream home, a seller ready to maximize your property's value, or an investor searching for your next opportunity — I'm here to guide you every step of the way.

The real estate market is always moving, and having the right agent in your corner makes all the difference. I stay on top of local trends, pricing, and neighborhood insights so you don't have to.

I believe every client deserves personalized attention, honest advice, and a strategy tailored to their unique goals. My job isn't done until you're completely satisfied with the outcome.

If you're thinking about buying or selling, I'd love to connect. Let's talk about your goals and put together a plan that works for you.

Thank you for taking the time to learn more about me. I look forward to earning your trust and your business.`;

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
            <><Check className="h-3.5 w-3.5 text-green-500" /> Copied!</>
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

  // Voice Cloning state
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voiceUploadUrl, setVoiceUploadUrl] = useState<string>("");
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isCloningVoice, setIsCloningVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceFileInputRef = useRef<HTMLInputElement>(null);

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
    onSuccess: (data) => {
      toast.success(`Voice cloned successfully as "${data.voiceName}"! It will now be used for all AI voiceovers.`);
      refetchPersona();
      setVoiceFile(null);
      setVoiceUploadUrl("");
      setRecordedBlob(null);
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
      await cloneVoiceMutation.mutateAsync({ voiceSampleUrl: url });
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
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 mb-5">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
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
            {/* Standard reading script */}
            <VoiceScript />

            {/* Option 1: Record in browser */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Option A — Record in browser</Label>
              <div className="flex items-center gap-3">
                {!isRecording ? (
                  <Button
                    variant="outline"
                    onClick={startRecording}
                    disabled={isCloningVoice || isUploadingVoice}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4 text-red-500" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={stopRecording}
                    className="gap-2 border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    <Square className="h-4 w-4" />
                    Stop — {formatSeconds(recordingSeconds)}
                  </Button>
                )}
                {recordedBlob && !isRecording && (
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Recording ready ({formatSeconds(recordingSeconds)})
                  </span>
                )}
              </div>
              {isRecording && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Recording… speak naturally. Aim for at least 30 seconds.
                </p>
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
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
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
