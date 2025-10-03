-- AlterTable
ALTER TABLE `message_replies` ADD COLUMN `seen_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `messages` ADD COLUMN `seen_at` DATETIME(3) NULL;
