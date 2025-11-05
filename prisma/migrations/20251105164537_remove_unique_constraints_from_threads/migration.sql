-- AddForeignKey
ALTER TABLE `threads` ADD CONSTRAINT `threads_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
