CREATE TABLE `favorites` (
	`book_id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `favorites_created_at_idx` ON `favorites` (`created_at`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text,
	`source_url` text,
	`source_title` text,
	`selected_text` text,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `notes_book_id_idx` ON `notes` (`book_id`);--> statement-breakpoint
CREATE INDEX `notes_updated_at_idx` ON `notes` (`updated_at`);