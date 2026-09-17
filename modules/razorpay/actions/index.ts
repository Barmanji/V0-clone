"use server";

import Razorpay from "razorpay";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";

const razorpay = new Razorpay({
  key_id: process.env.RZP_LIVE_KEY!,
  key_secret: process.env.RZP_LIVE_SECRET!,
});

type RazorpayOrderResult =
  | { success: true; orderId: string; amount: number; keyId: string }
  | { success: false; error: string };

export async function createRazorpayOrder(
  amountInRupees: number,
): Promise<RazorpayOrderResult> {
  try {
    // Convert Rupees to Paise (Razorpay expects smallest currency subunit)
    const amountInPaise = Math.round(amountInRupees * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        createdFrom: "Next.js App",
      },
    });

    return {
      success: true,
      orderId: order.id,
      amount: Number(order.amount),
      keyId: process.env.RZP_LIVE_KEY as string,
    };
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return { success: false, error: "Failed to create order" };
  }
}

export async function verifyPaymentAndSave(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      payload;

    const valid = validatePaymentVerification(
      { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      process.env.RZP_LIVE_SECRET!,
    );

    if (!valid) {
      return { success: false, error: "Payment verification failed" };
    }

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const existing = await db.razorpay.findFirst({
      where: { orderId: razorpay_order_id },
    });

    if (!existing) {
      await db.razorpay.create({
        data: {
          userId: user.id,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature,
        },
      });
    }

    await db.user.update({
      where: { id: user.id },
      data: { Plan: "PAID" },
    });

    await db.usage.delete({ where: { key: userId } }).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error("verifyPaymentAndSave failed:", error);
    return { success: false, error: "Failed to save payment" };
  }
}
