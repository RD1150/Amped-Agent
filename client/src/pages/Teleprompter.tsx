import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Video,
  VideoOff,
  Mic,
  MicOff,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
  Download,
  Settings2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Camera,
  Type,
  AlignCenter,
  AlignLeft,
  Maximize2,
  Minimize2,
} from "lucide-react";

type Mode = "setup" | "record";
type ScrollState = "idle" | "running" | "paused";

export default function Teleprompter() {
  // ── Script & display state ────────────────────────────────────────────────
  const [script, setScript] = useState<string>("");
  const [mode, setMode] = useState<Mode>("setup");
  const [scrollState, setScrollState] = useState<ScrollState>("idle");
  const [scrollSpeed, setScrollSpeed] = useState<number>(3); // 1–10
  const [fontSize, setFontSize] = useState<number>(42); // px
  const [mirrorText, setMirrorText] = useState<boolean>(false);
  const [mirrorCamera, setMirrorCamera] = useState<boolean>(true);
  const [textAlign, setTextAlign] = useState<"left" | "center">("center");
  const [showScript, setShowScript] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [scriptOpacity, setScriptOpacity] = useState<number>(90); // %

  // ── Camera / recording state ──────────────────────────────────────────────
  const [cameraOn, setCameraOn] = useState<boolean>(false);
  const [micOn, setMicOn] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string>("");

  // ── Refs ──────────────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Camera helpers ────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
        audio: micOn,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraOn(true);
    } catch (err: any) {
      setCameraError(err.message || "Could not access camera");
      toast.error("Camera access denied. Please allow camera permissions.");
    }
  }, [micOn]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setIsRecording(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !micOn;
      });
    }
    setMicOn((v) => !v);
  }, [micOn]);

  // ── Recording helpers ─────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
    };
    recorder.start(250);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  }, []);

  const downloadRecording = useCallback(() => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teleprompter-recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Recording downloaded!");
  }, [recordedBlob]);

  // ── Scroll animation ──────────────────────────────────────────────────────
  const scrollStep = useCallback(() => {
    if (!scrollRef.current) return;
    const pxPerFrame = scrollSpeed * 0.4;
    scrollRef.current.scrollTop += pxPerFrame;
    scrollAnimRef.current = requestAnimationFrame(scrollStep);
  }, [scrollSpeed]);

  const startScroll = useCallback(() => {
    if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    scrollAnimRef.current = requestAnimationFrame(scrollStep);
    setScrollState("running");
  }, [scrollStep]);

  const pauseScroll = useCallback(() => {
    if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    scrollAnimRef.current = null;
    setScrollState("paused");
  }, []);

  const resetScroll = useCallback(() => {
    if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    scrollAnimRef.current = null;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrollState("idle");
  }, []);

  const toggleScroll = useCallback(() => {
    if (scrollState === "running") pauseScroll();
    else startScroll();
  }, [scrollState, pauseScroll, startScroll]);

  // Update scroll speed live while running
  useEffect(() => {
    if (scrollState === "running") {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = requestAnimationFrame(scrollStep);
    }
  }, [scrollSpeed, scrollState, scrollStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [stopCamera]);

  // Keyboard shortcuts
  useEffect(() => {
    if (mode !== "record") return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); toggleScroll(); }
      if (e.code === "ArrowUp") { e.preventDefault(); setScrollSpeed((s) => Math.max(1, s - 1)); }
      if (e.code === "ArrowDown") { e.preventDefault(); setScrollSpeed((s) => Math.min(10, s + 1)); }
      if (e.code === "KeyR") { e.preventDefault(); resetScroll(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, toggleScroll, resetScroll]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Enter record mode ─────────────────────────────────────────────────────
  const enterRecordMode = async () => {
    if (!script.trim()) {
      toast.error("Please enter your script first.");
      return;
    }
    setMode("record");
    await startCamera();
  };

  const exitRecordMode = () => {
    stopRecording();
    stopCamera();
    resetScroll();
    setMode("setup");
  };

  // ── SETUP VIEW ────────────────────────────────────────────────────────────
  if (mode === "setup") {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center">
                <Type className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teleprompter</h1>
                <p className="text-sm text-gray-500">Film yourself while your script scrolls live</p>
              </div>
            </div>
          </div>

          {/* Script input */}
          <Card className="p-6 mb-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Type className="w-4 h-4" /> Your Script
              </label>
              <Badge variant="outline" className="text-xs">
                {script.trim().split(/\s+/).filter(Boolean).length} words
              </Badge>
            </div>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Paste or type your script here. This will scroll on screen while you record…"
              className="min-h-[280px] text-base leading-relaxed resize-none border-gray-200 focus:border-rose-400"
            />
          </Card>

          {/* Display settings */}
          <Card className="p-6 mb-6 border border-gray-200 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-5">
              <Settings2 className="w-4 h-4" /> Display Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Font size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Font Size</span>
                  <span className="text-sm font-medium text-gray-900">{fontSize}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setFontSize((s) => Math.max(24, s - 4))} className="p-1 rounded hover:bg-gray-100">
                    <ZoomOut className="w-4 h-4 text-gray-500" />
                  </button>
                  <Slider
                    value={[fontSize]}
                    min={24}
                    max={96}
                    step={4}
                    onValueChange={([v]) => setFontSize(v)}
                    className="flex-1"
                  />
                  <button onClick={() => setFontSize((s) => Math.min(96, s + 4))} className="p-1 rounded hover:bg-gray-100">
                    <ZoomIn className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Scroll speed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Scroll Speed</span>
                  <span className="text-sm font-medium text-gray-900">{scrollSpeed}/10</span>
                </div>
                <div className="flex items-center gap-3">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                  <Slider
                    value={[scrollSpeed]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={([v]) => setScrollSpeed(v)}
                    className="flex-1"
                  />
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                </div>
              </div>

              {/* Text alignment */}
              <div>
                <span className="text-sm text-gray-600 block mb-2">Text Alignment</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={textAlign === "left" ? "default" : "outline"}
                    onClick={() => setTextAlign("left")}
                    className={textAlign === "left" ? "bg-rose-600 hover:bg-rose-700" : ""}
                  >
                    <AlignLeft className="w-4 h-4 mr-1" /> Left
                  </Button>
                  <Button
                    size="sm"
                    variant={textAlign === "center" ? "default" : "outline"}
                    onClick={() => setTextAlign("center")}
                    className={textAlign === "center" ? "bg-rose-600 hover:bg-rose-700" : ""}
                  >
                    <AlignCenter className="w-4 h-4 mr-1" /> Center
                  </Button>
                </div>
              </div>

              {/* Mirror options */}
              <div>
                <span className="text-sm text-gray-600 block mb-2">Mirror Options</span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={mirrorCamera ? "default" : "outline"}
                    onClick={() => setMirrorCamera((v) => !v)}
                    className={mirrorCamera ? "bg-rose-600 hover:bg-rose-700" : ""}
                  >
                    <FlipHorizontal className="w-4 h-4 mr-1" /> Camera
                  </Button>
                  <Button
                    size="sm"
                    variant={mirrorText ? "default" : "outline"}
                    onClick={() => setMirrorText((v) => !v)}
                    className={mirrorText ? "bg-rose-600 hover:bg-rose-700" : ""}
                  >
                    <FlipHorizontal className="w-4 h-4 mr-1" /> Text
                  </Button>
                </div>
              </div>

              {/* Script opacity */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Script Overlay Opacity</span>
                  <span className="text-sm font-medium text-gray-900">{scriptOpacity}%</span>
                </div>
                <Slider
                  value={[scriptOpacity]}
                  min={30}
                  max={100}
                  step={5}
                  onValueChange={([v]) => setScriptOpacity(v)}
                />
              </div>
            </div>
          </Card>

          {/* CTA */}
          <Button
            onClick={enterRecordMode}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-xl shadow-lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Start Filming
          </Button>

          <p className="text-center text-xs text-gray-400 mt-3">
            Keyboard shortcuts: <kbd className="bg-gray-100 px-1 rounded">Space</kbd> play/pause &nbsp;
            <kbd className="bg-gray-100 px-1 rounded">↑↓</kbd> speed &nbsp;
            <kbd className="bg-gray-100 px-1 rounded">R</kbd> reset
          </p>
        </div>
      </div>
    );
  }

  // ── RECORD VIEW ───────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative w-full bg-black" style={{ minHeight: "100vh" }}>
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: mirrorCamera ? "scaleX(-1)" : "none" }}
      />

      {/* Dark overlay behind script for readability */}
      {showScript && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.15) 100%)",
          }}
        />
      )}

      {/* Scrolling script overlay */}
      {showScript && (
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ paddingTop: "15vh", paddingBottom: "15vh" }}
        >
          <div
            className="px-8 md:px-16 lg:px-24"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1.5,
              color: "white",
              textAlign: textAlign,
              textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)",
              fontWeight: 600,
              transform: mirrorText ? "scaleX(-1)" : "none",
              opacity: scriptOpacity / 100,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {script}
            {/* Spacer so text scrolls fully off screen */}
            <div style={{ height: "60vh" }} />
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent z-10">
        <div className="flex items-center gap-3">
          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 bg-red-600 rounded-full px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-sm font-mono font-bold">{formatTime(recordingTime)}</span>
            </div>
          )}
          {!isRecording && cameraOn && (
            <Badge className="bg-black/50 text-white border-white/20">Live Preview</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScript((v) => !v)}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            title="Toggle script visibility"
          >
            {showScript ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={exitRecordMode}
            className="px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-sm transition-colors"
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-gradient-to-t from-black/80 to-transparent z-10">
        {/* Speed & font size quick controls */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
            <span className="text-white/70 text-xs">Speed</span>
            <button onClick={() => setScrollSpeed((s) => Math.max(1, s - 1))} className="text-white hover:text-rose-400 transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="text-white font-bold text-sm w-4 text-center">{scrollSpeed}</span>
            <button onClick={() => setScrollSpeed((s) => Math.min(10, s + 1))} className="text-white hover:text-rose-400 transition-colors">
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
            <span className="text-white/70 text-xs">Size</span>
            <button onClick={() => setFontSize((s) => Math.max(24, s - 4))} className="text-white hover:text-rose-400 transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-white font-bold text-sm w-8 text-center">{fontSize}</span>
            <button onClick={() => setFontSize((s) => Math.min(96, s + 4))} className="text-white hover:text-rose-400 transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={resetScroll}
            className="flex items-center gap-1.5 bg-black/50 rounded-full px-4 py-2 text-white hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs">Reset</span>
          </button>
        </div>

        {/* Main action row */}
        <div className="flex items-center justify-center gap-4">
          {/* Mic toggle */}
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full transition-colors ${micOn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
            title="Toggle microphone"
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Teleprompter play/pause — big center button */}
          <button
            onClick={toggleScroll}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${
              scrollState === "running"
                ? "bg-amber-500 hover:bg-amber-600 scale-105"
                : "bg-white hover:bg-gray-100 scale-100"
            }`}
            title="Play/Pause teleprompter (Space)"
          >
            {scrollState === "running" ? (
              <Pause className="w-7 h-7 text-white" />
            ) : (
              <Play className="w-7 h-7 text-gray-900 ml-1" />
            )}
          </button>

          {/* Record button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 scale-105 ring-4 ring-red-400/50"
                : "bg-red-600 hover:bg-red-700"
            }`}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <Square className="w-6 h-6 text-white fill-white" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white" />
            )}
          </button>

          {/* Mirror camera toggle */}
          <button
            onClick={() => setMirrorCamera((v) => !v)}
            className={`p-3 rounded-full transition-colors ${mirrorCamera ? "bg-white/20 hover:bg-white/30 text-white" : "bg-white/10 hover:bg-white/20 text-white/50"}`}
            title="Mirror camera"
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Download row — shows after recording stops */}
        {recordedBlob && !isRecording && (
          <div className="flex justify-center mt-4">
            <button
              onClick={downloadRecording}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Recording
            </button>
          </div>
        )}

        {/* Camera error */}
        {cameraError && (
          <p className="text-center text-red-400 text-sm mt-2">{cameraError}</p>
        )}
      </div>
    </div>
  );
}
