import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

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
  // Stripe subscription fields
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionTier: mysqlEnum("subscriptionTier", ["starter", "pro", "premium"]).default("starter"),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "trialing", "past_due", "canceled", "incomplete", "incomplete_expired", "unpaid", "inactive"]).default("inactive"),
  subscriptionEndDate: timestamp("subscriptionEndDate"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  // D-ID avatar fields
  avatarImageUrl: text("avatarImageUrl"), // User's headshot for D-ID avatar generation
  avatarVideoUrl: text("avatarVideoUrl"), // Generated D-ID avatar intro video URL
  // Video generation usage tracking
  standardVideosThisMonth: int("standardVideosThisMonth").default(0).notNull(),
  aiEnhancedVideosThisMonth: int("aiEnhancedVideosThisMonth").default(0).notNull(),
  fullAiVideosThisMonth: int("fullAiVideosThisMonth").default(0).notNull(),
  lastVideoCountReset: timestamp("lastVideoCountReset").defaultNow().notNull(),
  // Cinematic tier usage tracking
  cinematicPropertyToursThisMonth: int("cinematicPropertyToursThisMonth").default(0).notNull(),
  cinematicAuthorityReelsThisMonth: int("cinematicAuthorityReelsThisMonth").default(0).notNull(),
  lastCinematicCountReset: timestamp("lastCinematicCountReset").defaultNow().notNull(),
  // Credit system
  creditBalance: int("creditBalance").default(50).notNull(), // Start with 50 free trial credits
  // Rate limiting
  dailyVideoCount: int("dailyVideoCount").default(0).notNull(),
  lastDailyReset: timestamp("lastDailyReset").defaultNow().notNull(),
  // Onboarding
  hasCompletedOnboarding: boolean("hasCompletedOnboarding").default(false).notNull(),
  onboardingStep: int("onboardingStep").default(1).notNull(), // Current step in onboarding (1-5)
  // Terms of Service acceptance
  hasAcceptedTerms: boolean("hasAcceptedTerms").default(false).notNull(),
  termsAcceptedAt: timestamp("termsAcceptedAt"),
  // Voiceover preferences (saved from PropertyTours / AutoReels)
  preferredVoiceId: varchar("preferredVoiceId", { length: 64 }).default("21m00Tcm4TlvDq8ikWAM"),
  preferredVoiceoverStyle: mysqlEnum("preferredVoiceoverStyle", ["professional", "warm", "luxury", "casual"]).default("professional"),
  // Cloned voice (ElevenLabs Instant Voice Clone from agent recording)
  clonedVoiceId: varchar("clonedVoiceId", { length: 64 }),
  clonedVoiceName: varchar("clonedVoiceName", { length: 128 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Persona & Brand settings for each user
 */
export const personas = mysqlTable("personas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentName: varchar("agentName", { length: 255 }), // Agent's full name
  licenseNumber: varchar("licenseNumber", { length: 100 }), // Agent DRE
  brokerageName: varchar("brokerageName", { length: 255 }), // Brokerage name
  brokerageDRE: varchar("brokerageDRE", { length: 100 }), // Brokerage DRE
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  headshotUrl: text("headshotUrl"),
  // Optional fields
  businessName: varchar("businessName", { length: 255 }),
  tagline: varchar("tagline", { length: 500 }),
  targetAudience: text("targetAudience"),
  brandVoice: mysqlEnum("brandVoice", ["professional", "friendly", "luxury", "casual", "authoritative"]).default("professional"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#C9A962"),
  logoUrl: text("logoUrl"),
  bio: text("bio"),
  brokerage: varchar("brokerage", { length: 255 }), // Legacy field, use brokerageName instead
  serviceAreas: text("serviceAreas"),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  emailAddress: varchar("emailAddress", { length: 320 }),
  socialHandles: text("socialHandles"), // JSON stored as text
  // Performance Coach personalization fields
  customerAvatar: text("customerAvatar"), // JSON: { type: "first-time-buyers" | "luxury-sellers" | "investors" | "relocators" | "downsizers", description: string }
  brandValues: text("brandValues"), // JSON: string[] - e.g. ["trust", "local expertise", "family-focused"]
  marketContext: text("marketContext"), // JSON: { city: string, state: string, marketType: "hot" | "balanced" | "buyers", keyTrends: string[] }
  isCompleted: boolean("isCompleted").default(false),
  // Kling Avatar 2.0 fields - for AI twin narration overlay in property tours
  klingAvatarHeadshotUrl: text("klingAvatarHeadshotUrl"), // Agent headshot for Kling Avatar 2.0 (jpg/png, ≥300px)
  klingAvatarVoiceUrl: text("klingAvatarVoiceUrl"),     // Agent voice recording URL (mp3/wav, 2-300s)
  klingAvatarEnabled: boolean("klingAvatarEnabled").default(false), // Whether avatar overlay is globally enabled
  // ElevenLabs voice clone fields - for AI voiceover narration in property tours
  elevenlabsVoiceId: varchar("elevenlabsVoiceId", { length: 255 }), // ElevenLabs cloned voice ID
  elevenlabsVoiceName: varchar("elevenlabsVoiceName", { length: 255 }), // Display name for the cloned voice
  voiceSampleUrl: text("voiceSampleUrl"), // URL to agent's voice recording sample (mp3/wav, 15s–5min)
  yearsExperience: int("yearsExperience"), // Years in real estate (from onboarding)
  primaryCity: varchar("primaryCity", { length: 255 }), // Primary market city (from onboarding)
  primaryState: varchar("primaryState", { length: 100 }), // Primary market state (from onboarding)
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
  contentType: mysqlEnum("contentType", ["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom", "carousel", "video"]).default("custom"),
  format: mysqlEnum("format", ["static_post", "carousel", "reel_script", "video_reel", "story"]).default("static_post").notNull(),
  status: mysqlEnum("status", ["draft", "scheduled", "published", "expired"]).default("draft"),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  platforms: text("platforms"), // JSON array stored as text - target platforms
  postedPlatforms: text("postedPlatforms"), // JSON array - platforms where post was successfully published
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
  contentType: mysqlEnum("contentType", ["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom", "carousel", "video"]).notNull(),
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

/**
 * Post Analytics - track engagement metrics for published posts
 */
export const postAnalytics = mysqlTable("post_analytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentPostId: int("contentPostId").notNull(),
  platform: mysqlEnum("platform", ["facebook", "instagram", "linkedin", "twitter"]).notNull(),
  platformPostId: varchar("platformPostId", { length: 255 }),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  reach: int("reach").default(0),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  engagementRate: decimal("engagementRate", { precision: 5, scale: 2 }).default("0.00"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostAnalytics = typeof postAnalytics.$inferSelect;
export type InsertPostAnalytics = typeof postAnalytics.$inferInsert;

/**
 * A/B Tests - compare performance of post variations
 */
export const abTests = mysqlTable("ab_tests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  variantAPostId: int("variantAPostId").notNull(),
  variantBPostId: int("variantBPostId").notNull(),
  winnerId: int("winnerId"), // Which variant won (postId)
  status: mysqlEnum("status", ["running", "completed", "cancelled"]).default("running"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AbTest = typeof abTests.$inferSelect;
export type InsertAbTest = typeof abTests.$inferInsert;

/**
 * Hook Engine - Proven content hooks to start posts/videos/carousels
 */
export const hooks = mysqlTable("hooks", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["buyer", "seller", "investor", "local", "luxury", "relocation", "general"]).notNull(),
  format: mysqlEnum("format", ["video", "email", "social", "carousel"]).notNull(),
  hookText: text("hookText").notNull(),
  useCase: text("useCase"), // Description of when to use this hook
  exampleExpansion: text("exampleExpansion"), // Example of how this hook expands into full content
  isPremium: boolean("isPremium").default(false), // Free tier gets ~20 hooks, Pro gets all
  usageCount: int("usageCount").default(0), // Track popularity
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Hook = typeof hooks.$inferSelect;
export type InsertHook = typeof hooks.$inferInsert;

/**
 * Beta Signups - Track beta tester applications
 */
export const betaSignups = mysqlTable("beta_signups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  brokerage: varchar("brokerage", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BetaSignup = typeof betaSignups.$inferSelect;
export type InsertBetaSignup = typeof betaSignups.$inferInsert;

/**
 * Custom prompt templates for AutoReels
 * Allows users to save their own reusable prompt templates
 */
export const customPromptTemplates = mysqlTable("custom_prompt_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 100 }).notNull(), // Display name (e.g., "Open House Promo")
  prompt: text("prompt").notNull(), // The actual prompt text
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomPromptTemplate = typeof customPromptTemplates.$inferSelect;
export type InsertCustomPromptTemplate = typeof customPromptTemplates.$inferInsert;

/**
 * Property Tours - Cinematic property tour videos
 * Allows agents to upload property photos and generate videos with Ken Burns effects
 */
export const propertyTours = mysqlTable("property_tours", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Property details
  address: varchar("address", { length: 500 }).notNull(),
  price: varchar("price", { length: 50 }), // Store as string to handle formatting ($1,500,000)
  beds: int("beds"),
  baths: decimal("baths", { precision: 3, scale: 1 }), // Support 2.5 baths
  sqft: int("sqft"),
  propertyType: varchar("propertyType", { length: 100 }), // Single Family, Condo, etc.
  description: text("description"),
  features: text("features"), // JSON array of key features
  // Media
  imageUrls: text("imageUrls").notNull(), // JSON array of S3 URLs for property photos
  videoUrl: text("videoUrl"), // S3 URL for generated video
  thumbnailUrl: text("thumbnailUrl"), // Video thumbnail
  // Video settings
  template: varchar("template", { length: 50 }).default("modern"), // modern, luxury, cozy
  musicTrack: varchar("musicTrack", { length: 100 }), // Background music selection
  duration: int("duration").default(30), // Video duration in seconds
  includeBranding: boolean("includeBranding").default(true), // Include agent branding overlay
  aspectRatio: varchar("aspectRatio", { length: 20 }).default("16:9"), // Video aspect ratio: 16:9, 9:16, 1:1
  cardTemplate: varchar("cardTemplate", { length: 50 }).default("modern"), // Intro/outro card style: modern, luxury, bold, classic, contemporary
  includeIntroVideo: boolean("includeIntroVideo").default(false), // Prepend user's intro video to tour
  videoMode: mysqlEnum("videoMode", ["standard", "ai-enhanced", "full-ai"]).default("standard"), // Video generation mode
  enableVoiceover: boolean("enableVoiceover").default(false), // Enable AI voiceover narration
  voiceId: varchar("voiceId", { length: 100 }), // ElevenLabs voice ID for voiceover
  voiceoverScript: text("voiceoverScript"), // Custom voiceover script (if not provided, will auto-generate from property details)
  customCameraPrompt: text("customCameraPrompt"), // Custom Runway ML camera movement prompt (e.g., "drone shot flying over property")
  perPhotoMovements: text("perPhotoMovements"), // JSON array of camera movement presets for each photo (e.g., ["zoom-in-pan-right", "dramatic-zoom", ...])
  movementSpeed: mysqlEnum("movementSpeed", ["slow", "fast"]).default("slow"), // Camera movement speed: slow (6-8s per photo, cinematic) or fast (3-4s per photo, energetic)
  // Kling Avatar 2.0 overlay
  enableAvatarOverlay: boolean("enableAvatarOverlay").default(false), // Enable agent AI twin corner overlay
  avatarOverlayPosition: mysqlEnum("avatarOverlayPosition", ["bottom-left", "bottom-right"]).default("bottom-left"),
  klingAvatarTaskId: varchar("klingAvatarTaskId", { length: 255 }), // Kling task ID for polling
  klingAvatarVideoUrl: text("klingAvatarVideoUrl"), // Generated Kling Avatar video URL
  // YouTube SEO
  youtubeTitle: text("youtubeTitle"), // AI-generated YouTube-optimized title
  youtubeDescription: text("youtubeDescription"), // AI-generated YouTube description with keywords
  youtubeTags: text("youtubeTags"), // JSON array of keyword tags
  youtubeTimestamps: text("youtubeTimestamps"), // JSON array of {time, label} chapter markers
  // Status
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  errorMessage: text("errorMessage"),
  processingStage: varchar("processingStage", { length: 100 }), // Background job stage: "preparing", "generating_ai_clips", "generating_voiceover", "submitting_to_shotstack"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PropertyTour = typeof propertyTours.$inferSelect;
export type InsertPropertyTour = typeof propertyTours.$inferInsert;

/**
 * Content Templates - Bulk imported templates from CSV
 * Stores hooks, reel ideas, scripts, and prompts for automated content generation
 */
export const contentTemplates = mysqlTable("content_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Core content fields
  hook: text("hook").notNull(), // Attention-grabbing opening line
  reelIdea: text("reelIdea"), // Short description of the reel concept
  script: text("script"), // Full script or prompt for content generation
  // Metadata
  category: varchar("category", { length: 100 }), // buyer, seller, market_update, tips, etc.
  platform: varchar("platform", { length: 50 }), // Instagram, TikTok, LinkedIn, Facebook, YouTube
  contentType: mysqlEnum("contentType", ["reel", "post", "carousel", "story", "video"]).default("post"),
  // Scheduling
  scheduledDate: timestamp("scheduledDate"), // When to auto-generate/post
  isScheduled: boolean("isScheduled").default(false),
  // Status tracking
  status: mysqlEnum("status", ["pending", "generated", "scheduled", "published", "failed"]).default("pending"),
  generatedPostId: int("generatedPostId"), // Link to contentPosts table if generated
  errorMessage: text("errorMessage"),
  // CSV import tracking
  importBatchId: varchar("importBatchId", { length: 100 }), // Group templates from same CSV upload
  rowNumber: int("rowNumber"), // Original row number in CSV
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = typeof contentTemplates.$inferInsert;

/**
 * Credit Transactions - Track all credit purchases and usage
 */
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Transaction details
  type: mysqlEnum("type", ["purchase", "usage", "refund", "bonus", "trial"]).notNull(),
  amount: int("amount").notNull(), // Positive for additions, negative for deductions
  balanceAfter: int("balanceAfter").notNull(), // Credit balance after this transaction
  // Purchase details (if type = 'purchase')
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  packageName: varchar("packageName", { length: 100 }), // e.g., "Starter", "Professional", "Agency"
  amountPaid: int("amountPaid"), // Amount paid in cents
  // Usage details (if type = 'usage')
  usageType: varchar("usageType", { length: 100 }), // e.g., "standard_video", "ai_enhanced_video", "full_ai_video", "voiceover"
  relatedResourceId: int("relatedResourceId"), // e.g., property_tours.id
  relatedResourceType: varchar("relatedResourceType", { length: 50 }), // e.g., "property_tour"
  // Metadata
  description: text("description"), // Human-readable description
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

/**
 * Drafts - Saved content drafts for later editing/posting
 */
export const drafts = mysqlTable("drafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["post", "reel", "tour"]).notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Draft = typeof drafts.$inferSelect;
export type InsertDraft = typeof drafts.$inferInsert;

/**
 * Reel Usage - Track monthly reel generation limits per user
 */
export const reelUsage = mysqlTable("reel_usage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // Format: "2026-02"
  count: int("count").default(0).notNull(), // Number of reels generated this month
  tier: mysqlEnum("tier", ["free", "pro"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReelUsage = typeof reelUsage.$inferSelect;
export type InsertReelUsage = typeof reelUsage.$inferInsert;

/**
 * AI Reels - Store generated talking avatar videos with 90-day retention
 */
export const aiReels = mysqlTable("ai_reels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }), // Optional user-provided title
  script: text("script").notNull(), // The script used for generation
  // D-ID simple avatar fields
  didVideoUrl: text("didVideoUrl"), // Original D-ID video URL (nullable for Shotstack reels)
  avatarUrl: text("avatarUrl"), // Avatar image used (nullable for Shotstack reels)
  voiceId: varchar("voiceId", { length: 100 }), // Voice ID used (nullable for Shotstack reels)
  // Shotstack Authority Reels fields
  hook: text("hook"), // Opening hook text for Authority Reels
  caption: text("caption"), // Full caption/description for Authority Reels
  shotstackRenderUrl: text("shotstackRenderUrl"), // Shotstack video URL
  shotstackRenderId: varchar("shotstackRenderId", { length: 255 }), // Shotstack render ID for status tracking
  // Common fields
  s3Key: varchar("s3Key", { length: 500 }), // S3 object key
  s3Url: text("s3Url"), // S3 public URL (our copy)
  duration: int("duration"), // Video duration in seconds
  reelType: mysqlEnum("reelType", ["did_avatar", "authority_reel"]).default("did_avatar").notNull(), // Type of reel
  status: mysqlEnum("status", ["processing", "completed", "failed", "expired"]).default("processing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // 90 days from creation
});

export type AiReel = typeof aiReels.$inferSelect;
export type InsertAiReel = typeof aiReels.$inferInsert;

/**
 * City Showcase Videos - YouTube city tour videos (admin-only)
 */
export const cityShowcaseVideos = mysqlTable("city_showcase_videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Admin user who created it
  
  // City information
  cityName: varchar("cityName", { length: 255 }).notNull(),
  stateName: varchar("stateName", { length: 100 }).notNull(),
  
  // Video configuration
  videoLength: int("videoLength").default(180).notNull(), // seconds (default 3 minutes)
  
  // Generated content
  introScript: text("introScript"), // Avatar intro script
  midScript1: text("midScript1"), // First mid-video avatar script
  midScript2: text("midScript2"), // Second mid-video avatar script
  outroScript: text("outroScript"), // Avatar outro script
  brollScript1: text("brollScript1"), // First B-roll voiceover narration
  brollScript2: text("brollScript2"), // Second B-roll voiceover narration
  brollScript3: text("brollScript3"), // Third B-roll voiceover narration
  
  // City data (from RapidAPI)
  cityData: text("cityData"), // JSON string with demographics, real estate stats
  
  // Generated assets
  introVideoUrl: text("introVideoUrl"), // D-ID avatar intro
  midVideo1Url: text("midVideo1Url"), // D-ID avatar mid-video #1
  midVideo2Url: text("midVideo2Url"), // D-ID avatar mid-video #2
  outroVideoUrl: text("outroVideoUrl"), // D-ID avatar outro
  brollVideo1Url: text("brollVideo1Url"), // Runway B-roll segment #1
  brollVideo2Url: text("brollVideo2Url"), // Runway B-roll segment #2
  brollVideo3Url: text("brollVideo3Url"), // Runway B-roll segment #3
  
  // Final composite video
  finalVideoUrl: text("finalVideoUrl"), // Shotstack composite
  thumbnailUrl: text("thumbnailUrl"),
  
  // Generation status
  status: mysqlEnum("status", ["draft", "generating_scripts", "generating_avatar", "generating_broll", "compositing", "completed", "failed"]).default("draft").notNull(),
  errorMessage: text("errorMessage"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CityShowcaseVideo = typeof cityShowcaseVideos.$inferSelect;
export type InsertCityShowcaseVideo = typeof cityShowcaseVideos.$inferInsert;

// ─── Generated Videos Library ─────────────────────────────────────────────────
// Unified record for all generated videos (Property Tours, AutoReels, Market Stats)
export const generatedVideos = mysqlTable("generated_videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["property_tour", "authority_reel", "market_stats"]).notNull(),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  renderId: varchar("renderId", { length: 128 }),
  status: mysqlEnum("status", ["rendering", "completed", "failed"]).default("rendering").notNull(),
  durationSeconds: int("durationSeconds"),
  hasVoiceover: boolean("hasVoiceover").default(false).notNull(),
  creditsCost: int("creditsCost").default(0).notNull(),
  metadata: text("metadata"), // JSON: address, price, location, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GeneratedVideo = typeof generatedVideos.$inferSelect;
export type InsertGeneratedVideo = typeof generatedVideos.$inferInsert;

/**
 * Google Business Profile locations
 * Stores the user's connected GBP location(s) for posting
 */
export const gbpLocations = mysqlTable("gbp_locations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Google OAuth tokens
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  // Google Account info
  googleAccountId: varchar("googleAccountId", { length: 255 }), // accounts/{id}
  googleEmail: varchar("googleEmail", { length: 320 }),
  // Business location info (selected by user after OAuth)
  locationName: varchar("locationName", { length: 255 }), // e.g. "Reena Dutta - REALTOR"
  locationId: varchar("locationId", { length: 255 }), // accounts/{id}/locations/{id}
  address: text("address"),
  isConnected: boolean("isConnected").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GbpLocation = typeof gbpLocations.$inferSelect;
export type InsertGbpLocation = typeof gbpLocations.$inferInsert;
