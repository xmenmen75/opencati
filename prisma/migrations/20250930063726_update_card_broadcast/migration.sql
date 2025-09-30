-- AlterTable
ALTER TABLE `card_broadcasts` ADD COLUMN `only_celebrate` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tip_cati` INTEGER NOT NULL DEFAULT 0;
