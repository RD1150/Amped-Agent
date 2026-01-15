CREATE TABLE `ab_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`testName` varchar(255) NOT NULL,
	`variantAPostId` int NOT NULL,
	`variantBPostId` int NOT NULL,
	`winnerId` int,
	`status` enum('running','completed','cancelled') DEFAULT 'running',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentPostId` int NOT NULL,
	`platform` enum('facebook','instagram','linkedin','twitter') NOT NULL,
	`platformPostId` varchar(255),
	`likes` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`reach` int DEFAULT 0,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`engagementRate` decimal(5,2) DEFAULT '0.00',
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('starter','professional','agency') DEFAULT 'starter';