CREATE TABLE `custom_avatar_twins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`didAvatarId` varchar(255) NOT NULL,
	`trainingVideoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`status` enum('training','ready','failed') NOT NULL DEFAULT 'training',
	`trainedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_avatar_twins_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_avatar_twins_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `full_avatar_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`script` text NOT NULL,
	`avatarUrl` text,
	`avatarType` enum('v2_photo','v3_custom') NOT NULL DEFAULT 'v2_photo',
	`customAvatarId` varchar(255),
	`voiceId` varchar(100) DEFAULT 'en-US-JennyNeural',
	`didTalkId` varchar(255),
	`videoUrl` text,
	`s3Key` varchar(500),
	`duration` int,
	`status` enum('processing','completed','failed') NOT NULL DEFAULT 'processing',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `full_avatar_videos_id` PRIMARY KEY(`id`)
);
