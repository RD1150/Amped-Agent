CREATE TABLE `api_usage_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`service` enum('creatomate','elevenlabs','runway','kling','openai','did','shotstack') NOT NULL,
	`feature` varchar(128) NOT NULL,
	`units` decimal(10,4) NOT NULL,
	`unitType` varchar(32) NOT NULL,
	`estimatedCostUsd` decimal(10,6) NOT NULL,
	`renderId` varchar(128),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_usage_logs_id` PRIMARY KEY(`id`)
);
