ALTER TABLE `open_house_leads` ADD `smsConsent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `open_house_leads` ADD `smsConsentTimestamp` timestamp;--> statement-breakpoint
ALTER TABLE `open_house_leads` ADD `smsOptedOut` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `open_house_leads` ADD `smsSent` int DEFAULT 0 NOT NULL;