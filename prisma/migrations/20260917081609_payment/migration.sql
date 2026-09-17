/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `Razorpay` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId]` on the table `Razorpay` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Razorpay_paymentId_key" ON "Razorpay"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Razorpay_orderId_key" ON "Razorpay"("orderId");
