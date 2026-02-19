ALTER TABLE `users` ADD `hasAcceptedTerms` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `termsAcceptedAt` timestamp;