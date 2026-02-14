ALTER TABLE `users` ADD `standardVideosThisMonth` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `aiEnhancedVideosThisMonth` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `fullAiVideosThisMonth` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastVideoCountReset` timestamp DEFAULT (now()) NOT NULL;