/**
 * Live Tour — in-browser guided room-by-room video recorder
 * Similar to Momenzo: guides the agent through each room with prompts,
 * records clips, uploads to S3, then assembles into a finished video.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Video,
  Circle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Play,
  Download,
  Camera,
  ArrowRight,
  ArrowLeft,
  X,
  Mic,
  MicOff,
  RotateCcw,
  FileText,
  Share2,
} from "lucide-react";
import { VideoPostingDialog } from "@/components/VideoPostingDialog";
import { toast } from "sonner";

// ─── Max recording duration ─────────────────────────────────────────────────
const MAX_RECORDING_SECONDS = 15;

// ─── Teleprompter scripts per room type ──────────────────────────────────────
const TELEPROMPTER_SCRIPTS: Record<string, string> = {
  "Exterior / Front": "Welcome! Here's the stunning exterior of this beautiful property. Notice the curb appeal, the landscaping, and the architectural details that make this home truly special.",
  "Living Room": "Step into this gorgeous living room — the perfect space for entertaining or relaxing. Take in the natural light, the open layout, and the premium finishes throughout.",
  "Kitchen": "This chef's kitchen is a dream come true. From the high-end appliances to the beautiful countertops and ample storage, every detail has been thoughtfully designed.",
  "Primary Bedroom": "Retreat to this spacious primary bedroom — your personal sanctuary. The generous proportions, natural light, and elegant finishes create the perfect escape.",
  "Primary Bathroom": "This spa-like primary bathroom features premium fixtures, beautiful tilework, and all the luxury touches you'd expect in a home of this caliber.",
  "Backyard / Outdoor": "Step outside to this incredible outdoor living space — perfect for entertaining, relaxing, or enjoying the beautiful weather year-round.",
  "Dining Room": "This elegant dining room is perfect for hosting dinner parties or family gatherings, with plenty of space and beautiful natural light.",
  "Office": "This dedicated home office provides the perfect work-from-home environment — quiet, private, and beautifully appointed.",
  "Garage": "The spacious garage offers ample room for vehicles, storage, and more — a practical and well-finished space.",
  "default": "Take a look at this beautiful space. Every detail has been carefully considered to create a home that's both functional and stunning.",
};

function getTeleprompterScript(roomName: string): string {
  return TELEPROMPTER_SCRIPTS[roomName] ?? TELEPROMPTER_SCRIPTS["default"];
}

// ─── Default room list ────────────────────────────────────────────────────────
const DEFAULT_ROOMS = [
  "Exterior / Front",
  "Living Room",
  "Kitchen",
  "Primary Bedroom",
  "Primary Bathroom",
  "Backyard / Outdoor",
];

// ─── Types ────────────────────────────────────────────────────────────────────
type RecordingState = "idle" | "countdown" | "recording" | "preview" | "uploading" | "done";

interface RoomClip {
  roomName: string;
  blob: Blob | null;
  url: string; // S3 URL after upload
  duration: number;
  localPreviewUrl: string; // Object URL for local preview
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiveTour() {
  // ── Setup phase ──
  const [phase, setPhase] = useState<"setup" | "recording" | "processing" | "done">("setup");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [rooms, setRooms] = useState<string[]>([...DEFAULT_ROOMS]);
  const [newRoom, setNewRoom] = useState("");

  // ── Social sharing ──
  const [showVideoShare, setShowVideoShare] = useState(false);

  // ── Session ──
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentRoomIdx, setCurrentRoomIdx] = useState(0);
  const [clips, setClips] = useState<RoomClip[]>([]);

  // ── Recording ──
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasCamera, setHasCamera] = useState(true);
  const [hasMic, setHasMic] = useState(true);

  // ── Teleprompter ──
  const [teleprompterEnabled, setTeleprompterEnabled] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── tRPC ──
  const createMutation = trpc.liveTour.create.useMutation();
  const saveClipMutation = trpc.liveTour.saveClip.useMutation();
  const assembleMutation = trpc.liveTour.assemble.useMutation();
  const { data: jobStatus, refetch: refetchStatus } = trpc.liveTour.getStatus.useQuery(
    { id: jobId! },
    { enabled: !!jobId && phase === "processing", refetchInterval: 5000 }
  );

  // ── Watch for job completion ──
  useEffect(() => {
    if (jobStatus?.status === "completed") {
      setPhase("done");
    } else if (jobStatus?.status === "failed") {
      toast.error("Video assembly failed: " + (jobStatus.errorMessage ?? "Unknown error"));
      setPhase("recording");
    }
  }, [jobStatus?.status]);

  // ── Camera setup ──
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasCamera(true);
      setHasMic(true);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === "NotAllowedError") {
        toast.error("Camera permission denied. Please allow camera access and try again.");
        setHasCamera(false);
      } else {
        toast.error("Could not access camera: " + error.message);
        setHasCamera(false);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── Start recording session ──
  const handleStartSession = async () => {
    if (!propertyAddress.trim()) {
      toast.error("Please enter the property address");
      return;
    }
    if (rooms.length === 0) {
      toast.error("Please add at least one room");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        propertyAddress: propertyAddress.trim(),
        rooms,
      });
      setJobId(result.id);
      setClips(rooms.map((r) => ({ roomName: r, blob: null, url: "", duration: 0, localPreviewUrl: "" })));
      setCurrentRoomIdx(0);
      setPhase("recording");
      await startCamera();
    } catch {
      toast.error("Failed to start session. Please try again.");
    }
  };

  // ── Countdown + record ──
  const startCountdown = () => {
    setCountdown(3);
    setRecordingState("countdown");
    let c = 3;
    const interval = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(interval);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const localPreviewUrl = URL.createObjectURL(blob);
      setClips((prev) => {
        const next = [...prev];
        next[currentRoomIdx] = {
          ...next[currentRoomIdx],
          blob,
          localPreviewUrl,
          duration: recordingSeconds,
        };
        return next;
      });
      setRecordingState("preview");
    };

    recorder.start(100);
    setRecordingState("recording");
    setRecordingSeconds(0);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const retakeClip = () => {
    setClips((prev) => {
      const next = [...prev];
      if (next[currentRoomIdx].localPreviewUrl) {
        URL.revokeObjectURL(next[currentRoomIdx].localPreviewUrl);
      }
      next[currentRoomIdx] = { ...next[currentRoomIdx], blob: null, localPreviewUrl: "", duration: 0 };
      return next;
    });
    setRecordingState("idle");
  };

  // ── Upload clip to S3 via server ──
  const uploadClip = async (clip: RoomClip, index: number): Promise<string> => {
    if (!clip.blob || !jobId) throw new Error("No blob to upload");

    const formData = new FormData();
    const ext = clip.blob.type.includes("mp4") ? "mp4" : "webm";
    formData.append("file", clip.blob, `room-${index}.${ext}`);
    formData.append("jobId", jobId);
    formData.append("roomIndex", String(index));

    const response = await fetch("/api/live-tour/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Upload failed: ${err}`);
    }

    const { url } = await response.json();
    return url;
  };

  // ── Accept clip and move to next room ──
  const acceptClip = async () => {
    const clip = clips[currentRoomIdx];
    if (!clip.blob) return;

    setRecordingState("uploading");

    try {
      const url = await uploadClip(clip, currentRoomIdx);

      // Save to server
      await saveClipMutation.mutateAsync({
        jobId: jobId!,
        roomIndex: currentRoomIdx,
        clipUrl: url,
        duration: clip.duration,
      });

      setClips((prev) => {
        const next = [...prev];
        next[currentRoomIdx] = { ...next[currentRoomIdx], url };
        return next;
      });

      setRecordingState("done");

      if (currentRoomIdx < rooms.length - 1) {
        // Move to next room
        setTimeout(() => {
          setCurrentRoomIdx((i) => i + 1);
          setRecordingState("idle");
        }, 800);
      }
    } catch (err: unknown) {
      toast.error("Upload failed: " + (err as Error).message);
      setRecordingState("preview");
    }
  };

  // ── Assemble final video ──
  const handleAssemble = async () => {
    const recordedCount = clips.filter((c) => c.url).length;
    if (recordedCount === 0) {
      toast.error("Please record at least one room before assembling.");
      return;
    }

    try {
      stopCamera();
      await assembleMutation.mutateAsync({ jobId: jobId! });
      setPhase("processing");
    } catch {
      toast.error("Failed to start video assembly. Please try again.");
    }
  };

  // ── Room list management ──
  const addRoom = () => {
    if (!newRoom.trim()) return;
    setRooms((r) => [...r, newRoom.trim()]);
    setNewRoom("");
  };

  const removeRoom = (i: number) => {
    setRooms((r) => r.filter((_, idx) => idx !== i));
  };

  const moveRoom = (i: number, dir: -1 | 1) => {
    setRooms((r) => {
      const next = [...r];
      const j = i + dir;
      if (j < 0 || j >= next.length) return r;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  // ── Auto-stop at MAX_RECORDING_SECONDS ──
  useEffect(() => {
    if (recordingState === "recording" && recordingSeconds >= MAX_RECORDING_SECONDS) {
      stopRecording();
    }
  }, [recordingSeconds, recordingState]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      clips.forEach((c) => { if (c.localPreviewUrl) URL.revokeObjectURL(c.localPreviewUrl); });
    };
  }, []);

  const completedCount = clips.filter((c) => c.url).length;
  const progress = rooms.length > 0 ? (completedCount / rooms.length) * 100 : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Setup phase
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Live Tour Recorder</h1>
              <p className="text-sm text-muted-foreground">
                Walk through each room — we guide you, then assemble the video automatically
              </p>
            </div>
          </div>
        </div>

        {/* Property address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Property Address</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="123 Main St, Beverly Hills, CA 90210"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStartSession()}
            />
          </CardContent>
        </Card>

        {/* Room list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rooms to Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rooms.map((room, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm">
                  <span className="text-muted-foreground text-xs w-5 text-center">{i + 1}</span>
                  <span>{room}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveRoom(i, -1)}
                    disabled={i === 0}
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveRoom(i, 1)}
                    disabled={i === rooms.length - 1}
                  >
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeRoom(i)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add room */}
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Add a room..."
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRoom()}
                className="text-sm"
              />
              <Button variant="outline" size="sm" onClick={addRoom} disabled={!newRoom.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Device tip */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-1">📱 Which device should I use?</p>
          <p className="text-blue-700 dark:text-blue-400">
            <strong>Phone or tablet</strong> — best for walking through the property room by room. The rear camera gives you higher quality and better low-light performance.
          </p>
          <p className="text-blue-700 dark:text-blue-400 mt-1">
            <strong>Computer webcam</strong> — great for desk-based narration or recording from a fixed position.
          </p>
        </div>

        {/* Tips */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300 space-y-1">
          <p className="font-semibold">Tips for a great tour:</p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-400">
            <li>Record 8–15 seconds per room</li>
            <li>Walk slowly and keep the camera steady</li>
            <li>Start at the doorway and pan across the room</li>
            <li>Good lighting makes a big difference</li>
          </ul>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleStartSession}
          disabled={createMutation.isPending || !propertyAddress.trim() || rooms.length === 0}
        >
          {createMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting session...</>
          ) : (
            <><Camera className="w-4 h-4 mr-2" /> Start Recording Tour</>
          )}
        </Button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Processing phase
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "processing") {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Assembling Your Tour Video</h2>
          <p className="text-muted-foreground text-sm">
            We're stitching your {completedCount} room clips together with music and title cards.
            This usually takes 2–4 minutes.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">You can safely close this tab — we'll notify you when it's ready.</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Done phase
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "done" && jobStatus?.videoUrl) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold">Your Live Tour is Ready!</h2>
          <p className="text-muted-foreground text-sm">{propertyAddress}</p>
        </div>

        <video
          src={jobStatus.videoUrl}
          controls
          className="w-full rounded-xl border"
          poster={jobStatus.thumbnailUrl || undefined}
        />

        <div className="flex gap-3">
          <Button className="flex-1" asChild>
            <a href={jobStatus.videoUrl} download target="_blank" rel="noreferrer">
              <Download className="w-4 h-4 mr-2" /> Download Video
            </a>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowVideoShare(true)}
          >
            <Share2 className="w-4 h-4 mr-2" /> Post to Social
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPhase("setup");
              setJobId(null);
              setClips([]);
              setCurrentRoomIdx(0);
              setPropertyAddress("");
            }}
          >
            Record Another Tour
          </Button>
        </div>

        <VideoPostingDialog
          open={showVideoShare}
          onOpenChange={setShowVideoShare}
          videoUrl={jobStatus.videoUrl}
          videoTitle={`Live Tour — ${propertyAddress}`}
          defaultCaption={`🏡 Live property tour of ${propertyAddress}. Walk through every room and see what makes this home special. #RealEstate #PropertyTour #HomeTour`}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Recording phase
  // ─────────────────────────────────────────────────────────────────────────
  const currentRoom = rooms[currentRoomIdx];
  const currentClip = clips[currentRoomIdx];

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Room {currentRoomIdx + 1} of {rooms.length}: <span className="text-amber-500">{currentRoom}</span>
          </span>
          <span className="text-muted-foreground">{completedCount}/{rooms.length} recorded</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Room nav pills */}
      <div className="flex gap-2 flex-wrap">
        {rooms.map((room, i) => {
          const done = clips[i]?.url;
          const active = i === currentRoomIdx;
          return (
            <button
              key={i}
              onClick={() => {
                if (recordingState === "idle" || recordingState === "done") {
                  setCurrentRoomIdx(i);
                  setRecordingState(clips[i]?.url ? "done" : "idle");
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-amber-500 text-white border-amber-500"
                  : done
                  ? "bg-green-500/10 text-green-600 border-green-300 dark:text-green-400"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {done ? <CheckCircle2 className="inline w-3 h-3 mr-1" /> : null}
              {room}
            </button>
          );
        })}
      </div>

      {/* Camera view */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        {/* Live camera feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${recordingState === "preview" ? "hidden" : ""}`}
        />

        {/* Preview of recorded clip */}
        {recordingState === "preview" && currentClip?.localPreviewUrl && (
          <video
            ref={previewRef}
            src={currentClip.localPreviewUrl}
            controls
            autoPlay
            className="w-full h-full object-cover"
          />
        )}

        {/* Countdown overlay */}
        {recordingState === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white text-8xl font-bold animate-pulse">{countdown}</span>
          </div>
        )}

        {/* Recording indicator with countdown ring */}
        {recordingState === "recording" && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
              <Circle className="w-3 h-3 fill-white animate-pulse" />
              REC {recordingSeconds}s
            </div>
            {/* Time remaining bar */}
            <div className="flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs">
              <div className="w-20 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    recordingSeconds >= MAX_RECORDING_SECONDS - 3 ? "bg-red-400" : "bg-white"
                  }`}
                  style={{ width: `${(recordingSeconds / MAX_RECORDING_SECONDS) * 100}%` }}
                />
              </div>
              <span className={recordingSeconds >= MAX_RECORDING_SECONDS - 3 ? "text-red-300 font-bold" : ""}>
                {MAX_RECORDING_SECONDS - recordingSeconds}s left
              </span>
            </div>
          </div>
        )}

        {/* Room label overlay */}
        {(recordingState === "idle" || recordingState === "countdown") && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/60 text-white px-4 py-2 rounded-lg text-sm">
              <p className="font-semibold text-amber-400">{currentRoom}</p>
              <p className="text-xs text-white/70">Walk slowly across the room — auto-stops at 15s</p>
            </div>
          </div>
        )}

        {/* Teleprompter overlay */}
        {teleprompterEnabled && recordingState === "recording" && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 pt-8 pb-4">
            <p className="text-white text-sm leading-relaxed animate-[scroll_8s_linear_infinite] line-clamp-3">
              {getTeleprompterScript(currentRoom)}
            </p>
          </div>
        )}

        {/* No camera fallback */}
        {!hasCamera && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white gap-3">
            <Camera className="w-12 h-12 text-gray-500" />
            <p className="text-sm text-gray-400">Camera not available</p>
            <Button size="sm" onClick={startCamera}>Try Again</Button>
          </div>
        )}

        {/* Uploading overlay */}
        {recordingState === "uploading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
            <p className="text-sm">Uploading clip...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {recordingState === "idle" && (
          <Button size="lg" onClick={startCountdown} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto sm:px-8">
            <Circle className="w-4 h-4 mr-2 fill-white" />
            Record {currentRoom}
          </Button>
        )}

        {recordingState === "countdown" && (
          <Button size="lg" variant="outline" disabled className="w-full sm:w-auto">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Get ready...
          </Button>
        )}

        {recordingState === "recording" && (
          <Button
            size="lg"
            onClick={stopRecording}
            className="bg-gray-800 hover:bg-gray-700 text-white w-full sm:w-auto sm:px-8"
          >
            <div className="w-4 h-4 mr-2 bg-white rounded-sm" />
            Stop Recording
          </Button>
        )}

        {recordingState === "preview" && (
          <>
            <Button variant="outline" size="lg" onClick={retakeClip} className="flex-1 sm:flex-none">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button size="lg" onClick={acceptClip} className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Use This Clip
            </Button>
          </>
        )}

        {recordingState === "done" && currentRoomIdx < rooms.length - 1 && (
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => {
              setCurrentRoomIdx((i) => i + 1);
              setRecordingState("idle");
            }}
          >
            Next: {rooms[currentRoomIdx + 1]}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Assemble button — shown when at least 1 clip is recorded */}
      {completedCount > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {completedCount === rooms.length
                ? "All rooms recorded! Ready to assemble."
                : `${completedCount} of ${rooms.length} rooms recorded. You can assemble now or continue recording.`}
            </p>
            <Button
              onClick={handleAssemble}
              disabled={assembleMutation.isPending}
              className="ml-4"
            >
              {assembleMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Assembling...</>
              ) : (
                <><Video className="w-4 h-4 mr-2" /> Assemble Video</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
