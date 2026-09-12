import type { ModelConfig } from "@/lib/models";

/**
 * Payload for creating a new project. Used by `createProject` and the
 * `useCreateProject` mutation (client -> server action).
 */
export interface CreateProjectPayload {
  value: string;
  modelConfig?: ModelConfig;
}

/**
 * Payload for triggering the code agent exactly once. Used by
 * `triggerCodeAgent`, `applyEnhancedPrompt` and their hooks.
 */
export interface AgentTriggerPayload {
  projectId: string;
  value: string;
  modelConfig?: ModelConfig;
}

/**
 * Payload for sending a regular chat message. Mirrors `AgentTriggerPayload`
 * with an explicit switch to also fire the code agent on follow-ups.
 */
export interface SendMessagePayload extends AgentTriggerPayload {
  triggerAgent?: boolean;
}

/**
 * File tree produced by the sandbox agent: absolute file path -> contents.
 * Stored as a JSON column on `Fragment`.
 */
export type ProjectFiles = Record<string, string>;