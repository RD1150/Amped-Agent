import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  persona: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getPersonaByUserId(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        businessName: z.string().optional(),
        tagline: z.string().optional(),
        targetAudience: z.string().optional(),
        brandVoice: z.enum(["professional", "friendly", "luxury", "casual", "authoritative"]).optional(),
        primaryColor: z.string().optional(),
        logoUrl: z.string().optional(),
        websiteUrl: z.string().optional(),
        phoneNumber: z.string().optional(),
        emailAddress: z.string().optional(),
        socialHandles: z.string().optional(),
        isCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertPersona(ctx.user.id, input);
      }),
  }),

  content: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getContentPostsByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getContentPostById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
        content: z.string(),
        contentType: z.enum(["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom"]).optional(),
        status: z.enum(["draft", "scheduled", "published", "expired"]).optional(),
        scheduledAt: z.date().optional(),
        platforms: z.string().optional(),
        imageUrl: z.string().optional(),
        propertyAddress: z.string().optional(),
        propertyPrice: z.number().optional(),
        propertyBedrooms: z.number().optional(),
        propertyBathrooms: z.number().optional(),
        propertySqft: z.number().optional(),
        propertyDescription: z.string().optional(),
        propertyListingType: z.string().optional(),
        aiGenerated: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createContentPost({ ...input, userId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        contentType: z.enum(["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom"]).optional(),
        status: z.enum(["draft", "scheduled", "published", "expired"]).optional(),
        scheduledAt: z.date().optional(),
        publishedAt: z.date().optional(),
        platforms: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateContentPost(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContentPost(input.id);
        return { success: true };
      }),
    
    generate: protectedProcedure
      .input(z.object({
        topic: z.string(),
        contentType: z.enum(["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom"]),
        propertyData: z.object({
          address: z.string().optional(),
          price: z.number().optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          sqft: z.number().optional(),
          description: z.string().optional(),
        }).optional(),
        tone: z.enum(["professional", "friendly", "luxury", "casual", "authoritative"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const persona = await db.getPersonaByUserId(ctx.user.id);
        const tone = input.tone || persona?.brandVoice || "professional";
        
        let systemPrompt = `You are a real estate content creator. Create engaging social media content for real estate professionals. 
Use a ${tone} tone. Keep the content concise and suitable for social media platforms like Facebook and Instagram.
Focus on creating compelling, shareable content that drives engagement.`;

        let userPrompt = "";
        
        if (input.contentType === "property_listing" && input.propertyData) {
          userPrompt = `Create an engaging property listing post for:
Address: ${input.propertyData.address || "Luxury Home"}
Price: ${input.propertyData.price ? `$${input.propertyData.price.toLocaleString()}` : "Contact for price"}
Bedrooms: ${input.propertyData.bedrooms || "N/A"}
Bathrooms: ${input.propertyData.bathrooms || "N/A"}
Square Feet: ${input.propertyData.sqft || "N/A"}
Description: ${input.propertyData.description || input.topic}

Create a compelling social media post that highlights the best features and creates urgency.`;
        } else if (input.contentType === "market_report") {
          userPrompt = `Create a market report post about: ${input.topic}
Include relevant statistics, trends, and actionable insights for buyers and sellers.`;
        } else if (input.contentType === "trending_news") {
          userPrompt = `Create a trending news post about: ${input.topic}
Make it relevant to real estate and provide value to your audience.`;
        } else if (input.contentType === "tips") {
          userPrompt = `Create a helpful tips post about: ${input.topic}
Provide actionable advice that homebuyers, sellers, or investors can use.`;
        } else if (input.contentType === "neighborhood") {
          userPrompt = `Create a neighborhood spotlight post about: ${input.topic}
Highlight the best features, amenities, and lifestyle of the area.`;
        } else {
          userPrompt = `Create engaging real estate content about: ${input.topic}`;
        }

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const messageContent = response.choices[0]?.message?.content;
            const generatedContent = typeof messageContent === 'string' ? messageContent : '';
        
        return {
          content: generatedContent,
          contentType: input.contentType,
        };
      }),
  }),

  calendar: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getCalendarEventsByUserId(ctx.user.id, input?.startDate, input?.endDate);
      }),
    
    create: protectedProcedure
      .input(z.object({
        contentPostId: z.number().optional(),
        title: z.string(),
        description: z.string().optional(),
        eventDate: z.date(),
        eventTime: z.string().optional(),
        eventType: z.enum(["post", "reminder", "task"]).optional(),
        isAllDay: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createCalendarEvent({ ...input, userId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventDate: z.date().optional(),
        eventTime: z.string().optional(),
        isAllDay: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCalendarEvent(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCalendarEvent(input.id);
        return { success: true };
      }),
  }),

  integrations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getIntegrationsByUserId(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        platform: z.enum(["facebook", "instagram", "linkedin", "twitter"]),
        accountName: z.string().optional(),
        accountId: z.string().optional(),
        isConnected: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { platform, ...data } = input;
        return db.upsertIntegration(ctx.user.id, platform, data);
      }),
  }),

  uploads: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUploadsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileKey: z.string(),
        fileUrl: z.string(),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
        category: z.enum(["image", "document", "csv", "other"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createUpload({ ...input, userId: ctx.user.id });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUpload(input.id);
        return { success: true };
      }),
  }),

  importJobs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getImportJobsByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getImportJobById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        fileName: z.string().optional(),
        fileUrl: z.string().optional(),
        importType: z.enum(["csv", "google_doc"]),
        settings: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createImportJob({ ...input, userId: ctx.user.id });
      }),
    
    processCSV: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        csvData: z.array(z.object({
          address: z.string().optional(),
          price: z.string().optional(),
          bedrooms: z.string().optional(),
          bathrooms: z.string().optional(),
          sqft: z.string().optional(),
          description: z.string().optional(),
          listingType: z.string().optional(),
        })),
        settings: z.object({
          postsPerWeek: z.number().default(3),
          contentTypes: z.array(z.string()).default(["property_listing", "tips", "market_report"]),
          startDate: z.string(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const { jobId, csvData, settings } = input;
        
        await db.updateImportJob(jobId, { 
          status: "processing", 
          totalRows: csvData.length,
          settings: JSON.stringify(settings),
        });
        
        const persona = await db.getPersonaByUserId(ctx.user.id);
        const tone = persona?.brandVoice || "professional";
        const startDate = new Date(settings.startDate);
        const postsPerWeek = settings.postsPerWeek;
        
        let currentDate = new Date(startDate);
        let postsCreated = 0;
        let dayCounter = 0;
        
        for (let i = 0; i < csvData.length; i++) {
          const row = csvData[i];
          
          // Generate content for this property
          const systemPrompt = `You are a real estate content creator. Create engaging social media content. Use a ${tone} tone. Keep it concise for social media.`;
          const userPrompt = `Create an engaging property listing post for:
Address: ${row.address || "Beautiful Home"}
Price: ${row.price || "Contact for price"}
Bedrooms: ${row.bedrooms || "N/A"}
Bathrooms: ${row.bathrooms || "N/A"}
Square Feet: ${row.sqft || "N/A"}
Description: ${row.description || "Stunning property available now"}

Create a compelling social media post.`;

          try {
            const response = await invokeLLM({
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            });

            const messageContent = response.choices[0]?.message?.content;
            const generatedContent = typeof messageContent === 'string' ? messageContent : '';
            
            // Calculate schedule date
            const scheduleDate = new Date(currentDate);
            scheduleDate.setDate(scheduleDate.getDate() + Math.floor(dayCounter * (7 / postsPerWeek)));
            
            // Create content post
            const post = await db.createContentPost({
              userId: ctx.user.id,
              title: row.address || `Property Listing ${i + 1}`,
              content: generatedContent,
              contentType: "property_listing",
              status: "scheduled",
              scheduledAt: scheduleDate,
              propertyAddress: row.address,
              propertyPrice: row.price ? parseInt(row.price.replace(/[^0-9]/g, "")) : undefined,
              propertyBedrooms: row.bedrooms ? parseInt(row.bedrooms) : undefined,
              propertyBathrooms: row.bathrooms ? parseInt(row.bathrooms) : undefined,
              propertySqft: row.sqft ? parseInt(row.sqft.replace(/[^0-9]/g, "")) : undefined,
              propertyDescription: row.description,
              propertyListingType: row.listingType,
              aiGenerated: true,
            });
            
            // Create calendar event
            await db.createCalendarEvent({
              userId: ctx.user.id,
              contentPostId: post.id,
              title: row.address || `Property Listing ${i + 1}`,
              eventDate: scheduleDate,
              eventTime: "09:00",
              eventType: "post",
            });
            
            postsCreated++;
            dayCounter++;
          } catch (error) {
            console.error("Error generating content for row", i, error);
          }
          
          await db.updateImportJob(jobId, { processedRows: i + 1 });
        }
        
        await db.updateImportJob(jobId, { 
          status: "completed", 
          generatedPosts: postsCreated,
          completedAt: new Date(),
        });
        
        return { success: true, postsCreated };
      }),
  }),
});

export type AppRouter = typeof appRouter;
