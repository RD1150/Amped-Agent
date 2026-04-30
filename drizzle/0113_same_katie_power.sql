CREATE TABLE `feedback_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`quote` text,
	`agentName` varchar(255),
	`agentTitle` varchar(255),
	`source` varchar(64) DEFAULT 'post_builder',
	`approved` boolean NOT NULL DEFAULT false,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_ratings_id` PRIMARY KEY(`id`)
);
