ALTER TABLE `users` ADD `weeklyDigestEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `weeklyDigestLastSentAt` timestamp;