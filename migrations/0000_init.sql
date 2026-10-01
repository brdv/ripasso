CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`owner_id` text NOT NULL,
	`visibility` text NOT NULL,
	`data` text NOT NULL,
	`search_text` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `entries_owner_id_idx` ON `entries` (`owner_id`);--> statement-breakpoint
CREATE TABLE `list_entries` (
	`list_id` text NOT NULL,
	`entry_id` text NOT NULL,
	`position` integer NOT NULL,
	`added_at` integer NOT NULL,
	PRIMARY KEY(`list_id`, `entry_id`)
);
--> statement-breakpoint
CREATE INDEX `list_entries_entry_id_idx` ON `list_entries` (`entry_id`);--> statement-breakpoint
CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`visibility` text NOT NULL,
	`share_slug` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lists_share_slug_unique` ON `lists` (`share_slug`);--> statement-breakpoint
CREATE INDEX `lists_owner_id_idx` ON `lists` (`owner_id`);--> statement-breakpoint
CREATE TABLE `progress` (
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`box` integer NOT NULL,
	`seen` integer NOT NULL,
	`correct` integer NOT NULL,
	`wrong` integer NOT NULL,
	`last` integer NOT NULL,
	PRIMARY KEY(`user_id`, `card_id`)
);
