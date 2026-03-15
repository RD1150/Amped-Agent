import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { v4 as uuidv4 } from "uuid";
import { invokeLLM } from "../_core/llm";

/**
 * Content Templates Router
 * Handles CSV bulk uploads of hooks, reel ideas, and scripts for automated content generation
 */

export const contentTemplatesRouter = router({
  /**
   * Upload and parse CSV file with content templates.
   * Supports two formats:
   *   1. Native format:  Hook, Reel Idea, Script, Category, Platform, Content Type, Scheduled Date
   *   2. Carousel format: ID, Topic, Description, Category, Subcategory, Tags, Difficulty, Target Audience, Seasonal, Key Points
   * When no 'hook' column is present, hooks are auto-generated via AI from Topic + Description.
   */
  uploadCSV: protectedProcedure
    .input(z.object({
      csvContent: z.string(),
      filename: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { csvContent } = input;
      const userId = ctx.user.id;
      const batchId = uuidv4();

      // Parse CSV content
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new Error("CSV must contain at least a header row and one data row");
      }

      // Parse header row — normalize to lowercase, trimmed
      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());

      // Detect format: native (has 'hook') vs carousel (has 'topic')
      const isCarouselFormat = !headers.includes('hook') && headers.includes('topic');

      // Column indices — native format
      const hookIndex = headers.indexOf('hook');
      const reelIdeaIndex = Math.max(headers.indexOf('reel idea'), headers.indexOf('reelidea'));
      const scriptIndex = Math.max(headers.indexOf('script'), headers.indexOf('prompt'));
      const categoryIndex = headers.indexOf('category');
      const platformIndex = headers.indexOf('platform');
      const contentTypeIndex = Math.max(headers.indexOf('content type'), headers.indexOf('contenttype'));
      const scheduledDateIndex = Math.max(headers.indexOf('scheduled date'), headers.indexOf('scheduleddate'));

      // Column indices — carousel format
      const topicIndex = headers.indexOf('topic');
      const descriptionIndex = headers.indexOf('description');
      const keyPointsIndex = headers.indexOf('key points');
      const tagsIndex = headers.indexOf('tags');
      const subcategoryIndex = headers.indexOf('subcategory');
      const targetAudienceIndex = headers.indexOf('target audience');

      // Parse data rows into raw records first
      type RawRecord = {
        topic?: string;
        description?: string;
        keyPoints?: string;
        tags?: string;
        category?: string;
        subcategory?: string;
        targetAudience?: string;
        hook?: string;
        reelIdea?: string;
        script?: string;
        platform?: string;
        contentType?: string;
        scheduledDate?: string;
        rowNumber: number;
      };

      const rawRecords: RawRecord[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = parseCSVLine(line);
        if (values.length === 0) continue;

        if (isCarouselFormat) {
          const topic = topicIndex >= 0 ? values[topicIndex]?.trim() : '';
          const description = descriptionIndex >= 0 ? values[descriptionIndex]?.trim() : '';
          if (!topic && !description) {
            console.warn(`Skipping row ${i + 1}: no topic or description`);
            continue;
          }
          rawRecords.push({
            topic,
            description,
            keyPoints: keyPointsIndex >= 0 ? values[keyPointsIndex]?.trim() : undefined,
            tags: tagsIndex >= 0 ? values[tagsIndex]?.trim() : undefined,
            category: categoryIndex >= 0 ? values[categoryIndex]?.trim() : undefined,
            subcategory: subcategoryIndex >= 0 ? values[subcategoryIndex]?.trim() : undefined,
            targetAudience: targetAudienceIndex >= 0 ? values[targetAudienceIndex]?.trim() : undefined,
            contentType: 'carousel',
            rowNumber: i,
          });
        } else {
          const hook = hookIndex >= 0 ? values[hookIndex]?.trim() : '';
          if (!hook) {
            console.warn(`Skipping row ${i + 1}: missing hook`);
            continue;
          }
          rawRecords.push({
            hook,
            reelIdea: reelIdeaIndex >= 0 ? values[reelIdeaIndex]?.trim() : undefined,
            script: scriptIndex >= 0 ? values[scriptIndex]?.trim() : undefined,
            category: categoryIndex >= 0 ? values[categoryIndex]?.trim() : undefined,
            platform: platformIndex >= 0 ? values[platformIndex]?.trim() : undefined,
            contentType: contentTypeIndex >= 0 ? values[contentTypeIndex]?.trim() : undefined,
            scheduledDate: scheduledDateIndex >= 0 ? values[scheduledDateIndex]?.trim() : undefined,
            rowNumber: i,
          });
        }
      }

      if (rawRecords.length === 0) {
        throw new Error("No valid rows found in CSV");
      }

      // For carousel format: batch-generate hooks via AI for all rows
      const templates: any[] = [];
      if (isCarouselFormat) {
        // Build a single LLM call to generate all hooks at once (efficient)
        const hookPrompts = rawRecords.map((r, idx) =>
          `${idx + 1}. Topic: "${r.topic}" | Description: "${r.description}"`
        ).join('\n');

        const llmResult = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are a real estate social media expert. For each topic+description pair, write ONE scroll-stopping Instagram hook (1-2 sentences, max 20 words). The hook must create curiosity, address a fear or desire, and speak directly to home buyers or sellers. Return ONLY a numbered list matching the input — no explanations, no extra text.`,
            },
            { role: 'user', content: hookPrompts },
          ],
        });

        const rawHooks = (llmResult.choices[0]?.message?.content as string || '').trim().split('\n');
        // Parse numbered list: "1. hook text" → "hook text"
        const generatedHooks = rawHooks.map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);

        for (let idx = 0; idx < rawRecords.length; idx++) {
          const r = rawRecords[idx];
          const hook = generatedHooks[idx] || `${r.topic} — what every buyer needs to know`;
          // Build reelIdea from key points (semicolon-separated slide titles)
          const reelIdea = r.keyPoints
            ? `Carousel slides: ${r.keyPoints.split(';').map(s => s.trim()).filter(Boolean).join(' → ')}`
            : undefined;
          // Build hashtags from tags
          const tagsStr = r.tags
            ? r.tags.split(';').map(t => `#${t.trim().replace(/\s+/g, '')}`).filter(Boolean).join(' ')
            : undefined;
          const category = r.subcategory || r.category || 'Real Estate';

          templates.push({
            userId,
            hook,
            reelIdea: reelIdea || null,
            script: tagsStr || null,
            category,
            platform: null,
            contentType: 'carousel' as const,
            scheduledDate: null,
            isScheduled: false,
            status: 'pending' as const,
            importBatchId: batchId,
            rowNumber: r.rowNumber,
          });
        }
      } else {
        for (const r of rawRecords) {
          templates.push({
            userId,
            hook: r.hook!,
            reelIdea: r.reelIdea || null,
            script: r.script || null,
            category: r.category || null,
            platform: r.platform || null,
            contentType: mapContentType(r.contentType),
            scheduledDate: r.scheduledDate ? parseDate(r.scheduledDate) : null,
            isScheduled: false,
            status: 'pending' as const,
            importBatchId: batchId,
            rowNumber: r.rowNumber,
          });
        }
      }

      // Bulk insert
      await db.createContentTemplatesBatch(templates);

      return {
        success: true,
        batchId,
        count: templates.length,
        message: `Successfully imported ${templates.length} content templates${
          isCarouselFormat ? ' with AI-generated hooks' : ''
        }`,
      };
    }),

  /**
   * Get all content templates for current user
   */
  list: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(100),
      status: z.enum(['pending', 'generated', 'scheduled', 'published', 'failed']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const templates = await db.getContentTemplatesByUserId(ctx.user.id, input.limit);
      
      if (input.status) {
        return templates.filter(t => t.status === input.status);
      }
      
      return templates;
    }),

  /**
   * Get templates by batch ID
   */
  getByBatch: protectedProcedure
    .input(z.object({
      batchId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getContentTemplatesByBatchId(input.batchId);
    }),

  /**
   * Get single template by ID
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const template = await db.getContentTemplateById(input.id);
      if (!template || template.userId !== ctx.user.id) {
        throw new Error("Template not found");
      }
      return template;
    }),

  /**
   * Update a template
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      hook: z.string().optional(),
      reelIdea: z.string().optional(),
      script: z.string().optional(),
      category: z.string().optional(),
      platform: z.string().optional(),
      contentType: z.enum(['reel', 'post', 'carousel', 'story', 'video']).optional(),
      scheduledDate: z.date().optional(),
      isScheduled: z.boolean().optional(),
      status: z.enum(['pending', 'generated', 'scheduled', 'published', 'failed']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // Verify ownership
      const template = await db.getContentTemplateById(id);
      if (!template || template.userId !== ctx.user.id) {
        throw new Error("Template not found");
      }

      await db.updateContentTemplate(id, data);
      return { success: true };
    }),

  /**
   * Delete a template
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const template = await db.getContentTemplateById(input.id);
      if (!template || template.userId !== ctx.user.id) {
        throw new Error("Template not found");
      }

      await db.deleteContentTemplate(input.id);
      return { success: true };
    }),

  /**
   * Delete entire batch
   */
  deleteBatch: protectedProcedure
    .input(z.object({
      batchId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership by checking one template from batch
      const templates = await db.getContentTemplatesByBatchId(input.batchId);
      if (templates.length === 0 || templates[0].userId !== ctx.user.id) {
        throw new Error("Batch not found");
      }

      await db.deleteContentTemplatesByBatchId(input.batchId);
      return { success: true, count: templates.length };
    }),

  /**
   * Get pending templates ready for generation
   */
  getPending: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getPendingContentTemplates(ctx.user.id);
    }),

  /**
   * Generate content from a single template
   */
  generateContent: protectedProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const template = await db.getContentTemplateById(input.templateId);
      if (!template || template.userId !== ctx.user.id) {
        throw new Error("Template not found");
      }

      // Get user persona for context
      const persona = await db.getPersonaByUserId(ctx.user.id);
      
      // Build prompt from template
      const prompt = buildContentPrompt(template, persona);

      try {
        // Generate content using LLM
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a professional real estate content creator. Create engaging, authentic social media content that helps real estate agents connect with their audience." },
            { role: "user", content: prompt },
          ],
        });

        const generatedContent = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content);

        // Create content post
        const post = await db.createContentPost({
          userId: ctx.user.id,
          title: template.hook.substring(0, 100),
          content: generatedContent,
          contentType: mapContentTypeToPostType(template.contentType || 'post'),
          format: mapContentTypeToFormat(template.contentType || 'post'),
          status: "draft",
          platforms: template.platform ? JSON.stringify([template.platform]) : undefined,
          aiGenerated: true,
        });

        // Update template status
        await db.updateContentTemplate(template.id, {
          status: "generated",
          generatedPostId: post.id,
        });

        return {
          success: true,
          postId: post.id,
          content: generatedContent,
        };
      } catch (error: any) {
        // Update template with error
        await db.updateContentTemplate(template.id, {
          status: "failed",
          errorMessage: error.message,
        });
        throw error;
      }
    }),

  /**
   * Generate content from multiple templates in batch
   */
  generateBatch: protectedProcedure
    .input(z.object({
      templateIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      
      for (const templateId of input.templateIds) {
        try {
          const template = await db.getContentTemplateById(templateId);
          if (!template || template.userId !== ctx.user.id) {
            results.push({ templateId, success: false, error: "Template not found" });
            continue;
          }

          const persona = await db.getPersonaByUserId(ctx.user.id);
          const prompt = buildContentPrompt(template, persona);

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a professional real estate content creator. Create engaging, authentic social media content that helps real estate agents connect with their audience." },
              { role: "user", content: prompt },
            ],
          });

          const generatedContent = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content);

          const post = await db.createContentPost({
            userId: ctx.user.id,
            title: template.hook.substring(0, 100),
            content: generatedContent,
            contentType: mapContentTypeToPostType(template.contentType || 'post'),
            format: mapContentTypeToFormat(template.contentType || 'post'),
            status: "draft",
            platforms: template.platform ? JSON.stringify([template.platform]) : undefined,
            aiGenerated: true,
          });

          await db.updateContentTemplate(template.id, {
            status: "generated",
            generatedPostId: post.id,
          });

          results.push({ templateId, success: true, postId: post.id });
        } catch (error: any) {
          await db.updateContentTemplate(templateId, {
            status: "failed",
            errorMessage: error.message,
          });
          results.push({ templateId, success: false, error: error.message });
        }
      }

      return {
        total: input.templateIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    }),
});

/**
 * Helper function to parse CSV line respecting quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Map content type string to enum value
 */
function mapContentType(type: string | undefined): 'reel' | 'post' | 'carousel' | 'story' | 'video' {
  if (!type) return 'post';
  
  const normalized = type.toLowerCase();
  if (normalized.includes('reel')) return 'reel';
  if (normalized.includes('carousel')) return 'carousel';
  if (normalized.includes('story')) return 'story';
  if (normalized.includes('video')) return 'video';
  
  return 'post';
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}


/**
 * Build content generation prompt from template and persona
 */
function buildContentPrompt(template: any, persona: any): string {
  let prompt = `Create social media content based on the following:\n\n`;
  
  prompt += `Hook/Opening: ${template.hook}\n\n`;
  
  if (template.reelIdea) {
    prompt += `Reel Idea: ${template.reelIdea}\n\n`;
  }
  
  if (template.script) {
    prompt += `Script/Prompt: ${template.script}\n\n`;
  }
  
  prompt += `Content Type: ${template.contentType}\n`;
  prompt += `Platform: ${template.platform || 'General social media'}\n`;
  prompt += `Category: ${template.category || 'General real estate'}\n\n`;
  
  if (persona) {
    prompt += `Agent Context:\n`;
    if (persona.agentName) prompt += `- Agent Name: ${persona.agentName}\n`;
    if (persona.brokerageName) prompt += `- Brokerage: ${persona.brokerageName}\n`;
    if (persona.serviceAreas) prompt += `- Service Areas: ${persona.serviceAreas}\n`;
    if (persona.brandVoice) prompt += `- Brand Voice: ${persona.brandVoice}\n`;
    if (persona.targetAudience) prompt += `- Target Audience: ${persona.targetAudience}\n`;
    prompt += `\n`;
  }
  
  prompt += `Generate engaging, professional content that:\n`;
  prompt += `1. Uses the hook as the opening line\n`;
  prompt += `2. Follows the reel idea and script guidance provided\n`;
  prompt += `3. Matches the brand voice and target audience\n`;
  prompt += `4. Is optimized for ${template.platform || 'social media'}\n`;
  prompt += `5. Includes a clear call-to-action\n`;
  prompt += `6. Is authentic and helpful to the audience\n\n`;
  
  if (template.contentType === 'carousel') {
    prompt += `Format the content as a carousel post with 5-7 slides. Use "---SLIDE---" to separate each slide.\n`;
  } else if (template.contentType === 'reel') {
    prompt += `Format the content as a video script with timestamps and visual cues.\n`;
  }
  
  return prompt;
}

/**
 * Map template content type to content post type
 */
function mapContentTypeToPostType(contentType: string): 'property_listing' | 'market_report' | 'trending_news' | 'tips' | 'neighborhood' | 'custom' | 'carousel' | 'video' {
  switch (contentType) {
    case 'carousel':
      return 'carousel';
    case 'reel':
    case 'video':
      return 'video';
    default:
      return 'custom';
  }
}

/**
 * Map template content type to post format
 */
function mapContentTypeToFormat(contentType: string): 'static_post' | 'carousel' | 'reel_script' | 'video_reel' | 'story' {
  switch (contentType) {
    case 'carousel':
      return 'carousel';
    case 'reel':
      return 'reel_script';
    case 'video':
      return 'video_reel';
    case 'story':
      return 'story';
    default:
      return 'static_post';
  }
}
