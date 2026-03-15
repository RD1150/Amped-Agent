CREATE TABLE `market_data_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationKey` varchar(255) NOT NULL,
	`data` text NOT NULL,
	`cachedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `market_data_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `market_data_cache_locationKey_unique` UNIQUE(`locationKey`)
);
