ALTER TABLE `personas` ADD `klingAvatarHeadshotUrl` text;--> statement-breakpoint
ALTER TABLE `personas` ADD `klingAvatarVoiceUrl` text;--> statement-breakpoint
ALTER TABLE `personas` ADD `klingAvatarEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `property_tours` ADD `enableAvatarOverlay` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `property_tours` ADD `avatarOverlayPosition` enum('bottom-left','bottom-right') DEFAULT 'bottom-left';--> statement-breakpoint
ALTER TABLE `property_tours` ADD `klingAvatarTaskId` varchar(255);--> statement-breakpoint
ALTER TABLE `property_tours` ADD `klingAvatarVideoUrl` text;