import Shotstack from "shotstack-sdk";

// Initialize Shotstack client lazily
function getApiClient() {
  const defaultClient = Shotstack.ApiClient.instance;
  const DeveloperKey = defaultClient.authentications["DeveloperKey"];
  DeveloperKey.apiKey = process.env.SHOTSTACK_API_KEY || "";

  if (!DeveloperKey.apiKey) {
    console.error("[VideoGenerator] SHOTSTACK_API_KEY not configured");
    throw new Error("SHOTSTACK_API_KEY is not configured. Please contact support.");
  }

  return new Shotstack.EditApi();
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
}

/**
 * Generate a cinematic property tour video using Shotstack API
 * Creates Ken Burns effect with smooth transitions
 */
export async function generatePropertyTourVideo(
  options: VideoGenerationOptions
): Promise<{ renderId: string }> {
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

  // Create clips for each image with Ken Burns effect
  const clips: any[] = imageUrls.map((url, index) => {
    // Alternate zoom directions for variety
    const zoomIn = index % 2 === 0;
    
    return {
      asset: {
        type: "image",
        src: url,
      },
      start: index * durationPerImage,
      length: durationPerImage,
      fit: "cover",
      scale: zoomIn ? 1.0 : 1.2, // Start scale
      position: "center",
      transition: {
        in: index === 0 ? "fade" : "fade",
        out: "fade",
      },
      effect: "zoomIn", // Ken Burns zoom effect
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

  // Create timeline
  const timeline = new Shotstack.Timeline();
  const track = new Shotstack.Track();
  track.clips = allClips;
  timeline.tracks = [track];

  // Set output format
  const output = new Shotstack.Output();
  output.format = "mp4";
  output.resolution = "hd";
  output.fps = 30;
  output.quality = "high";

  // Create edit
  const edit = new Shotstack.Edit();
  edit.timeline = timeline;
  edit.output = output;

  try {
    console.log("[VideoGenerator] Submitting render to Shotstack...");
    console.log("[VideoGenerator] Image count:", imageUrls.length);
    console.log("[VideoGenerator] Duration:", duration);
    
    const api = getApiClient();
    
    // Submit render job
    const response = await api.postRender(edit);
    
    if (!response || !response.response || !response.response.id) {
      throw new Error("Invalid response from Shotstack API");
    }

    console.log("[VideoGenerator] Shotstack render started:", response.response.id);

    return {
      renderId: response.response.id,
    };
  } catch (error: any) {
    console.error("[VideoGenerator] Shotstack render failed:", error);
    console.error("[VideoGenerator] Error details:", JSON.stringify(error, null, 2));
    
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
  try {
    const api = getApiClient();
    const response = await api.getRender(renderId);
    
    if (!response || !response.response) {
      throw new Error("Invalid response from Shotstack API");
    }

    const render = response.response;

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
