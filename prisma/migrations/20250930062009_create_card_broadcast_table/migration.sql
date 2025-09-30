-- CreateTable
CREATE TABLE `card_broadcasts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_card_id` BIGINT NOT NULL,
    `content` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `card_broadcasts` ADD CONSTRAINT `card_broadcasts_user_card_id_fkey` FOREIGN KEY (`user_card_id`) REFERENCES `user_cards`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
