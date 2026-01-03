import { eq, desc, and, gte, lte } from "drizzle-orm";
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
  InsertPostingSchedule, postingSchedules
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

// ============ PERSONA HELPERS ============

export async function getPersonaByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(personas).where(eq(personas.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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
