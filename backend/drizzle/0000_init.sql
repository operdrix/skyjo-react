CREATE TABLE `game_players` (
	`game_id` varchar(16) NOT NULL,
	`user_id` varchar(32) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`score_by_round` json NOT NULL,
	`status` enum('connected','disconnected') NOT NULL DEFAULT 'connected',
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `game_players_game_id_user_id_pk` PRIMARY KEY(`game_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` varchar(16) NOT NULL,
	`creator` varchar(32) NOT NULL,
	`winner` varchar(32),
	`winner_score` int,
	`state` enum('pending','playing','finished') NOT NULL DEFAULT 'pending',
	`round_number` int NOT NULL DEFAULT 0,
	`private` boolean NOT NULL DEFAULT false,
	`max_players` int NOT NULL DEFAULT 4,
	`players_play_again` json NOT NULL,
	`game_data` json NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(32) NOT NULL,
	`username` varchar(255) NOT NULL,
	`firstname` varchar(255) NOT NULL,
	`lastname` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`best_score` int,
	`verified` boolean NOT NULL DEFAULT false,
	`verified_token` varchar(255),
	`verified_token_expires` datetime(3),
	`avatar` varchar(255),
	`reset_password_token` varchar(255),
	`reset_password_expires` datetime(3),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `game_players` ADD CONSTRAINT `game_players_game_id_games_id_fk` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_players` ADD CONSTRAINT `game_players_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_creator_users_id_fk` FOREIGN KEY (`creator`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_winner_users_id_fk` FOREIGN KEY (`winner`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;