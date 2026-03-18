CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`opds_id` text,
	`name` text,
	`title` text,
	`summary` text,
	`language` text,
	`author` text,
	`category` text,
	`size_bytes` integer,
	`download_url` text,
	`local_path` text,
	`is_downloaded` integer DEFAULT false NOT NULL,
	`updated_at` integer DEFAULT (unixepoch())
);
