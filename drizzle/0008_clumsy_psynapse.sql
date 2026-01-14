ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','trialing','past_due','canceled','incomplete','incomplete_expired','unpaid','inactive') DEFAULT 'inactive';--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionEndDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `cancelAtPeriodEnd` boolean DEFAULT false;