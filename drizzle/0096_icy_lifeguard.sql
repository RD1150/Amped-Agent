CREATE TABLE `saved_letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`letterType` varchar(100) NOT NULL,
	`letterLabel` varchar(200) NOT NULL,
	`letterCategory` varchar(100) NOT NULL,
	`targetInput` varchar(500),
	`recipientName` varchar(255),
	`content` text NOT NULL,
	`pdfUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_letters_id` PRIMARY KEY(`id`)
);
