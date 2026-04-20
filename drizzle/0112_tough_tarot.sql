CREATE TABLE `broll_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`s3Key` varchar(512) NOT NULL,
	`mediaType` enum('video','image') NOT NULL,
	`tags` text,
	`fileSize` int,
	`duration` decimal(10,2),
	`thumbnailUrl` text,
	`mimeType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `broll_library_id` PRIMARY KEY(`id`)
);
