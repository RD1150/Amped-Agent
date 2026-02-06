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
}

const SHOTSTACK_API_URL = "https://api.shotstack.io/v1";

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
  } = options;

  if (imageUrls.length === 0) {
    throw new Error("At least one image is required");
  }

  // Calculate duration per image
  const durationPerImage = duration / imageUrls.length;

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
    
    // For images, apply dynamic camera movements like a videographer
    // Cycle through different movement types for variety
    const movements = [
      // Zoom in with slight pan right
      { scale: { start: 1.0, end: 1.3 }, x: { start: 0, end: -50 } },
      // Zoom out with slight pan left
      { scale: { start: 1.3, end: 1.0 }, x: { start: -50, end: 0 } },
      // Pan right to left with zoom
      { scale: { start: 1.1, end: 1.25 }, x: { start: -80, end: 80 } },
      // Pan left to right with zoom
      { scale: { start: 1.1, end: 1.25 }, x: { start: 80, end: -80 } },
      // Vertical pan down with zoom in
      { scale: { start: 1.0, end: 1.3 }, y: { start: -50, end: 50 } },
      // Vertical pan up with zoom out
      { scale: { start: 1.3, end: 1.0 }, y: { start: 50, end: -50 } },
      // Dramatic zoom in
      { scale: { start: 1.0, end: 1.4 } },
      // Slow zoom out
      { scale: { start: 1.35, end: 1.05 } },
    ];
    
    const movement = movements[index % movements.length];
    
    return {
      asset: {
        type: "image",
        src: url,
      },
      start: index * durationPerImage,
      length: durationPerImage,
      fit: "crop",
      position: "center",
      transition: {
        in: index === 0 ? "fade" : "fade",
        out: "fade",
      },
      transform: movement,
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

  // Add text overlays using HTML assets (simpler approach)
  const textOverlays: any[] = [];
  
  // Address overlay
  textOverlays.push({
    asset: {
      type: "html",
      html: `<div style="width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 120px;"><div style="background: rgba(0,0,0,0.8); padding: 15px 30px; border-radius: 8px;"><p style="color: white; font-size: 36px; font-weight: bold; margin: 0; text-align: center;">${propertyDetails.address}</p></div></div>`,
      width: htmlWidth,
      height: htmlHeight,
    },
    start: 0,
    length: duration,
  });
  
  // Details overlay
  if (detailsText) {
    textOverlays.push({
      asset: {
        type: "html",
        html: `<div style="width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 60px;"><div style="background: rgba(0,0,0,0.8); padding: 10px 25px; border-radius: 6px;"><p style="color: white; font-size: 24px; margin: 0; text-align: center;">${detailsText}</p></div></div>`,
        width: htmlWidth,
        height: htmlHeight,
      },
      start: 0,
      length: duration,
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

  // Combine all clips
  const allClips = [
    ...clips,
    ...textOverlays,
    ...brandingClips,
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

  // Add music soundtrack if selected
  const soundtrack: any = musicTrack ? {
    src: getMusicTrackUrl(musicTrack),
    effect: "fadeInFadeOut",
    volume: 0.3,
  } : undefined;

  // Create edit payload
  const payload: any = {
    timeline: {
      soundtrack,
      tracks: [
        {
          clips: allClips,
        },
      ],
    },
    output: {
      format: "mp4",
      resolution,
      ...(size && { size }), // Add size for custom dimensions
      fps: 30,
      quality: "high",
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
      console.error("[VideoGenerator] Shotstack API error:", errorText);
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

    return {
      status: render.status as any,
      url: render.url || undefined,
      thumbnail: render.thumbnail || undefined,
      error: render.error || undefined,
    };
  } catch (error) {
    console.error("[VideoGenerator] Failed to check render status:", error);
    throw new Error(
      `Failed to check render status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
