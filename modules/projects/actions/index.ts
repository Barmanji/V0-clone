"use server";

import { inngest } from "../../../inngest/client";
import db from "@/lib/db";
import { MessageRole, MessageType } from "@/lib/generated/prisma/enums";
import { getCurrentUser } from "@/modules/auth/actions";
import { consumeCredits } from "@/lib/usage";

export const getProjects = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const projects = await db.project.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return projects;
};

function generateProjectName(prompt: string): string {
  const cleaned = prompt
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .split(/\s+/);

  const stopwords = new Set([
    "a", "an", "the", "for", "with", "using", "please", "create", "build",
    "make", "generate", "i", "want", "need", "can", "you", "to", "of", "and",
    "that", "this", "app", "application", "website", "page", "clone"
  ]);

  const meaningful = cleaned.filter(
    (w) => w.length > 1 && !stopwords.has(w.toLowerCase())
  );

  const words = (meaningful.length >= 2 ? meaningful : cleaned).slice(0, 4);

  const title = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return title || "Untitled Project";
}

/**
 * Creates a project with the user's initial message.
 * Does NOT trigger the code agent — use triggerCodeAgent() separately.
 */
export const createProject = async (payload: { value: string; modelConfig?: any }) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { value, modelConfig } = payload;

  try {
    await consumeCredits();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("You have reached your limit", {
        cause: { code: "BAD_REQUEST", message: "You have reached your limit" },
      });
    } else {
      throw new Error("Too many requests", {
        cause: { code: "TOO_MANY_REQUESTS", message: "Too many requests" },
      });
    }
  }

  const newProject = await db.project.create({
    data: {
      name: generateProjectName(value),
      userId: user.id,
      messages: {
        create: {
          content: value,
          role: MessageRole.USER,
          type: MessageType.RESULT,
        },
      },
    },
  });

  return newProject;
};

/**
 * Triggers the code agent for a project with the given prompt.
 * Call this after questions are answered (or skipped).
 */
export const triggerCodeAgent = async (payload: {
  projectId: string;
  value: string;
  modelConfig?: any;
}) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { projectId, value, modelConfig } = payload;

  const project = await db.project.findUnique({
    where: { id: projectId, userId: user.id },
  });
  if (!project) throw new Error("Project not found");

  await inngest.send({
    name: "code-agent/run",
    data: {
      value,
      projectId,
      modelConfig: modelConfig || undefined,
    },
  });
};

/**
 * Replaces the project's first user message with the enhanced prompt, then
 * triggers the code agent exactly once. This keeps the chat showing a single
 * user message (the refined prompt) instead of an echo of the original.
 */
export const applyEnhancedPrompt = async (payload: {
  projectId: string;
  value: string;
  modelConfig?: any;
}) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { projectId, value, modelConfig } = payload;

  const project = await db.project.findUnique({
    where: { id: projectId, userId: user.id },
  });
  if (!project) throw new Error("Project not found");

  const firstUserMessage = await db.message.findFirst({
    where: {
      projectId,
      role: MessageRole.USER,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  if (!firstUserMessage) throw new Error("No user message found");

  const updatedMessage = await db.message.update({
    where: { id: firstUserMessage.id },
    data: { content: value },
  });

  await inngest.send({
    name: "code-agent/run",
    data: {
      value,
      projectId,
      modelConfig: modelConfig || undefined,
    },
  });

  return updatedMessage;
};

export const getProjectById = async (projectId: any) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const project = await db.project.findUnique({
    where: {
      id: projectId,
      userId: user.id,
    },
  });

  if (!project) throw new Error("Project not found");

  return project;
};
