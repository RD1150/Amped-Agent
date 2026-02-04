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
}

const SHOTSTACK_API_URL = "https://api.shotstack.io/v1";

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
  } = options;

  if (imageUrls.length === 0) {
    throw new Error("At least one image is required");
  }

  // Calculate duration per image
  const durationPerImage = duration / imageUrls.length;

  // Create clips for each image with varied Ken Burns effects
  const clips: any[] = imageUrls.map((url, index) => {
    // Cycle through 4 different motion effects for variety
    const motionType = index % 4;
    
    let effect, scale, position;
    
    switch (motionType) {
      case 0: // Zoom in from center
        effect = "zoomIn";
        scale = 1.0;
        position = "center";
        break;
      case 1: // Zoom out from center
        effect = "zoomOut";
        scale = 1.2;
        position = "center";
        break;
      case 2: // Pan from left to right
        effect = "slideRight";
        scale = 1.1;
        position = "left";
        break;
      case 3: // Pan from right to left
        effect = "slideLeft";
        scale = 1.1;
        position = "right";
        break;
      default:
        effect = "zoomIn";
        scale = 1.0;
        position = "center";
    }
    
    return {
      asset: {
        type: "image",
        src: url,
      },
      start: index * durationPerImage,
      length: durationPerImage,
      fit: "cover",
      scale: scale,
      position: position,
      transition: {
        in: index === 0 ? "fade" : "fade",
        out: "fade",
      },
      effect: effect,
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

  // Add text overlays
  const titleClip = {
    asset: {
      type: "title",
      text: propertyDetails.address,
      style: "blockbuster",
      color: "#ffffff",
      size: "medium",
      background: "rgba(0,0,0,0.6)",
      position: "bottom",
      offset: {
        y: 0.15,
      },
    },
    start: 0,
    length: duration,
  };

  const detailsClip = detailsText
    ? {
        asset: {
          type: "title",
          text: detailsText,
          style: "subtitle",
          color: "#ffffff",
          size: "small",
          background: "rgba(0,0,0,0.6)",
          position: "bottom",
          offset: {
            y: 0.05,
          },
        },
        start: 0,
        length: duration,
      }
    : null;

  // Combine all clips
  const allClips = detailsClip ? [...clips, titleClip, detailsClip] : [...clips, titleClip];

  // Create edit payload
  const payload = {
    timeline: {
      tracks: [
        {
          clips: allClips,
        },
      ],
    },
    output: {
      format: "mp4",
      resolution: "hd",
      fps: 30,
      quality: "high",
    },
  };

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
      error: render.error || undefined,
    };
  } catch (error) {
    console.error("[VideoGenerator] Failed to check render status:", error);
    throw new Error(
      `Failed to check render status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
