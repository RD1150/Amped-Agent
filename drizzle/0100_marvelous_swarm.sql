CREATE TABLE `avatar_scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentType` varchar(100) NOT NULL,
	`keyPoints` text,
	`script` text NOT NULL,
	`targetLength` varchar(20),
	`city` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `avatar_scripts_id` PRIMARY KEY(`id`)
);
