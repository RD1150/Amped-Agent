import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { contentPosts } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { storagePut } from '../storage';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

export const videoRouter = router({
  convertCarouselToVideo: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        carouselImages: z.array(z.string()),
        pauseTime: z.number().min(1).max(10),
        transition: z.string(),
        musicId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const { postId, carouselImages, pauseTime, transition, musicId } = input;

      // Validate slide count
      if (carouselImages.length === 0) {
        throw new Error('No images provided for video conversion');
      }
      if (carouselImages.length > 10) {
        throw new Error('Maximum 10 slides allowed for video conversion');
      }

      try {
        // Create temp directory for processing
        const tempDir = `/tmp/video-${Date.now()}`;
        if (!existsSync(tempDir)) {
          await mkdir(tempDir, { recursive: true });
        }

        // Download carousel images
        const imagePaths: string[] = [];
        for (let i = 0; i < carouselImages.length; i++) {
          const imageUrl = carouselImages[i];
          const imagePath = path.join(tempDir, `slide-${i}.jpg`);
          
          // Download image
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          await writeFile(imagePath, response.data);
          imagePaths.push(imagePath);
        }

        // Get music file path (system-level directory path, cannot be renamed)
        // TODO: Move music files to S3 storage for production
        const musicPath = `/home/ubuntu/luxestate/server/assets/music/${musicId}.mp3`;
        
        // Build FFmpeg command for video generation
        const outputPath = path.join(tempDir, 'output.mp4');
        
        // Create filter complex for transitions
        let filterComplex = '';
        let inputs = '';
        
        for (let i = 0; i < imagePaths.length; i++) {
          inputs += `-loop 1 -t ${pauseTime} -i "${imagePaths[i]}" `;
        }

        // Add music input
        inputs += `-i "${musicPath}" `;

        // Build transition filter based on selected transition
        const transitionDuration = 0.5; // 0.5 second transition
        
        for (let i = 0; i < imagePaths.length; i++) {
          if (i === 0) {
            filterComplex += `[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v0];`;
          } else {
            filterComplex += `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}];`;
          }
        }

        // Apply transitions
        let currentLabel = 'v0';
        for (let i = 1; i < imagePaths.length; i++) {
          const nextLabel = `v${i}`;
          const outLabel = i === imagePaths.length - 1 ? 'out' : `t${i}`;
          
          // Different transition effects
          let transitionFilter = '';
          switch (transition) {
            case 'wipe_left':
              transitionFilter = `wipeleft`;
              break;
            case 'wipe_right':
              transitionFilter = `wiperight`;
              break;
            case 'fade':
              transitionFilter = `fade`;
              break;
            case 'slide_up':
              transitionFilter = `slideup`;
              break;
            case 'slide_down':
              transitionFilter = `slidedown`;
              break;
            case 'zoom_in':
              transitionFilter = `zoomin`;
              break;
            case 'zoom_out':
              transitionFilter = `fadeblack`;
              break;
            default:
              transitionFilter = `fade`;
          }
          
          filterComplex += `[${currentLabel}][${nextLabel}]xfade=transition=${transitionFilter}:duration=${transitionDuration}:offset=${(pauseTime * i) - transitionDuration}[${outLabel}];`;
          currentLabel = outLabel;
        }

        // Build full FFmpeg command
        const ffmpegCommand = `ffmpeg ${inputs} -filter_complex "${filterComplex}" -map "[out]" -map ${imagePaths.length}:a -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k -shortest "${outputPath}"`;

        console.log('Executing FFmpeg command:', ffmpegCommand);

        // Execute FFmpeg
        await execAsync(ffmpegCommand, { maxBuffer: 50 * 1024 * 1024 });

        // Read generated video
        const videoBuffer = await require('fs').promises.readFile(outputPath);

        // Upload to storage
        const videoKey = `videos/${userId}/${Date.now()}.mp4`;
        const uploadResult = await storagePut(videoKey, videoBuffer, 'video/mp4');

        // Update content post with video URL
        const db = await getDb();
        if (db) {
          await db
            .update(contentPosts)
            .set({
              imageUrl: uploadResult.url,
              format: 'video_reel',
              updatedAt: new Date(),
            })
            .where(eq(contentPosts.id, postId));
        }

        // Cleanup temp files
        for (const imagePath of imagePaths) {
          await unlink(imagePath).catch(() => {});
        }
        await unlink(outputPath).catch(() => {});

        return {
          videoUrl: uploadResult.url,
          success: true,
        };
      } catch (error: any) {
        console.error('Video conversion error:', error);
        throw new Error(`Failed to convert carousel to video: ${error.message}`);
      }
    }),
});
