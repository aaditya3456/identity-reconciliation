CREATE TABLE `Contact` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `phoneNumber` VARCHAR(50) NULL,
  `email` VARCHAR(255) NULL,
  `linkedId` INT NULL,
  `linkPrecedence` VARCHAR(10) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `Contact_email_idx` (`email`),
  INDEX `Contact_phoneNumber_idx` (`phoneNumber`),
  INDEX `Contact_linkedId_idx` (`linkedId`),
  CONSTRAINT `Contact_linkedId_fkey` FOREIGN KEY (`linkedId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

