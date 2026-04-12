CREATE TABLE `presentation_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`presentationId` int NOT NULL,
	`presentationType` enum('listing','buyer','listing_webpage') NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`ipRegion` varchar(100),
	CONSTRAINT `presentation_views_id` PRIMARY KEY(`id`)
);
