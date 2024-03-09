CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text,
	`isDefault` integer DEFAULT 0,
	`content` text,
	`authorId` text,
	`positionX` real DEFAULT 16,
	`positionY` real DEFAULT 24
);
--> statement-breakpoint
CREATE INDEX `author_idx` ON `notes` (`authorId`);