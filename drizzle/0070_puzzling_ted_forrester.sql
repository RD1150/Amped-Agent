CREATE TABLE `live_tour_jobs` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`propertyAddress` varchar(500) NOT NULL DEFAULT '',
	`agentName` varchar(255) NOT NULL DEFAULT '',
	`agentPhone` varchar(50) NOT NULL DEFAULT '',
	`agentLogoUrl` varchar(1000) NOT NULL DEFAULT '',
	`clips` text NOT NULL DEFAULT ('[]'),
	`status` varchar(50) NOT NULL DEFAULT 'recording',
	`videoUrl` varchar(1000) NOT NULL DEFAULT '',
	`thumbnailUrl` varchar(1000) NOT NULL DEFAULT '',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `live_tour_jobs_id` PRIMARY KEY(`id`)
);
