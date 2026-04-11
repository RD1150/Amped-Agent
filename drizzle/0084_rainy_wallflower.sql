ALTER TABLE `listing_presentations` MODIFY COLUMN `exportFormat` enum('pdf','pptx') DEFAULT 'pptx';--> statement-breakpoint
ALTER TABLE `listing_presentations` MODIFY COLUMN `status` enum('draft','generating','completed','failed') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `listingPrice` varchar(100);--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `bedrooms` varchar(20);--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `bathrooms` varchar(20);--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `squareFeet` varchar(50);--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `lotSize` varchar(100);--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `yearBuilt` varchar(10);--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `propertyType` varchar(100);--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `hoaFee` varchar(100);--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `listingDescription` text;--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `keyFeatures` text;--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `photoUrls` text DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `comparableSales` text DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `marketOverview` text;--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `suggestedPriceRange` varchar(200);--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `pricingRationale` text;--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `agentName` varchar(255);--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `agentHeadshotUrl` text;--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `agentBio` text;--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `agentStats` text;--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `agentTestimonials` text DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `marketingChannels` text DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `marketingDetails` text;--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `openHouseStrategy` text;--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `timelineToList` text;--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `creditsCost` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `listing_presentations` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL;