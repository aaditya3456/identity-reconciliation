-- DropForeignKey
ALTER TABLE `contact` DROP FOREIGN KEY `Contact_linkedId_fkey`;

-- AlterTable
ALTER TABLE `contact` ALTER COLUMN `updatedAt` DROP DEFAULT;
