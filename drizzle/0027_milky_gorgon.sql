ALTER TABLE `property_tours` ADD `videoMode` enum('standard','ai-enhanced','full-ai') DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE `property_tours` ADD `enableVoiceover` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `property_tours` ADD `voiceId` varchar(100);