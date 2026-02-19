import { mysqlTable, int, varchar, text, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * City Showcase videos table
 * Admin-only feature for generating YouTube city tour videos
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
