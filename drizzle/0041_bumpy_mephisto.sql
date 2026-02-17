ALTER TABLE `ai_reels` MODIFY COLUMN `didVideoUrl` text;--> statement-breakpoint
ALTER TABLE `ai_reels` MODIFY COLUMN `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `ai_reels` MODIFY COLUMN `voiceId` varchar(100);--> statement-breakpoint
ALTER TABLE `ai_reels` ADD `hook` text;--> statement-breakpoint
ALTER TABLE `ai_reels` ADD `caption` text;--> statement-breakpoint
ALTER TABLE `ai_reels` ADD `shotstackRenderUrl` text;--> statement-breakpoint
ALTER TABLE `ai_reels` ADD `shotstackRenderId` varchar(255);--> statement-breakpoint
ALTER TABLE `ai_reels` ADD `reelType` enum('did_avatar','authority_reel') DEFAULT 'did_avatar' NOT NULL;