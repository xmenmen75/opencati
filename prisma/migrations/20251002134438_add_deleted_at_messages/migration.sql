-- AlterTable
ALTER TABLE `messages` ADD COLUMN `receiver_deleted_at` DATETIME(3) NULL,
    ADD COLUMN `sender_deleted_at` DATETIME(3) NULL;
