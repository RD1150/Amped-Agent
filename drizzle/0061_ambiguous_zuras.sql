CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`topic` varchar(255) NOT NULL,
	`city` varchar(255),
	`niche` enum('buyers','sellers','investors','luxury','relocation','general') DEFAULT 'general',
	`wordCount` int DEFAULT 0,
	`seoKeywords` text,
	`metaDescription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`whyRealEstate` text,
	`mostMemorableWin` text,
	`whatMakesYouDifferent` text,
	`whoYouServe` text,
	`yourMarket` text,
	`personalFact` text,
	`shortBio` text,
	`longBio` text,
	`elevatorPitch` text,
	`socialCaption` text,
	`linkedinSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_stories_id` PRIMARY KEY(`id`)
);
