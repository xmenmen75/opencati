-- AlterTable
ALTER TABLE `messages` ADD COLUMN `reaction` ENUM('HEART', 'CONFETTI', 'THUMBSUP') NULL;
