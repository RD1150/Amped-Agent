-- Migration 0111: Add zapier_webhooks table for per-user Zapier webhook URLs
CREATE TABLE IF NOT EXISTS "zapier_webhooks" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "eventType" varchar(100) NOT NULL,
  "webhookUrl" text NOT NULL,
  "isEnabled" boolean DEFAULT true NOT NULL,
  "lastFiredAt" timestamp,
  "lastFireStatus" varchar(20),
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
