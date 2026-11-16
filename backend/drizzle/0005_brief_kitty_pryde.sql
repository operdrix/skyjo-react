ALTER TABLE `users` ADD `is_bot` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bot_level` enum('facile','moyen','difficile');