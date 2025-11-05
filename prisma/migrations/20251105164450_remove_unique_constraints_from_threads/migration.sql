-- DropForeignKey
ALTER TABLE `threads` DROP FOREIGN KEY `threads_sender_id_fkey`;

-- DropIndex
DROP INDEX `threads_sender_id_receiver_id_broadcast_id_key` ON `threads`;