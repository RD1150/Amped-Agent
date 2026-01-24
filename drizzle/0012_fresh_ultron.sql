CREATE TABLE `hooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('buyer','seller','investor','local','luxury','relocation','general') NOT NULL,
	`format` enum('video','email','social','carousel') NOT NULL,
	`hookText` text NOT NULL,
	`useCase` text,
	`exampleExpansion` text,
	`isPremium` boolean DEFAULT false,
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hooks_id` PRIMARY KEY(`id`)
);
