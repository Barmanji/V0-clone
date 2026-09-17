import { auth } from "@clerk/nextjs/server";
import db from "./db";
import { PlanType } from "@/lib/generated/prisma/enums";

export async function hasProAccess() {
  try {
    const { userId } = await auth();
    if (!userId) return false;

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { Plan: true },
    });

    return user?.Plan === PlanType.PAID;
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return false;
  }
}
