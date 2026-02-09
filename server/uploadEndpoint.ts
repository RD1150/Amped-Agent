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
    fileSize: 50 * 1024 * 1024, // 50MB max per file
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
        }

        // Generate unique filename
        const randomSuffix = randomBytes(8).toString("hex");
        const ext = mimeType === "image/jpeg" ? "jpg" : file.originalname.split(".").pop();
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

export default router;
