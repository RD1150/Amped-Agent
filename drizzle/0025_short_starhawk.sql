CREATE TABLE `content_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`hook` text NOT NULL,
	`reelIdea` text,
	`script` text,
	`category` varchar(100),
	`platform` varchar(50),
	`contentType` enum('reel','post','carousel','story','video') DEFAULT 'post',
	`scheduledDate` timestamp,
	`isScheduled` boolean DEFAULT false,
	`status` enum('pending','generated','scheduled','published','failed') DEFAULT 'pending',
	`generatedPostId` int,
	`errorMessage` text,
	`importBatchId` varchar(100),
	`rowNumber` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `property_tours` ADD `includeIntroVideo` boolean DEFAULT false;