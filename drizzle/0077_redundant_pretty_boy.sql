CREATE TABLE `generation_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`toolType` enum('full_avatar_video','ai_reels','property_tour','post_builder','blog_builder','youtube_builder','newsletter','lead_magnet','market_insights','expert_hooks','listing_presentation','other') NOT NULL,
	`referenceId` int,
	`referenceTable` varchar(100),
	`rating` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generation_feedback_id` PRIMARY KEY(`id`)
);
