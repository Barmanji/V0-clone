-- CreateEnum
CREATE TYPE "PaidUser" AS ENUM ('FREE', 'PAID');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "type" "PaidUser" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "Razorpay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,

    CONSTRAINT "Razorpay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Razorpay" ADD CONSTRAINT "Razorpay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
