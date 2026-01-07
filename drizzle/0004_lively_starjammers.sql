CREATE TABLE `subscription_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`monthlyPrice` int NOT NULL,
	`yearlyPrice` int,
	`postsPerMonth` int,
	`imagesPerMonth` int,
	`platformsAllowed` int DEFAULT 2,
	`teamMembersAllowed` int DEFAULT 1,
	`clientsAllowed` int DEFAULT 1,
	`whiteLabelEnabled` boolean DEFAULT false,
	`analyticsEnabled` boolean DEFAULT true,
	`prioritySupport` boolean DEFAULT false,
	`features` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_tiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertType` enum('posts_80','posts_90','posts_100','images_80','images_90','images_100') NOT NULL,
	`month` varchar(7) NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledged` boolean DEFAULT false,
	CONSTRAINT `usage_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`postsGenerated` int DEFAULT 0,
	`imagesGenerated` int DEFAULT 0,
	`aiCallsMade` int DEFAULT 0,
	`storageUsedMb` int DEFAULT 0,
	`apiCallsMade` int DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usage_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tierId` int NOT NULL,
	`status` enum('active','cancelled','suspended','trial') DEFAULT 'trial',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean DEFAULT false,
	`trialEndsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_subscriptions_userId_unique` UNIQUE(`userId`)
);
