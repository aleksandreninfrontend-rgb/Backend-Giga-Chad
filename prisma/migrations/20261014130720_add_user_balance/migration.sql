-- AlterTable
ALTER TABLE "User" ADD COLUMN     "balance" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "User"
ADD CONSTRAINT "User_balance_non_negative"
CHECK ("balance" >= 0);