# Cinematic Directive for Real Estate Property Tours

**Version:** 1.0  
**Last Updated:** February 19, 2026  
**Purpose:** Define technical and creative standards for "cinematic" quality property tour videos

---

## 1. Visual Movement Standards

### 1.1 Ken Burns Effect (REQUIRED for Cinematic Tier)

The Ken Burns effect combines **zoom + pan** movement to create dynamic, film-like motion from static images.

**Technical Specifications:**
- **Zoom Range:** 20-30% scale increase (start: 1.0, end: 1.2-1.3)
- **Pan Direction:** Diagonal or lateral movement (not just center zoom)
- **Duration:** 5-7 seconds per shot minimum
- **Easing:** Smooth, linear motion (no sudden acceleration)

**Implementation Patterns:**

| Shot Type | Start Position | End Position | Zoom | Duration |
|-----------|---------------|--------------|------|----------|
| Wide Exterior | Bottom-left | Top-right | 1.0 → 1.25 | 6s |
| Interior Room | Center | Left-pan | 1.0 → 1.2 | 5.5s |
| Detail Shot | Top-right | Bottom-left | 1.0 → 1.3 | 5s |
| Aerial View | Center | Zoom-out | 1.2 → 1.0 | 7s |

**Anti-Patterns (Avoid):**
- ❌ Static images with no movement
- ❌ Zoom-only without pan (feels robotic)
- ❌ Fast, jarring movements (< 4 seconds)
- ❌ Random movement without intentionality

---

## 2. Transition Standards

### 2.1 Fade Transitions (REQUIRED for Cinematic Tier)

**Technical Specifications:**
- **Type:** Crossfade (dissolve) between shots
- **Duration:** 1.0-1.5 seconds overlap
- **Easing:** Linear or ease-in-out
- **Black Frames:** Optional 0.5s fade to black between sections

**When to Use:**
- Between all property shots (standard)
- Between sections (e.g., exterior → interior)
- At video start/end (fade from/to black)

**Anti-Patterns (Avoid):**
- ❌ Hard cuts (too abrupt for luxury properties)
- ❌ Slide/wipe transitions (dated, non-cinematic)
- ❌ Flash/strobe effects (unprofessional)

---

## 3. Pacing & Rhythm

### 3.1 Shot Duration

**Cinematic Tier Standards:**
- **Minimum:** 5 seconds per shot
- **Optimal:** 5.5-6.5 seconds per shot
- **Maximum:** 8 seconds (avoid viewer fatigue)

**Total Video Length:**
- **6 photos:** 33-39 seconds (with transitions)
- **8 photos:** 44-52 seconds
- **10 photos:** 55-65 seconds

### 3.2 Rhythm Patterns

**Luxury Properties (Slow Pacing):**
- 6-7 seconds per shot
- Long fades (1.5s)
- Dramatic pauses in voiceover

**Mid-Range Properties (Moderate Pacing):**
- 5-6 seconds per shot
- Standard fades (1.0s)
- Steady voiceover rhythm

**High-Energy Properties (Faster Pacing):**
- 4.5-5.5 seconds per shot
- Quick fades (0.8s)
- Upbeat music and voiceover

---

## 4. Audio Standards

### 4.1 Music Selection

**Cinematic Tier Requirements:**
- **Genre:** Orchestral, ambient, cinematic score, or soft piano
- **Tempo:** 60-90 BPM (slow to moderate)
- **Mood:** Elegant, sophisticated, aspirational
- **Volume:** 20-30% when mixed with voiceover

**Recommended Tracks (from Shotstack Library):**
- `https://shotstack.io/assets/music/cinematic/dreams.mp3`
- `https://shotstack.io/assets/music/ambient/serenity.mp3`
- `https://shotstack.io/assets/music/piano/reflection.mp3`

**Anti-Patterns (Avoid):**
- ❌ Upbeat pop music (not cinematic)
- ❌ Music with lyrics (distracts from voiceover)
- ❌ High-tempo tracks (> 120 BPM)

### 4.2 Voiceover Standards

**Delivery Style:**
- **Pace:** Slow, deliberate, with dramatic pauses
- **Tone:** Deep, warm, authoritative
- **Volume:** 100% (music at 20-30% behind)

**Script Structure:**
- **Opening:** Dramatic hook ("Welcome... to luxury redefined.")
- **Body:** Short phrases with pauses ("From the stunning exterior... to the resort-style pool...")
- **Closing:** Aspirational statement ("This... is more than a home.")

**ElevenLabs Voice Recommendations:**
- **Male:** Brian (deep, cinematic)
- **Female:** Sarah (elegant, sophisticated)

---

## 5. Color & Visual Treatment

### 5.1 Color Grading (Optional for Cinematic Tier)

**Film-Like Look:**
- **Contrast:** +10-15% (deeper shadows, brighter highlights)
- **Saturation:** -5-10% (slightly desaturated for film aesthetic)
- **Warmth:** +5% (golden hour feel)

**Implementation:**
- Use Shotstack color filters if available
- Apply consistent grading across all shots

### 5.2 Letterbox Effect (Optional)

**Aspect Ratio:**
- **Standard:** 16:9 (1920×1080)
- **Cinematic:** 2.39:1 (add black bars top/bottom)

**When to Use:**
- Ultra-luxury properties ($2M+)
- Architectural showcases
- Brand differentiation

---

## 6. Shot Composition Guidelines

### 6.1 Shot Sequence (Recommended Order)

1. **Establishing Shot:** Wide exterior or aerial view
2. **Hero Shot:** Most impressive feature (pool, view, architecture)
3. **Living Spaces:** Main living room, great room
4. **Kitchen:** Chef's kitchen, dining area
5. **Private Spaces:** Master bedroom, spa bathroom
6. **Closing Shot:** Aerial or sunset exterior

### 6.2 Visual Hierarchy

**Primary Focus:**
- Architecture and design
- Natural light and space
- Luxury features and finishes

**Secondary Elements:**
- Landscaping and outdoor spaces
- Views and surroundings
- Lifestyle amenities

---

## 7. Technical Specifications

### 7.1 Video Output

**Format:** MP4 (H.264 codec)  
**Resolution:** 1920×1080 (Full HD)  
**Frame Rate:** 25 FPS (film-like) or 30 FPS (standard)  
**Bitrate:** 8-10 Mbps (high quality)

### 7.2 Shotstack API Parameters

```typescript
// Ken Burns Effect Example
const clip = new Shotstack.Clip();
clip.start = 0;
clip.length = 6.0; // 6 seconds
clip.fit = Shotstack.Clip.FitEnum.Cover;

// Zoom + Pan
clip.scale = 1.0; // Start scale
clip.scaleEnd = 1.25; // End scale (25% zoom)
clip.offset = { x: -0.1, y: -0.1 }; // Start position (bottom-left)
clip.offsetEnd = { x: 0.1, y: 0.1 }; // End position (top-right)

// Fade Transition
clip.transition = new Shotstack.Transition();
clip.transition.in = Shotstack.Transition.InEnum.Fade;
clip.transition.out = Shotstack.Transition.OutEnum.Fade;
```

---

## 8. Quality Tiers Comparison

| Feature | Standard (5cr) | AI-Enhanced (15cr) | Full Cinematic (40cr) |
|---------|----------------|--------------------|-----------------------|
| **Movement** | Basic Ken Burns | Enhanced Ken Burns | Dramatic Ken Burns + Pan |
| **Shot Duration** | 3.5s | 4.5s | 5.5-6.5s |
| **Transitions** | Fade | Fade | Fade + Black Frames |
| **Zoom Range** | 10-15% | 15-20% | 20-30% |
| **Voiceover** | None | Standard | Dramatic, Slow |
| **Music** | Basic | Ambient | Cinematic Score |
| **Color Grading** | None | None | Optional |
| **Letterbox** | No | No | Optional |

---

## 9. Implementation Checklist

Before rendering a "Full Cinematic" video, verify:

- [ ] Ken Burns effect applied (zoom + pan, not just zoom)
- [ ] Shot duration 5.5-6.5 seconds minimum
- [ ] Fade transitions between all shots (1.0-1.5s)
- [ ] Cinematic music track selected (orchestral/ambient)
- [ ] Dramatic voiceover with slow pacing and pauses
- [ ] Music volume at 20-30% behind voiceover
- [ ] Shots ordered in logical sequence (exterior → interior → closing)
- [ ] Total video length 35-65 seconds
- [ ] Output resolution 1920×1080 HD
- [ ] Frame rate 25-30 FPS

---

## 10. Examples & References

**Cinematic Real Estate Videos (Reference):**
- Sotheby's International Realty luxury property tours
- Christie's Real Estate cinematic showcases
- Douglas Elliman high-end property videos

**Key Characteristics:**
- Slow, deliberate pacing
- Smooth camera movements (even from stills)
- Elegant transitions
- Sophisticated audio mix
- Film-like color grading

---

## 11. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 19, 2026 | Initial directive created |

---

**Questions or Feedback?**  
Contact the development team to suggest improvements to this directive.
