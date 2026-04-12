ALTER TABLE `users` ADD `monthlyVideoSlotsUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `slotsResetAt` timestamp DEFAULT (now()) NOT NULL;