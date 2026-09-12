"use server";

import { MessageType, MessageRole } from "@/lib/generated/prisma/enums";
import db from "../../../lib/db";
import { inngest } from "../../../inngest/client";
import { getCurrentUser } from "@/modules/auth/actions";
import { consumeCredits } from "@/lib/usage";

export const createMessages = async (payload: { value: string; projectId: string; modelConfig?: any }) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { value, projectId, modelConfig } = payload;

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

  // NOTE: Do NOT trigger the code agent here.
  // Agent is triggered separately via triggerCodeAgent() after question flow.

  return newMessage;
};

/**
 * Sends a user message to a project.
 * Used during question flow for user answers, and for regular follow-up messages.
 */
export const sendMessage = async (payload: {
  projectId: string;
  value: string;
  modelConfig?: any;
  triggerAgent?: boolean;
}) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { projectId, value, modelConfig, triggerAgent = false } = payload;

  const project = await db.project.findUnique({
    where: { id: projectId, userId: user.id },
  });
  if (!project) throw new Error("Project not found");

  const newMessage = await db.message.create({
    data: {
      projectId,
      content: value,
      role: MessageRole.USER,
      type: MessageType.RESULT,
    },
  });

  if (triggerAgent) {
    await inngest.send({
      name: "code-agent/run",
      data: {
        value,
        projectId,
        modelConfig: modelConfig || undefined,
      },
    });
  }

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
      createdAt: "asc",
    },
    include: {
      fragments: true,
    },
  });

  return messages;
};
