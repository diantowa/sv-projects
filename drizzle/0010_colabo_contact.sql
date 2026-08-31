PRAGMA defer_foreign_keys = ON;

CREATE TABLE `inquiry_next` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`company` text,
	`project_type` text,
	`budget` text,
	`timeline` text,
	`message` text NOT NULL,
	`link` text,
	`contact_type` text,
	`contact_value` text,
	`source` text DEFAULT 'private_note' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer
);

INSERT INTO `inquiry_next` (
	`id`, `name`, `email`, `company`, `project_type`, `budget`, `timeline`,
	`message`, `link`, `contact_type`, `contact_value`, `source`, `status`, `created_at`
)
SELECT
	`id`, `name`, `email`, `company`, `project_type`, `budget`, `timeline`,
	`message`, `link`, CASE WHEN `email` IS NOT NULL THEN 'email' ELSE NULL END,
	`email`, 'legacy_form', `status`, `created_at`
FROM `inquiry`;

DROP TABLE `inquiry`;
ALTER TABLE `inquiry_next` RENAME TO `inquiry`;
CREATE INDEX `inquiry_created_at_idx` ON `inquiry` (`created_at`);

