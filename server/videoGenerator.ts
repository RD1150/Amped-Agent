import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { storagePut } from "./storage";

const execAsync = promisify(exec);

export interface PropertyDetails {
  address: string;
  price?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  propertyType?: string;
  description?: string;
}

export interface VideoGenerationOptions {
  imageUrls: string[]; // URLs of property images
  propertyDetails: PropertyDetails;
  template?: "modern" | "luxury" | "cozy";
  duration?: number; // Total video duration in seconds
  musicTrack?: string;
}

/**
 * Generate a cinematic property tour video with Ken Burns effects
 * @param options Video generation options
 * @returns S3 URL of the generated video
 */
export async function generatePropertyTourVideo(
  options: VideoGenerationOptions
): Promise<{ videoUrl: string; thumbnailUrl: string }> {
  const {
    imageUrls,
    propertyDetails,
    template = "modern",
    duration = 30,
  } = options;

  if (imageUrls.length === 0) {
    throw new Error("At least one image is required");
  }

  // Create temp directory for video generation
  const tempDir = `/tmp/property-tour-${Date.now()}`;
  await mkdir(tempDir, { recursive: true });

  try {
    // Download images to temp directory
    const localImagePaths: string[] = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${imageUrl}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const imagePath = path.join(tempDir, `image-${i}.jpg`);
      await writeFile(imagePath, buffer);
      localImagePaths.push(imagePath);
    }

    // Calculate duration per image
    const durationPerImage = duration / imageUrls.length;

    // Generate FFmpeg filter complex for Ken Burns effect
    const filterComplex = generateKenBurnsFilter(
      localImagePaths.length,
      durationPerImage,
      template
    );

    // Generate text overlay for property details
    const textOverlay = generateTextOverlay(propertyDetails, template);

    // Build FFmpeg command
    const outputPath = path.join(tempDir, "output.mp4");
    const thumbnailPath = path.join(tempDir, "thumbnail.jpg");

    // Input files
    const inputs = localImagePaths.map((p) => `-i "${p}"`).join(" ");

    // FFmpeg command with Ken Burns effect, transitions, and text overlay
    const ffmpegCmd = `ffmpeg ${inputs} \\
      -filter_complex "${filterComplex}${textOverlay}" \\
      -map "[out]" \\
      -c:v libx264 \\
      -preset medium \\
      -crf 23 \\
      -pix_fmt yuv420p \\
      -r 30 \\
      -t ${duration} \\
      -y "${outputPath}"`;

    console.log("[VideoGenerator] Generating video with FFmpeg...");
    await execAsync(ffmpegCmd);

    // Generate thumbnail from first frame
    await execAsync(
      `ffmpeg -i "${outputPath}" -ss 00:00:01 -vframes 1 -y "${thumbnailPath}"`
    );

    // Upload video and thumbnail to S3
    console.log("[VideoGenerator] Uploading video to S3...");
    const videoBuffer = await readFileAsync(outputPath);
    const thumbnailBuffer = await readFileAsync(thumbnailPath);

    const videoKey = `property-tours/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
    const thumbnailKey = `property-tours/thumbnails/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    const { url: videoUrl } = await storagePut(
      videoKey,
      videoBuffer,
      "video/mp4"
    );
    const { url: thumbnailUrl } = await storagePut(
      thumbnailKey,
      thumbnailBuffer,
      "image/jpeg"
    );

    // Cleanup temp files
    await cleanupTempDir(tempDir);

    return { videoUrl, thumbnailUrl };
  } catch (error) {
    // Cleanup on error
    await cleanupTempDir(tempDir);
    throw error;
  }
}

/**
 * Generate Ken Burns effect filter for FFmpeg
 */
function generateKenBurnsFilter(
  imageCount: number,
  durationPerImage: number,
  template: string
): string {
  const filters: string[] = [];
  const transitions: string[] = [];

  for (let i = 0; i < imageCount; i++) {
    // Ken Burns effect: zoom in and pan
    const zoomStart = 1.0;
    const zoomEnd = 1.3;
    const panX = i % 2 === 0 ? "0" : "(iw-iw/zoom)";
    const panY = i % 2 === 0 ? "(ih-ih/zoom)" : "0";

    // Apply Ken Burns effect to each image
    filters.push(
      `[${i}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,` +
        `zoompan=z='min(zoom+0.0015,${zoomEnd})':x='${panX}':y='${panY}':d=${Math.floor(durationPerImage * 30)}:s=1920x1080:fps=30[v${i}]`
    );
  }

  // Concatenate all clips with crossfade transitions
  if (imageCount === 1) {
    return filters[0] + ";[v0]";
  }

  let concatFilter = filters.join(";") + ";";
  let currentLabel = "v0";

  for (let i = 1; i < imageCount; i++) {
    const nextLabel = i === imageCount - 1 ? "out" : `v${i}concat`;
    const fadeDuration = 0.5;

    concatFilter += `[${currentLabel}][v${i}]xfade=transition=fade:duration=${fadeDuration}:offset=${(i - 1) * durationPerImage + durationPerImage - fadeDuration}[${nextLabel}];`;
    currentLabel = nextLabel;
  }

  return concatFilter.slice(0, -1); // Remove trailing semicolon
}

/**
 * Generate text overlay for property details
 */
function generateTextOverlay(
  details: PropertyDetails,
  template: string
): string {
  const { address, price, beds, baths, sqft } = details;

  // Build property info text
  const infoLines: string[] = [];
  if (price) infoLines.push(price);
  if (beds && baths) infoLines.push(`${beds} BD | ${baths} BA`);
  if (sqft) infoLines.push(`${sqft.toLocaleString()} SQ FT`);

  const propertyInfo = infoLines.join(" · ");

  // Text overlay with address and property info
  const fontSize = template === "luxury" ? 48 : 42;
  const fontColor = template === "luxury" ? "white" : "white";
  const boxColor = "black@0.6";

  // Address at bottom
  const addressOverlay = `,drawtext=text='${escapeText(address)}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=h-150:box=1:boxcolor=${boxColor}:boxborderw=20`;

  // Property info below address
  const infoOverlay = propertyInfo
    ? `,drawtext=text='${escapeText(propertyInfo)}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=${fontSize - 8}:fontcolor=${fontColor}:x=(w-text_w)/2:y=h-90:box=1:boxcolor=${boxColor}:boxborderw=15`
    : "";

  return addressOverlay + infoOverlay;
}

/**
 * Escape text for FFmpeg drawtext filter
 */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

/**
 * Read file as buffer
 */
async function readFileAsync(filePath: string): Promise<Buffer> {
  const fs = await import("fs/promises");
  return fs.readFile(filePath);
}

/**
 * Cleanup temporary directory
 */
async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    if (existsSync(tempDir)) {
      const fs = await import("fs/promises");
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error("[VideoGenerator] Failed to cleanup temp dir:", error);
  }
}
