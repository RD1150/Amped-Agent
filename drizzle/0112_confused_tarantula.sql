CREATE TABLE `broll_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`s3Key` varchar(512) NOT NULL,
	`mediaType` enum('video','image') NOT NULL,
	`tags` text,
	`fileSize` int,
	`duration` decimal(10,2),
	`thumbnailUrl` text,
	`mimeType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `broll_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `interview_episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`guestId` int NOT NULL,
	`topic` varchar(500) NOT NULL,
	`script` text,
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`audioUrl` text,
	`audioKey` varchar(500),
	`videoUrl` text,
	`videoKey` varchar(500),
	`durationSeconds` int,
	`creditsCost` int DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_episodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_guests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(255) NOT NULL,
	`bio` text,
	`voiceId` varchar(255) NOT NULL,
	`voiceName` varchar(255),
	`avatarUrl` text,
	`avatarKey` varchar(500),
	`heygenAvatarId` varchar(255),
	`accentColor` varchar(20) DEFAULT '#6366f1',
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_guests_id` PRIMARY KEY(`id`)
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
ALTER TABLE `users` MODIFY COLUMN `twinVideoCredits` int NOT NULL DEFAULT 10;--> statement-breakpoint
ALTER TABLE `integrations` ADD `accessTokenSecret` text;--> statement-breakpoint
ALTER TABLE `integrations` ADD `twitterApiKey` text;--> statement-breakpoint
ALTER TABLE `integrations` ADD `twitterApiSecret` text;--> statement-breakpoint
ALTER TABLE `personas` ADD `localHighlights` text;--> statement-breakpoint
ALTER TABLE `users` ADD `hasAcceptedBetaAgreement` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `betaAgreementAcceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetExpiresAt` timestamp;