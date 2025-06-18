-- AlterTable
ALTER TABLE `activityplan` MODIFY `startDate` VARCHAR(191) NOT NULL,
    MODIFY `endDate` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `dailynutritiontarget` MODIFY `effectiveDate` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `useractivity` MODIFY `date` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `usermeal` MODIFY `date` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `weightgoal` MODIFY `startDate` VARCHAR(191) NOT NULL,
    MODIFY `targetDate` VARCHAR(191) NULL;
