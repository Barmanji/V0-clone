"use server";

import { MessageType, MessageRole } from "@/lib/generated/prisma/enums";
import db from "../../../lib/db";
import { inngest } from "../../../inngest/client";
import { getCurrentUser } from "@/modules/auth/actions";
import { consumeCredits } from "@/lib/usage";

export const createMessages = async (value: string, projectId: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify project ownership
  const project = await db.project.findUnique({
    where: {
      id: projectId,
      userId: user.id,
    },
  });

  if (!project) throw new Error("Project not found or unauthorized");

  try {
    // await consumeCredits();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Something went wrong", {
        cause: { code: "BAD_REQUEST" },
      });
    } else {
      throw new Error("Something went wrong", {
        cause: { message: "Too Many Request" },
      });
    }
  }

  const newMessage = await db.message.create({
    data: {
      projectId: projectId,
      content: value,
      role: MessageRole.USER,
      type: MessageType.RESULT,
    },
  });

  await inngest.send({
    name: "code-agent/run",
    data: {
      value: value,
      projectId: projectId,
    },
  });

  return newMessage;
};

export const getMessages = async (projectId: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify project ownership
  const project = await db.project.findUnique({
    where: {
      id: projectId,
      userId: user.id,
    },
  });

  if (!project) throw new Error("Project not found or unauthorized");

  const messages = await db.message.findMany({
    where: {
      projectId,
    },
    orderBy: {
      updatedAt: "asc",
    },
    include: {
      fragments: true,
    },
  });

  return messages;
};
