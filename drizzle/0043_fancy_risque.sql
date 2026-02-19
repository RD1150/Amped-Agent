ALTER TABLE `users` ADD `cinematicPropertyToursThisMonth` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `cinematicAuthorityReelsThisMonth` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastCinematicCountReset` timestamp DEFAULT (now()) NOT NULL;