/*
  Warnings:

  - The primary key for the `usermeal` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `usermeal` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`userId`, `mealTypeId`, `date`);
