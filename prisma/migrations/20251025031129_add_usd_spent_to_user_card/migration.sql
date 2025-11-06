-- AlterTable
ALTER TABLE `user_cards` ADD COLUMN `usd_spent` BIGINT NOT NULL DEFAULT 0,
    MODIFY `cati_spent` BIGINT NOT NULL DEFAULT 0;
