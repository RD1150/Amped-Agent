/**
 * Cinematic visual enhancements for property tour videos
 * Adds professional color grading, effects, and transitions
 */

export interface CinematicOptions {
  aspectRatio: "16:9" | "9:16" | "1:1";
  colorGrade?: "teal-orange" | "moody" | "warm" | "cool" | "natural";
  filmGrain?: boolean;
  vignette?: boolean;
  lensFlare?: boolean;
}

/**
 * Generate color grading LUT (Look-Up Table) overlay
 * Shotstack supports color adjustments via brightness, contrast, saturation
 */
export function getColorGradingFilter(grade: string = "teal-orange") {
  const grades: Record<string, any> = {
    "teal-orange": {
      brightness: 0.05,
      contrast: 0.15,
      saturation: 0.2,
      // Teal shadows, orange highlights (cinematic look)
    },
    "moody": {
      brightness: -0.1,
      contrast: 0.25,
      saturation: -0.1,
      // Dark, desaturated, high contrast
    },
    "warm": {
      brightness: 0.1,
      contrast: 0.1,
      saturation: 0.15,
      // Warm, inviting tones
    },
    "cool": {
      brightness: 0,
      contrast: 0.1,
      saturation: 0.05,
      // Cool, modern tones
    },
    "natural": {
      brightness: 0,
      contrast: 0.05,
      saturation: 0,
      // Minimal grading
    },
  };

  return grades[grade] || grades["teal-orange"];
}

/**
 * Add film grain overlay asset
 * Returns Shotstack asset for film grain texture
 */
export function getFilmGrainOverlay(aspectRatio: string) {
  // Film grain video overlay (subtle texture)
  return {
    asset: {
      type: "video",
      src: "https://files.manuscdn.com/film-grain-overlay.mp4", // Placeholder - need to upload actual grain
      volume: 0,
    },
    length: 999, // Cover entire video
    start: 0,
    opacity: 0.15, // Subtle grain
    fit: "cover",
  };
}

/**
 * Add vignette overlay
 * Dark edges for cinematic focus
 */
export function getVignetteOverlay(aspectRatio: string) {
  return {
    asset: {
      type: "html",
      html: `
        <div style="
          width: 100%;
          height: 100%;
          background: radial-gradient(
            ellipse at center,
            transparent 0%,
            transparent 40%,
            rgba(0,0,0,0.3) 70%,
            rgba(0,0,0,0.6) 100%
          );
        "></div>
      `,
      css: "body { margin: 0; }",
      width: aspectRatio === "9:16" ? 1080 : 1920,
      height: aspectRatio === "9:16" ? 1920 : 1080,
    },
    length: 999,
    start: 0,
    opacity: 0.8,
  };
}

/**
 * Get smooth cross-dissolve transition
 * Better than hard cuts for cinematic feel
 */
export function getCinematicTransition(index: number, totalClips: number) {
  if (index === 0) {
    return {
      in: "fade",
      out: "fade",
    };
  }
  
  if (index === totalClips - 1) {
    return {
      in: "fade",
    };
  }
  
  return {
    in: "fade",
    out: "fade",
  };
}

/**
 * Add lens flare effect at strategic moments
 * Subtle light leaks for cinematic feel
 */
export function getLensFlareOverlay(startTime: number, duration: number = 2) {
  return {
    asset: {
      type: "luma",
      // Shotstack luma effect for light leaks
      src: "https://shotstack-assets.s3.amazonaws.com/luma/light-leak-1.mp4",
    },
    start: startTime,
    length: duration,
    opacity: 0.3,
    fit: "cover",
  };
}

/**
 * Apply cinematic enhancements to video clips
 * Modifies clips array in place
 */
export function applyCinematicEnhancements(
  clips: any[],
  options: CinematicOptions
): any[] {
  const enhancedClips = [...clips];
  
  // Apply color grading to all image/video clips
  const colorFilter = getColorGradingFilter(options.colorGrade);
  
  enhancedClips.forEach((clip, index) => {
    // Add smooth transitions
    if (clip.asset.type === "image" || clip.asset.type === "video") {
      clip.transition = getCinematicTransition(index, clips.length);
      
      // Apply color grading
      if (!clip.asset.filter) {
        clip.asset.filter = colorFilter;
      }
    }
  });
  
  return enhancedClips;
}

/**
 * Get cinematic overlay track
 * Adds vignette, film grain, and other effects as overlays
 */
export function getCinematicOverlays(
  options: CinematicOptions,
  videoDuration: number
): any[] {
  const overlays: any[] = [];
  
  // Add vignette
  if (options.vignette !== false) {
    overlays.push(getVignetteOverlay(options.aspectRatio));
  }
  
  // Add film grain (if we have the asset)
  if (options.filmGrain) {
    // overlays.push(getFilmGrainOverlay(options.aspectRatio));
    // Disabled until we have actual film grain asset
  }
  
  // Add lens flares at key moments
  if (options.lensFlare) {
    // Add subtle flare at 1/3 and 2/3 through video
    overlays.push(getLensFlareOverlay(videoDuration * 0.33, 1.5));
    overlays.push(getLensFlareOverlay(videoDuration * 0.66, 1.5));
  }
  
  return overlays;
}
