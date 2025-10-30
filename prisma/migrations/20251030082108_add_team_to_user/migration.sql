-- AlterTable
ALTER TABLE `users` ADD COLUMN `user_team` ENUM('EVEN', 'ODD') NOT NULL DEFAULT 'EVEN';
