import { eq, desc, and, gte, lte, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  InsertPersona, personas,
  InsertContentPost, contentPosts,
  InsertCalendarEvent, calendarEvents,
  InsertIntegration, integrations,
  InsertUpload, uploads,
  InsertImportJob, importJobs,
  InsertAnalytics, analytics,
  InsertPostingSchedule, postingSchedules,
  subscriptionTiers, SubscriptionTier,
  userSubscriptions, UserSubscription, InsertUserSubscription,
  usageTracking, UsageTracking, InsertUsageTracking,
  usageAlerts, UsageAlert, InsertUsageAlert,
  whiteLabelSettings, WhiteLabelSettings, InsertWhiteLabelSettings,
  hooks, Hook,
  betaSignups, BetaSignup, InsertBetaSignup,
  customPromptTemplates, CustomPromptTemplate, InsertCustomPromptTemplate,
  propertyTours, PropertyTour, InsertPropertyTour,
  contentTemplates, ContentTemplate, InsertContentTemplate,
  drafts, Draft, InsertDraft,
  aiReels, AiReel, InsertAiReel,
  watchedVideos, WatchedVideo
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _dbConnectFailed = false;

export async function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      console.warn("[Database] DATABASE_URL is not set");
      return null;
    }
    // Always retry — do not cache a failed connection permanently
    try {
      _db = drizzle(process.env.DATABASE_URL);
      _dbConnectFailed = false;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER HELPERS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot upsert user: database not available");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if ((user as any).passwordHash !== undefined) {
      (values as any).passwordHash = (user as any).passwordHash;
      updateSet.passwordHash = (user as any).passwordHash;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
  return { success: true };
}

export async function updateUserAvatar(
  userId: number,
  avatarImageUrl: string | null,
  avatarVideoUrl: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { updatedAt: new Date() };
  if (avatarImageUrl !== null) updateData.avatarImageUrl = avatarImageUrl;
  if (avatarVideoUrl !== null) {
    updateData.avatarVideoUrl = avatarVideoUrl;
    updateData.avatarVideoSavedAt = new Date(); // Stamp generation time for 90-day expiry tracking
  }
  
  await db.update(users).set(updateData).where(eq(users.id, userId));
  return { success: true };
}

export async function updateUserProfile(
  userId: number,
  data: { name: string; bio?: string; location?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {
    name: data.name,
    updatedAt: new Date(),
  };
  
  // Store bio and location in persona table
  if (data.bio || data.location) {
    const persona = await getPersonaByUserId(userId);
    if (persona) {
      await db.update(personas)
        .set({
          bio: data.bio || persona.bio,
          serviceAreas: data.location || persona.serviceAreas,
          updatedAt: new Date(),
        })
        .where(eq(personas.userId, userId));
    } else {
      // Create persona if doesn't exist
      await db.insert(personas).values({
        userId,
        bio: data.bio,
        serviceAreas: data.location,
      });
    }
  }
  
  await db.update(users).set(updateData).where(eq(users.id, userId));
  return { success: true };
}

export async function saveOnboardingStep(userId: number, step: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ onboardingStep: step, updatedAt: new Date() })
    .where(eq(users.id, userId));
  
  return { success: true };
}

export async function markOnboardingComplete(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get user data for welcome email
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const userData = user[0];
  
  await db.update(users)
    .set({ hasCompletedOnboarding: true, updatedAt: new Date() })
    .where(eq(users.id, userId));
  
  // Send welcome email notification
  if (userData?.name && userData?.email) {
    const { sendWelcomeEmail } = await import("./_core/welcomeEmail");
    await sendWelcomeEmail({
      userName: userData.name,
      userEmail: userData.email,
    });
  }
  
  return { success: true };
}

export async function resetOnboardingComplete(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users)
    .set({ hasCompletedOnboarding: false, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return { success: true };
}

export async function acceptTermsOfService(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ 
      hasAcceptedTerms: true, 
      termsAcceptedAt: new Date(),
      updatedAt: new Date() 
    })
    .where(eq(users.id, userId));
  
  return { success: true };
}

// ============ PERSONA HELPERS ============

export async function getPersonaByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(personas).where(eq(personas.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertPersona(userId: number, data: Partial<InsertPersona>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getPersonaByUserId(userId);
  if (existing) {
    await db.update(personas).set({ ...data, updatedAt: new Date() }).where(eq(personas.userId, userId));
    return { ...existing, ...data };
  } else {
    const result = await db.insert(personas).values({ ...data, userId });
    return { id: Number(result[0].insertId), userId, ...data };
  }
}

export interface ServiceCity { city: string; state: string; }

/**
 * Parse serviceCities JSON — supports both legacy string[] and new {city,state}[] formats.
 */
export function parseServiceCities(raw: string | null | undefined): ServiceCity[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    // New format: [{city, state}]
    if (typeof parsed[0] === "object" && parsed[0] !== null && "city" in parsed[0]) {
      return (parsed as ServiceCity[]).filter((e) => e.city?.trim());
    }
    // Legacy format: string[]
    return (parsed as string[]).filter(Boolean).map((c) => ({ city: c, state: "" }));
  } catch { return []; }
}

/**
 * Returns a human-readable location string from a persona.
 * Prefers serviceCities (all cities joined with per-city state) over primaryCity.
 */
export function getServiceCitiesLabel(persona: { serviceCities?: string | null; primaryCity?: string | null; primaryState?: string | null } | null, fallback = "your area"): string {
  if (!persona) return fallback;
  const entries = parseServiceCities(persona.serviceCities);
  if (entries.length > 0) {
    return entries.map((e) => e.state ? `${e.city}, ${e.state}` : e.city).join(" | ");
  }
  if (persona.primaryCity) {
    return persona.primaryState ? `${persona.primaryCity}, ${persona.primaryState}` : persona.primaryCity;
  }
  return fallback;
}

/**
 * Pick one city from the service cities list using a rotation index.
 * Useful for generating hyperlocal content that cycles through all markets.
 */
export function pickServiceCity(persona: { serviceCities?: string | null; primaryCity?: string | null; primaryState?: string | null } | null, index = 0): string {
  const entries = parseServiceCities(persona?.serviceCities);
  if (entries.length > 0) {
    const entry = entries[index % entries.length];
    return entry.state ? `${entry.city}, ${entry.state}` : entry.city;
  }
  if (persona?.primaryCity) {
    return persona.primaryState ? `${persona.primaryCity}, ${persona.primaryState}` : persona.primaryCity;
  }
  return "your area";
}

// ============ CONTENT POST HELPERS ============

export async function getContentPostsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentPosts).where(eq(contentPosts.userId, userId)).orderBy(desc(contentPosts.createdAt)).limit(limit);
}

export async function getContentPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contentPosts).where(eq(contentPosts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createContentPost(data: InsertContentPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentPosts).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateContentPost(id: number, data: Partial<InsertContentPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contentPosts).set({ ...data, updatedAt: new Date() }).where(eq(contentPosts.id, id));
  return getContentPostById(id);
}

export async function deleteContentPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contentPosts).where(eq(contentPosts.id, id));
}

// ============ CALENDAR EVENT HELPERS ============

export async function getCalendarEventsByUserId(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId));
  
  if (startDate && endDate) {
    query = db.select().from(calendarEvents).where(
      and(
        eq(calendarEvents.userId, userId),
        gte(calendarEvents.eventDate, startDate),
        lte(calendarEvents.eventDate, endDate)
      )
    );
  }
  
  return query.orderBy(calendarEvents.eventDate);
}

export async function createCalendarEvent(data: InsertCalendarEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(calendarEvents).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateCalendarEvent(id: number, data: Partial<InsertCalendarEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(calendarEvents).set({ ...data, updatedAt: new Date() }).where(eq(calendarEvents.id, id));
}

export async function deleteCalendarEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}

// ============ INTEGRATION HELPERS ============

export async function getIntegrationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(integrations).where(eq(integrations.userId, userId));
}

export async function upsertIntegration(userId: number, platform: "facebook" | "instagram" | "linkedin" | "twitter", data: Partial<InsertIntegration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(integrations).where(
    and(eq(integrations.userId, userId), eq(integrations.platform, platform))
  ).limit(1);
  
  if (existing.length > 0) {
    await db.update(integrations).set({ ...data, updatedAt: new Date() }).where(eq(integrations.id, existing[0].id));
    return { ...existing[0], ...data };
  } else {
    const result = await db.insert(integrations).values({ ...data, userId, platform });
    return { id: Number(result[0].insertId), userId, platform, ...data };
  }
}

// ============ UPLOAD HELPERS ============

export async function getUploadsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(uploads).where(eq(uploads.userId, userId)).orderBy(desc(uploads.createdAt));
}

export async function createUpload(data: InsertUpload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(uploads).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function deleteUpload(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(uploads).where(eq(uploads.id, id));
}

// ============ IMPORT JOB HELPERS ============

export async function getImportJobsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(importJobs).where(eq(importJobs.userId, userId)).orderBy(desc(importJobs.createdAt));
}

export async function createImportJob(data: InsertImportJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(importJobs).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateImportJob(id: number, data: Partial<InsertImportJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(importJobs).set(data).where(eq(importJobs.id, id));
}

export async function getImportJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(importJobs).where(eq(importJobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ ANALYTICS HELPERS ============

export async function createAnalyticsRecord(data: InsertAnalytics) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(analytics).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function getAnalyticsByUserId(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  if (startDate && endDate) {
    return db.select().from(analytics).where(
      and(
        eq(analytics.userId, userId),
        gte(analytics.recordedAt, startDate),
        lte(analytics.recordedAt, endDate)
      )
    ).orderBy(desc(analytics.recordedAt));
  }
  
  return db.select().from(analytics).where(eq(analytics.userId, userId)).orderBy(desc(analytics.recordedAt));
}

export async function getAnalyticsByContentPostId(contentPostId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(analytics).where(eq(analytics.contentPostId, contentPostId)).orderBy(desc(analytics.recordedAt));
}

// ============ POSTING SCHEDULE HELPERS ============

export async function getPostingSchedulesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postingSchedules).where(eq(postingSchedules.userId, userId)).orderBy(desc(postingSchedules.createdAt));
}

export async function getActivePostingSchedules(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postingSchedules).where(
    and(
      eq(postingSchedules.userId, userId),
      eq(postingSchedules.isActive, true)
    )
  ).orderBy(desc(postingSchedules.nextRunAt));
}

export async function createPostingSchedule(data: InsertPostingSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(postingSchedules).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updatePostingSchedule(id: number, data: Partial<InsertPostingSchedule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(postingSchedules).set({ ...data, updatedAt: new Date() }).where(eq(postingSchedules.id, id));
}

export async function deletePostingSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(postingSchedules).where(eq(postingSchedules.id, id));
}

export async function getPostingScheduleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(postingSchedules).where(eq(postingSchedules.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ SUBSCRIPTION & USAGE TRACKING HELPERS ============

export async function getAllSubscriptionTiers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionTiers).where(eq(subscriptionTiers.isActive, true));
}

export async function getSubscriptionTierByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.name, name)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserSubscription(data: InsertUserSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(userSubscriptions).values(data).onDuplicateKeyUpdate({
    set: {
      tierId: data.tierId,
      status: data.status,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      trialEndsAt: data.trialEndsAt,
      updatedAt: new Date(),
    }
  });
}

export async function getUserUsageForMonth(userId: number, month: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(usageTracking).where(
    and(
      eq(usageTracking.userId, userId),
      eq(usageTracking.month, month)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementUsage(userId: number, type: 'posts' | 'images' | 'ai_calls' | 'api_calls', amount: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const month = new Date().toISOString().slice(0, 7); // "2026-01" format
  const existing = await getUserUsageForMonth(userId, month);
  
  if (existing) {
    const updates: Partial<InsertUsageTracking> = { lastUpdated: new Date() };
    if (type === 'posts') updates.postsGenerated = (existing.postsGenerated || 0) + amount;
    if (type === 'images') updates.imagesGenerated = (existing.imagesGenerated || 0) + amount;
    if (type === 'ai_calls') updates.aiCallsMade = (existing.aiCallsMade || 0) + amount;
    if (type === 'api_calls') updates.apiCallsMade = (existing.apiCallsMade || 0) + amount;
    
    await db.update(usageTracking).set(updates).where(eq(usageTracking.id, existing.id));
  } else {
    const newUsage: InsertUsageTracking = {
      userId,
      month,
      postsGenerated: type === 'posts' ? amount : 0,
      imagesGenerated: type === 'images' ? amount : 0,
      aiCallsMade: type === 'ai_calls' ? amount : 0,
      apiCallsMade: type === 'api_calls' ? amount : 0,
    };
    await db.insert(usageTracking).values(newUsage);
  }
}

export async function checkUsageLimits(userId: number): Promise<{ allowed: boolean; reason?: string; usage?: UsageTracking; tier?: SubscriptionTier }> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    return { allowed: false, reason: "No active subscription" };
  }
  
  const db = await getDb();
  if (!db) return { allowed: false, reason: "Database not available" };
  
  const tierResult = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, subscription.tierId)).limit(1);
  if (tierResult.length === 0) {
    return { allowed: false, reason: "Invalid subscription tier" };
  }
  
  const tier = tierResult[0];
  const month = new Date().toISOString().slice(0, 7);
  const usage = await getUserUsageForMonth(userId, month);
  
  // If tier has null limits, it's unlimited
  if (tier.postsPerMonth === null && tier.imagesPerMonth === null) {
    return { allowed: true, usage: usage || undefined, tier };
  }
  
  // Check if user has exceeded limits
  if (tier.postsPerMonth !== null && usage && (usage.postsGenerated || 0) >= tier.postsPerMonth) {
    return { allowed: false, reason: `Monthly post limit reached (${tier.postsPerMonth})`, usage, tier };
  }
  
  if (tier.imagesPerMonth !== null && usage && (usage.imagesGenerated || 0) >= tier.imagesPerMonth) {
    return { allowed: false, reason: `Monthly image limit reached (${tier.imagesPerMonth})`, usage, tier };
  }
  
  return { allowed: true, usage: usage || undefined, tier };
}

export async function createUsageAlert(data: InsertUsageAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(usageAlerts).values(data);
}

export async function getUnacknowledgedAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(usageAlerts).where(
    and(
      eq(usageAlerts.userId, userId),
      eq(usageAlerts.acknowledged, false)
    )
  ).orderBy(desc(usageAlerts.sentAt));
}

// ============ WHITE-LABEL HELPERS ============

export async function getWhiteLabelSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(whiteLabelSettings).where(eq(whiteLabelSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertWhiteLabelSettings(data: InsertWhiteLabelSettings) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(whiteLabelSettings).values(data).onDuplicateKeyUpdate({
    set: {
      appName: data.appName,
      appTagline: data.appTagline,
      logoUrl: data.logoUrl,
      faviconUrl: data.faviconUrl,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      customDomain: data.customDomain,
      customCss: data.customCss,
      hideOriginalBranding: data.hideOriginalBranding,
      supportEmail: data.supportEmail,
      supportPhone: data.supportPhone,
      termsUrl: data.termsUrl,
      privacyUrl: data.privacyUrl,
      updatedAt: new Date(),
    }
  });
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ HOOK ENGINE HELPERS ============

export async function getAllHooks(isPremium?: boolean) {
  const db = await getDb();
  if (!db) return [];
  
  if (isPremium === undefined) {
    // Return all hooks
    return await db.select().from(hooks).orderBy(desc(hooks.usageCount));
  }
  
  // Filter by premium status
  return await db.select().from(hooks).where(eq(hooks.isPremium, isPremium)).orderBy(desc(hooks.usageCount));
}

export async function getHooksByCategory(category: string, isPremium?: boolean) {
  const db = await getDb();
  if (!db) return [];
  
  if (isPremium === undefined) {
    return await db.select().from(hooks).where(sql`${hooks.category} = ${category}`).orderBy(desc(hooks.usageCount));
  }
  
  return await db.select().from(hooks)
    .where(sql`${hooks.category} = ${category} AND ${hooks.isPremium} = ${isPremium}`)
    .orderBy(desc(hooks.usageCount));
}

export async function getHooksByFormat(format: string, isPremium?: boolean) {
  const db = await getDb();
  if (!db) return [];
  
  if (isPremium === undefined) {
    return await db.select().from(hooks).where(sql`${hooks.format} = ${format}`).orderBy(desc(hooks.usageCount));
  }
  
  return await db.select().from(hooks)
    .where(sql`${hooks.format} = ${format} AND ${hooks.isPremium} = ${isPremium}`)
    .orderBy(desc(hooks.usageCount));
}

export async function getHookById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(hooks).where(eq(hooks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementHookUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(hooks)
    .set({ usageCount: sql`${hooks.usageCount} + 1` })
    .where(eq(hooks.id, id));
}

// ============ BETA SIGNUP HELPERS ============

export async function createBetaSignup(data: {
  name: string;
  brokerage?: string;
  email: string;
  phone?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create beta signup: database not available");
    return;
  }

  try {
    await db.insert(betaSignups).values({
      name: data.name,
      brokerage: data.brokerage || null,
      email: data.email,
      phone: data.phone || null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[Database] Failed to create beta signup:", error);
    throw error;
  }
}


// ============================================================
// Custom Prompt Templates
// ============================================================

export async function getCustomPromptTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customPromptTemplates).where(eq(customPromptTemplates.userId, userId)).orderBy(desc(customPromptTemplates.createdAt));
}

export async function createCustomPromptTemplate(data: InsertCustomPromptTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customPromptTemplates).values(data);
  return result;
}

export async function updateCustomPromptTemplate(id: number, data: Partial<InsertCustomPromptTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customPromptTemplates).set(data).where(eq(customPromptTemplates.id, id));
}

export async function deleteCustomPromptTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(customPromptTemplates).where(eq(customPromptTemplates.id, id));
}


// ============================================================
// Property Tours
// ============================================================

export async function createPropertyTour(data: InsertPropertyTour) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(propertyTours).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function getPropertyTourById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(propertyTours).where(eq(propertyTours.id, id)).limit(1);
  return result[0] || null;
}

export async function getPropertyToursByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propertyTours).where(eq(propertyTours.userId, userId)).orderBy(desc(propertyTours.createdAt));
}

export async function updatePropertyTour(id: number, data: Partial<InsertPropertyTour>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(propertyTours).set(data).where(eq(propertyTours.id, id));
}

export async function deletePropertyTour(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(propertyTours).where(eq(propertyTours.id, id));
}

/**
 * Find all property tours stuck in "processing" state for longer than olderThanMinutes.
 * These are orphaned background jobs killed by a server restart or crash.
 */
export async function getStuckProcessingTours(olderThanMinutes: number = 35) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  return db
    .select()
    .from(propertyTours)
    .where(
      and(
        eq(propertyTours.status, "processing"),
        lte(propertyTours.updatedAt, cutoff)
      )
    );
}

// ============ CONTENT TEMPLATES HELPERS ============
// For CSV bulk uploads of hooks, reel ideas, and scripts

export async function createContentTemplate(data: InsertContentTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentTemplates).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function createContentTemplatesBatch(templates: InsertContentTemplate[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentTemplates).values(templates);
  return result;
}

export async function getContentTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contentTemplates).where(eq(contentTemplates.id, id)).limit(1);
  return result[0] || null;
}

export async function getContentTemplatesByUserId(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentTemplates).where(eq(contentTemplates.userId, userId)).orderBy(desc(contentTemplates.createdAt)).limit(limit);
}

export async function getContentTemplatesByBatchId(batchId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentTemplates).where(eq(contentTemplates.importBatchId, batchId)).orderBy(contentTemplates.rowNumber);
}

export async function getPendingContentTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentTemplates)
    .where(and(
      eq(contentTemplates.userId, userId),
      eq(contentTemplates.status, 'pending')
    ))
    .orderBy(contentTemplates.createdAt);
}

export async function updateContentTemplate(id: number, data: Partial<InsertContentTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contentTemplates).set(data).where(eq(contentTemplates.id, id));
}

export async function deleteContentTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contentTemplates).where(eq(contentTemplates.id, id));
}

export async function deleteContentTemplatesByBatchId(batchId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contentTemplates).where(eq(contentTemplates.importBatchId, batchId));
}

// ============ DRAFT HELPERS ============

export async function createDraft(data: InsertDraft) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(drafts).values(data);
  return result[0];
}

export async function getDraftsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(drafts).where(eq(drafts.userId, userId)).orderBy(desc(drafts.createdAt));
}

export async function deleteDraft(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(drafts).where(eq(drafts.id, id));
}

export async function bulkDeleteDrafts(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(drafts).where(inArray(drafts.id, ids));
}

// ============ AI REELS HELPERS ============

export async function createAiReel(data: InsertAiReel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiReels).values(data);
  return result[0];
}

export async function getAiReelsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiReels).where(eq(aiReels.userId, userId)).orderBy(desc(aiReels.createdAt));
}

export async function getAiReelById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(aiReels).where(eq(aiReels.id, id));
  return results[0] || null;
}

export async function updateAiReel(id: number, data: Partial<InsertAiReel>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiReels).set(data).where(eq(aiReels.id, id));
}

export async function deleteAiReel(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(aiReels).where(eq(aiReels.id, id));
}

// ─── Watched Videos ───────────────────────────────────────────────────────────
export async function getWatchedVideoIds(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ videoId: watchedVideos.videoId })
    .from(watchedVideos)
    .where(eq(watchedVideos.userId, userId));
  return rows.map((r) => r.videoId);
}

export async function markVideoWatched(userId: number, videoId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if already exists
  const existing = await db.select({ id: watchedVideos.id })
    .from(watchedVideos)
    .where(and(eq(watchedVideos.userId, userId), eq(watchedVideos.videoId, videoId)));
  if (existing.length === 0) {
    await db.insert(watchedVideos).values({ userId, videoId });
  }
}

export async function unmarkVideoWatched(userId: number, videoId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(watchedVideos)
    .where(and(eq(watchedVideos.userId, userId), eq(watchedVideos.videoId, videoId)));
}


// ============ REFERRAL HELPERS ============

/**
 * Generate a unique 8-character alphanumeric referral code for a user.
 * Retries up to 5 times to avoid collisions.
 */
export async function generateReferralCode(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Unambiguous chars (no 0/O, 1/I)
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    // Check uniqueness
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code)).limit(1);
    if (existing.length === 0) {
      await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
      return code;
    }
  }
  throw new Error("Failed to generate unique referral code after 5 attempts");
}

/**
 * Get a user by their referral code.
 */
export async function getUserByReferralCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.referralCode, code.toUpperCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Apply a referral: award 25 credits to both the new user and the referrer.
 * Sets referredBy on the new user and logs credit transactions for both.
 * Safe to call only once per new user (checks referredBy is null).
 */
export async function applyReferral(newUserId: number, referrerUserId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Mark the new user as referred (idempotency guard)
  const newUser = await db.select({ referredBy: users.referredBy }).from(users).where(eq(users.id, newUserId)).limit(1);
  if (newUser.length > 0 && newUser[0].referredBy !== null) {
    // Already applied
    return;
  }

  await db.update(users)
    .set({ referredBy: referrerUserId })
    .where(eq(users.id, newUserId));

  // Import addCredits lazily to avoid circular deps
  const { addCredits } = await import("./credits");

  // Award 25 credits to the new user
  await addCredits({
    userId: newUserId,
    amount: 25,
    type: "bonus",
    description: "Referral bonus — joined via a friend's invite link",
  });

  // Award 25 credits to the referrer
  await addCredits({
    userId: referrerUserId,
    amount: 25,
    type: "bonus",
    description: "Referral reward — a friend joined using your invite link",
  });

  // Track total referral credits earned by referrer
  await db.update(users)
    .set({ referralCreditsEarned: sql`${users.referralCreditsEarned} + 25` })
    .where(eq(users.id, referrerUserId));
}

/**
 * Get referral stats for a user: their code, number of successful referrals, and total credits earned.
 */
export async function getReferralStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userRow = await db
    .select({ referralCode: users.referralCode, referralCreditsEarned: users.referralCreditsEarned })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRow.length === 0) throw new Error("User not found");

  const referralCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.referredBy, userId));

  return {
    referralCode: userRow[0].referralCode,
    referralCount: Number(referralCount[0]?.count ?? 0),
    creditsEarned: userRow[0].referralCreditsEarned ?? 0,
  };
}
