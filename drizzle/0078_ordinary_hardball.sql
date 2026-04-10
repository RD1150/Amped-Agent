CREATE TABLE `watched_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`watchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watched_videos_id` PRIMARY KEY(`id`)
);
