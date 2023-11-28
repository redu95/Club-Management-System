-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema club
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema club
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `club` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `club` ;

-- -----------------------------------------------------
-- Table `club`.`events`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `club`.`events` (
  `event_id` INT NOT NULL AUTO_INCREMENT,
  `event_title` VARCHAR(255) NOT NULL,
  `event_image` LONGBLOB NULL DEFAULT NULL,
  `event_description` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`event_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 27
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `club`.`loginuser`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `club`.`loginuser` (
  `user_role` VARCHAR(10) NOT NULL,
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `user_name` VARCHAR(255) NULL DEFAULT NULL,
  `user_pass` VARCHAR(255) NULL DEFAULT NULL,
  `user_sex` VARCHAR(10) NULL DEFAULT NULL,
  `user_status` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `user_id_UNIQUE` (`user_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 21
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
