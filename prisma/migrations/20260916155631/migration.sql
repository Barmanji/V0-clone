/*
  Warnings:

  - You are about to drop the column `type` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PAID');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "type",
ADD COLUMN     "Plan" "PlanType" NOT NULL DEFAULT 'FREE';

-- DropEnum
DROP TYPE "PaidUser";
