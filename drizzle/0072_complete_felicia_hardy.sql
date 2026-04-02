CREATE TABLE `image_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`filename` varchar(500) NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`url` text NOT NULL,
	`mimeType` varchar(100) NOT NULL DEFAULT 'image/jpeg',
	`sizeBytes` int,
	`width` int,
	`height` int,
	`hookText` text,
	`hookGenerated` tinyint NOT NULL DEFAULT 0,
	`tags` text NOT NULL DEFAULT ('[]'),
	`propertyAddress` varchar(500),
	`roomType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `image_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listing_presentations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`propertyAddress` varchar(500),
	`gammaId` varchar(255),
	`gammaUrl` text,
	`exportUrl` text,
	`exportFormat` enum('pdf','pptx') DEFAULT 'pdf',
	`status` enum('generating','completed','failed') NOT NULL DEFAULT 'generating',
	`inputData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listing_presentations_id` PRIMARY KEY(`id`)
);
