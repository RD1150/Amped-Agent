CREATE TABLE `podcast_episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seriesId` int NOT NULL,
	`userId` int NOT NULL,
	`episodeNumber` int NOT NULL DEFAULT 1,
	`title` varchar(255) NOT NULL,
	`rawInput` text,
	`script` text,
	`outputType` enum('audio','avatar_video') NOT NULL DEFAULT 'audio',
	`voiceId` varchar(64),
	`audioUrl` text,
	`videoUrl` text,
	`videoJobId` varchar(128),
	`durationSeconds` int,
	`status` enum('draft','generating','ready','failed') NOT NULL DEFAULT 'draft',
	`errorMessage` text,
	`creditsCost` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `podcast_episodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `podcast_series` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`seriesType` enum('podcast','book') NOT NULL DEFAULT 'podcast',
	`coverImageUrl` text,
	`authorName` varchar(255),
	`category` varchar(128) DEFAULT 'Real Estate',
	`episodeCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `podcast_series_id` PRIMARY KEY(`id`)
);
