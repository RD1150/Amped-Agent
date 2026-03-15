CREATE TABLE `gbp_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`googleAccountId` varchar(255),
	`googleEmail` varchar(320),
	`locationName` varchar(255),
	`locationId` varchar(255),
	`address` text,
	`isConnected` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gbp_locations_id` PRIMARY KEY(`id`)
);
