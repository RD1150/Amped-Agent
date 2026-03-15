CREATE TABLE `lead_magnets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('first_time_buyer_guide','neighborhood_report','market_update') NOT NULL,
	`title` varchar(255) NOT NULL,
	`city` varchar(255) NOT NULL,
	`agentName` varchar(255),
	`agentBrokerage` varchar(255),
	`pdfUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_magnets_id` PRIMARY KEY(`id`)
);
