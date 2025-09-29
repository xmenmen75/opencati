/*
  Warnings:

  - You are about to drop the column `pool_share_percentage` on the `cards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `cards` DROP COLUMN `pool_share_percentage`;

-- CreateTable
CREATE TABLE `season_cards` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `season_id` BIGINT NOT NULL,
    `card_id` INTEGER NOT NULL,
    `user_bid_pool_percentage` DECIMAL(5, 2) NOT NULL,
    `sponsor_pool_percentage` DECIMAL(5, 2) NOT NULL,
    `drop_probability` DECIMAL(8, 5) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `season_cards_season_id_card_id_key`(`season_id`, `card_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `season_cards` ADD CONSTRAINT `season_cards_season_id_fkey` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `season_cards` ADD CONSTRAINT `season_cards_card_id_fkey` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
