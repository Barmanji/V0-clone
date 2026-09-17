"use server";
import { auth } from "@clerk/nextjs/server";
import { DURATION, FREE_POINTS, PRO_POINTS, getUsageStatus } from "@/lib/usage";
import { hasProAccess } from "@/lib/razorpay";

export const status = async () => {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }


    const maxPoints = (await hasProAccess()) ? PRO_POINTS : FREE_POINTS;

    const result = await getUsageStatus();

    console.log("Usage result:", result);


    if (!result) {
      return {
        remainingPoints: maxPoints,
        msBeforeNext: DURATION * 1000,
        consumedPoints: 0,
        isFirstRequest: true,
        maxPoints
      };
    }


    const remainingPoints = result.remainingPoints ?? (maxPoints - (result.consumedPoints || 0));

    return {
      remainingPoints,
      msBeforeNext: result.msBeforeNext || DURATION * 1000,
      consumedPoints: result.consumedPoints || 0,
      isFirstRequest: false,
      maxPoints
    };
  } catch (error) {
    console.error("Error in status action:", error);
    throw error;
  }
};

