/*
  Warnings:

  - You are about to drop the column `fatSecretFoodId` on the `favoritefood` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,foodId]` on the table `FavoriteFood` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `foodId` to the `FavoriteFood` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `favoritefood` DROP FOREIGN KEY `FavoriteFood_userId_fkey`;

-- DropIndex
DROP INDEX `FavoriteFood_userId_fatSecretFoodId_key` ON `favoritefood`;

-- AlterTable
ALTER TABLE `favoritefood` DROP COLUMN `fatSecretFoodId`,
    ADD COLUMN `foodId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `FavoriteFood_userId_foodId_key` ON `FavoriteFood`(`userId`, `foodId`);

-- AddForeignKey
ALTER TABLE `FavoriteFood` ADD CONSTRAINT `FavoriteFood_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
