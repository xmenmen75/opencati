/*
  Warnings:

  - You are about to drop the column `broadcast_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `has_reply` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `reaction` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `receiver_deleted_at` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `receiver_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `seen_at` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `sender_deleted_at` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the `message_replies` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `thread_id` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `message_replies` DROP FOREIGN KEY `message_replies_message_id_fkey`;

-- DropForeignKey
ALTER TABLE `message_replies` DROP FOREIGN KEY `message_replies_sender_id_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_broadcast_id_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_receiver_id_fkey`;

-- DropIndex
DROP INDEX `messages_broadcast_id_fkey` ON `messages`;

-- DropIndex
DROP INDEX `messages_receiver_id_fkey` ON `messages`;

-- AlterTable
ALTER TABLE `messages` DROP COLUMN `broadcast_id`,
    DROP COLUMN `has_reply`,
    DROP COLUMN `reaction`,
    DROP COLUMN `receiver_deleted_at`,
    DROP COLUMN `receiver_id`,
    DROP COLUMN `seen_at`,
    DROP COLUMN `sender_deleted_at`,
    ADD COLUMN `thread_id` BIGINT NOT NULL;

-- DropTable
DROP TABLE `message_replies`;

-- CreateTable
CREATE TABLE `threads` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sender_id` BIGINT NOT NULL,
    `receiver_id` BIGINT NOT NULL,
    `broadcast_id` BIGINT NOT NULL,
    `reaction` ENUM('HEART', 'CONFETTI', 'THUMBSUP') NOT NULL,
    `sender_seen_at` DATETIME(3) NULL,
    `receiver_seen_at` DATETIME(3) NULL,
    `sender_deleted_at` DATETIME(3) NULL,
    `receiver_deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `threads_sender_id_receiver_id_broadcast_id_key`(`sender_id`, `receiver_id`, `broadcast_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `threads` ADD CONSTRAINT `threads_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `threads` ADD CONSTRAINT `threads_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `threads` ADD CONSTRAINT `threads_broadcast_id_fkey` FOREIGN KEY (`broadcast_id`) REFERENCES `card_broadcasts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_thread_id_fkey` FOREIGN KEY (`thread_id`) REFERENCES `threads`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
