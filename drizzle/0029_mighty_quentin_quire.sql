ALTER TABLE `users` ADD `dailyVideoCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastDailyReset` timestamp DEFAULT (now()) NOT NULL;