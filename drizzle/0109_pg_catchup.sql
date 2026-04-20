-- ============================================================
-- 0109_pg_catchup.sql
-- PostgreSQL catch-up migration: applies all changes from
-- MySQL-syntax migrations 0081–0108 that were never run
-- against the live PostgreSQL database.
-- All statements use IF NOT EXISTS / DO $$ guards to be safe.
-- ============================================================

-- 0081: listing_presentations columns
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "agentBio" text;
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "agentHeadshotUrl" text;
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "agentStats" text;
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "agentTestimonials" text;
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "marketingChannels" text;
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "pricingStrategy" text;
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "timelineToList" text;
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "creditsCost" integer NOT NULL DEFAULT 0;
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;

-- 0082: listing_presentations draft status
-- (MODIFY COLUMN for status enum — PostgreSQL: alter type if needed, skip if already correct)

-- 0083: listing_presentations gammaId/gammaUrl/exportFormat/status
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "gammaId" varchar(255);
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "gammaUrl" text;
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "exportFormat" varchar(16) DEFAULT 'pptx';

-- 0084: listing_presentations inputData
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "inputData" text;

-- 0086: listing_presentations thumbnailUrl
ALTER TABLE listing_presentations ADD COLUMN IF NOT EXISTS "thumbnailUrl" text;

-- 0087: personas bookingUrl
ALTER TABLE personas ADD COLUMN IF NOT EXISTS "bookingUrl" varchar(500);

-- 0088: buyer_presentations table
CREATE TABLE IF NOT EXISTS buyer_presentations (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL,
  title varchar(500) NOT NULL,
  "buyerName" varchar(255),
  "buyerType" varchar(100),
  "priceRange" varchar(200),
  "targetAreas" text,
  "desiredBedrooms" varchar(20),
  "desiredBathrooms" varchar(20),
  "mustHaves" text,
  "niceToHaves" text,
  timeline varchar(200),
  "marketCity" varchar(255),
  "marketState" varchar(100),
  "marketOverview" text,
  "avgDaysOnMarket" varchar(50),
  "avgListPrice" varchar(100),
  "inventoryLevel" varchar(100),
  "financingNotes" text,
  "lenderName" varchar(255),
  "lenderContact" varchar(255),
  "agentName" varchar(255),
  "agentHeadshotUrl" text,
  "agentBio" text,
  "agentStats" text,
  "agentTestimonials" text,
  "processSteps" text,
  "buyerConcerns" text,
  "gammaId" varchar(255),
  "gammaUrl" text,
  "exportFormat" varchar(16) DEFAULT 'pptx',
  "thumbnailUrl" text,
  status varchar(32) NOT NULL DEFAULT 'draft',
  "inputData" text,
  "creditsCost" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- 0089: presentation_views table
CREATE TABLE IF NOT EXISTS presentation_views (
  id serial PRIMARY KEY,
  "presentationId" integer NOT NULL,
  "presentationType" varchar(32) NOT NULL,
  "viewedAt" timestamp NOT NULL DEFAULT now(),
  "ipRegion" varchar(100)
);

-- 0090: users monthlyVideoSlotsUsed / slotsResetAt
ALTER TABLE users ADD COLUMN IF NOT EXISTS "monthlyVideoSlotsUsed" integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "slotsResetAt" timestamp NOT NULL DEFAULT now();

-- 0091: personas targetNeighborhoods / targetZipCodes
ALTER TABLE personas ADD COLUMN IF NOT EXISTS "targetNeighborhoods" text;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS "targetZipCodes" text;

-- 0093: users passwordHash
ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordHash" varchar(255);

-- 0094: users referral columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS "referralCode" varchar(16);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "referredBy" integer;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "referralCreditsEarned" integer NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_referralCode_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT "users_referralCode_unique" UNIQUE ("referralCode");
  END IF;
END $$;

-- 0095: generated_guides table
CREATE TABLE IF NOT EXISTS generated_guides (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "guideType" varchar(32) NOT NULL,
  "clientName" varchar(255),
  "propertyAddress" varchar(500),
  "cityArea" varchar(255),
  "agentName" varchar(255),
  "agentPhone" varchar(50),
  "agentEmail" varchar(320),
  "agentBrokerage" varchar(255),
  "agentHeadshotUrl" text,
  "agentLogoUrl" text,
  "coverPhotoUrl" text,
  "cmaData" text,
  "suggestedPriceRange" varchar(200),
  "customNotes" text,
  "pdfUrl" text NOT NULL,
  "s3Key" varchar(500) NOT NULL,
  "creditsCost" integer NOT NULL DEFAULT 5,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- 0096: saved_letters table
CREATE TABLE IF NOT EXISTS saved_letters (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "letterType" varchar(100) NOT NULL,
  "letterLabel" varchar(200) NOT NULL,
  "letterCategory" varchar(100) NOT NULL,
  "targetInput" varchar(500),
  "recipientName" varchar(255),
  content text NOT NULL,
  "pdfUrl" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- 0098: users trialEndsAt
ALTER TABLE users ADD COLUMN IF NOT EXISTS "trialEndsAt" timestamp;

-- 0099: users trialSource
ALTER TABLE users ADD COLUMN IF NOT EXISTS "trialSource" varchar(50);

-- 0100: invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id serial PRIMARY KEY,
  code varchar(32) NOT NULL UNIQUE,
  label varchar(255),
  "usedBy" integer,
  "usedAt" timestamp,
  "expiresAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- 0101: podcast_series and podcast_episodes tables
CREATE TABLE IF NOT EXISTS podcast_series (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL,
  title varchar(500) NOT NULL,
  description text,
  "seriesType" varchar(32) NOT NULL DEFAULT 'podcast',
  "coverImageUrl" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS podcast_episodes (
  id serial PRIMARY KEY,
  "seriesId" integer NOT NULL,
  "userId" integer NOT NULL,
  title varchar(500) NOT NULL,
  "episodeNumber" integer NOT NULL DEFAULT 1,
  script text,
  "audioUrl" text,
  "videoUrl" text,
  "outputType" varchar(32) DEFAULT 'audio',
  status varchar(32) NOT NULL DEFAULT 'draft',
  "errorMessage" text,
  "creditsCost" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- 0102: listing_kits table
CREATE TABLE IF NOT EXISTS listing_kits (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL,
  address varchar(500) NOT NULL,
  city varchar(255),
  state varchar(100),
  price varchar(64),
  bedrooms integer,
  bathrooms varchar(16),
  sqft integer,
  description text,
  "photoUrls" text,
  status varchar(32) NOT NULL DEFAULT 'draft',
  "socialPosts" text,
  "emailBlast" text,
  "presentationUrl" text,
  "propertyTourJobId" varchar(128),
  "propertyTourVideoUrl" text,
  "leadMagnetUrl" text,
  "errorMessage" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- 0103: testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "clientName" varchar(255) NOT NULL,
  "clientEmail" varchar(320),
  "reviewText" text,
  rating integer DEFAULT 5,
  source varchar(32) NOT NULL DEFAULT 'manual',
  "requestSentAt" timestamp,
  "receivedAt" timestamp,
  "socialPostText" text,
  "storyImageUrl" text,
  status varchar(32) NOT NULL DEFAULT 'requested',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- 0104: open_houses and open_house_leads tables
CREATE TABLE IF NOT EXISTS open_houses (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL,
  address varchar(500) NOT NULL,
  city varchar(255),
  date timestamp NOT NULL,
  "startTime" varchar(16),
  "endTime" varchar(16),
  price varchar(64),
  "publicSlug" varchar(64) NOT NULL UNIQUE,
  "followUpSequence" varchar(16) NOT NULL DEFAULT '3email',
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS open_house_leads (
  id serial PRIMARY KEY,
  "openHouseId" integer NOT NULL,
  "agentUserId" integer NOT NULL,
  name varchar(255) NOT NULL,
  email varchar(320),
  phone varchar(32),
  timeframe varchar(128),
  "preApproved" boolean DEFAULT false,
  notes text,
  "followUpStatus" varchar(32) NOT NULL DEFAULT 'pending',
  "emailsSent" integer NOT NULL DEFAULT 0,
  "nextFollowUpAt" timestamp,
  "crmLeadId" integer,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- 0104 (cont): crm_leads, crm_lead_notes, drip_sequences, drip_enrollments
CREATE TABLE IF NOT EXISTS crm_leads (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL,
  name varchar(255) NOT NULL,
  email varchar(320),
  phone varchar(32),
  stage varchar(32) NOT NULL DEFAULT 'new',
  source varchar(32) NOT NULL DEFAULT 'manual',
  "sourceRef" varchar(255),
  "lastContactedAt" timestamp,
  notes text,
  tags varchar(500),
  "isArchived" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_lead_notes (
  id serial PRIMARY KEY,
  "leadId" integer NOT NULL,
  "userId" integer NOT NULL,
  "noteType" varchar(32) NOT NULL DEFAULT 'note',
  content text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drip_sequences (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  "sequenceType" varchar(32) NOT NULL DEFAULT 'custom',
  steps text NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drip_enrollments (
  id serial PRIMARY KEY,
  "sequenceId" integer NOT NULL,
  "userId" integer NOT NULL,
  "contactName" varchar(255),
  "contactEmail" varchar(320) NOT NULL,
  "currentStep" integer NOT NULL DEFAULT 0,
  "nextSendAt" timestamp,
  status varchar(32) NOT NULL DEFAULT 'active',
  "enrolledAt" timestamp NOT NULL DEFAULT now(),
  "completedAt" timestamp,
  "lastEmailSentAt" timestamp,
  "emailsSent" integer NOT NULL DEFAULT 0
);

-- 0106: open_house_leads SMS columns
ALTER TABLE open_house_leads ADD COLUMN IF NOT EXISTS "smsConsent" boolean NOT NULL DEFAULT false;
ALTER TABLE open_house_leads ADD COLUMN IF NOT EXISTS "smsConsentTimestamp" timestamp;
ALTER TABLE open_house_leads ADD COLUMN IF NOT EXISTS "smsOptedOut" boolean NOT NULL DEFAULT false;
ALTER TABLE open_house_leads ADD COLUMN IF NOT EXISTS "smsSent" integer NOT NULL DEFAULT 0;

-- 0107: open_houses bedrooms/bathrooms
ALTER TABLE open_houses ADD COLUMN IF NOT EXISTS "bedrooms" varchar(16);
ALTER TABLE open_houses ADD COLUMN IF NOT EXISTS "bathrooms" varchar(16);

-- 0108: users weeklyDigest columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS "weeklyDigestEnabled" boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "weeklyDigestLastSentAt" timestamp;

-- Also add password reset columns referenced in authRoutes.ts
ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordResetToken" varchar(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "loginMethod" varchar(64);
