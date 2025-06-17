/*
  Warnings:

  - You are about to drop the column `fatSecretFoodId` on the `usermeal` table. All the data in the column will be lost.
  - Added the required column `foodId` to the `UserMeal` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `UserMeal_fatSecretFoodId_idx` ON `usermeal`;

-- AlterTable
ALTER TABLE `usermeal` DROP COLUMN `fatSecretFoodId`,
    ADD COLUMN `foodId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `UserMeal_foodId_idx` ON `UserMeal`(`foodId`);
