CREATE TABLE `video_scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`scenes` text NOT NULL DEFAULT ('[]'),
	`fullScript` text,
	`status` enum('draft','generating','completed','failed') NOT NULL DEFAULT 'draft',
	`videoUrl` text,
	`videoId` varchar(255),
	`totalDurationSec` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_scripts_id` PRIMARY KEY(`id`)
);
