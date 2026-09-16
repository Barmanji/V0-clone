import { inngest } from "./client";
import {
  gemini,
  createAgent,
  createTool,
  createNetwork,
  createState,
  type TextMessage,
  openai,
} from "@inngest/agent-kit";
import Sandbox from "@e2b/code-interpreter";
import { z } from "zod";
import {
  FRAGMENT_TITLE_PROMPT,
  PROMPT,
  RESPONSE_PROMPT,
} from "@/modules/constant/prompt";
import { lastAssistantTextMessageContent } from "./utils";
import db from "@/lib/db";
import { MessageRole, MessageType } from "@/lib/generated/prisma/enums";
import type { ProjectFiles } from "@/modules/types";
import {
  getModelFromConfig,
  type AgentModelConfig,
} from "@/lib/agent-model";
import { validateApiKeyWithProvider } from "@/lib/provider-heartbeat";

type ModelConfig = AgentModelConfig;

export const codeAgentFunction = inngest.createFunction(
  {
    id: "code-agent",
    triggers: { event: "code-agent/run" },
  },

  async ({ event, step }) => {
    const modelConfig: ModelConfig | undefined = event.data.modelConfig;

    // Fail fast on an invalid user-provided API key before a sandbox is
    // created or any agent iteration runs. Server-default keys are skipped.
    const keyCheck = await step.run("validate-api-key", async () => {
      if (!modelConfig?.apiKey) return { ok: true as const };
      const provider = modelConfig.provider;
      if (!provider) return { ok: true as const };
      return validateApiKeyWithProvider(provider, modelConfig.apiKey);
    });

    if (!keyCheck.ok) {
      await step.run("save-key-error", async () => {
        return db.message.create({
          data: {
            projectId: event.data.projectId,
            content: `Your ${modelConfig?.provider} API key was rejected by the provider. Open the model selector, add a valid key, and try again.`,
            role: MessageRole.ASSISTANT,
            type: MessageType.ERROR,
          },
        });
      });
      return { error: "Invalid API key for " + modelConfig?.provider };
    }

    const model = getModelFromConfig(modelConfig);

    // Step-1
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("v0-clone-build-dev");
      return sandbox.sandboxId;
    });
    // Persistent memory — previous messages + files from the last completed build
    const previousMessages: TextMessage[] = await step.run(
      "get-previous-messages",
      async () => {
        const formattedMessages: TextMessage[] = [];

        const messages = await db.message.findMany({
          where: {
            projectId: event.data.projectId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        for (const message of messages) {
          formattedMessages.push({
            type: "text",
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content,
          });
        }

        return formattedMessages;
      },
    );

    const previousFiles: ProjectFiles = await step.run(
      "get-previous-files",
      async () => {
        const fragment = await db.fragment.findFirst({
          where: { message: { projectId: event.data.projectId } },
          orderBy: { createdAt: "desc" },
        });
        return (fragment?.files ?? {}) as ProjectFiles;
      },
    );

    // Hydrate the fresh sandbox with the previous build's files so the agent
    // can read them and the verifyBuild step type-checks the real code.
    await step.run("hydrate-sandbox-files", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      for (const [path, content] of Object.entries(previousFiles)) {
        await sandbox.files.write(path, content);
      }
      return Object.keys(previousFiles).length; // dummy return so inngest will show somthn
    });

    const state = createState(
      {
        summary: "",
        files: previousFiles,
      },
      {
        messages: previousMessages,
      },
    );

    const shadcnComponents = await step.run(
      "list-shadcn-components",
      async () => {
        const sandbox = await Sandbox.connect(sandboxId);
        const result = await sandbox.commands.run(
          "ls /home/user/components/ui | sed 's/\\.tsx$//'",
        );
        return result.stdout
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .join(", ");
      },
    );

    const existingFilesList = Object.keys(previousFiles).length
      ? Object.keys(previousFiles).map((f) => `  - ${f}`).join("\n")
      : "(none — fresh build)";

    const resolvedPrompt = PROMPT.replace(
      "{{SHADCN_COMPONENT_LIST}}",
      shadcnComponents,
    ).replace("{{EXISTING_FILES}}", existingFilesList);
    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: resolvedPrompt,
      model: model,
      tools: [
        // 1. Terminal
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await Sandbox.connect(sandboxId);

                const result = await sandbox.commands.run(command, {
                  onStdout: (data) => {
                    buffers.stdout += data;
                  },

                  onStderr: (data) => {
                    buffers.stderr += data;
                  },
                });

                return result.stdout;
              } catch (error) {
                console.log(
                  `Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`,
                );

                return `Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`;
              }
            });
          },
        }),

        // 2. createOrUpdateFiles
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sanbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),

          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network?.state?.data.files || {};

                  const sanbox = await Sandbox.connect(sandboxId);

                  for (const file of files) {
                    await sanbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (error) {
                  return "Error" + error;
                }
              },
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),
        // 3. readFiles
        createTool({
          name: "readFiles",
          description: "Read files in the sandbox",

          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sanbox = await Sandbox.connect(sandboxId);

                const contents = [];

                for (const file of files) {
                  const content = await sanbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                return "Error" + error;
              }
            });
          },
        }),
        createTool({
          name: "verifyBuild",
          description:
            "Type-checks the project. Call this after all files are written and before finishing.",
          parameters: z.object({}),
          handler: async (_args, { step, network }) => {
            const output = await step?.run("verifyBuild", async () => {
              const sandbox = await Sandbox.connect(sandboxId);
              const result = await sandbox.commands.run(
                "npx tsc --noEmit --pretty false 2>&1 || true",
              );
              return result.stdout.trim() || "No errors found.";
            });

            if (network) {
              network.state.data.buildStatus = output;
            }
            return output;
          },
        }),
      ],

      // How agent will act?
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);
          if (lastAssistantMessageText?.includes("<task_summary>")) {
            const hasFiles =
              Object.keys(network?.state?.data?.files || {}).length > 0;
            const buildClean =
              network?.state?.data?.buildStatus === "No errors found.";
            if (hasFiles && buildClean) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 10,

      router: async ({ network }) => {
        const summary = network.state.data.summary;
        const files = network.state.data.files;
        const hasFiles = files && Object.keys(files).length > 0;
        const buildClean =
          network.state.data.buildStatus === "No errors found.";

        if (summary && hasFiles && buildClean) return;
        return codeAgent;
      },
    });

    const result = await network.run(event.data.value, { state });

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "Generate a title for the fragment",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({ model: "gpt-3.5-turbo" }),
    });

    const responseGenerator = createAgent({
      name: "response-generator",
      description: "Generate a response for the fragment",
      system: RESPONSE_PROMPT,
      model: openai({ model: "gpt-3.5-turbo" }),
    });

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(
      result.state.data.summary,
    );
    const { output: responseOutput } = await responseGenerator.run(
      result.state.data.summary,
    );

    const generateFragmentTitle = () => {
      if (fragmentTitleOutput[0].type !== "text") {
        return "Fragment";
      }

      if (Array.isArray(fragmentTitleOutput[0].content)) {
        return fragmentTitleOutput[0].content.map((c) => c).join("");
      } else {
        return fragmentTitleOutput[0].content;
      }
    };

    const generateResponse = () => {
      if (responseOutput[0].type !== "text") {
        return "Here you go";
      }

      if (Array.isArray(responseOutput[0].content)) {
        return responseOutput[0].content.map((c) => c).join("");
      } else {
        return responseOutput[0].content;
      }
    };

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      const host = sandbox.getHost(3000);

      return `http://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await db.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong in saving-result. Please try again",
            role: MessageRole.ASSISTANT,
            type: MessageType.ERROR,
          },
        });
      }

      return await db.message.create({
        data: {
          projectId: event.data.projectId,
          content: generateResponse(),
          role: MessageRole.ASSISTANT,
          type: MessageType.RESULT,
          fragments: {
            create: {
              sandboxUrl: sandboxUrl,
              title: generateFragmentTitle(),
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: generateFragmentTitle(),
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);
