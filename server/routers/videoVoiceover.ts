/**
 * Video Voiceover Router
 *
 * Accepts an uploaded video URL and either:
 *   (a) Auto-generates a voiceover script by extracting frames and analyzing with vision LLM
 *   (b) Uses a user-provided script
 *
 * Then:
 *   1. Generates TTS audio via ElevenLabs (cloned voice or preset)
 *   2. Merges audio onto the video using ffmpeg
 *   3. Burns word-synced captions onto the video using ffmpeg drawtext
 *   4. Uploads the final video to S3 and returns the URL
 */

import { z } from "zod";
import { exec as execCb } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { protectedProcedure, router } from "../_core/trpc";
import { textToSpeechWithTimestamps, WordAlignment } from "../_core/elevenLabs";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";

const exec = promisify(execCb);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Download a remote URL to a local temp file */
async function downloadToTemp(url: string, ext: string): Promise<string> {
  const tmpPath = path.join(os.tmpdir(), `vv-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(tmpPath, buf);
  return tmpPath;
}

/** Extract N evenly-spaced frames from a video as base64 JPEG strings */
async function extractFrames(videoPath: string, count: number = 6): Promise<string[]> {
  // Get video duration
  const { stdout } = await exec(
    `ffprobe -v quiet -print_format json -show_streams "${videoPath}"`
  );
  const info = JSON.parse(stdout);
  const videoStream = info.streams?.find((s: any) => s.codec_type === "video");
  const duration = parseFloat(videoStream?.duration ?? "30");

  const frames: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = (duration / (count + 1)) * (i + 1);
    const framePath = path.join(os.tmpdir(), `vv-frame-${Date.now()}-${i}.jpg`);
    await exec(
      `ffmpeg -y -ss ${t.toFixed(2)} -i "${videoPath}" -vframes 1 -q:v 3 -vf "scale=640:-1" "${framePath}"`
    );
    const buf = fs.readFileSync(framePath);
    frames.push(buf.toString("base64"));
    fs.unlinkSync(framePath);
  }
  return frames;
}

/** Generate a voiceover script from video frames using vision LLM */
async function generateScriptFromFrames(
  frames: string[],
  duration: number,
  persona: { agentName?: string; primaryCity?: string; tagline?: string } | null
): Promise<string> {
  const wordTarget = Math.round((duration * 140) / 60); // ~140 wpm
  const agentContext = persona?.agentName
    ? `The agent is ${persona.agentName}${persona.primaryCity ? `, serving ${persona.primaryCity}` : ""}.`
    : "The agent is a real estate professional.";

  const imageContent = frames.map((b64) => ({
    type: "image_url" as const,
    image_url: { url: `data:image/jpeg;base64,${b64}`, detail: "low" as const },
  }));

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a professional real estate voiceover scriptwriter. ${agentContext}
Write a natural, conversational voiceover script for a real estate video.
- Target length: ~${wordTarget} words (fits a ${Math.round(duration)}s video at natural speaking pace)
- Tone: warm, confident, and authoritative — not salesy
- Describe what is being shown in each part of the video
- End with a soft call to action
- Output ONLY the script text — no stage directions, no formatting, no labels`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Here are ${frames.length} evenly-spaced frames from a ${Math.round(duration)}-second real estate video. Write the voiceover script.`,
          },
          ...imageContent,
        ],
      },
    ],
    maxTokens: 600,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("LLM returned empty script");
  return typeof content === "string" ? content.trim() : "";
}

/** Build an ASS subtitle file from word alignment data */
function buildAssSubtitles(
  alignment: WordAlignment[],
  style: "white" | "yellow" | "gold" | "none",
  size: "normal" | "large"
): string {
  if (style === "none" || alignment.length === 0) return "";

  const colorMap: Record<string, string> = {
    white: "&H00FFFFFF",
    yellow: "&H0000FFFF",
    gold: "&H0000D7FF",
  };
  const primaryColor = colorMap[style] ?? "&H00FFFFFF";
  const fontSize = size === "large" ? 28 : 22;

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 1

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${fontSize},${primaryColor},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2.5,1,2,80,80,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Group words into ~3-word chunks for readability
  const CHUNK = 3;
  const lines: string[] = [];
  for (let i = 0; i < alignment.length; i += CHUNK) {
    const chunk = alignment.slice(i, i + CHUNK);
    const start = chunk[0].start;
    const end = chunk[chunk.length - 1].end;
    const text = chunk.map((w) => w.word).join(" ");
    const fmt = (s: number) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = (s % 60).toFixed(2);
      return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(5, "0")}`;
    };
    lines.push(`Dialogue: 0,${fmt(start)},${fmt(end)},Default,,0,0,0,,${text}`);
  }

  return header + lines.join("\n") + "\n";
}

/** Merge audio + captions onto a video using ffmpeg, return output path */
async function mergeAudioAndCaptions(
  videoPath: string,
  audioPath: string,
  assPath: string | null,
  outputPath: string
): Promise<void> {
  const subtitleFilter = assPath ? `,ass='${assPath}'` : "";
  // -shortest: trim to shortest stream (video or audio)
  // -map 0:v: take video from input 0
  // -map 1:a: take audio from input 1
  const cmd = [
    "ffmpeg -y",
    `-i "${videoPath}"`,
    `-i "${audioPath}"`,
    `-filter_complex "[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2${subtitleFilter}[v]"`,
    `-map "[v]" -map 1:a`,
    `-c:v libx264 -preset fast -crf 23`,
    `-c:a aac -b:a 128k`,
    `-shortest`,
    `"${outputPath}"`,
  ].join(" ");
  await exec(cmd);
}

// ── Router ────────────────────────────────────────────────────────────────────

export const videoVoiceoverRouter = router({
  /**
   * Generate a voiceover script from a video (auto mode).
   * Returns the script text so the user can review/edit before generating audio.
   */
  generateScript: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any; input: { videoUrl: string } }) => {
      const { videoUrl } = input;
      const persona = await db.getPersonaByUserId(ctx.user.id);

      // Download video
      const ext = videoUrl.split("?")[0].split(".").pop()?.toLowerCase() || "mp4";
      const videoPath = await downloadToTemp(videoUrl, ext);

      try {
        // Get duration
        const { stdout } = await exec(
          `ffprobe -v quiet -print_format json -show_streams "${videoPath}"`
        );
        const info = JSON.parse(stdout);
        const videoStream = info.streams?.find((s: any) => s.codec_type === "video");
        const duration = parseFloat(videoStream?.duration ?? "30");

        // Extract frames
        const frames = await extractFrames(videoPath, 6);

        // Generate script
        const script = await generateScriptFromFrames(frames, duration, persona ? { agentName: persona.agentName ?? undefined, primaryCity: (persona as any).primaryCity ?? undefined, tagline: (persona as any).tagline ?? undefined } : null);

        return { script, duration: Math.round(duration) };
      } finally {
        fs.unlinkSync(videoPath);
      }
    }),

  /**
   * Generate audio + captions and merge onto the uploaded video.
   * Accepts either a user-provided script or the auto-generated one.
   */
  renderVoiceover: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string().url(),
        script: z.string().min(10).max(3000),
        voiceId: z.string().optional(), // ElevenLabs voice_id; defaults to cloned voice or Rachel
        captionStyle: z.enum(["white", "yellow", "gold", "none"]).default("white"),
        captionSize: z.enum(["normal", "large"]).default("normal"),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any; input: { videoUrl: string; script: string; voiceId?: string; captionStyle: "white" | "yellow" | "gold" | "none"; captionSize: "normal" | "large" } }) => {
      const { videoUrl, script, voiceId, captionStyle, captionSize } = input;

      // Resolve voice: prefer cloned voice, fall back to provided, then Rachel
      const persona = await db.getPersonaByUserId(ctx.user.id);
      const resolvedVoiceId =
        voiceId ||
        (persona as any)?.elevenLabsVoiceId ||
        "21m00Tcm4TlvDq8ikWAM"; // Rachel

      // Download video
      const ext = videoUrl.split("?")[0].split(".").pop()?.toLowerCase() || "mp4";
      const videoPath = await downloadToTemp(videoUrl, ext);
      const audioPath = path.join(os.tmpdir(), `vv-audio-${Date.now()}.mp3`);
      const assPath = path.join(os.tmpdir(), `vv-subs-${Date.now()}.ass`);
      const outputPath = path.join(os.tmpdir(), `vv-out-${Date.now()}.mp4`);

      try {
        // 1. Generate TTS with word timestamps
        const { audioBuffer, alignment } = await textToSpeechWithTimestamps({
          text: script,
          voice_id: resolvedVoiceId,
          stability: 0.6,
          similarity_boost: 0.75,
          use_speaker_boost: true,
        });
        if (!audioBuffer || audioBuffer.length === 0) {
          throw new Error("Voice generation returned empty audio.");
        }
        fs.writeFileSync(audioPath, audioBuffer);

        // 2. Build ASS subtitle file
        let assFilePath: string | null = null;
        if (captionStyle !== "none" && alignment.length > 0) {
          const assContent = buildAssSubtitles(alignment, captionStyle, captionSize);
          fs.writeFileSync(assPath, assContent);
          assFilePath = assPath;
        }

        // 3. Merge audio + captions onto video
        await mergeAudioAndCaptions(videoPath, audioPath, assFilePath, outputPath);

        // 4. Upload to S3
        const outputBuffer = fs.readFileSync(outputPath);
        const key = `video-voiceover/${ctx.user.id}-${Date.now()}.mp4`;
        const { url } = await storagePut(key, outputBuffer, "video/mp4");

        return { videoUrl: url };
      } finally {
        // Cleanup temp files
        for (const p of [videoPath, audioPath, assPath, outputPath]) {
          try { fs.unlinkSync(p); } catch {}
        }
      }
    }),
});
