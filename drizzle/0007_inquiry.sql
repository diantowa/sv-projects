CREATE TABLE IF NOT EXISTS `inquiry` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text,
	`project_type` text,
	`budget` text,
	`timeline` text,
	`message` text NOT NULL,
	`link` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer
);
