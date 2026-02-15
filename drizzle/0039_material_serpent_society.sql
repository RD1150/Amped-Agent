CREATE TABLE `ai_reels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`script` text NOT NULL,
	`didVideoUrl` text NOT NULL,
	`s3Key` varchar(500),
	`s3Url` text,
	`avatarUrl` text NOT NULL,
	`voiceId` varchar(100) NOT NULL,
	`duration` int,
	`status` enum('processing','completed','failed','expired') NOT NULL DEFAULT 'processing',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `ai_reels_id` PRIMARY KEY(`id`)
);
