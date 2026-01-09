import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Persona & Brand settings for each user
 */
export const personas = mysqlTable("personas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  businessName: varchar("businessName", { length: 255 }),
  tagline: varchar("tagline", { length: 500 }),
  targetAudience: text("targetAudience"),
  brandVoice: mysqlEnum("brandVoice", ["professional", "friendly", "luxury", "casual", "authoritative"]).default("professional"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#C9A962"),
  logoUrl: text("logoUrl"),
  headshotUrl: text("headshotUrl"),
  bio: text("bio"),
  brokerage: varchar("brokerage", { length: 255 }),
  licenseNumber: varchar("licenseNumber", { length: 100 }),
  serviceAreas: text("serviceAreas"),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  emailAddress: varchar("emailAddress", { length: 320 }),
  socialHandles: text("socialHandles"), // JSON stored as text
  isCompleted: boolean("isCompleted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = typeof personas.$inferInsert;

/**
 * Content posts - the main content items
 */
export const contentPosts = mysqlTable("content_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }),
  content: text("content").notNull(),
  contentType: mysqlEnum("contentType", ["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom"]).default("custom"),
  status: mysqlEnum("status", ["draft", "scheduled", "published", "expired"]).default("draft"),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  platforms: text("platforms"), // JSON array stored as text
  imageUrl: text("imageUrl"),
  propertyAddress: varchar("propertyAddress", { length: 500 }),
  propertyPrice: int("propertyPrice"),
  propertyBedrooms: int("propertyBedrooms"),
  propertyBathrooms: int("propertyBathrooms"),
  propertySqft: int("propertySqft"),
  propertyDescription: text("propertyDescription"),
  propertyListingType: varchar("propertyListingType", { length: 50 }),
  aiGenerated: boolean("aiGenerated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentPost = typeof contentPosts.$inferSelect;
export type InsertContentPost = typeof contentPosts.$inferInsert;

/**
 * Calendar events - for scheduling and viewing content
 */
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentPostId: int("contentPostId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventDate: timestamp("eventDate").notNull(),
  eventTime: varchar("eventTime", { length: 10 }),
  eventType: mysqlEnum("eventType", ["post", "reminder", "task"]).default("post"),
  isAllDay: boolean("isAllDay").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Social media integrations
 */
export const integrations = mysqlTable("integrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["facebook", "instagram", "linkedin", "twitter"]).notNull(),
  accountName: varchar("accountName", { length: 255 }),
  accountId: varchar("accountId", { length: 255 }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  isConnected: boolean("isConnected").default(false),
  connectedAt: timestamp("connectedAt"),
  // Instagram-specific fields
  instagramBusinessAccountId: varchar("instagramBusinessAccountId", { length: 255 }),
  instagramUsername: varchar("instagramUsername", { length: 255 }),
  facebookPageId: varchar("facebookPageId", { length: 255 }), // The Facebook Page connected to Instagram
  facebookPageAccessToken: text("facebookPageAccessToken"), // Page access token for Instagram posting
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;

/**
 * Uploaded files/assets
 */
export const uploads = mysqlTable("uploads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 100 }),
  fileSize: int("fileSize"),
  category: mysqlEnum("category", ["image", "document", "csv", "other"]).default("other"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

/**
 * Import jobs - track CSV/Google Docs imports
 */
export const importJobs = mysqlTable("import_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 500 }),
  fileUrl: text("fileUrl"),
  importType: mysqlEnum("importType", ["csv", "google_doc"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  totalRows: int("totalRows").default(0),
  processedRows: int("processedRows").default(0),
  generatedPosts: int("generatedPosts").default(0),
  errorMessage: text("errorMessage"),
  settings: text("settings"), // JSON stored as text
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ImportJob = typeof importJobs.$inferSelect;
export type InsertImportJob = typeof importJobs.$inferInsert;

/**
 * GoHighLevel settings
 */
export const ghlSettings = mysqlTable("ghl_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  apiKey: text("apiKey"),
  locationId: varchar("locationId", { length: 255 }),
  agencyId: varchar("agencyId", { length: 255 }),
  isConnected: boolean("isConnected").default(false),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GHLSettings = typeof ghlSettings.$inferSelect;
export type InsertGHLSettings = typeof ghlSettings.$inferInsert;

/**
 * Analytics - track post performance metrics
 */
export const analytics = mysqlTable("analytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentPostId: int("contentPostId").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  views: int("views").default(0),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  clicks: int("clicks").default(0),
  engagementRate: int("engagementRate").default(0), // stored as percentage * 100
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;

/**
 * Posting schedules - automated recurring content patterns
 */
export const postingSchedules = mysqlTable("posting_schedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true),
  contentType: mysqlEnum("contentType", ["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom"]).notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "biweekly", "monthly"]).notNull(),
  dayOfWeek: int("dayOfWeek"), // 0-6 for Sunday-Saturday
  dayOfMonth: int("dayOfMonth"), // 1-31 for monthly schedules
  timeOfDay: varchar("timeOfDay", { length: 10 }).notNull(), // HH:MM format
  platforms: text("platforms"), // JSON array stored as text
  autoGenerate: boolean("autoGenerate").default(true),
  templateSettings: text("templateSettings"), // JSON stored as text
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PostingSchedule = typeof postingSchedules.$inferSelect;
export type InsertPostingSchedule = typeof postingSchedules.$inferInsert;

/**
 * White-label settings - custom branding for agencies
 */
export const whiteLabelSettings = mysqlTable("white_label_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // The agency owner
  appName: varchar("appName", { length: 255 }).default("LuxEstate"),
  appTagline: varchar("appTagline", { length: 500 }),
  logoUrl: text("logoUrl"),
  faviconUrl: text("faviconUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#C9A962"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#1a1a1a"),
  accentColor: varchar("accentColor", { length: 7 }).default("#C9A962"),
  customDomain: varchar("customDomain", { length: 255 }),
  customCss: text("customCss"),
  hideOriginalBranding: boolean("hideOriginalBranding").default(false),
  supportEmail: varchar("supportEmail", { length: 320 }),
  supportPhone: varchar("supportPhone", { length: 20 }),
  termsUrl: text("termsUrl"),
  privacyUrl: text("privacyUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhiteLabelSettings = typeof whiteLabelSettings.$inferSelect;
export type InsertWhiteLabelSettings = typeof whiteLabelSettings.$inferInsert;

/**
 * Subscription tiers - pricing plans
 */
export const subscriptionTiers = mysqlTable("subscription_tiers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // "Basic", "Pro", "Agency"
  displayName: varchar("displayName", { length: 100 }).notNull(),
  monthlyPrice: int("monthlyPrice").notNull(), // in cents
  yearlyPrice: int("yearlyPrice"), // in cents
  postsPerMonth: int("postsPerMonth"), // null = unlimited
  imagesPerMonth: int("imagesPerMonth"), // null = unlimited
  platformsAllowed: int("platformsAllowed").default(2),
  teamMembersAllowed: int("teamMembersAllowed").default(1),
  clientsAllowed: int("clientsAllowed").default(1), // for agencies
  whiteLabelEnabled: boolean("whiteLabelEnabled").default(false),
  analyticsEnabled: boolean("analyticsEnabled").default(true),
  prioritySupport: boolean("prioritySupport").default(false),
  features: text("features"), // JSON array of feature flags
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = typeof subscriptionTiers.$inferInsert;

/**
 * User subscriptions - links users to their tier
 */
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tierId: int("tierId").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "suspended", "trial"]).default("trial"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  trialEndsAt: timestamp("trialEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * Usage tracking - monitor user consumption
 */
export const usageTracking = mysqlTable("usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // "2026-01" format
  postsGenerated: int("postsGenerated").default(0),
  imagesGenerated: int("imagesGenerated").default(0),
  aiCallsMade: int("aiCallsMade").default(0),
  storageUsedMb: int("storageUsedMb").default(0),
  apiCallsMade: int("apiCallsMade").default(0),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

/**
 * Usage alerts - notify users when approaching limits
 */
export const usageAlerts = mysqlTable("usage_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  alertType: mysqlEnum("alertType", ["posts_80", "posts_90", "posts_100", "images_80", "images_90", "images_100"]).notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  acknowledged: boolean("acknowledged").default(false),
});

export type UsageAlert = typeof usageAlerts.$inferSelect;
export type InsertUsageAlert = typeof usageAlerts.$inferInsert;
