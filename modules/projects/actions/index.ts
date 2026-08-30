"use server";

import { inngest } from "../../../inngest/client";
import db from "@/lib/db";
import { MessageRole, MessageType } from "@/lib/generated/prisma/enums";
import { generateSlug } from "random-word-slugs";
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

export const createProject = async (value: any) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

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
      name: generateSlug(2, { format: "kebab" }),
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

  // sending to inngest
  await inngest.send({
    name: "code-agent/run",
    data: {
      value: value,
      projectId: newProject.id,
    },
  });

  return newProject;
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
