// Direct HTTP API implementation to avoid Shotstack SDK parsing issues

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
}

export type CardTemplate = "modern" | "luxury" | "bold" | "classic" | "contemporary";

import { ENV } from "./_core/env";

const SHOTSTACK_API_URL = ENV.SHOTSTACK_HOST;

/**
 * Get royalty-free music track URL from Shotstack library
 * Using Shotstack's built-in music library
 */
function getMusicTrackUrl(trackType: string): string {
  // Shotstack provides royalty-free music tracks
  // These are example URLs - in production, use actual Shotstack music library URLs
  const tracks: Record<string, string> = {
    upbeat: "https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/unminus/ambisax.mp3",
    calm: "https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/unminus/blueskies.mp3",
    luxury: "https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/unminus/palmtrees.mp3",
  };
  return tracks[trackType] || tracks.upbeat;
}

/**
 * Generate a cinematic property tour video using Shotstack API
 * Creates Ken Burns effect with smooth transitions
 */
export async function generatePropertyTourVideo(
  options: VideoGenerationOptions
): Promise<{ renderId: string }> {
  const apiKey = process.env.SHOTSTACK_API_KEY;
  
  if (!apiKey) {
    console.error("[VideoGenerator] SHOTSTACK_API_KEY not configured");
    throw new Error("SHOTSTACK_API_KEY is not configured. Please contact support.");
  }

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

  if (imageUrls.length === 0) {
    throw new Error("At least one image is required");
  }

  // Calculate duration per image
  const durationPerImage = duration / imageUrls.length;

  // Generate voiceover if enabled
  let voiceoverUrl: string | undefined;
  if (enableVoiceover) {
    console.log("[VideoGenerator] Generating voiceover narration...");
    const { generatePropertyTourScript } = await import("./scriptGenerator");
    const { textToSpeech } = await import("./_core/elevenLabs");
    const { storagePut } = await import("./storage");
    
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
    
    console.log("[VideoGenerator] Script generated:", script.substring(0, 100) + "...");
    
    // Generate audio with ElevenLabs
    const audioBuffer = await textToSpeech({
      text: script,
      voice_id: voiceId,
    });
    
    // Upload to S3
    const timestamp = Date.now();
    const audioKey = `property-tours/voiceovers/${timestamp}-voiceover.mp3`;
    const { url } = await storagePut(audioKey, audioBuffer, "audio/mpeg");
    voiceoverUrl = url;
    
    console.log("[VideoGenerator] Voiceover generated and uploaded:", voiceoverUrl);
  }

  // Generate AI videos for hero photos if using AI-enhanced or full-ai mode
  let aiVideoMap = new Map<string, string>();
  if (videoMode === "ai-enhanced" || videoMode === "full-ai") {
    const { generateHeroVideoClips, getHeroCountForMode } = await import("./hybridVideoGenerator");
    const heroCount = getHeroCountForMode(videoMode, imageUrls.length);
    
    if (heroCount > 0) {
      console.log(`[VideoGenerator] Generating ${heroCount} AI-enhanced clips with Runway ML...`);
      aiVideoMap = await generateHeroVideoClips(imageUrls, heroCount, aspectRatio, options.customCameraPrompt);
      console.log(`[VideoGenerator] AI generation complete. ${aiVideoMap.size} clips ready.`);
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
  const clips: any[] = imageUrls.map((url, index) => {
    // Check if this image has an AI-generated video
    const aiVideoUrl = aiVideoMap.get(url);
    
    // If AI video is available, use it instead of static image
    if (aiVideoUrl) {
      console.log(`[VideoGenerator] Using AI video for: ${url}`);
      return {
        asset: {
          type: "video",
          src: aiVideoUrl,
          volume: 0, // Mute AI video, use music track instead
        },
        start: index * durationPerImage,
        length: durationPerImage,
        fit: "cover",
        transition: {
          in: index === 0 ? "fade" : "fade",
          out: "fade",
        },
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
        start: index * durationPerImage,
        length: durationPerImage,
        fit: "cover",
        transition: {
          in: index === 0 ? "fade" : "fade",
          out: "fade",
        },
      };
    }
    
    // AutoReels-style custom Ken Burns effects with dramatic movements
    // Create custom scale + offset animations for professional cinematic feel
    const cinematicAnimations = [
      // Zoom in with slight pan right
      { scale: { from: 1.0, to: 1.3 }, offset: { x: { from: 0, to: 0.05 }, y: { from: 0, to: 0 } } },
      // Zoom out with pan left
      { scale: { from: 1.3, to: 1.0 }, offset: { x: { from: 0.05, to: 0 }, y: { from: 0, to: 0 } } },
      // Pan right with slight zoom
      { scale: { from: 1.1, to: 1.25 }, offset: { x: { from: -0.1, to: 0.1 }, y: { from: 0, to: 0 } } },
      // Pan left with zoom in
      { scale: { from: 1.0, to: 1.3 }, offset: { x: { from: 0.1, to: -0.05 }, y: { from: 0, to: 0 } } },
      // Dramatic zoom in (hero shot)
      { scale: { from: 1.0, to: 1.4 }, offset: { x: { from: 0, to: 0 }, y: { from: 0, to: 0 } } },
      // Pan up with zoom
      { scale: { from: 1.1, to: 1.3 }, offset: { x: { from: 0, to: 0 }, y: { from: 0.05, to: -0.05 } } },
      // Pan down with zoom out
      { scale: { from: 1.3, to: 1.1 }, offset: { x: { from: 0, to: 0 }, y: { from: -0.05, to: 0.05 } } },
      // Diagonal pan with zoom
      { scale: { from: 1.0, to: 1.35 }, offset: { x: { from: -0.05, to: 0.05 }, y: { from: -0.05, to: 0.05 } } },
    ];
    
    const animation = cinematicAnimations[index % cinematicAnimations.length];
    
    // Smart fit for vertical videos (9:16) to reduce aggressive cropping
    const fitMode = aspectRatio === "9:16" ? "contain" : "cover";
    
    return {
      asset: {
        type: "image",
        src: url,
      },
      start: index * durationPerImage,
      length: durationPerImage,
      fit: fitMode,
      // Custom transform animations for AutoReels-quality movement
      transform: {
        scale: [
          {
            from: animation.scale.from,
            to: animation.scale.to,
            start: 0,
            length: durationPerImage,
            interpolation: "bezier",
            easing: "easeInOutQuad",
          },
        ],
      },
      offset: {
        x: [
          {
            from: animation.offset.x.from,
            to: animation.offset.x.to,
            start: 0,
            length: durationPerImage,
            interpolation: "bezier",
            easing: "easeInOutQuad",
          },
        ],
        y: [
          {
            from: animation.offset.y.from,
            to: animation.offset.y.to,
            start: 0,
            length: durationPerImage,
            interpolation: "bezier",
            easing: "easeInOutQuad",
          },
        ],
      },
      // Use cut transitions for continuous cinematic flow (AutoReels style)
      transition: index === 0 ? { in: "fade" } : undefined,
    };
  });

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

  // Add text overlays using Shotstack text assets (cleaner rendering)
  const textOverlays: any[] = [];
  
  // Address overlay - positioned at bottom with proper padding
  textOverlays.push({
    asset: {
      type: "text",
      text: propertyDetails.address,
      font: {
        family: "Montserrat SemiBold",
        size: aspectRatio === "9:16" ? 38 : 42,
        color: "#FFFFFF",
        weight: 700,
      },
      background: {
        color: "#000000",
        opacity: 0.85,
        borderRadius: 8,
        padding: 15,
      },
      alignment: {
        horizontal: "center",
        vertical: "bottom",
      },
      width: aspectRatio === "9:16" ? 1000 : 1600,
      height: aspectRatio === "9:16" ? 200 : 150,
    },
    start: 0,
    length: duration,
    position: "bottom",
    offset: {
      y: aspectRatio === "9:16" ? -0.15 : -0.12,
    },
  });
  
  // Details overlay - positioned above address
  if (detailsText) {
    textOverlays.push({
      asset: {
        type: "text",
        text: detailsText,
        font: {
          family: "Montserrat SemiBold",
          size: aspectRatio === "9:16" ? 28 : 32,
          color: "#FFFFFF",
          weight: 600,
        },
        background: {
          color: "#000000",
          opacity: 0.85,
          borderRadius: 6,
          padding: 12,
        },
        alignment: {
          horizontal: "center",
          vertical: "bottom",
        },
        width: aspectRatio === "9:16" ? 900 : 1400,
        height: aspectRatio === "9:16" ? 120 : 100,
      },
      start: 0,
      length: duration,
      position: "bottom",
      offset: {
        y: aspectRatio === "9:16" ? -0.05 : -0.03,
      },
    });
  }

  // Add agent branding overlay if enabled
  let brandingClips: any[] = [];
  if (includeBranding && userId) {
    try {
      // Import db functions
      const db = await import("./db");
      
      // Fetch agent profile
      const persona = await db.getPersonaByUserId(userId);
      
      if (persona && persona.headshotUrl) {
        // Add agent branding as HTML overlay in bottom-right
        const contactInfo = [];
        if (persona.agentName) contactInfo.push(persona.agentName);
        if (persona.phoneNumber) contactInfo.push(persona.phoneNumber);
        if (persona.websiteUrl) contactInfo.push(persona.websiteUrl);
        if (persona.emailAddress) contactInfo.push(persona.emailAddress);
        
        if (contactInfo.length > 0 && persona.headshotUrl) {
          // Combined branding with headshot and info
          brandingClips.push({
            asset: {
              type: "html",
              html: `<div style="width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: flex-end; padding: 20px;"><div style="background: rgba(0,0,0,0.8); padding: 10px; border-radius: 8px; display: flex; align-items: center; gap: 10px;"><img src="${persona.headshotUrl}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" /><p style="color: white; font-size: 16px; margin: 0;">${contactInfo.join(" · ")}</p></div></div>`,
              width: htmlWidth,
              height: htmlHeight,
            },
            start: 0,
            length: duration,
          });
        }
      }
    } catch (error) {
      console.error("[VideoGenerator] Failed to fetch agent profile:", error);
      // Continue without branding if fetch fails
    }
  }

  /**
   * Generate intro card HTML based on selected template
   */
  function generateIntroCard(template: CardTemplate, address: string, price: string | undefined, agentName: string): string {
    switch (template) {
      case "modern":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);"><h1 style="color: #C9A962; font-size: 48px; font-weight: bold; margin: 0; text-align: center; font-family: 'Inter', sans-serif;">${address}</h1>${price ? `<p style="color: white; font-size: 36px; margin: 20px 0 0 0; font-family: 'Inter', sans-serif;">${price}</p>` : ""}<p style="color: #C9A962; font-size: 24px; margin: 30px 0 0 0; font-family: 'Inter', sans-serif;">${agentName}</p></div>`;
      
      case "luxury":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0a0a0a 0%, #1a1515 50%, #0a0a0a 100%);"><div style="border: 2px solid #D4AF37; padding: 40px; background: rgba(0,0,0,0.5);"><h1 style="color: #D4AF37; font-size: 52px; font-weight: 300; margin: 0; text-align: center; font-family: 'Playfair Display', serif; letter-spacing: 2px;">${address}</h1>${price ? `<p style="color: #F5F5F5; font-size: 38px; margin: 25px 0 0 0; text-align: center; font-family: 'Playfair Display', serif;">${price}</p>` : ""}<div style="width: 80px; height: 1px; background: #D4AF37; margin: 25px auto;"></div><p style="color: #D4AF37; font-size: 22px; margin: 0; text-align: center; font-family: 'Playfair Display', serif; letter-spacing: 1px;">${agentName}</p></div></div>`;
      
      case "bold":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; background: linear-gradient(90deg, #FF6B35 0%, #F7931E 100%); padding: 60px;"><h1 style="color: white; font-size: 56px; font-weight: 900; margin: 0; text-align: left; font-family: 'Montserrat', sans-serif; text-transform: uppercase; line-height: 1.1; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${address}</h1>${price ? `<p style="color: #1a1a1a; font-size: 42px; margin: 20px 0 0 0; font-weight: 800; font-family: 'Montserrat', sans-serif;">${price}</p>` : ""}<p style="color: white; font-size: 26px; margin: 30px 0 0 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">${agentName}</p></div>`;
      
      case "classic":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FFFFFF;"><div style="text-align: center; padding: 40px;"><h1 style="color: #2C3E50; font-size: 46px; font-weight: 600; margin: 0; font-family: 'Georgia', serif;">${address}</h1>${price ? `<p style="color: #34495E; font-size: 34px; margin: 20px 0 0 0; font-family: 'Georgia', serif;">${price}</p>` : ""}<div style="width: 100px; height: 2px; background: #C9A962; margin: 25px auto;"></div><p style="color: #7F8C8D; font-size: 22px; margin: 0; font-family: 'Georgia', serif; font-style: italic;">${agentName}</p></div></div>`;
      
      case "contemporary":
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);"><div style="background: rgba(255,255,255,0.95); padding: 50px 60px; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);"><h1 style="color: #2D3748; font-size: 50px; font-weight: 700; margin: 0; text-align: center; font-family: 'Poppins', sans-serif;">${address}</h1>${price ? `<p style="color: #4A5568; font-size: 36px; margin: 20px 0 0 0; text-align: center; font-family: 'Poppins', sans-serif;">${price}</p>` : ""}<p style="color: #667eea; font-size: 24px; margin: 25px 0 0 0; text-align: center; font-family: 'Poppins', sans-serif; font-weight: 500;">${agentName}</p></div></div>`;
      
      default:
        return `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);"><h1 style="color: #C9A962; font-size: 48px; font-weight: bold; margin: 0; text-align: center;">${address}</h1>${price ? `<p style="color: white; font-size: 36px; margin: 20px 0 0 0;">${price}</p>` : ""}<p style="color: #C9A962; font-size: 24px; margin: 30px 0 0 0;">${agentName}</p></div>`;
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
          transition: {
            out: "fade",
          },
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
          start: duration + 2, // After intro + main content
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
  
  // Update total duration to include intro and outro
  const totalDuration = duration + introLength + (outroCard.length > 0 ? 3 : 0);

  // Combine all clips
  const allClips = [
    ...userIntroClip,
    ...adjustedIntroCard,
    ...adjustedClips,
    ...adjustedTextOverlays,
    ...adjustedBrandingClips,
    ...outroCard,
  ];

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

  // Add music soundtrack if selected (extend to cover intro/outro)
  const soundtrack: any = musicTrack ? {
    type: "audio", // Required: specify asset type
    src: getMusicTrackUrl(musicTrack),
    effect: "fadeInFadeOut",
    volume: enableVoiceover ? 0.3 : 0.6, // Increased volume for audibility
  } : undefined;

  // Add voiceover audio track if enabled
  const voiceoverTrack: any[] = [];
  if (voiceoverUrl) {
    voiceoverTrack.push({
      asset: {
        type: "audio",
        src: voiceoverUrl,
        volume: 1.0,
      },
      start: introLength, // Start after intro
      length: duration, // Match main video duration
    });
  }

  // Create edit payload
  const payload: any = {
    timeline: {
      soundtrack,
      tracks: [
        {
          clips: allClips,
        },
        ...(voiceoverTrack.length > 0 ? [{ clips: voiceoverTrack }] : []),
      ],
    },
    output: {
      format: "mp4",
      resolution,
      ...(size && { size }), // Add size for custom dimensions
      fps: 30,
      quality: "high",
      // Generate poster image from the most visually appealing frame
      // Capture at 25% through the video (after intro, during property photos)
      poster: {
        capture: Math.max(introLength + (duration * 0.25), 1), // Capture at 25% of main content
      },
    },
  };

  // Remove undefined soundtrack
  if (!soundtrack) {
    delete payload.timeline.soundtrack;
  }

  try {
    console.log("[VideoGenerator] Submitting render to Shotstack...");
    console.log("[VideoGenerator] Image count:", imageUrls.length);
    console.log("[VideoGenerator] Duration:", duration);
    console.log("[VideoGenerator] Payload:", JSON.stringify(payload, null, 2));
    
    // Submit render job via HTTP
    const response = await fetch(`${SHOTSTACK_API_URL}/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[VideoGenerator] Shotstack API error:", response.status, response.statusText);
      console.error("[VideoGenerator] Error response body:", errorText);
      console.error("[VideoGenerator] Request URL:", `${SHOTSTACK_API_URL}/render`);
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result || !result.response || !result.response.id) {
      throw new Error("Invalid response from Shotstack API");
    }

    console.log("[VideoGenerator] Shotstack render started:", result.response.id);

    return {
      renderId: result.response.id,
    };
  } catch (error: any) {
    console.error("[VideoGenerator] Shotstack render failed:", error);
    console.error("[VideoGenerator] Error details:", error.message);
    
    // Check for specific error types
    if (error.status === 401 || error.status === 403) {
      throw new Error("Invalid Shotstack API key. Please check your configuration.");
    }
    
    throw new Error(
      `Failed to generate video: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Check the status of a Shotstack render job
 */
export async function checkRenderStatus(renderId: string): Promise<{
  status: "queued" | "fetching" | "rendering" | "saving" | "done" | "failed";
  url?: string;
  thumbnail?: string;
  poster?: string;
  error?: string;
}> {
  const apiKey = process.env.SHOTSTACK_API_KEY;
  
  if (!apiKey) {
    throw new Error("SHOTSTACK_API_KEY is not configured");
  }

  try {
    console.log("[VideoGenerator] Checking render status for:", renderId);
    
    const response = await fetch(`${SHOTSTACK_API_URL}/render/${renderId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[VideoGenerator] Status check error:", errorText);
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result || !result.response) {
      throw new Error("Invalid response from Shotstack API");
    }

    const render = result.response;
    
    console.log("[VideoGenerator] Render status:", render.status);
    if (render.url) {
      console.log("[VideoGenerator] Video URL:", render.url);
    }
    if (render.poster) {
      console.log("[VideoGenerator] Poster URL:", render.poster);
    }

    return {
      status: render.status as any,
      url: render.url || undefined,
      thumbnail: render.thumbnail || undefined,
      poster: render.poster || undefined,
      error: render.error || undefined,
    };
  } catch (error) {
    console.error("[VideoGenerator] Failed to check render status:", error);
    throw new Error(
      `Failed to check render status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
