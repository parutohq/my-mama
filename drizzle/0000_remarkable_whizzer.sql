CREATE TABLE `care_records` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
