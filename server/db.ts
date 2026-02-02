import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  InsertPersona, personas,
  InsertContentPost, contentPosts,
  InsertCalendarEvent, calendarEvents,
  InsertIntegration, integrations,
  InsertUpload, uploads,
  InsertImportJob, importJobs,
  InsertGHLSettings, ghlSettings,
  InsertAnalytics, analytics,
  InsertPostingSchedule, postingSchedules,
  subscriptionTiers, SubscriptionTier,
  userSubscriptions, UserSubscription, InsertUserSubscription,
  usageTracking, UsageTracking, InsertUsageTracking,
  usageAlerts, UsageAlert, InsertUsageAlert,
  whiteLabelSettings, WhiteLabelSettings, InsertWhiteLabelSettings,
  hooks, Hook,
  betaSignups, BetaSignup, InsertBetaSignup
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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
    console.warn("[Database] Cannot upsert user: database not available");
    return;
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
  if (avatarVideoUrl !== null) updateData.avatarVideoUrl = avatarVideoUrl;
  
  await db.update(users).set(updateData).where(eq(users.id, userId));
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

// ============ GHL SETTINGS HELPERS ============

export async function getGHLSettingsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ghlSettings).where(eq(ghlSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertGHLSettings(userId: number, data: Partial<InsertGHLSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getGHLSettingsByUserId(userId);
  if (existing) {
    await db.update(ghlSettings).set({ ...data, updatedAt: new Date() }).where(eq(ghlSettings.userId, userId));
    return { ...existing, ...data };
  } else {
    const result = await db.insert(ghlSettings).values({ ...data, userId });
    return { id: Number(result[0].insertId), userId, ...data };
  }
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

