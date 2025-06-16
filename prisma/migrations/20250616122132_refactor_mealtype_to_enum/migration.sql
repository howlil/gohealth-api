/*
  Warnings:

  - The primary key for the `usermeal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `mealTypeId` on the `usermeal` table. All the data in the column will be lost.
  - You are about to drop the `mealtype` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `mealType` to the `UserMeal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `usermeal` DROP FOREIGN KEY `UserMeal_mealTypeId_fkey`;

-- DropIndex
DROP INDEX `UserMeal_mealTypeId_idx` ON `usermeal`;

-- AlterTable
ALTER TABLE `usermeal` DROP PRIMARY KEY,
    DROP COLUMN `mealTypeId`,
    ADD COLUMN `mealType` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
    ADD PRIMARY KEY (`userId`, `mealType`, `date`);

-- DropTable
DROP TABLE `mealtype`;

-- CreateIndex
CREATE INDEX `UserMeal_mealType_idx` ON `UserMeal`(`mealType`);
