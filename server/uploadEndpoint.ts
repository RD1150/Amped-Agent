import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { storagePut } from "./storage";
import { randomBytes } from "crypto";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per file (supports 2-minute videos)
  },
});

// Direct upload endpoint with server-side compression
router.post("/upload-images", upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    console.log(`📤 Received ${req.files.length} files for upload`);

    const uploadedUrls: string[] = [];

    for (const file of req.files) {
      try {
        let processedBuffer = file.buffer;
        let mimeType = file.mimetype;

        // Compress images (skip videos)
        if (file.mimetype.startsWith("image/")) {
          const originalSize = (file.size / 1024 / 1024).toFixed(2);
          
          // Compress with Sharp
          processedBuffer = await sharp(file.buffer)
            .resize(1600, 1600, {
              fit: "inside",
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toBuffer();

          const compressedSize = (processedBuffer.length / 1024 / 1024).toFixed(2);
          console.log(`✅ Compressed ${file.originalname}: ${originalSize}MB → ${compressedSize}MB`);
          
          mimeType = "image/jpeg"; // Always output as JPEG
        } else if (file.mimetype.startsWith("video/")) {
          // Log video upload info
          const videoSize = (file.size / 1024 / 1024).toFixed(2);
          console.log(`📹 Uploading video ${file.originalname}: ${videoSize}MB`);
        }

        // Generate unique filename with proper extension
        const randomSuffix = randomBytes(8).toString("hex");
        let ext = "jpg"; // default
        
        if (mimeType === "image/jpeg") {
          ext = "jpg";
        } else if (file.originalname && file.originalname.includes(".")) {
          ext = file.originalname.split(".").pop() || "mp4";
        } else if (mimeType.startsWith("video/")) {
          ext = "mp4"; // default for videos
        }
        
        const filename = `property-${Date.now()}-${randomSuffix}.${ext}`;

        // Upload to S3
        const { url } = await storagePut(
          `property-tours/${filename}`,
          processedBuffer,
          mimeType
        );

        uploadedUrls.push(url);
        console.log(`✅ Uploaded: ${filename}`);
      } catch (error) {
        console.error(`❌ Failed to process ${file.originalname}:`, error);
        // Continue with other files even if one fails
      }
    }

    if (uploadedUrls.length === 0) {
      return res.status(500).json({ error: "All uploads failed" });
    }

    res.json({ urls: uploadedUrls });
  } catch (error) {
    console.error("Upload endpoint error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Upload failed" 
    });
  }
});

// Single-file upload endpoint (used by avatar and other single-file uploads)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    let processedBuffer = file.buffer;
    let mimeType = file.mimetype;

    // Compress images
    if (file.mimetype.startsWith("image/")) {
      processedBuffer = await sharp(file.buffer)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      mimeType = "image/jpeg";
    }

    const randomSuffix = randomBytes(8).toString("hex");
    const ext = mimeType === "image/jpeg" ? "jpg" : (file.originalname?.split(".").pop() || "bin");
    const filename = `uploads/${Date.now()}-${randomSuffix}.${ext}`;

    const { url } = await storagePut(filename, processedBuffer, mimeType);

    console.log(`✅ Single upload: ${filename}`);
    res.json({ url });
  } catch (error) {
    console.error("Single upload error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed" });
  }
});

// Audio/voice sample upload endpoint (for ElevenLabs voice cloning)
router.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }
    const file = req.file;
    const mimeType = file.mimetype;
    // Only accept audio files
    if (!mimeType.startsWith("audio/") && !file.originalname?.match(/\.(mp3|wav|m4a|ogg|flac|webm)$/i)) {
      return res.status(400).json({ error: "Only audio files are accepted (mp3, wav, m4a, ogg, flac, webm)" });
    }
    const randomSuffix = randomBytes(8).toString("hex");
    const ext = file.originalname?.split(".").pop()?.toLowerCase() || "mp3";
    const filename = `voice-samples/${Date.now()}-${randomSuffix}.${ext}`;
    const { url } = await storagePut(filename, file.buffer, mimeType || "audio/mpeg");
    console.log(`✅ Voice sample uploaded: ${filename} (${(file.size / 1024).toFixed(0)}KB)`);
    res.json({ url });
  } catch (error) {
    console.error("Audio upload error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed" });
  }
});

export default router;
