/**
 * audioMixer.ts
 * Server-side utility to mix background music into a video using FFmpeg.
 * The avatar voice track is preserved at full volume; BGM is mixed in at a low level.
 */

import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Mix background music into a video buffer.
 * Returns a new video buffer with the BGM mixed in at the specified volume.
 *
 * @param videoBuffer  - The original video (MP4) as a Buffer
 * @param musicBuffer  - The background music (MP3/WAV) as a Buffer
 * @param bgmVolume    - BGM volume level 0.0–1.0 (default 0.12 = 12%)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mixBgmIntoVideo(
  videoBuffer: Buffer,
  musicBuffer: Buffer,
  bgmVolume = 0.12
): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const videoPath = path.join(tmpDir, `av-input-${Date.now()}.mp4`);
  const musicPath = path.join(tmpDir, `bgm-input-${Date.now()}.mp3`);
  const outputPath = path.join(tmpDir, `av-output-${Date.now()}.mp4`);

  try {
    // Write temp files
    fs.writeFileSync(videoPath, videoBuffer);
    fs.writeFileSync(musicPath, musicBuffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(musicPath)
        // Mix: avatar voice at 100%, BGM looped and faded at bgmVolume
        .complexFilter([
          // Loop BGM to match video duration, then apply volume
          `[1:a]aloop=loop=-1:size=2e+09,volume=${bgmVolume}[bgm]`,
          // Mix avatar voice with BGM; shortest=1 stops when video ends
          `[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=3[aout]`,
        ])
        .outputOptions([
          "-map 0:v",      // video stream from input 0
          "-map [aout]",   // mixed audio
          "-c:v copy",     // copy video codec (no re-encode)
          "-c:a aac",      // encode mixed audio as AAC
          "-b:a 192k",
          "-shortest",
          "-movflags +faststart",
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    const result = fs.readFileSync(outputPath);
    return result;
  } finally {
    // Cleanup temp files
    for (const f of [videoPath, musicPath, outputPath]) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
  }
}
