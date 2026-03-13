/**
 * Quick validation script to check the Shotstack payload for common errors
 * Run with: node server/validateShotstackPayload.mjs
 */

// Simulate what videoGenerator.ts produces for a 5-image Standard render
function sanitizeClip(clip) {
  const c = { ...clip };
  if (c.transition && Object.keys(c.transition).length === 0) {
    delete c.transition;
  }
  return c;
}

function stripFilterFromVideoClips(clips) {
  return clips.map(clip => {
    const c = sanitizeClip(clip);
    if (c.asset?.type === "video" && c.filter) {
      delete c.filter;
    }
    return c;
  });
}

// Simulate 5 image clips (Standard Ken Burns)
const imageUrls = [
  "https://example.com/img1.jpg",
  "https://example.com/img2.jpg",
  "https://example.com/img3.jpg",
  "https://example.com/img4.jpg",
  "https://example.com/img5.jpg",
];

const builtInEffects = ["zoomIn", "zoomOut", "slideLeft", "slideRight", "slideUp"];
const durationPerImage = 6;
const crossfadeDuration = 0.8;

const rawClips = imageUrls.map((url, index) => {
  const clipStart = index * durationPerImage;
  const clipLength = durationPerImage;
  const overlapIn = index > 0 ? crossfadeDuration : 0;
  const overlapOut = index < imageUrls.length - 1 ? crossfadeDuration : 0;
  const effect = builtInEffects[index % builtInEffects.length];

  return {
    asset: { type: "image", src: url },
    start: clipStart - overlapIn,
    length: clipLength + overlapIn + overlapOut,
    transition: {
      ...(index > 0 && { in: "fade" }),
      ...(index < imageUrls.length - 1 && { out: "fade" }),
    },
    fit: "cover",
    effect,
  };
});

const sanitizedClips = stripFilterFromVideoClips(rawClips);

// Check for validation errors
let errors = 0;
sanitizedClips.forEach((clip, i) => {
  // Check 1: empty transition object
  if (clip.transition && Object.keys(clip.transition).length === 0) {
    console.error(`❌ Clip ${i}: empty transition object`);
    errors++;
  }
  // Check 2: filter on video clip
  if (clip.asset?.type === "video" && clip.filter) {
    console.error(`❌ Clip ${i}: filter on video clip`);
    errors++;
  }
  // Check 3: missing required fields
  if (!clip.asset || !clip.start === undefined || !clip.length) {
    console.error(`❌ Clip ${i}: missing required fields`);
    errors++;
  }
  // Check 4: negative start time
  if (clip.start < 0) {
    console.error(`❌ Clip ${i}: negative start time (${clip.start})`);
    errors++;
  }
  // Check 5: zero or negative length
  if (clip.length <= 0) {
    console.error(`❌ Clip ${i}: zero or negative length (${clip.length})`);
    errors++;
  }
});

if (errors === 0) {
  console.log(`✅ All ${sanitizedClips.length} clips are valid`);
  sanitizedClips.forEach((clip, i) => {
    const trans = clip.transition ? JSON.stringify(clip.transition) : "none";
    const filter = clip.filter ? JSON.stringify(clip.filter) : "none";
    console.log(`  Clip ${i+1}: effect=${clip.effect}, transition=${trans}, filter=${filter}, start=${clip.start.toFixed(1)}, length=${clip.length.toFixed(1)}`);
  });
} else {
  console.error(`\n❌ Found ${errors} validation error(s)`);
  process.exit(1);
}

// Also test cinematic enhancements
console.log("\n--- Testing cinematic enhancements ---");
const cinematicTransitions = ["fade", "zoom", "slideLeft", "slideRight", "carouselLeft", "carouselRight"];
const cinematicClips = rawClips.map((clip, index) => {
  const enhanced = { ...clip };
  if (clip.asset?.type === "image" || clip.asset?.type === "video") {
    enhanced.filter = { brightness: 0.08, contrast: 0.15, saturation: 0.12 };
    const transitionIn = cinematicTransitions[index % cinematicTransitions.length];
    enhanced.transition = {
      ...(index > 0 && { in: transitionIn }),
      ...(index < rawClips.length - 1 && { out: "fade" }),
    };
  }
  return enhanced;
});

const sanitizedCinematicClips = stripFilterFromVideoClips(cinematicClips);
let cinematicErrors = 0;
sanitizedCinematicClips.forEach((clip, i) => {
  if (clip.transition && Object.keys(clip.transition).length === 0) {
    console.error(`❌ Cinematic clip ${i}: empty transition`);
    cinematicErrors++;
  }
});

if (cinematicErrors === 0) {
  console.log(`✅ All ${sanitizedCinematicClips.length} cinematic clips are valid`);
} else {
  console.error(`❌ Found ${cinematicErrors} cinematic validation error(s)`);
}
