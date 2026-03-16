// Direct HTTP API implementation to avoid Shotstack SDK parsing issues
import * as fs from "fs";

// Write logs to a file so we can debug background job issues
function writeLog(message: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync("/home/ubuntu/luxestate/.manus-logs/videogen.log", line);
  } catch {}
  console.log(message);
}

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
  includeBranding?: boolean; // Include agent branding overlay
  userId?: number; // User ID for fetching agent profile
  aspectRatio?: "16:9" | "9:16" | "1:1"; // Video aspect ratio
  cardTemplate?: "modern" | "luxury" | "bold" | "classic" | "contemporary"; // Intro/outro card style
  includeIntroVideo?: boolean; // Prepend user's intro video
  videoMode?: "standard" | "ai-enhanced" | "full-ai"; // Video generation mode
  enableVoiceover?: boolean; // Enable AI voiceover narration
  voiceId?: string; // ElevenLabs voice ID
  voiceoverScript?: string; // Custom script (if not provided, will auto-generate)
  customCameraPrompt?: string; // Custom Runway ML camera movement prompt
  perPhotoMovements?: string[]; // Camera movement preset for each photo
  movementSpeed?: "slow" | "fast"; // Camera movement speed: slow (6-8s per photo) or fast (3-4s per photo)
  enableAvatarOverlay?: boolean; // Enable Kling Avatar 2.0 agent twin corner overlay
  avatarOverlayPosition?: "bottom-left" | "bottom-right"; // Corner position for avatar
  agentHeadshotUrl?: string; // Agent headshot for Kling Avatar generation
  agentVoiceUrl?: string;    // Agent voice recording for Kling Avatar generation
  klingAvatarVideoUrl?: string; // Pre-generated Kling Avatar video URL (cached)
}

export type CardTemplate = "modern" | "luxury" | "bold" | "classic" | "contemporary";

import { ENV } from "./_core/env";
import { applyCinematicEnhancements, getCinematicOverlays, type CinematicOptions } from "./cinematicEffects";


/**
 * Get music track URL from music library
 * Uses the actual music library with real track IDs
 */
function getMusicTrackUrl(trackId: string): string {
  // Import music library
  const { getTrackById } = require("./musicLibrary");
  
  // Get track by ID from music library
  const track = getTrackById(trackId);
  
  if (track && track.url) {
    return track.url;
  }
  
  // Fallback to first track if ID not found
  const { MUSIC_LIBRARY } = require("./musicLibrary");
  return MUSIC_LIBRARY[0]?.url || "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/vsuIkwkfirpwAsAL.mp3";
}

/**
 * Generate a cinematic property tour video using Shotstack API
 * Creates Ken Burns effect with smooth transitions
 */
export async function generatePropertyTourVideo(
  options: VideoGenerationOptions
): Promise<{ renderId: string }> {
  writeLog("[VideoGenerator] ========== FUNCTION CALLED ==========");
  writeLog(`[VideoGenerator] Video mode: ${options.videoMode}`);
  writeLog(`[VideoGenerator] Image count: ${options.imageUrls.length}`);
  writeLog(`[VideoGenerator] Aspect ratio: ${options.aspectRatio}`);
  writeLog(`[VideoGenerator] Image URLs: ${JSON.stringify(options.imageUrls)}`);
  
  const {
    imageUrls,
    propertyDetails,
    template = "modern",
    duration = 30,
    includeBranding = true,
    userId,
    aspectRatio = "16:9",
    musicTrack,
    cardTemplate = "modern",
    includeIntroVideo = false,
    videoMode = "standard",
    enableVoiceover = false,
    voiceId,
    voiceoverScript,
  } = options;
  const enableAvatarOverlay = options.enableAvatarOverlay ?? false;
  const avatarOverlayPosition = options.avatarOverlayPosition ?? "bottom-left";

  if (imageUrls.length === 0) {
    throw new Error("At least one image is required");
  }

  // Calculate duration per image based on mode and movement speed
  // Full Cinematic: 8-10s per photo (slow, deliberate — AI motion needs time to develop)
  // Standard Ken Burns: 4-6s per photo (snappier)
  const baseDurationPerImage = duration / imageUrls.length;
  const isCinematic = videoMode === "full-ai";
  const cinematicMultiplier = isCinematic ? 1.4 : 1.0; // Cinematic clips are 40% longer
  const speedMultiplier = options.movementSpeed === "fast" ? 0.6 : 1.0; // Fast = 60% of normal duration
  const durationPerImage = baseDurationPerImage * speedMultiplier * cinematicMultiplier;
  const easingCurve = options.movementSpeed === "fast" ? "easeInOutCubic" : "easeInOutQuad"; // Snappier for fast

  // Generate voiceover if enabled
  let voiceoverUrl: string | undefined;
  if (enableVoiceover) {
    console.log("[VideoGenerator] Generating voiceover narration with ElevenLabs...");
    try {
      const { generatePropertyTourScript } = await import("./scriptGenerator");
      const { textToSpeech } = await import("./_core/elevenLabs");
      const { storagePut } = await import("./storage");

      // Validate ElevenLabs API key is configured
      if (!process.env.ELEVENLABS_API_KEY) {
        throw new Error("ElevenLabs API key is not configured. Please add ELEVENLABS_API_KEY to your environment.");
      }

      // Generate or use provided script
      const script = voiceoverScript || await generatePropertyTourScript({
        propertyDetails: {
          address: propertyDetails.address,
          price: propertyDetails.price ? parseFloat(propertyDetails.price.replace(/[^0-9.]/g, "")) : undefined,
          bedrooms: propertyDetails.beds,
          bathrooms: propertyDetails.baths,
          squareFeet: propertyDetails.sqft,
          description: propertyDetails.description,
        },
        duration,
        style: "professional",
      });

      if (!script || script.trim().length === 0) {
        throw new Error("Failed to generate voiceover script — empty response from LLM.");
      }

      console.log(`[VideoGenerator] Script generated (${script.split(/\s+/).length} words):`, script.substring(0, 120) + "...");

      // Generate audio with ElevenLabs
      const audioBuffer = await textToSpeech({
        text: script,
        voice_id: voiceId || "21m00Tcm4TlvDq8ikWAM", // Default to Rachel
        stability: 0.5,
        similarity_boost: 0.75,
        use_speaker_boost: true,
      });

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("ElevenLabs returned empty audio buffer.");
      }

      console.log(`[VideoGenerator] ElevenLabs audio generated: ${(audioBuffer.length / 1024).toFixed(1)}KB`);

      // Upload to S3
      const timestamp = Date.now();
      const audioKey = `property-tours/voiceovers/${timestamp}-${Math.random().toString(36).substring(7)}.mp3`;
      const { url } = await storagePut(audioKey, audioBuffer, "audio/mpeg");
      voiceoverUrl = url;

      console.log("[VideoGenerator] Voiceover uploaded to S3:", voiceoverUrl);
    } catch (voiceoverError) {
      const errMsg = voiceoverError instanceof Error ? voiceoverError.message : String(voiceoverError);
      console.error("[VideoGenerator] Voiceover generation FAILED:", errMsg);
      // Propagate the error so the user knows voiceover failed
      throw new Error(`Voiceover generation failed: ${errMsg}`);
    }
  }

  // Generate AI videos for hero photos if using AI-enhanced or full-ai mode
  let aiVideoMap = new Map<string, string>();
  if (videoMode === "ai-enhanced" || videoMode === "full-ai") {
    const { generateHeroVideoClips, getHeroCountForMode } = await import("./hybridVideoGenerator");
    const heroCount = getHeroCountForMode(videoMode, imageUrls.length);
    
    if (heroCount > 0) {
      console.log(`[VideoGenerator] Generating ${heroCount} AI-enhanced clips with Kling AI...`);
      aiVideoMap = await generateHeroVideoClips(imageUrls, heroCount, aspectRatio, options.customCameraPrompt);
      console.log(`[VideoGenerator] AI generation complete. ${aiVideoMap.size}/${heroCount} clips ready.`);
      
      // For Full Cinematic mode: warn if AI generation partially failed
      // (Standard mode silently falls back to Ken Burns — that's fine)
      if (videoMode === "full-ai" && aiVideoMap.size < heroCount) {
        const failedCount = heroCount - aiVideoMap.size;
        console.warn(`[VideoGenerator] Full Cinematic: ${failedCount} clips fell back to Ken Burns (AI generation failed)`);
        // Continue rendering — partial AI is still better than nothing
      }
    }
  }

  // Map aspect ratio to dimensions for HTML overlays
  let htmlWidth: number;
  let htmlHeight: number;
  switch (aspectRatio) {
    case "9:16":
      htmlWidth = 1080;
      htmlHeight = 1920;
      break;
    case "1:1":
      htmlWidth = 1080;
      htmlHeight = 1080;
      break;
    case "16:9":
    default:
      htmlWidth = 1920;
      htmlHeight = 1080;
      break;
  }

  // Create clips for each image/video with varied Ken Burns effects
  // IMPORTANT: Use cumulative start times to handle AI clips (which have different durations)
  // AI clips are 5s (Kling native duration), Ken Burns clips use durationPerImage
  const AI_CLIP_DURATION = 5; // Kling AI always generates 5-second clips
  
  // First pass: calculate the actual duration of each clip
  const clipDurations = imageUrls.map((url) => {
    const aiVideoUrl = aiVideoMap.get(url);
    if (aiVideoUrl) return AI_CLIP_DURATION;
    return durationPerImage;
  });
  
  // Second pass: build cumulative start times
  const clipStarts: number[] = [];
  let cumulativeStart = 0;
  for (let i = 0; i < imageUrls.length; i++) {
    clipStarts.push(cumulativeStart);
    cumulativeStart += clipDurations[i];
  }
  
  // Recalculate total duration based on actual clip durations
  const actualMainDuration = cumulativeStart;
  
  const clips: any[] = imageUrls.map((url, index) => {
    // Check if this image has an AI-generated video
    const aiVideoUrl = aiVideoMap.get(url);
    const clipStart = clipStarts[index];
    const clipLength = clipDurations[index];
    
    // If AI video is available, use it instead of static image
    if (aiVideoUrl) {
      console.log(`[VideoGenerator] Using AI video for clip ${index + 1}: ${url} (start=${clipStart.toFixed(1)}s, length=${clipLength}s)`);
      return {
        asset: {
          type: "video",
          src: aiVideoUrl,
          trim: 0,        // Start from beginning of the AI clip
          volume: 0,      // Mute AI video audio, use music track instead
        },
        start: clipStart,
        length: clipLength,
        fit: "cover",
        ...(index > 0 && {
          transition: {
            in: "fade",
          },
        }),
      };
    }
    
    // Detect if this is a video file (check URL extension)
    const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(url);
    
    if (isVideo) {
      // For video clips, no Ken Burns effect - just play the video
      return {
        asset: {
          type: "video",
          src: url,
          volume: 0.3, // Lower volume so music is more prominent
        },
        start: clipStart,
        length: clipLength,
        fit: "cover",
      };
    }
    
    // Use Shotstack's built-in Ken Burns effects
    // These are pre-built, tested, and guaranteed to work with the API
    const builtInEffects = [
      "zoomIn",
      "zoomOut",
      "slideLeft",
      "slideRight",
      "slideUp",
      "slideDown",
    ];
    
    // Use per-photo movement if provided, otherwise cycle through effects
    let effect: string;
    if (options.perPhotoMovements && options.perPhotoMovements[index] && options.perPhotoMovements[index] !== "auto") {
      // Map custom movement names to built-in effects
      const movementToEffect: Record<string, string> = {
        "zoom-in-pan-right": "zoomIn",
        "zoom-out-pan-left": "zoomOut",
        "pan-right-zoom": "slideRight",
        "pan-left-zoom": "slideLeft",
        "dramatic-zoom": "zoomIn",
        "pan-up-zoom": "slideUp",
        "pan-down-zoom": "slideDown",
        "diagonal-pan-zoom": "zoomIn",
      };
      effect = movementToEffect[options.perPhotoMovements[index]] || "zoomIn";
    } else {
      // Cycle through built-in effects
      effect = builtInEffects[index % builtInEffects.length];
    }
    
    // Smart fit for vertical videos (9:16) to reduce aggressive cropping
    const fitMode = aspectRatio === "9:16" ? "contain" : "cover";
    
    // Smooth crossfade dissolve between photos
    // Overlap clips so the fade-out of one overlaps the fade-in of the next
    const crossfadeDuration = 0.8; // 0.8s dissolve feels cinematic without being slow
    const overlapIn = index > 0 ? crossfadeDuration : 0;
    const overlapOut = index < imageUrls.length - 1 ? crossfadeDuration : 0;
    
    // Build transition only if there's actually an in or out
    const transitionIn = index > 0 ? "fade" : undefined;
    const transitionOut = index < imageUrls.length - 1 ? "fade" : undefined;
    const transition = (transitionIn || transitionOut)
      ? { ...(transitionIn && { in: transitionIn }), ...(transitionOut && { out: transitionOut }) }
      : undefined;
    
    // Ensure start is never negative (first clip starts at 0 or introLength)
    const adjustedStart = Math.max(0, clipStart - overlapIn);
    
    const imageClip: any = {
      asset: {
        type: "image",
        src: url,
      },
      start: adjustedStart,
      length: clipLength + overlapIn + overlapOut,
      fit: fitMode,
      effect, // Use Shotstack's built-in Ken Burns effects
    };
    if (transition) imageClip.transition = transition;
    return imageClip;
  });

  // Use actual computed duration (accounts for AI clips being 5s vs Ken Burns clips)
  // This ensures text overlays and outros are timed correctly
  const effectiveDuration = actualMainDuration;
  
  // Build property details text
  const detailsParts: string[] = [];
  if (propertyDetails.price) detailsParts.push(propertyDetails.price);
  if (propertyDetails.beds && propertyDetails.baths) {
    detailsParts.push(`${propertyDetails.beds} BD | ${propertyDetails.baths} BA`);
  }
  if (propertyDetails.sqft) {
    detailsParts.push(`${propertyDetails.sqft.toLocaleString()} SQ FT`);
  }
  const detailsText = detailsParts.join(" · ");

  // Add text overlays using HTML assets (more flexible than Shotstack text assets)
  const textOverlays: any[] = [];
  const overlayWidth = htmlWidth;
  const overlayHeight = htmlHeight;
  const addrFontSize = aspectRatio === "9:16" ? 38 : 42;
  const detailFontSize = aspectRatio === "9:16" ? 28 : 32;
  const bottomPadding = aspectRatio === "9:16" ? Math.round(overlayHeight * 0.12) : Math.round(overlayHeight * 0.08);
  
  // Combined address + details overlay at bottom
  const overlayHtml = `<div style="
    width:${overlayWidth}px;
    height:${overlayHeight}px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:flex-end;
    padding-bottom:${bottomPadding}px;
    box-sizing:border-box;
    font-family:'Montserrat',sans-serif;
  ">
    <div style="
      background:rgba(0,0,0,0.5);
      border-radius:8px;
      padding:12px 24px;
      text-align:center;
      margin-bottom:8px;
    ">
      <div style="color:#FFFFFF;font-size:${addrFontSize}px;font-weight:700;line-height:1.2;">${propertyDetails.address}</div>
      ${detailsText ? `<div style="color:#C9A962;font-size:${detailFontSize}px;font-weight:500;margin-top:4px;letter-spacing:1px;">${detailsText}</div>` : ""}
    </div>
  </div>`;
  
  textOverlays.push({
    asset: {
      type: "html",
      html: overlayHtml,
      css: "body{margin:0;padding:0;overflow:hidden;background:transparent}",
      width: overlayWidth,
      height: overlayHeight,
    },
    start: 0,
    length: effectiveDuration,
    position: "center",
  });

  // REMOVED: Mid-video branding overlay
  // Branding now only appears on intro/outro cards to avoid blocking property views
  // This keeps the focus on the property features during the tour
  let brandingClips: any[] = [];

  /**
   * Generate intro card HTML based on selected template
   */
  function generateIntroCard(template: CardTemplate, address: string, price: string | undefined, agentName: string, showAgentName: boolean = true): string {
    switch (template) {
      case "modern":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);"><h1 style="color: #C9A962; font-size: 48px; font-weight: bold; margin: 0; text-align: center; font-family: 'Inter', sans-serif;">${address}</h1>${price ? `<p style="color: white; font-size: 36px; margin: 20px 0 0 0; font-family: 'Inter', sans-serif;">${price}</p>` : ""}${showAgentName && agentName ? `<p style="color: #C9A962; font-size: 24px; margin: 30px 0 0 0; font-family: 'Inter', sans-serif;">${agentName}</p>` : ""}</div>`;
      
      case "luxury":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0a0a0a 0%, #1a1515 50%, #0a0a0a 100%);"><div style="border: 2px solid #D4AF37; padding: 40px; background: rgba(0,0,0,0.5);"><h1 style="color: #D4AF37; font-size: 52px; font-weight: 300; margin: 0; text-align: center; font-family: 'Playfair Display', serif; letter-spacing: 2px;">${address}</h1>${price ? `<p style="color: #F5F5F5; font-size: 38px; margin: 25px 0 0 0; text-align: center; font-family: 'Playfair Display', serif;">${price}</p>` : ""}<div style="width: 80px; height: 1px; background: #D4AF37; margin: 25px auto;"></div>${showAgentName && agentName ? `<p style="color: #D4AF37; font-size: 22px; margin: 0; text-align: center; font-family: 'Playfair Display', serif; letter-spacing: 1px;">${agentName}</p>` : ""}</div></div>`;
      
      case "bold":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; background: linear-gradient(90deg, #FF6B35 0%, #F7931E 100%); padding: 60px;"><h1 style="color: white; font-size: 56px; font-weight: 900; margin: 0; text-align: left; font-family: 'Montserrat', sans-serif; text-transform: uppercase; line-height: 1.1; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${address}</h1>${price ? `<p style="color: #1a1a1a; font-size: 42px; margin: 20px 0 0 0; font-weight: 800; font-family: 'Montserrat', sans-serif;">${price}</p>` : ""}${showAgentName && agentName ? `<p style="color: white; font-size: 26px; margin: 30px 0 0 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">${agentName}</p>` : ""}</div>`;
      
      case "classic":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FFFFFF;"><div style="text-align: center; padding: 40px;"><h1 style="color: #2C3E50; font-size: 46px; font-weight: 600; margin: 0; font-family: 'Georgia', serif;">${address}</h1>${price ? `<p style="color: #34495E; font-size: 34px; margin: 20px 0 0 0; font-family: 'Georgia', serif;">${price}</p>` : ""}<div style="width: 100px; height: 2px; background: #C9A962; margin: 25px auto;"></div>${showAgentName && agentName ? `<p style="color: #7F8C8D; font-size: 22px; margin: 0; font-family: 'Georgia', serif; font-style: italic;">${agentName}</p>` : ""}</div></div>`;
      
      case "contemporary":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);"><div style="background: rgba(255,255,255,0.95); padding: 50px 60px; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);"><h1 style="color: #2D3748; font-size: 50px; font-weight: 700; margin: 0; text-align: center; font-family: 'Poppins', sans-serif;">${address}</h1>${price ? `<p style="color: #4A5568; font-size: 36px; margin: 20px 0 0 0; text-align: center; font-family: 'Poppins', sans-serif;">${price}</p>` : ""}${showAgentName && agentName ? `<p style="color: #667eea; font-size: 24px; margin: 25px 0 0 0; text-align: center; font-family: 'Poppins', sans-serif; font-weight: 500;">${agentName}</p>` : ""}</div></div>`;
      
      default:
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);"><h1 style="color: #C9A962; font-size: 48px; font-weight: bold; margin: 0; text-align: center;">${address}</h1>${price ? `<p style="color: white; font-size: 36px; margin: 20px 0 0 0;">${price}</p>` : ""}${showAgentName && agentName ? `<p style="color: #C9A962; font-size: 24px; margin: 30px 0 0 0;">${agentName}</p>` : ""}</div>`;
    }
  }

  /**
   * Generate outro card HTML based on selected template
   */
  function generateOutroCard(template: CardTemplate, agentName: string, contactLines: string[]): string {
    const contactHtml = contactLines.map(line => `<p style="margin: 10px 0;">${line}</p>`).join("");
    
    switch (template) {
      case "modern":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);"><h2 style="color: #C9A962; font-size: 42px; font-weight: bold; margin: 0; text-align: center; font-family: 'Inter', sans-serif;">Ready to Schedule a Showing?</h2><p style="color: white; font-size: 32px; margin: 30px 0 0 0; font-weight: 600; font-family: 'Inter', sans-serif;">${agentName}</p><div style="color: white; font-size: 24px; margin-top: 20px; font-family: 'Inter', sans-serif;">${contactHtml}</div></div>`;
      
      case "luxury":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0a0a0a 0%, #1a1515 50%, #0a0a0a 100%);"><div style="border: 2px solid #D4AF37; padding: 40px; background: rgba(0,0,0,0.5); text-align: center;"><h2 style="color: #D4AF37; font-size: 44px; font-weight: 300; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: 2px;">Schedule Your Private Tour</h2><div style="width: 80px; height: 1px; background: #D4AF37; margin: 25px auto;"></div><p style="color: #F5F5F5; font-size: 30px; margin: 0; font-family: 'Playfair Display', serif;">${agentName}</p><div style="color: #F5F5F5; font-size: 22px; margin-top: 20px; font-family: 'Playfair Display', serif;">${contactHtml}</div></div></div>`;
      
      case "bold":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; background: linear-gradient(90deg, #FF6B35 0%, #F7931E 100%); padding: 60px;"><h2 style="color: white; font-size: 48px; font-weight: 900; margin: 0; text-align: left; font-family: 'Montserrat', sans-serif; text-transform: uppercase; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">LET'S TALK!</h2><p style="color: #1a1a1a; font-size: 36px; margin: 20px 0 0 0; font-weight: 800; font-family: 'Montserrat', sans-serif;">${agentName}</p><div style="color: white; font-size: 26px; margin-top: 20px; font-family: 'Montserrat', sans-serif; font-weight: 600;">${contactHtml}</div></div>`;
      
      case "classic":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FFFFFF;"><div style="text-align: center; padding: 40px;"><h2 style="color: #2C3E50; font-size: 40px; font-weight: 600; margin: 0; font-family: 'Georgia', serif;">Contact Me Today</h2><div style="width: 100px; height: 2px; background: #C9A962; margin: 25px auto;"></div><p style="color: #34495E; font-size: 28px; margin: 0; font-family: 'Georgia', serif; font-style: italic;">${agentName}</p><div style="color: #7F8C8D; font-size: 22px; margin-top: 20px; font-family: 'Georgia', serif;">${contactHtml}</div></div></div>`;
      
      case "contemporary":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);"><div style="background: rgba(255,255,255,0.95); padding: 50px 60px; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center;"><h2 style="color: #2D3748; font-size: 46px; font-weight: 700; margin: 0; font-family: 'Poppins', sans-serif;">Let's Connect</h2><p style="color: #667eea; font-size: 32px; margin: 20px 0 0 0; font-family: 'Poppins', sans-serif; font-weight: 600;">${agentName}</p><div style="color: #4A5568; font-size: 24px; margin-top: 20px; font-family: 'Poppins', sans-serif;">${contactHtml}</div></div></div>`;
      
      default:
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);"><h2 style="color: #C9A962; font-size: 42px; font-weight: bold; margin: 0; text-align: center;">Ready to Schedule a Showing?</h2><p style="color: white; font-size: 32px; margin: 30px 0 0 0; font-weight: 600;">${agentName}</p><div style="color: white; font-size: 24px; margin-top: 20px;">${contactHtml}</div></div>`;
    }
  }

  // Add intro card (2 seconds)
  const selectedTemplate: CardTemplate = cardTemplate || "modern";
  const introCard: any[] = [];
  if (includeBranding && userId) {
    try {
      const db = await import("./db");
      const persona = await db.getPersonaByUserId(userId);
      
      if (persona) {
        const introText = generateIntroCard(
          selectedTemplate,
          propertyDetails.address,
          propertyDetails.price,
          persona.agentName || ""
        );
        
        introCard.push({
          asset: {
            type: "html",
            html: introText,
            width: htmlWidth,
            height: htmlHeight,
          },
          start: 0,
          length: 2,

        });
      }
    } catch (error) {
      console.error("[VideoGenerator] Failed to create intro card:", error);
    }
  }
  
  // Add outro card (3 seconds)
  const outroCard: any[] = [];
  if (includeBranding && userId) {
    try {
      const db = await import("./db");
      const persona = await db.getPersonaByUserId(userId);
      
      if (persona) {
        const contactLines = [];
        if (persona.phoneNumber) contactLines.push(persona.phoneNumber);
        if (persona.emailAddress) contactLines.push(persona.emailAddress);
        if (persona.websiteUrl) contactLines.push(persona.websiteUrl);
        
        const outroText = generateOutroCard(
          selectedTemplate,
          persona.agentName || "",
          contactLines
        );
        
        outroCard.push({
          asset: {
            type: "html",
            html: outroText,
            width: htmlWidth,
            height: htmlHeight,
          },
          start: effectiveDuration + 2, // After intro card + main content
          length: 3,
          transition: {
            in: "fade",
          },
        });
      }
    } catch (error) {
      console.error("[VideoGenerator] Failed to create outro card:", error);
    }
  }
  
  // Add user's intro video if enabled
  const USER_INTRO_VIDEO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/eskOJdrujAZgEfsC.mp4";
  const userIntroClip: any[] = [];
  let userIntroLength = 0;
  
  if (includeIntroVideo) {
    userIntroLength = 5; // Assume 5 second intro video
    userIntroClip.push({
      asset: {
        type: "video",
        src: USER_INTRO_VIDEO_URL,
        volume: 1.0, // Full volume for intro video
      },
      start: 0,
      length: userIntroLength,
      fit: "crop",
      position: "center",
    });
  }
  
  // Adjust timing of main clips to start after user intro and intro card
  const introCardLength = introCard.length > 0 ? 2 : 0;
  const introLength = userIntroLength + introCardLength;
  
  // Adjust intro card to start after user intro video
  const adjustedIntroCard = introCard.map(clip => ({
    ...clip,
    start: clip.start + userIntroLength,
  }));
  const adjustedClips = clips.map(clip => {
    const adjusted = { ...clip };
    adjusted.start = clip.start + introLength;
    // Preserve transform property for camera movements
    if (clip.transform) {
      adjusted.transform = clip.transform;
    }
    return adjusted;
  });
  
  const adjustedTextOverlays = textOverlays.map(overlay => ({
    ...overlay,
    start: overlay.start + introLength,
  }));
  
  const adjustedBrandingClips = brandingClips.map(clip => ({
    ...clip,
    start: clip.start + introLength,
  }));
  
  // Update total duration to include intro and outro (use effectiveDuration for AI-aware timing)
  const totalDuration = effectiveDuration + introLength + (outroCard.length > 0 ? 3 : 0);

  // Apply cinematic enhancements ONLY for Full Cinematic mode
  // Standard Ken Burns: no color grade, no vignette, no letterbox — keeps it clean and fast
  const cinematicOptions: CinematicOptions = {
    aspectRatio,
    colorGrade: "warm", // Warm grade for Full Cinematic (teal-orange is too harsh for real estate)
    vignette: isCinematic, // Vignette only for Full Cinematic
    filmGrain: false,
    lensFlare: false,
  };
  
  // Full Cinematic: apply color grade + dramatic transitions to all clips
  // Standard: pass clips through unmodified
  const enhancedClips = isCinematic
    ? applyCinematicEnhancements(adjustedClips, cinematicOptions)
    : adjustedClips;
  
  // Full Cinematic: add vignette + letterbox overlays
  // Standard: no overlays
  const cinematicOverlays = isCinematic
    ? getCinematicOverlays(cinematicOptions, totalDuration)
    : [];

  // Full Cinematic: replace basic text overlays with animated luxury lower-thirds
  // Standard: keep existing basic text overlays
  let lowerThirdOverlays: any[] = [];
  if (isCinematic) {
    const { getLuxuryLowerThird } = await import("./cinematicEffects");
    // Show lower-third starting at 1.5s into main content, hold for 5s then fade
    const lowerThirdStart = introLength + 1.5;
    const lowerThirdHold = Math.min(6, effectiveDuration - 2);
    if (lowerThirdHold > 1) {
      lowerThirdOverlays = getLuxuryLowerThird(
        propertyDetails.address,
        detailsText,
        aspectRatio,
        lowerThirdStart,
        lowerThirdHold
      );
    }
  }

  /**
   * Strip empty transition objects from clips.
   * Shotstack rejects clips with transition: {} (must have at least `in` or `out`).
   */
  function sanitizeClip(clip: any): any {
    const c = { ...clip };
    if (c.transition && Object.keys(c.transition).length === 0) {
      delete c.transition;
    }
    return c;
  }

  /**
   * Remove `filter` from video clips — Shotstack only supports filter on image clips.
   * Also strips empty transition objects.
   */
  function stripFilterFromVideoClips(clips: any[]): any[] {
    return clips.map(clip => {
      const c = sanitizeClip(clip);
      if (c.asset?.type === "video" && c.filter) {
        delete c.filter;
      }
      // Ensure start is never negative
      if (typeof c.start === "number" && c.start < 0) {
        c.start = 0;
      }
      // Ensure length is always positive
      if (typeof c.length === "number" && c.length <= 0) {
        c.length = 1;
      }
      return c;
    });
  }

  // Base video/image track: user intro + intro card + main photo/video clips + outro card
  // These are all image/video assets — no HTML overlays mixed in
  const baseVideoClips = stripFilterFromVideoClips([
    ...userIntroClip,
    ...adjustedIntroCard,
    ...enhancedClips,
    ...adjustedBrandingClips,
    ...outroCard,
  ]);

  // Overlay track: text overlays, lower-thirds, vignette, letterbox
  // These are HTML/text assets — must be in a separate track layered on top
  const overlayClips = [
    ...(isCinematic ? lowerThirdOverlays : adjustedTextOverlays),
    ...cinematicOverlays,
  ].map(sanitizeClip);

  // For Shotstack: tracks are rendered bottom-to-top (track[0] = bottom)
  // So base video goes in track[0], overlays go in track[1]
  const allClips = baseVideoClips; // kept for backward compat reference

  // Map aspect ratio to resolution and size
  let resolution: string;
  let size: { width: number; height: number } | undefined;
  
  switch (aspectRatio) {
    case "9:16":
      // For vertical videos, use custom size
      resolution = "1080"; // Base resolution
      size = { width: 1080, height: 1920 };
      break;
    case "1:1":
      // For square videos, use custom size
      resolution = "1080";
      size = { width: 1080, height: 1080 };
      break;
    case "16:9":
    default:
      resolution = "hd"; // 1920x1080 for YouTube
      size = undefined; // hd preset handles this
      break;
  }

  // Resolve music track URL
  const musicTrackUrl = musicTrack ? getMusicTrackUrl(musicTrack) : undefined;

  // Generate or use cached Kling Avatar video for agent overlay
  let avatarVideoUrl: string | undefined;
  if (enableAvatarOverlay && options.agentHeadshotUrl && options.agentVoiceUrl) {
    try {
      if (options.klingAvatarVideoUrl) {
        avatarVideoUrl = options.klingAvatarVideoUrl;
        console.log("[VideoGenerator] Using cached Kling Avatar video:", avatarVideoUrl);
      } else {
        console.log("[VideoGenerator] Generating Kling Avatar 2.0 narration...");
        const { generateAgentAvatarVideo } = await import("./_core/klingAi");
        avatarVideoUrl = await generateAgentAvatarVideo(
          options.agentHeadshotUrl,
          options.agentVoiceUrl,
          propertyDetails.address,
          "std"
        );
        console.log("[VideoGenerator] \u2713 Kling Avatar video ready:", avatarVideoUrl);
      }
    } catch (err: any) {
      console.warn("[VideoGenerator] Kling Avatar generation failed, skipping overlay:", err.message);
    }
  }

  // Fetch agent persona for branding
  let agentName = "";
  let agentPhone: string | undefined;
  let agentEmail: string | undefined;
  let agentWebsite: string | undefined;
  if (includeBranding && userId) {
    try {
      const dbModule = await import("./db");
      const persona = await dbModule.getPersonaByUserId(userId);
      if (persona) {
        agentName = persona.agentName || "";
        agentPhone = persona.phoneNumber || undefined;
        agentEmail = persona.emailAddress || undefined;
        agentWebsite = persona.websiteUrl || undefined;
      }
    } catch (err: any) {
      console.warn("[VideoGenerator] Failed to fetch agent persona:", err.message);
    }
  }

  // ── Submit to Creatomate ──────────────────────────────────────────────────
  writeLog("[VideoGenerator] Submitting render to Creatomate...");
  writeLog(`[VideoGenerator] Image count: ${imageUrls.length}`);
  writeLog(`[VideoGenerator] Duration: ${duration}`);

  try {
    const { renderPropertyTour } = await import("./_core/creatomateRenderer");
    const result = await renderPropertyTour({
      imageUrls,
      propertyDetails,
      duration,
      musicTrackUrl,
      includeBranding,
      aspectRatio,
      cardTemplate,
      videoMode,
      enableVoiceover,
      voiceoverUrl,
      perPhotoMovements: options.perPhotoMovements,
      movementSpeed: options.movementSpeed,
      aiVideoMap,
      agentName,
      agentPhone,
      agentEmail,
      agentWebsite,
      avatarVideoUrl,
      avatarOverlayPosition,
      includeIntroVideo,
      introVideoUrl: includeIntroVideo ? "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/eskOJdrujAZgEfsC.mp4" : undefined,
    });

    writeLog(`[VideoGenerator] Creatomate render queued: ${result.renderId}`);
    return { renderId: result.renderId };
  } catch (error: any) {
    writeLog(`[VideoGenerator] Creatomate render failed: ${error.message}`);
    console.error("[VideoGenerator] Creatomate render failed:", error);
    throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Check the status of a Creatomate render job
 */
export async function checkRenderStatus(renderId: string): Promise<{
  status: "queued" | "fetching" | "rendering" | "saving" | "done" | "failed";
  url?: string;
  thumbnail?: string;
  poster?: string;
  error?: string;
}> {
  try {
    console.log("[VideoGenerator] Checking Creatomate render status for:", renderId);
    const { checkRenderStatus: creatomateCheck } = await import("./_core/creatomateRenderer");
    const result = await creatomateCheck(renderId);
    // Map Creatomate statuses to legacy interface
    const statusMap: Record<string, "queued" | "fetching" | "rendering" | "saving" | "done" | "failed"> = {
      queued: "queued",
      waiting: "queued",
      rendering: "rendering",
      done: "done",
      failed: "failed",
    };
    return {
      status: statusMap[result.status] ?? "rendering",
      url: result.url,
      thumbnail: result.thumbnail,
      poster: result.poster,
      error: result.error,
    };
  } catch (error) {
    console.error("[VideoGenerator] Failed to check render status:", error);
    throw new Error(
      `Failed to check render status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
