/*
  Warnings:

  - You are about to drop the column `brandName` on the `favoritefood` table. All the data in the column will be lost.
  - You are about to drop the column `defaultServing` on the `favoritefood` table. All the data in the column will be lost.
  - You are about to drop the column `defaultUnit` on the `favoritefood` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `favoritefood` table. All the data in the column will be lost.
  - You are about to drop the column `foodName` on the `favoritefood` table. All the data in the column will be lost.
  - You are about to drop the column `nutritionData` on the `favoritefood` table. All the data in the column will be lost.
  - The primary key for the `usermeal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `brandName` on the `usermeal` table. All the data in the column will be lost.
  - You are about to drop the column `foodName` on the `usermeal` table. All the data in the column will be lost.
  - You are about to drop the column `nutritionData` on the `usermeal` table. All the data in the column will be lost.
  - You are about to drop the column `servingId` on the `usermeal` table. All the data in the column will be lost.
  - The required column `id` was added to the `UserMeal` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `totalCalories` to the `UserMeal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCarbs` to the `UserMeal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalFat` to the `UserMeal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalProtein` to the `UserMeal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `favoritefood` DROP COLUMN `brandName`,
    DROP COLUMN `defaultServing`,
    DROP COLUMN `defaultUnit`,
    DROP COLUMN `description`,
    DROP COLUMN `foodName`,
    DROP COLUMN `nutritionData`;

-- AlterTable
ALTER TABLE `usermeal` DROP PRIMARY KEY,
    DROP COLUMN `brandName`,
    DROP COLUMN `foodName`,
    DROP COLUMN `nutritionData`,
    DROP COLUMN `servingId`,
    ADD COLUMN `id` VARCHAR(191) NOT NULL,
    ADD COLUMN `totalCalories` DOUBLE NOT NULL,
    ADD COLUMN `totalCarbs` DOUBLE NOT NULL,
    ADD COLUMN `totalFat` DOUBLE NOT NULL,
    ADD COLUMN `totalProtein` DOUBLE NOT NULL,
    MODIFY `quantity` DOUBLE NOT NULL DEFAULT 1,
    MODIFY `unit` VARCHAR(191) NOT NULL DEFAULT 'porsi',
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `FoodCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FoodCategory_name_key`(`name`),
    UNIQUE INDEX `FoodCategory_slug_key`(`slug`),
    INDEX `FoodCategory_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Food` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `protein` DOUBLE NOT NULL DEFAULT 0,
    `fat` DOUBLE NOT NULL DEFAULT 0,
    `carbohydrate` DOUBLE NOT NULL DEFAULT 0,
    `calory` DOUBLE NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Food_categoryId_idx`(`categoryId`),
    INDEX `Food_name_idx`(`name`),
    INDEX `Food_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `UserMeal_userId_mealType_date_idx` ON `UserMeal`(`userId`, `mealType`, `date`);

-- AddForeignKey
ALTER TABLE `Food` ADD CONSTRAINT `Food_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `FoodCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteFood` ADD CONSTRAINT `FavoriteFood_foodId_fkey` FOREIGN KEY (`foodId`) REFERENCES `Food`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMeal` ADD CONSTRAINT `UserMeal_foodId_fkey` FOREIGN KEY (`foodId`) REFERENCES `Food`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
