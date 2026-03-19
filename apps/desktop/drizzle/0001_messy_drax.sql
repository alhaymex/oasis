CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `catalog_sites` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`variant_count` integer NOT NULL,
	`sort_index` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `catalog_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`site_name` text NOT NULL,
	`site_icon` text NOT NULL,
	`site_description` text NOT NULL,
	`name` text NOT NULL,
	`name_normalized` text NOT NULL,
	`filename` text NOT NULL,
	`download_url` text NOT NULL,
	`size_label` text NOT NULL,
	`size_bytes` integer,
	`sort_index` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `catalog_variants_site_id_idx` ON `catalog_variants` (`site_id`);--> statement-breakpoint
CREATE INDEX `catalog_variants_name_normalized_idx` ON `catalog_variants` (`name_normalized`);--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_variants_filename_idx` ON `catalog_variants` (`filename`);