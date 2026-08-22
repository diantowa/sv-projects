CREATE TABLE `blog_post` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`slug` text NOT NULL,
	`date` text,
	`tags` text,
	`body` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `collaboration` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`description` text,
	`year` text,
	`link` text,
	`status` text,
	`published` integer DEFAULT true NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `resume` (
	`id` text PRIMARY KEY DEFAULT 'main' NOT NULL,
	`full_name` text DEFAULT '' NOT NULL,
	`headline` text DEFAULT '' NOT NULL,
	`location` text,
	`email` text,
	`phone` text,
	`website` text,
	`linkedin` text,
	`summary` text,
	`skills` text,
	`include_projects` integer DEFAULT false NOT NULL,
	`include_collaborations` integer DEFAULT false NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `resume_certification` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`issuer` text,
	`date` text,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `resume_education` (
	`id` text PRIMARY KEY NOT NULL,
	`degree` text NOT NULL,
	`institution` text NOT NULL,
	`location` text,
	`period` text,
	`detail` text,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `resume_experience` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`location` text,
	`start_date` text NOT NULL,
	`end_date` text DEFAULT 'Present' NOT NULL,
	`bullets` text,
	`tech_stack` text,
	`sort` integer DEFAULT 0 NOT NULL
);
