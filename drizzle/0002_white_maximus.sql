CREATE TABLE `analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentPostId` int NOT NULL,
	`platform` varchar(50) NOT NULL,
	`views` int DEFAULT 0,
	`likes` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`engagementRate` int DEFAULT 0,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posting_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`isActive` boolean DEFAULT true,
	`contentType` enum('property_listing','market_report','trending_news','tips','neighborhood','custom') NOT NULL,
	`frequency` enum('daily','weekly','biweekly','monthly') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`timeOfDay` varchar(10) NOT NULL,
	`platforms` text,
	`autoGenerate` boolean DEFAULT true,
	`templateSettings` text,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posting_schedules_id` PRIMARY KEY(`id`)
);
