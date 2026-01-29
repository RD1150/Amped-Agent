CREATE TABLE `beta_signups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`brokerage` varchar(255),
	`email` varchar(255) NOT NULL,
	`phone` varchar(50),
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beta_signups_id` PRIMARY KEY(`id`)
);
