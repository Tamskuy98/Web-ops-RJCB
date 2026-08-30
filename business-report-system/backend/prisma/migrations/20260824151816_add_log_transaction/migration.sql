/*
  Warnings:

  - Made the column `status` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "log_transaction" (
    "id" SERIAL NOT NULL,
    "refId" TEXT NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "modul" TEXT NOT NULL,
    "typePayment" TEXT,
    "type" TEXT NOT NULL,
    "before" DECIMAL(65,30) NOT NULL,
    "after" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL,
    "created_by" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_transaction_pkey" PRIMARY KEY ("id")
);
