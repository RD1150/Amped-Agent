CREATE TABLE `generated_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('property_tour','authority_reel','market_stats') NOT NULL,
	`videoUrl` text,
	`thumbnailUrl` text,
	`renderId` varchar(128),
	`status` enum('rendering','completed','failed') NOT NULL DEFAULT 'rendering',
	`durationSeconds` int,
	`hasVoiceover` boolean NOT NULL DEFAULT false,
	`creditsCost` int NOT NULL DEFAULT 0,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generated_videos_id` PRIMARY KEY(`id`)
);
