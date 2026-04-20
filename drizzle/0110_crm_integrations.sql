-- Migration 0110: Add crm_integrations table for Lofty, Follow Up Boss, and kvCORE API keys
CREATE TABLE IF NOT EXISTS "crm_integrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "platform" varchar(50) NOT NULL,
  "apiKey" text,
  "isEnabled" boolean DEFAULT true NOT NULL,
  "lastTestedAt" timestamp,
  "lastTestStatus" varchar(20),
  "lastTestMessage" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
