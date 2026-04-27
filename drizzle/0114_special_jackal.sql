CREATE TABLE `crm_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` varchar(50) NOT NULL,
	`apiKey` text,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`lastTestedAt` timestamp,
	`lastTestStatus` varchar(20),
	`lastTestMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `zapier_webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`webhookUrl` text NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`lastFiredAt` timestamp,
	`lastFireStatus` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `zapier_webhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `personas` ADD `localHighlights` text;--> statement-breakpoint
ALTER TABLE `users` ADD `hasAcceptedBetaAgreement` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `betaAgreementAcceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetExpiresAt` timestamp;