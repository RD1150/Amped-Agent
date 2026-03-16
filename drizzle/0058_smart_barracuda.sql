CREATE TABLE `cinematic_jobs` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','generating_clips','assembling','done','failed') NOT NULL DEFAULT 'pending',
	`totalPhotos` int NOT NULL DEFAULT 0,
	`completedClips` int NOT NULL DEFAULT 0,
	`videoUrl` text,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cinematic_jobs_id` PRIMARY KEY(`id`)
);
