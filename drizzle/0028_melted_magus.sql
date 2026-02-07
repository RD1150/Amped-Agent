CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase','usage','refund','bonus','trial') NOT NULL,
	`amount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`packageName` varchar(100),
	`amountPaid` int,
	`usageType` varchar(100),
	`relatedResourceId` int,
	`relatedResourceType` varchar(50),
	`description` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `creditBalance` int DEFAULT 50 NOT NULL;