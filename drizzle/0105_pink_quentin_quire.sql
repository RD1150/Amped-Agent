CREATE TABLE `crm_lead_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`noteType` enum('note','call','email','meeting','ai_suggestion') NOT NULL DEFAULT 'note',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_lead_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`stage` enum('new','contacted','nurturing','appointment_set','closed') NOT NULL DEFAULT 'new',
	`source` enum('open_house','lead_magnet','referral','social','website','manual','other') NOT NULL DEFAULT 'manual',
	`sourceRef` varchar(255),
	`lastContactedAt` timestamp,
	`notes` text,
	`tags` varchar(500),
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drip_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`userId` int NOT NULL,
	`contactName` varchar(255),
	`contactEmail` varchar(320) NOT NULL,
	`currentStep` int NOT NULL DEFAULT 0,
	`nextSendAt` timestamp,
	`status` enum('active','completed','paused','unsubscribed') NOT NULL DEFAULT 'active',
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`lastEmailSentAt` timestamp,
	`emailsSent` int NOT NULL DEFAULT 0,
	CONSTRAINT `drip_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drip_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sequenceType` enum('seller_nurture','buyer_nurture','past_client','open_house','custom') NOT NULL DEFAULT 'custom',
	`steps` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drip_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listing_kits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`address` varchar(500) NOT NULL,
	`city` varchar(255),
	`state` varchar(100),
	`price` varchar(64),
	`bedrooms` int,
	`bathrooms` varchar(16),
	`sqft` int,
	`description` text,
	`photoUrls` text,
	`status` enum('draft','generating','ready','failed') NOT NULL DEFAULT 'draft',
	`socialPosts` text,
	`emailBlast` text,
	`presentationUrl` text,
	`propertyTourJobId` varchar(128),
	`propertyTourVideoUrl` text,
	`leadMagnetUrl` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listing_kits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `open_house_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openHouseId` int NOT NULL,
	`agentUserId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`timeframe` varchar(128),
	`preApproved` boolean DEFAULT false,
	`notes` text,
	`followUpStatus` enum('pending','in_progress','completed','opted_out') NOT NULL DEFAULT 'pending',
	`emailsSent` int NOT NULL DEFAULT 0,
	`nextFollowUpAt` timestamp,
	`crmLeadId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `open_house_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `open_houses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`address` varchar(500) NOT NULL,
	`city` varchar(255),
	`date` timestamp NOT NULL,
	`startTime` varchar(16),
	`endTime` varchar(16),
	`price` varchar(64),
	`publicSlug` varchar(64) NOT NULL,
	`followUpSequence` enum('none','3email','5email') NOT NULL DEFAULT '3email',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `open_houses_id` PRIMARY KEY(`id`),
	CONSTRAINT `open_houses_publicSlug_unique` UNIQUE(`publicSlug`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320),
	`reviewText` text,
	`rating` int DEFAULT 5,
	`source` enum('google','zillow','realtor','manual','other') NOT NULL DEFAULT 'manual',
	`requestSentAt` timestamp,
	`receivedAt` timestamp,
	`socialPostText` text,
	`storyImageUrl` text,
	`status` enum('requested','received','published') NOT NULL DEFAULT 'requested',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
