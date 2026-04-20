import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, decimal, serial } from "drizzle-orm/pg-core";

export const role_enum = pgEnum("role_enum", ["user", "admin"]);
export const subscriptionTier_enum = pgEnum("subscriptionTier_enum", ["starter", "pro", "authority"]);
export const subscriptionStatus_enum = pgEnum("subscriptionStatus_enum", ["active", "trialing", "past_due", "canceled", "incomplete", "incomplete_expired", "unpaid", "inactive"]);
export const preferredVoiceoverStyle_enum = pgEnum("preferredVoiceoverStyle_enum", ["professional", "warm", "luxury", "casual"]);
export const brandVoice_enum = pgEnum("brandVoice_enum", ["professional", "friendly", "luxury", "casual", "authoritative"]);
export const contentType_enum = pgEnum("contentType_enum", ["property_listing", "market_report", "trending_news", "tips", "neighborhood", "custom", "carousel", "video"]);
export const format_enum = pgEnum("format_enum", ["static_post", "carousel", "reel_script", "video_reel", "story"]);
export const status_enum = pgEnum("status_enum", ["draft", "scheduled", "published", "expired"]);
export const eventType_enum = pgEnum("eventType_enum", ["post", "reminder", "task"]);
export const platform_enum = pgEnum("platform_enum", ["facebook", "instagram", "linkedin", "twitter"]);
export const category_enum = pgEnum("category_enum", ["image", "document", "csv", "other"]);
export const importType_enum = pgEnum("importType_enum", ["csv", "google_doc"]);
export const status_enum_1 = pgEnum("status_enum_1", ["pending", "processing", "completed", "failed"]);
export const frequency_enum = pgEnum("frequency_enum", ["daily", "weekly", "biweekly", "monthly"]);
export const status_enum_2 = pgEnum("status_enum_2", ["active", "cancelled", "suspended", "trial"]);
export const alertType_enum = pgEnum("alertType_enum", ["posts_80", "posts_90", "posts_100", "images_80", "images_90", "images_100"]);
export const status_enum_3 = pgEnum("status_enum_3", ["running", "completed", "cancelled"]);
export const category_enum_1 = pgEnum("category_enum_1", ["buyer", "seller", "investor", "local", "luxury", "relocation", "general"]);
export const format_enum_1 = pgEnum("format_enum_1", ["video", "email", "social", "carousel"]);
export const status_enum_4 = pgEnum("status_enum_4", ["pending", "approved", "rejected"]);
export const videoMode_enum = pgEnum("videoMode_enum", ["standard", "ai-enhanced", "full-ai", "cinematic"]);
export const movementSpeed_enum = pgEnum("movementSpeed_enum", ["slow", "fast"]);
export const avatarOverlayPosition_enum = pgEnum("avatarOverlayPosition_enum", ["bottom-left", "bottom-right"]);
export const contentType_enum_1 = pgEnum("contentType_enum_1", ["reel", "post", "carousel", "story", "video"]);
export const status_enum_5 = pgEnum("status_enum_5", ["pending", "generated", "scheduled", "published", "failed"]);
export const type_enum = pgEnum("type_enum", ["purchase", "usage", "refund", "bonus", "trial"]);
export const type_enum_1 = pgEnum("type_enum_1", ["post", "reel", "tour"]);
export const tier_enum = pgEnum("tier_enum", ["free", "pro"]);
export const reelType_enum = pgEnum("reelType_enum", ["did_avatar", "authority_reel"]);
export const status_enum_6 = pgEnum("status_enum_6", ["processing", "completed", "failed", "expired"]);
export const status_enum_7 = pgEnum("status_enum_7", ["draft", "generating_scripts", "generating_avatar", "generating_broll", "compositing", "completed", "failed"]);
export const type_enum_2 = pgEnum("type_enum_2", ["property_tour", "authority_reel", "market_stats"]);
export const status_enum_8 = pgEnum("status_enum_8", ["rendering", "completed", "failed"]);
export const type_enum_3 = pgEnum("type_enum_3", ["first_time_buyer_guide", "neighborhood_report", "market_update"]);
export const status_enum_9 = pgEnum("status_enum_9", ["pending", "generating_clips", "assembling", "done", "failed"]);
export const service_enum = pgEnum("service_enum", ["creatomate", "elevenlabs", "runway", "kling", "openai", "did", "shotstack"]);
export const niche_enum = pgEnum("niche_enum", ["buyers", "sellers", "investors", "luxury", "relocation", "general", "local_authority"]);
export const avatarType_enum = pgEnum("avatarType_enum", ["v2_photo", "v3_custom"]);
export const status_enum_10 = pgEnum("status_enum_10", ["processing", "completed", "failed"]);
export const status_enum_11 = pgEnum("status_enum_11", ["training", "ready", "failed"]);
export const exportFormat_enum = pgEnum("exportFormat_enum", ["pdf", "pptx"]);
export const status_enum_12 = pgEnum("status_enum_12", ["draft", "generating", "completed", "failed"]);
export const presentationType_enum = pgEnum("presentationType_enum", ["listing", "buyer", "listing_webpage"]);
export const toolType_enum = pgEnum("toolType_enum", ["full_avatar_video", "ai_reels", "property_tour", "post_builder", "blog_builder", "youtube_builder", "newsletter", "lead_magnet", "market_insights", "expert_hooks", "listing_presentation", "other"]);
export const guideType_enum = pgEnum("guideType_enum", ["sellers_manual", "buyers_guide"]);
export const seriesType_enum = pgEnum("seriesType_enum", ["podcast", "book"]);
export const outputType_enum = pgEnum("outputType_enum", ["audio", "avatar_video"]);
export const status_enum_13 = pgEnum("status_enum_13", ["draft", "generating", "ready", "failed"]);
export const source_enum = pgEnum("source_enum", ["google", "zillow", "realtor", "manual", "other"]);
export const status_enum_14 = pgEnum("status_enum_14", ["requested", "received", "published"]);
export const followUpSequence_enum = pgEnum("followUpSequence_enum", ["none", "3email", "5email"]);
export const followUpStatus_enum = pgEnum("followUpStatus_enum", ["pending", "in_progress", "completed", "opted_out"]);
export const stage_enum = pgEnum("stage_enum", ["new", "contacted", "nurturing", "appointment_set", "closed"]);
export const source_enum_1 = pgEnum("source_enum_1", ["open_house", "lead_magnet", "referral", "social", "website", "manual", "other"]);
export const noteType_enum = pgEnum("noteType_enum", ["note", "call", "email", "meeting", "ai_suggestion"]);
export const sequenceType_enum = pgEnum("sequenceType_enum", ["seller_nurture", "buyer_nurture", "past_client", "open_house", "custom"]);
export const status_enum_15 = pgEnum("status_enum_15", ["active", "completed", "paused", "unsubscribed"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: role_enum().default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Stripe subscription fields
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionTier: subscriptionTier_enum().default("starter"),
  subscriptionStatus: subscriptionStatus_enum().default("inactive"),
  subscriptionEndDate: timestamp("subscriptionEndDate"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  trialEndsAt: timestamp("trialEndsAt"), // When the 14-day trial expires (null if never trialed or already converted)
  trialSource: varchar("trialSource", { length: 50 }), // Acquisition channel: 'organic', 'referral', 'ad', 'social', 'email', etc.
  // D-ID avatar fields
  avatarImageUrl: text("avatarImageUrl"), // User's headshot for D-ID avatar generation
  avatarVideoUrl: text("avatarVideoUrl"), // Generated D-ID avatar intro video URL
  avatarVideoSavedAt: timestamp("avatarVideoSavedAt"), // When the D-ID avatar video was last generated (for 90-day expiry warning)
  // Video generation usage tracking
  standardVideosThisMonth: integer("standardVideosThisMonth").default(0).notNull(),
  aiEnhancedVideosThisMonth: integer("aiEnhancedVideosThisMonth").default(0).notNull(),
  fullAiVideosThisMonth: integer("fullAiVideosThisMonth").default(0).notNull(),
  lastVideoCountReset: timestamp("lastVideoCountReset").defaultNow().notNull(),
  // Cinematic tier usage tracking
  cinematicPropertyToursThisMonth: integer("cinematicPropertyToursThisMonth").default(0).notNull(),
  cinematicAuthorityReelsThisMonth: integer("cinematicAuthorityReelsThisMonth").default(0).notNull(),
  lastCinematicCountReset: timestamp("lastCinematicCountReset").defaultNow().notNull(),
  // Monthly free video pool system
  monthlyVideoSlotsUsed: integer("monthlyVideoSlotsUsed").default(0).notNull(), // Slots used this billing cycle
  slotsResetAt: timestamp("slotsResetAt").defaultNow().notNull(), // When slots were last reset
  // Credit system
  creditBalance: integer("creditBalance").default(50).notNull(), // Start with 50 free trial credits
  // Rate limiting
  dailyVideoCount: integer("dailyVideoCount").default(0).notNull(),
  lastDailyReset: timestamp("lastDailyReset").defaultNow().notNull(),
  // Onboarding
  hasCompletedOnboarding: boolean("hasCompletedOnboarding").default(false).notNull(),
  onboardingStep: integer("onboardingStep").default(1).notNull(), // Current step in onboarding (1-5)
  // Terms of Service acceptance
  hasAcceptedTerms: boolean("hasAcceptedTerms").default(false).notNull(),
  termsAcceptedAt: timestamp("termsAcceptedAt"),
  // Beta Tester Agreement
  hasAcceptedBetaAgreement: boolean("hasAcceptedBetaAgreement").default(false).notNull(),
  betaAgreementAcceptedAt: timestamp("betaAgreementAcceptedAt"),
  // Voiceover preferences (saved from PropertyTours / AutoReels)
  preferredVoiceId: varchar("preferredVoiceId", { length: 64 }).default("21m00Tcm4TlvDq8ikWAM"),
  preferredVoiceoverStyle: preferredVoiceoverStyle_enum().default("professional"),
  // Cloned voice (ElevenLabs Instant Voice Clone from agent recording)
  clonedVoiceId: varchar("clonedVoiceId", { length: 64 }),
  clonedVoiceName: varchar("clonedVoiceName", { length: 128 }),
  // Email/password auth (null for OAuth-only users)
  passwordHash: varchar("passwordHash", { length: 255 }),
  // Password reset
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetExpiresAt: timestamp("passwordResetExpiresAt"),
  // Referral system
  referralCode: varchar("referralCode", { length: 16 }).unique(), // Unique code for this user's referral link
  referredBy: integer("referredBy"), // userId of the person who referred this user
  referralCreditsEarned: integer("referralCreditsEarned").default(0).notNull(), // Total credits earned from referrals
  // Weekly Email Digest
  weeklyDigestEnabled: boolean("weeklyDigestEnabled").default(false).notNull(), // Opt-in for Monday morning diagnosis email
  weeklyDigestLastSentAt: timestamp("weeklyDigestLastSentAt"), // When the last digest was sent
  // Beta video credits (avatar/twin videos during beta period)
  twinVideoCredits: int("twinVideoCredits").default(10).notNull(), // Beta users start with 10 free avatar video credits
  // Zapier / webhook integration
  zapierWebhookKey: varchar("zapierWebhookKey", { length: 64 }), // Unique key for inbound Zapier webhooks
  // Beta agreement
  hasAcceptedBetaAgreement: boolean("hasAcceptedBetaAgreement").default(false).notNull(),
  betaAgreementAcceptedAt: timestamp("betaAgreementAcceptedAt"),
  // Password reset (email/password auth)
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetExpiresAt: timestamp("passwordResetExpiresAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tracks which Get Started tutorial videos each user has watched
 */
export const watchedVideos = pgTable("watched_videos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  videoId: varchar("videoId", { length: 64 }).notNull(), // e.g. "post-builder", "agent-profile"
  watchedAt: timestamp("watchedAt").defaultNow().notNull(),
});

export type WatchedVideo = typeof watchedVideos.$inferSelect;
export type InsertWatchedVideo = typeof watchedVideos.$inferInsert;

/**
 * Persona & Brand settings for each user
 */
export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
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
  brandVoice: brandVoice_enum().default("professional"),
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
  yearsExperience: integer("yearsExperience"), // Years in real estate (from onboarding)
  primaryCity: varchar("primaryCity", { length: 255 }), // Primary market city (from onboarding, kept for legacy)
  primaryState: varchar("primaryState", { length: 100 }), // Primary market state (from onboarding)
  serviceCities: text("serviceCities"), // JSON: string[] of up to 5 cities/counties the agent serves
  headshotOffsetY: integer("headshotOffsetY").default(50), // Vertical position of headshot in circle (0=top, 100=bottom, 50=center)
  headshotZoom: integer("headshotZoom").default(100), // Zoom level of headshot (100=no zoom, 200=2x zoom)
  gammaThemeId: varchar("gammaThemeId", { length: 255 }), // Default Gamma workspace theme ID for Listing Presentations
  bookingUrl: varchar("bookingUrl", { length: 500 }), // Calendly / CRM booking link shown on presentation landing pages
  targetNeighborhoods: text("targetNeighborhoods"), // JSON: string[] - specific neighborhoods/subdivisions to dominate (e.g. ["Mueller", "Tarrytown"])
  targetZipCodes: text("targetZipCodes"), // JSON: string[] - target ZIP codes for hyperlocal SEO (e.g. ["78704", "78745"])
  localHighlights: text("localHighlights"), // JSON: string[] - local amenities, landmarks, schools, lifestyle features to mention in AI content (e.g. ["North Ranch Country Club", "Award-winning Conejo Valley schools", "15 min to Malibu beaches"])
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = typeof personas.$inferInsert;

/**
 * Content posts - the main content items
 */
export const contentPosts = pgTable("content_posts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 500 }),
  content: text("content").notNull(),
  contentType: contentType_enum().default("custom"),
  format: format_enum().default("static_post").notNull(),
  status: status_enum().default("draft"),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  platforms: text("platforms"), // JSON array stored as text - target platforms
  postedPlatforms: text("postedPlatforms"), // JSON array - platforms where post was successfully published
  imageUrl: text("imageUrl"),
  propertyAddress: varchar("propertyAddress", { length: 500 }),
  propertyPrice: integer("propertyPrice"),
  propertyBedrooms: integer("propertyBedrooms"),
  propertyBathrooms: integer("propertyBathrooms"),
  propertySqft: integer("propertySqft"),
  propertyDescription: text("propertyDescription"),
  propertyListingType: varchar("propertyListingType", { length: 50 }),
  aiGenerated: boolean("aiGenerated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ContentPost = typeof contentPosts.$inferSelect;
export type InsertContentPost = typeof contentPosts.$inferInsert;

/**
 * Calendar events - for scheduling and viewing content
 */
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  contentPostId: integer("contentPostId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventDate: timestamp("eventDate").notNull(),
  eventTime: varchar("eventTime", { length: 10 }),
  eventType: eventType_enum().default("post"),
  isAllDay: boolean("isAllDay").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Social media integrations
 */
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  platform: platform_enum().notNull(),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;

/**
 * Uploaded files/assets
 */
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 100 }),
  fileSize: integer("fileSize"),
  category: category_enum().default("other"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

/**
 * Import jobs - track CSV/Google Docs imports
 */
export const importJobs = pgTable("import_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  fileName: varchar("fileName", { length: 500 }),
  fileUrl: text("fileUrl"),
  importType: importType_enum().notNull(),
  status: status_enum_1().default("pending"),
  totalRows: integer("totalRows").default(0),
  processedRows: integer("processedRows").default(0),
  generatedPosts: integer("generatedPosts").default(0),
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
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  contentPostId: integer("contentPostId").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  clicks: integer("clicks").default(0),
  engagementRate: integer("engagementRate").default(0), // stored as percentage * 100
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;

/**
 * Posting schedules - automated recurring content patterns
 */
export const postingSchedules = pgTable("posting_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true),
  contentType: contentType_enum().notNull(),
  frequency: frequency_enum().notNull(),
  dayOfWeek: integer("dayOfWeek"), // 0-6 for Sunday-Saturday
  dayOfMonth: integer("dayOfMonth"), // 1-31 for monthly schedules
  timeOfDay: varchar("timeOfDay", { length: 10 }).notNull(), // HH:MM format
  platforms: text("platforms"), // JSON array stored as text
  autoGenerate: boolean("autoGenerate").default(true),
  templateSettings: text("templateSettings"), // JSON stored as text
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PostingSchedule = typeof postingSchedules.$inferSelect;
export type InsertPostingSchedule = typeof postingSchedules.$inferInsert;

/**
 * White-label settings - custom branding for agencies
 */
export const whiteLabelSettings = pgTable("white_label_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(), // The agency owner
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WhiteLabelSettings = typeof whiteLabelSettings.$inferSelect;
export type InsertWhiteLabelSettings = typeof whiteLabelSettings.$inferInsert;

/**
 * Subscription tiers - pricing plans
 */
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // "Basic", "Pro", "Agency"
  displayName: varchar("displayName", { length: 100 }).notNull(),
  monthlyPrice: integer("monthlyPrice").notNull(), // in cents
  yearlyPrice: integer("yearlyPrice"), // in cents
  postsPerMonth: integer("postsPerMonth"), // null = unlimited
  imagesPerMonth: integer("imagesPerMonth"), // null = unlimited
  platformsAllowed: integer("platformsAllowed").default(2),
  teamMembersAllowed: integer("teamMembersAllowed").default(1),
  clientsAllowed: integer("clientsAllowed").default(1), // for agencies
  whiteLabelEnabled: boolean("whiteLabelEnabled").default(false),
  analyticsEnabled: boolean("analyticsEnabled").default(true),
  prioritySupport: boolean("prioritySupport").default(false),
  features: text("features"), // JSON array of feature flags
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = typeof subscriptionTiers.$inferInsert;

/**
 * User subscriptions - links users to their tier
 */
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  tierId: integer("tierId").notNull(),
  status: status_enum_2().default("trial"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  trialEndsAt: timestamp("trialEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * Usage tracking - monitor user consumption
 */
export const usageTracking = pgTable("usage_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // "2026-01" format
  postsGenerated: integer("postsGenerated").default(0),
  imagesGenerated: integer("imagesGenerated").default(0),
  aiCallsMade: integer("aiCallsMade").default(0),
  storageUsedMb: integer("storageUsedMb").default(0),
  apiCallsMade: integer("apiCallsMade").default(0),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

/**
 * Usage alerts - notify users when approaching limits
 */
export const usageAlerts = pgTable("usage_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  alertType: alertType_enum().notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  acknowledged: boolean("acknowledged").default(false),
});

export type UsageAlert = typeof usageAlerts.$inferSelect;
export type InsertUsageAlert = typeof usageAlerts.$inferInsert;

/**
 * Post Analytics - track engagement metrics for published posts
 */
export const postAnalytics = pgTable("post_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  contentPostId: integer("contentPostId").notNull(),
  platform: platform_enum().notNull(),
  platformPostId: varchar("platformPostId", { length: 255 }),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  reach: integer("reach").default(0),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  engagementRate: decimal("engagementRate", { precision: 5, scale: 2 }).default("0.00"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostAnalytics = typeof postAnalytics.$inferSelect;
export type InsertPostAnalytics = typeof postAnalytics.$inferInsert;

/**
 * A/B Tests - compare performance of post variations
 */
export const abTests = pgTable("ab_tests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  variantAPostId: integer("variantAPostId").notNull(),
  variantBPostId: integer("variantBPostId").notNull(),
  winnerId: integer("winnerId"), // Which variant won (postId)
  status: status_enum_3().default("running"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AbTest = typeof abTests.$inferSelect;
export type InsertAbTest = typeof abTests.$inferInsert;

/**
 * Hook Engine - Proven content hooks to start posts/videos/carousels
 */
export const hooks = pgTable("hooks", {
  id: serial("id").primaryKey(),
  category: category_enum_1().notNull(),
  format: format_enum_1().notNull(),
  hookText: text("hookText").notNull(),
  useCase: text("useCase"), // Description of when to use this hook
  exampleExpansion: text("exampleExpansion"), // Example of how this hook expands into full content
  isPremium: boolean("isPremium").default(false), // Free tier gets ~20 hooks, Pro gets all
  usageCount: integer("usageCount").default(0), // Track popularity
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Hook = typeof hooks.$inferSelect;
export type InsertHook = typeof hooks.$inferInsert;

/**
 * Beta Signups - Track beta tester applications
 */
export const betaSignups = pgTable("beta_signups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  brokerage: varchar("brokerage", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  status: status_enum_4().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BetaSignup = typeof betaSignups.$inferSelect;
export type InsertBetaSignup = typeof betaSignups.$inferInsert;

/**
 * Custom prompt templates for AutoReels
 * Allows users to save their own reusable prompt templates
 */
export const customPromptTemplates = pgTable("custom_prompt_templates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  label: varchar("label", { length: 100 }).notNull(), // Display name (e.g., "Open House Promo")
  prompt: text("prompt").notNull(), // The actual prompt text
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CustomPromptTemplate = typeof customPromptTemplates.$inferSelect;
export type InsertCustomPromptTemplate = typeof customPromptTemplates.$inferInsert;

/**
 * Property Tours - Cinematic property tour videos
 * Allows agents to upload property photos and generate videos with Ken Burns effects
 */
export const propertyTours = pgTable("property_tours", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Property details
  address: varchar("address", { length: 500 }), // Optional — agents touring other brokers' listings may omit the address
  city: varchar("city", { length: 255 }), // Optional market/city tag (e.g., "Agoura Hills") when full address is not provided
  price: varchar("price", { length: 50 }), // Store as string to handle formatting ($1,500,000)
  beds: integer("beds"),
  baths: decimal("baths", { precision: 3, scale: 1 }), // Support 2.5 baths
  sqft: integer("sqft"),
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
  duration: integer("duration").default(30), // Video duration in seconds
  includeBranding: boolean("includeBranding").default(true), // Include agent branding overlay
  aspectRatio: varchar("aspectRatio", { length: 20 }).default("16:9"), // Video aspect ratio: 16:9, 9:16, 1:1
  cardTemplate: varchar("cardTemplate", { length: 50 }).default("modern"), // Intro/outro card style: modern, luxury, bold, classic, contemporary
  includeIntroVideo: boolean("includeIntroVideo").default(false), // Prepend user's intro video to tour
  videoMode: videoMode_enum().default("standard"), // Video generation mode
  enableVoiceover: boolean("enableVoiceover").default(false), // Enable AI voiceover narration
  voiceId: varchar("voiceId", { length: 100 }), // ElevenLabs voice ID for voiceover
  voiceoverScript: text("voiceoverScript"), // Custom voiceover script (if not provided, will auto-generate from property details)
  customCameraPrompt: text("customCameraPrompt"), // Custom Runway ML camera movement prompt (e.g., "drone shot flying over property")
  perPhotoMovements: text("perPhotoMovements"), // JSON array of camera movement presets for each photo (e.g., ["zoom-in-pan-right", "dramatic-zoom", ...])
  movementSpeed: movementSpeed_enum().default("slow"), // Camera movement speed: slow (6-8s per photo, cinematic) or fast (3-4s per photo, energetic)
  // Kling Avatar 2.0 overlay
  enableAvatarOverlay: boolean("enableAvatarOverlay").default(false), // Enable agent AI twin corner overlay
  avatarOverlayPosition: avatarOverlayPosition_enum().default("bottom-left"),
  klingAvatarTaskId: varchar("klingAvatarTaskId", { length: 255 }), // Kling task ID for polling
  klingAvatarVideoUrl: text("klingAvatarVideoUrl"), // Generated Kling Avatar video URL
  // YouTube SEO
  youtubeTitle: text("youtubeTitle"), // AI-generated YouTube-optimized title
  youtubeDescription: text("youtubeDescription"), // AI-generated YouTube description with keywords
  youtubeTags: text("youtubeTags"), // JSON array of keyword tags
  youtubeTimestamps: text("youtubeTimestamps"), // JSON array of {time, label} chapter markers
  // Avatar intro/outro
  avatarTwinId: integer("avatarTwinId"), // FK to custom_avatar_twins.id — which avatar to use for intro/outro
  avatarIntroScript: text("avatarIntroScript"), // Script for the avatar intro clip
  avatarIntroVideoUrl: text("avatarIntroVideoUrl"), // Generated HeyGen intro clip URL (S3)
  // Status
  status: status_enum_1().default("pending"),
  errorMessage: text("errorMessage"),
  processingStage: varchar("processingStage", { length: 100 }), // Background job stage: "preparing", "generating_ai_clips", "generating_voiceover", "submitting_to_shotstack"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PropertyTour = typeof propertyTours.$inferSelect;
export type InsertPropertyTour = typeof propertyTours.$inferInsert;

/**
 * Content Templates - Bulk imported templates from CSV
 * Stores hooks, reel ideas, scripts, and prompts for automated content generation
 */
export const contentTemplates = pgTable("content_templates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Core content fields
  hook: text("hook").notNull(), // Attention-grabbing opening line
  reelIdea: text("reelIdea"), // Short description of the reel concept
  script: text("script"), // Full script or prompt for content generation
  // Metadata
  category: varchar("category", { length: 100 }), // buyer, seller, market_update, tips, etc.
  platform: varchar("platform", { length: 50 }), // Instagram, TikTok, LinkedIn, Facebook, YouTube
  contentType: contentType_enum_1().default("post"),
  // Scheduling
  scheduledDate: timestamp("scheduledDate"), // When to auto-generate/post
  isScheduled: boolean("isScheduled").default(false),
  // Status tracking
  status: status_enum_5().default("pending"),
  generatedPostId: integer("generatedPostId"), // Link to contentPosts table if generated
  errorMessage: text("errorMessage"),
  // CSV import tracking
  importBatchId: varchar("importBatchId", { length: 100 }), // Group templates from same CSV upload
  rowNumber: integer("rowNumber"), // Original row number in CSV
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = typeof contentTemplates.$inferInsert;

/**
 * Credit Transactions - Track all credit purchases and usage
 */
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Transaction details
  type: type_enum().notNull(),
  amount: integer("amount").notNull(), // Positive for additions, negative for deductions
  balanceAfter: integer("balanceAfter").notNull(), // Credit balance after this transaction
  // Purchase details (if type = 'purchase')
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  packageName: varchar("packageName", { length: 100 }), // e.g., "Starter", "Professional", "Agency"
  amountPaid: integer("amountPaid"), // Amount paid in cents
  // Usage details (if type = 'usage')
  usageType: varchar("usageType", { length: 100 }), // e.g., "standard_video", "ai_enhanced_video", "full_ai_video", "voiceover"
  relatedResourceId: integer("relatedResourceId"), // e.g., property_tours.id
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
export const drafts = pgTable("drafts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: type_enum_1().notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Draft = typeof drafts.$inferSelect;
export type InsertDraft = typeof drafts.$inferInsert;

/**
 * Reel Usage - Track monthly reel generation limits per user
 */
export const reelUsage = pgTable("reel_usage", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // Format: "2026-02"
  count: integer("count").default(0).notNull(), // Number of reels generated this month
  tier: tier_enum().default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ReelUsage = typeof reelUsage.$inferSelect;
export type InsertReelUsage = typeof reelUsage.$inferInsert;

/**
 * AI Reels - Store generated talking avatar videos with 90-day retention
 */
export const aiReels = pgTable("ai_reels", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }), // Optional user-provided title
  script: text("script").notNull(), // The script used for generation
  // D-ID simple avatar fields
  didVideoUrl: text("didVideoUrl"), // Original D-ID video URL (nullable for Shotstack reels)
  avatarUrl: text("avatarUrl"), // Avatar image used (nullable for Creatomate reels)
  voiceId: varchar("voiceId", { length: 100 }), // Voice ID used (nullable for Creatomate reels)
  // Authority Reels fields
  hook: text("hook"), // Opening hook text for Authority Reels
  caption: text("caption"), // Full caption/description for Authority Reels
  shotstackRenderUrl: text("shotstackRenderUrl"), // Render video URL (Creatomate)
  shotstackRenderId: varchar("shotstackRenderId", { length: 255 }), // Creatomate render ID for status tracking
  // Common fields
  s3Key: varchar("s3Key", { length: 500 }), // S3 object key
  s3Url: text("s3Url"), // S3 public URL (our copy)
  duration: integer("duration"), // Video duration in seconds
  reelType: reelType_enum().default("did_avatar").notNull(), // Type of reel
  status: status_enum_6().default("processing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // 90 days from creation
});

export type AiReel = typeof aiReels.$inferSelect;
export type InsertAiReel = typeof aiReels.$inferInsert;

/**
 * City Showcase Videos - YouTube city tour videos (admin-only)
 */
export const cityShowcaseVideos = pgTable("city_showcase_videos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // Admin user who created it
  
  // City information
  cityName: varchar("cityName", { length: 255 }).notNull(),
  stateName: varchar("stateName", { length: 100 }).notNull(),
  
  // Video configuration
  videoLength: integer("videoLength").default(180).notNull(), // seconds (default 3 minutes)
  
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
  status: status_enum_7().default("draft").notNull(),
  errorMessage: text("errorMessage"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CityShowcaseVideo = typeof cityShowcaseVideos.$inferSelect;
export type InsertCityShowcaseVideo = typeof cityShowcaseVideos.$inferInsert;

// ─── Generated Videos Library ─────────────────────────────────────────────────
// Unified record for all generated videos (Property Tours, AutoReels, Market Stats)
export const generatedVideos = pgTable("generated_videos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: type_enum_2().notNull(),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  renderId: varchar("renderId", { length: 128 }),
  status: status_enum_8().default("rendering").notNull(),
  durationSeconds: integer("durationSeconds"),
  hasVoiceover: boolean("hasVoiceover").default(false).notNull(),
  creditsCost: integer("creditsCost").default(0).notNull(),
  secondaryVideoUrl: text("secondaryVideoUrl"), // Luxury dual-output: portrait 9:16 version
  metadata: text("metadata"), // JSON: address, price, location, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type GeneratedVideo = typeof generatedVideos.$inferSelect;
export type InsertGeneratedVideo = typeof generatedVideos.$inferInsert;

/**
 * Google Business Profile locations
 * Stores the user's connected GBP location(s) for posting
 */
export const gbpLocations = pgTable("gbp_locations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GbpLocation = typeof gbpLocations.$inferSelect;
export type InsertGbpLocation = typeof gbpLocations.$inferInsert;

// ─── Market Data Cache ─────────────────────────────────────────────────────────
// Persists RapidAPI Realtor API responses across server restarts to conserve quota
export const marketDataCache = pgTable("market_data_cache", {
  id: serial("id").primaryKey(),
  locationKey: varchar("locationKey", { length: 255 }).notNull().unique(), // normalized lowercase location
  data: text("data").notNull(), // JSON stringified MarketStatsData
  cachedAt: timestamp("cachedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});
export type MarketDataCacheRow = typeof marketDataCache.$inferSelect;
export type InsertMarketDataCache = typeof marketDataCache.$inferInsert;

// ─── YouTube Connections ───────────────────────────────────────────────────────
// Stores OAuth tokens for connected YouTube channels
export const youtubeConnections = pgTable("youtube_connections", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // OAuth tokens
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  // Channel info (populated after OAuth)
  channelId: varchar("channelId", { length: 255 }),
  channelTitle: varchar("channelTitle", { length: 255 }),
  channelThumbnail: text("channelThumbnail"),
  isConnected: boolean("isConnected").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type YoutubeConnection = typeof youtubeConnections.$inferSelect;
export type InsertYoutubeConnection = typeof youtubeConnections.$inferInsert;

// ─── Lead Magnets ──────────────────────────────────────────────────────────────
// Stores generated lead magnet PDFs for the My Lead Magnets library
export const leadMagnets = pgTable("lead_magnets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: type_enum_3().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  agentName: varchar("agentName", { length: 255 }),
  agentBrokerage: varchar("agentBrokerage", { length: 255 }),
  pdfUrl: text("pdfUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LeadMagnet = typeof leadMagnets.$inferSelect;
export type InsertLeadMagnet = typeof leadMagnets.$inferInsert;

// ─── Cinematic Walkthrough Jobs ────────────────────────────────────────────────
// Persists AI Cinematic Tour generation jobs so they survive server restarts
export const cinematicJobs = pgTable("cinematic_jobs", {
  id: varchar("id", { length: 64 }).primaryKey(), // UUID job ID
  userId: integer("userId").notNull(),
  status: status_enum_9().default("pending").notNull(),
  totalPhotos: integer("totalPhotos").default(0).notNull(),
  completedClips: integer("completedClips").default(0).notNull(),
  videoUrl: text("videoUrl"),
  error: text("error"),
  inputSnapshot: text("inputSnapshot"), // JSON snapshot of input for retry
  clipsJson: text("clipsJson"), // JSON array of per-clip results [{url, roomLabel, duration, roomType}]
  retryCount: integer("retryCount").default(0).notNull(), // number of retries (max 3) — server-restart failures are exempt
  isServerRestartFailure: boolean("isServerRestartFailure").default(false).notNull(), // true when failure was caused by server restart (exempt from retry limit)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type CinematicJob = typeof cinematicJobs.$inferSelect;
export type InsertCinematicJob = typeof cinematicJobs.$inferInsert;

// ─── AI API Usage Logs ─────────────────────────────────────────────────────────
// Tracks every AI API call with cost estimates for spend monitoring
export const apiUsageLogs = pgTable("api_usage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId"), // null = system-level call
  service: service_enum().notNull(),
  feature: varchar("feature", { length: 128 }).notNull(), // e.g. "property_tour", "auto_reel", "voiceover", "ai_clip"
  units: decimal("units", { precision: 10, scale: 4 }).notNull(), // seconds, characters, tokens, renders
  unitType: varchar("unitType", { length: 32 }).notNull(), // "seconds", "characters", "tokens", "renders"
  estimatedCostUsd: decimal("estimatedCostUsd", { precision: 10, scale: 6 }).notNull(), // estimated USD cost
  renderId: varchar("renderId", { length: 128 }), // optional render/job ID for cross-reference
  metadata: text("metadata"), // JSON string for extra context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;
export type InsertApiUsageLog = typeof apiUsageLogs.$inferInsert;

// ─── Blog Posts ─────────────────────────────────────────────────────────────────────────────────
// Stores AI-generated blog posts for real estate agents
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(), // Full blog post HTML/markdown
  topic: varchar("topic", { length: 255 }).notNull(), // e.g. "First-Time Buyer Tips"
  city: varchar("city", { length: 255 }), // Target city for hyperlocal SEO
  niche: niche_enum().default("general"),
  wordCount: integer("wordCount").default(0),
  seoKeywords: text("seoKeywords"), // JSON array of target keywords
  metaDescription: text("metaDescription"), // SEO meta description
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ─── Brand Stories ─────────────────────────────────────────────────────────────────────────────
// Stores AI-generated brand stories for real estate agents
export const brandStories = pgTable("brand_stories", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Interview answers (raw input)
  whyRealEstate: text("whyRealEstate"), // Why did you get into real estate?
  mostMemorableWin: text("mostMemorableWin"), // Most memorable client win
  whatMakesYouDifferent: text("whatMakesYouDifferent"), // What sets you apart?
  whoYouServe: text("whoYouServe"), // Who is your ideal client?
  yourMarket: text("yourMarket"), // What makes your market unique?
  personalFact: text("personalFact"), // One personal fact that humanizes you
  // Generated outputs
  shortBio: text("shortBio"), // 2-3 sentence bio for social profiles
  longBio: text("longBio"), // Full brand story (400-600 words)
  elevatorPitch: text("elevatorPitch"), // 30-second verbal pitch
  socialCaption: text("socialCaption"), // Instagram/Facebook intro post
  linkedinSummary: text("linkedinSummary"), // LinkedIn About section
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type BrandStory = typeof brandStories.$inferSelect;
export type InsertBrandStory = typeof brandStories.$inferInsert;

// ─── Full Avatar Videos ────────────────────────────────────────────────────────────────────────
// Stores full talking-head videos generated entirely by D-ID (not just intro clips)
export const fullAvatarVideos = pgTable("full_avatar_videos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }), // Optional user-provided title
  script: text("script").notNull(), // Full script delivered by the avatar
  avatarUrl: text("avatarUrl"), // Headshot URL (V2) or null for V3
  avatarType: avatarType_enum().default("v2_photo").notNull(),
  customAvatarId: varchar("customAvatarId", { length: 255 }), // D-ID V3 avatar ID (if custom twin)
  voiceId: varchar("voiceId", { length: 100 }).default("en-US-JennyNeural"),
  didTalkId: varchar("didTalkId", { length: 255 }), // D-ID talk job ID for status polling
  videoUrl: text("videoUrl"), // Final video URL (S3)
  s3Key: varchar("s3Key", { length: 500 }),
  duration: integer("duration"), // Estimated duration in seconds
  status: status_enum_10().default("processing").notNull(),
  thumbnailUrl: text("thumbnailUrl"), // Poster/thumbnail image URL for the video card
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // 90 days from creation
});
export type FullAvatarVideo = typeof fullAvatarVideos.$inferSelect;
export type InsertFullAvatarVideo = typeof fullAvatarVideos.$inferInsert;

// ─── Custom Avatar Twins (D-ID V3) ────────────────────────────────────────────────────────────
// Stores HeyGen / D-ID digital twins — multiple per user (different outfits/looks)
export const customAvatarTwins = pgTable("custom_avatar_twins", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // Multiple avatars per user allowed
  nickname: varchar("nickname", { length: 100 }), // e.g. "Blazer — Office", "Casual — Outdoor"
  isDefault: boolean("isDefault").default(false).notNull(), // Which avatar to use by default
  didAvatarId: varchar("didAvatarId", { length: 255 }).notNull(), // HeyGen / D-ID avatar ID
  trainingVideoUrl: text("trainingVideoUrl"), // S3 URL of training photo/video (null for manually linked)
  thumbnailUrl: text("thumbnailUrl"), // Preview thumbnail
  status: status_enum_11().default("training").notNull(),
  trainedAt: timestamp("trainedAt"), // When training completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type CustomAvatarTwin = typeof customAvatarTwins.$inferSelect;
export type InsertCustomAvatarTwin = typeof customAvatarTwins.$inferInsert;

// ─── Live Tour (in-browser guided room recorder) ─────────────────────────────
// Each row represents one guided recording session
export const liveTourJobs = pgTable("live_tour_jobs", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: integer("userId").notNull(),
  propertyAddress: varchar("propertyAddress", { length: 500 }).notNull().default(""),
  agentName: varchar("agentName", { length: 255 }).notNull().default(""),
  agentPhone: varchar("agentPhone", { length: 50 }).notNull().default(""),
  agentLogoUrl: varchar("agentLogoUrl", { length: 1000 }).notNull().default(""),
  // JSON array of { roomName, clipUrl, duration } objects
  clips: text("clips").notNull().default("[]"),
  // recording | processing | completed | failed
  status: varchar("status", { length: 50 }).notNull().default("recording"),
  videoUrl: varchar("videoUrl", { length: 1000 }).notNull().default(""),
  thumbnailUrl: varchar("thumbnailUrl", { length: 1000 }).notNull().default(""),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type LiveTourJob = typeof liveTourJobs.$inferSelect;
export type InsertLiveTourJob = typeof liveTourJobs.$inferInsert;

// ─── Image Library ────────────────────────────────────────────────────────────
// Stores property photos uploaded by agents, with optional AI-generated hooks
export const imageLibrary = pgTable("image_library", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  filename: varchar("filename", { length: 500 }).notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull().default("image/jpeg"),
  sizeBytes: integer("sizeBytes"),
  width: integer("width"),
  height: integer("height"),
  hookText: text("hookText"), // AI-generated hook text for overlay
  hookGenerated: integer("hookGenerated").default(0).notNull(),
  tags: text("tags").default("[]").notNull(), // JSON array of strings
  propertyAddress: varchar("propertyAddress", { length: 500 }),
  roomType: varchar("roomType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ImageLibraryItem = typeof imageLibrary.$inferSelect;
export type InsertImageLibraryItem = typeof imageLibrary.$inferInsert;

// ─── Listing Presentations (Gamma API) ───────────────────────────────────────
export const listingPresentations = pgTable("listing_presentations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),

  // ── Property Details ──────────────────────────────────────────────────────
  propertyAddress: varchar("propertyAddress", { length: 500 }),
  listingPrice: varchar("listingPrice", { length: 100 }),
  bedrooms: varchar("bedrooms", { length: 20 }),
  bathrooms: varchar("bathrooms", { length: 20 }),
  squareFeet: varchar("squareFeet", { length: 50 }),
  lotSize: varchar("lotSize", { length: 100 }),
  yearBuilt: varchar("yearBuilt", { length: 10 }),
  propertyType: varchar("propertyType", { length: 100 }),
  hoaFee: varchar("hoaFee", { length: 100 }),
  listingDescription: text("listingDescription"),
  keyFeatures: text("keyFeatures"),

  // ── Photos (S3 URLs stored as JSON array) ─────────────────────────────────
  photoUrls: text("photoUrls"), // JSON string[] — null means empty array

  // ── CMA / Market Data ─────────────────────────────────────────────────────
  // comps stored as JSON: [{address, price, sqft, pricePerSqft, daysOnMarket, soldDate}][]
  comparableSales: text("comparableSales"),
  marketOverview: text("marketOverview"), // free-text or auto-populated from Market Insights
  suggestedPriceRange: varchar("suggestedPriceRange", { length: 200 }),
  pricingRationale: text("pricingRationale"),

  // ── Agent Bio & Stats ─────────────────────────────────────────────────────
  agentName: varchar("agentName", { length: 255 }),
  agentHeadshotUrl: text("agentHeadshotUrl"),
  agentBio: text("agentBio"),
  agentStats: text("agentStats"), // free-text: years exp, homes sold, avg DOM, etc.
  agentTestimonials: text("agentTestimonials"), // JSON {author, text}[]

  // ── Marketing Plan ────────────────────────────────────────────────────────
  // channels stored as JSON string[]: ["MLS", "Zillow", "Social", "Email", "Open House", "Video Tour"]
  marketingChannels: text("marketingChannels"),
  marketingDetails: text("marketingDetails"), // free-text elaboration
  openHouseStrategy: text("openHouseStrategy"),
  timelineToList: text("timelineToList"), // free-text week-by-week plan

  // ── Gamma Output ─────────────────────────────────────────────────────────
  gammaId: varchar("gammaId", { length: 255 }),
  gammaUrl: text("gammaUrl"),
  exportUrl: text("exportUrl"),
  exportFormat: exportFormat_enum().default("pptx"),
  thumbnailUrl: text("thumbnailUrl"), // First-slide screenshot URL for card preview

  // ── Status & Metadata ────────────────────────────────────────────────────
  // draft = being built by agent, generating = sent to Gamma, completed = ready, failed = error
  status: status_enum_12().default("draft").notNull(),
  inputData: text("inputData"), // full JSON snapshot of all inputs at generation time
  creditsCost: integer("creditsCost").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ListingPresentation = typeof listingPresentations.$inferSelect;
export type InsertListingPresentation = typeof listingPresentations.$inferInsert;

// ─── Presentation View Tracking ─────────────────────────────────────────────────────────────────
export const presentationViews = pgTable("presentation_views", {
  id: serial("id").primaryKey(),
  presentationId: integer("presentationId").notNull(), // ID of the listing or buyer presentation
  presentationType: presentationType_enum().notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  ipRegion: varchar("ipRegion", { length: 100 }), // Rough geo from IP (optional)
});
export type PresentationView = typeof presentationViews.$inferSelect;

// ─── Buyer Presentations ─────────────────────────────────────────────────────
export const buyerPresentations = pgTable("buyer_presentations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),

  // ── Buyer Details ─────────────────────────────────────────────────────────
  buyerName: varchar("buyerName", { length: 255 }),
  buyerType: varchar("buyerType", { length: 100 }), // first-time, move-up, investor, relocating, downsizing
  priceRange: varchar("priceRange", { length: 200 }),
  targetAreas: text("targetAreas"), // JSON string[]
  desiredBedrooms: varchar("desiredBedrooms", { length: 20 }),
  desiredBathrooms: varchar("desiredBathrooms", { length: 20 }),
  mustHaves: text("mustHaves"), // free-text
  niceToHaves: text("niceToHaves"), // free-text
  timeline: varchar("timeline", { length: 200 }),

  // ── Market Snapshot ───────────────────────────────────────────────────────
  marketCity: varchar("marketCity", { length: 255 }),
  marketState: varchar("marketState", { length: 100 }),
  marketOverview: text("marketOverview"),
  avgDaysOnMarket: varchar("avgDaysOnMarket", { length: 50 }),
  avgListPrice: varchar("avgListPrice", { length: 100 }),
  inventoryLevel: varchar("inventoryLevel", { length: 100 }), // low / balanced / high

  // ── Financing Overview ────────────────────────────────────────────────────
  financingNotes: text("financingNotes"), // free-text: pre-approval, loan types, down payment
  lenderName: varchar("lenderName", { length: 255 }),
  lenderContact: varchar("lenderContact", { length: 255 }),

  // ── Agent Bio & Stats ─────────────────────────────────────────────────────
  agentName: varchar("agentName", { length: 255 }),
  agentHeadshotUrl: text("agentHeadshotUrl"),
  agentBio: text("agentBio"),
  agentStats: text("agentStats"),
  agentTestimonials: text("agentTestimonials"), // JSON {author, text}[]

  // ── Buying Process ────────────────────────────────────────────────────────
  processSteps: text("processSteps"), // JSON string[] — custom steps the agent wants to highlight
  buyerConcerns: text("buyerConcerns"), // free-text: common concerns and how agent addresses them

  // ── Gamma Output ─────────────────────────────────────────────────────────
  gammaId: varchar("gammaId", { length: 255 }),
  gammaUrl: text("gammaUrl"),
  exportFormat: exportFormat_enum().default("pptx"),
  thumbnailUrl: text("thumbnailUrl"),

  // ── Status & Metadata ────────────────────────────────────────────────────
  status: status_enum_12().default("draft").notNull(),
  inputData: text("inputData"),
  creditsCost: integer("creditsCost").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type BuyerPresentation = typeof buyerPresentations.$inferSelect;
export type InsertBuyerPresentation = typeof buyerPresentations.$inferInsert;

// ─── Video Script Builder ─────────────────────────────────────────────────────
export const videoScripts = pgTable("video_scripts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  // scenes stored as JSON array: [{id, spokenScript, visualPrompt, durationSec}]
  scenes: text("scenes").notNull().default("[]"),
  // assembled full script (spoken lines joined)
  fullScript: text("fullScript"),
  // video generation status
  status: status_enum_12().default("draft").notNull(),
  videoUrl: text("videoUrl"),
  videoId: varchar("videoId", { length: 255 }),
  totalDurationSec: integer("totalDurationSec"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type VideoScript = typeof videoScripts.$inferSelect;
export type InsertVideoScript = typeof videoScripts.$inferInsert;

// ─── Generation Quality Feedback (internal only, never shown to end users) ────
export const generationFeedback = pgTable("generation_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  toolType: toolType_enum().notNull(),
  referenceId: integer("referenceId"),
  referenceTable: varchar("referenceTable", { length: 100 }),
  rating: integer("rating").notNull(), // 1-5
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GenerationFeedback = typeof generationFeedback.$inferSelect;
export type InsertGenerationFeedback = typeof generationFeedback.$inferInsert;


// ─── Generated Guides (Seller's Manual & Buyer's Guide) ───────────────────────
// Stores branded PDF guides generated by agents for listing/buyer appointments
export const generatedGuides = pgTable("generated_guides", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  guideType: guideType_enum().notNull(),
  // Client & property info
  clientName: varchar("clientName", { length: 255 }), // Optional — e.g. "John & Mary Smith"
  propertyAddress: varchar("propertyAddress", { length: 500 }), // For seller's manual
  cityArea: varchar("cityArea", { length: 255 }), // e.g. "Los Angeles" or "Austin, TX"
  // Agent branding (snapshot at generation time)
  agentName: varchar("agentName", { length: 255 }),
  agentPhone: varchar("agentPhone", { length: 50 }),
  agentEmail: varchar("agentEmail", { length: 320 }),
  agentBrokerage: varchar("agentBrokerage", { length: 255 }),
  agentHeadshotUrl: text("agentHeadshotUrl"),
  agentLogoUrl: text("agentLogoUrl"),
  coverPhotoUrl: text("coverPhotoUrl"), // Custom cover or null for default
  // CMA data (JSON array of comps)
  cmaData: text("cmaData"), // JSON: [{address, salePrice, beds, baths, sqft, saleDate, adjustments, notes}]
  suggestedPriceRange: varchar("suggestedPriceRange", { length: 200 }),
  // Custom notes / action plan
  customNotes: text("customNotes"),
  // Generated output
  pdfUrl: text("pdfUrl").notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  creditsCost: integer("creditsCost").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GeneratedGuide = typeof generatedGuides.$inferSelect;
export type InsertGeneratedGuide = typeof generatedGuides.$inferInsert;

// ─── Saved Prospecting Letters ────────────────────────────────────────────────
export const savedLetters = pgTable("saved_letters", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  letterType: varchar("letterType", { length: 100 }).notNull(),
  letterLabel: varchar("letterLabel", { length: 200 }).notNull(),
  letterCategory: varchar("letterCategory", { length: 100 }).notNull(),
  targetInput: varchar("targetInput", { length: 500 }),
  recipientName: varchar("recipientName", { length: 255 }),
  content: text("content").notNull(),
  pdfUrl: text("pdfUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SavedLetter = typeof savedLetters.$inferSelect;
export type InsertSavedLetter = typeof savedLetters.$inferInsert;

// ─── Avatar Script History ────────────────────────────────────────────────────
export const avatarScripts = pgTable("avatar_scripts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  contentType: varchar("contentType", { length: 100 }).notNull(),
  title: varchar("title", { length: 200 }),
  keyPoints: text("keyPoints"),
  script: text("script").notNull(),
  targetLength: varchar("targetLength", { length: 20 }),
  city: varchar("city", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AvatarScript = typeof avatarScripts.$inferSelect;
export type InsertAvatarScript = typeof avatarScripts.$inferInsert;

// ─── Beta Invite Codes ────────────────────────────────────────────────────────
export const inviteCodes = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  label: varchar("label", { length: 200 }), // e.g. "Beta Tester - Jane Smith"
  usedByUserId: integer("usedByUserId"),         // null = not yet used
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt"),         // null = never expires
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdByAdminId: integer("createdByAdminId").notNull(),
  isRevoked: boolean("isRevoked").default(false).notNull(),
});
export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = typeof inviteCodes.$inferInsert;

/**
 * Podcast / Book Builder — Series (a show or a book)
 */
export const podcastSeries = pgTable("podcast_series", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  seriesType: seriesType_enum().default("podcast").notNull(),
  coverImageUrl: text("coverImageUrl"),
  authorName: varchar("authorName", { length: 255 }),
  category: varchar("category", { length: 128 }).default("Real Estate"),
  episodeCount: integer("episodeCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PodcastSeries = typeof podcastSeries.$inferSelect;
export type InsertPodcastSeries = typeof podcastSeries.$inferInsert;

/**
 * Podcast / Book Builder — Episodes (individual chapters or episodes)
 */
export const podcastEpisodes = pgTable("podcast_episodes", {
  id: serial("id").primaryKey(),
  seriesId: integer("seriesId").notNull(),
  userId: integer("userId").notNull(),
  episodeNumber: integer("episodeNumber").default(1).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  rawInput: text("rawInput"),           // Agent's raw notes / chapter text
  script: text("script"),               // AI-polished narration script
  outputType: outputType_enum().default("audio").notNull(),
  voiceId: varchar("voiceId", { length: 64 }),
  audioUrl: text("audioUrl"),           // ElevenLabs MP3 URL
  videoUrl: text("videoUrl"),           // Avatar video URL (if outputType = avatar_video)
  videoJobId: varchar("videoJobId", { length: 128 }), // HeyGen / D-ID job ID
  durationSeconds: integer("durationSeconds"),
  status: status_enum_13().default("draft").notNull(),
  errorMessage: text("errorMessage"),
  creditsCost: integer("creditsCost").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PodcastEpisode = typeof podcastEpisodes.$inferSelect;
export type InsertPodcastEpisode = typeof podcastEpisodes.$inferInsert;

/**
 * Listing Launch Kit — one listing → full asset bundle
 */
export const listingKits = pgTable("listing_kits", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 100 }),
  price: varchar("price", { length: 64 }),
  bedrooms: integer("bedrooms"),
  bathrooms: varchar("bathrooms", { length: 16 }),
  sqft: integer("sqft"),
  description: text("description"),
  photoUrls: text("photoUrls"), // JSON array of S3 URLs
  status: status_enum_13().default("draft").notNull(),
  // Generated asset references
  socialPosts: text("socialPosts"),       // JSON array of post strings
  emailBlast: text("emailBlast"),         // Email subject + body
  presentationUrl: text("presentationUrl"), // Gamma listing presentation URL
  propertyTourJobId: varchar("propertyTourJobId", { length: 128 }),
  propertyTourVideoUrl: text("propertyTourVideoUrl"),
  leadMagnetUrl: text("leadMagnetUrl"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ListingKit = typeof listingKits.$inferSelect;
export type InsertListingKit = typeof listingKits.$inferInsert;

/**
 * Testimonials — client reviews and auto-generated social posts
 */
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  reviewText: text("reviewText"),
  rating: integer("rating").default(5), // 1-5
  source: source_enum().default("manual").notNull(),
  requestSentAt: timestamp("requestSentAt"),
  receivedAt: timestamp("receivedAt"),
  socialPostText: text("socialPostText"),   // AI-generated social post from review
  storyImageUrl: text("storyImageUrl"),     // Branded story graphic URL
  status: status_enum_14().default("requested").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

/**
 * Open Houses — agent-created open house events
 */
export const openHouses = pgTable("open_houses", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 255 }),
  date: timestamp("date").notNull(),
  startTime: varchar("startTime", { length: 16 }),
  endTime: varchar("endTime", { length: 16 }),
  price: varchar("price", { length: 64 }),
  bedrooms: varchar("bedrooms", { length: 16 }),
  bathrooms: varchar("bathrooms", { length: 16 }),
  publicSlug: varchar("publicSlug", { length: 64 }).notNull().unique(), // URL-safe ID for QR
  followUpSequence: followUpSequence_enum().default("3email").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OpenHouse = typeof openHouses.$inferSelect;
export type InsertOpenHouse = typeof openHouses.$inferInsert;

/**
 * Open House Leads — visitors who signed in at an open house
 */
export const openHouseLeads = pgTable("open_house_leads", {
  id: serial("id").primaryKey(),
  openHouseId: integer("openHouseId").notNull(),
  agentUserId: integer("agentUserId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  timeframe: varchar("timeframe", { length: 128 }), // "3-6 months", "just looking", etc.
  preApproved: boolean("preApproved").default(false),
  notes: text("notes"),
  followUpStatus: followUpStatus_enum().default("pending").notNull(),
  emailsSent: integer("emailsSent").default(0).notNull(),
  nextFollowUpAt: timestamp("nextFollowUpAt"),
  crmLeadId: integer("crmLeadId"), // Link to leads table once transferred
  smsConsent: boolean("smsConsent").default(false).notNull(), // TCPA consent for SMS marketing
  smsConsentTimestamp: timestamp("smsConsentTimestamp"), // When consent was given (audit log)
  smsOptedOut: boolean("smsOptedOut").default(false).notNull(), // STOP reply received
  smsSent: integer("smsSent").default(0).notNull(), // Number of SMS messages sent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OpenHouseLead = typeof openHouseLeads.$inferSelect;
export type InsertOpenHouseLead = typeof openHouseLeads.$inferInsert;

/**
 * CRM Leads — lightweight pipeline for all lead sources
 */
export const crmLeads = pgTable("crm_leads", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  stage: stage_enum().default("new").notNull(),
  source: source_enum_1().default("manual").notNull(),
  sourceRef: varchar("sourceRef", { length: 255 }), // e.g. open house address, lead magnet title
  lastContactedAt: timestamp("lastContactedAt"),
  notes: text("notes"),
  tags: varchar("tags", { length: 500 }), // comma-separated
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;

/**
 * CRM Lead Notes — activity log per lead
 */
export const crmLeadNotes = pgTable("crm_lead_notes", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId").notNull(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  noteType: noteType_enum().default("note").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CrmLeadNote = typeof crmLeadNotes.$inferSelect;
export type InsertCrmLeadNote = typeof crmLeadNotes.$inferInsert;

/**
 * Email Drip Sequences — reusable multi-step email campaigns
 */
export const dripSequences = pgTable("drip_sequences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sequenceType: sequenceType_enum().default("custom").notNull(),
  steps: text("steps").notNull(), // JSON: [{subject, body, delayDays}]
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type DripSequence = typeof dripSequences.$inferSelect;
export type InsertDripSequence = typeof dripSequences.$inferInsert;

/**
 * Email Drip Enrollments — contacts enrolled in a drip sequence
 */
export const dripEnrollments = pgTable("drip_enrollments", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequenceId").notNull(),
  userId: integer("userId").notNull(),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  currentStep: integer("currentStep").default(0).notNull(), // 0-indexed step number
  nextSendAt: timestamp("nextSendAt"),
  status: status_enum_15().default("active").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  lastEmailSentAt: timestamp("lastEmailSentAt"),
  emailsSent: integer("emailsSent").default(0).notNull(),
});
export type DripEnrollment = typeof dripEnrollments.$inferSelect;
export type InsertDripEnrollment = typeof dripEnrollments.$inferInsert;

/**
 * CRM Integrations — stores API keys for external CRM platforms (Lofty, Follow Up Boss, kvCORE)
 */
export const crmIntegrations = pgTable("crm_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // "lofty" | "followupboss" | "kvcore"
  apiKey: text("apiKey"), // encrypted API key
  isEnabled: boolean("isEnabled").default(true).notNull(),
  lastTestedAt: timestamp("lastTestedAt"),
  lastTestStatus: varchar("lastTestStatus", { length: 20 }), // "success" | "failed"
  lastTestMessage: text("lastTestMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type CrmIntegration = typeof crmIntegrations.$inferSelect;
export type InsertCrmIntegration = typeof crmIntegrations.$inferInsert;
