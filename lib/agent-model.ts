import { gemini, openai, anthropic, grok } from "@inngest/agent-kit";
import { DEFAULT_MODEL_ID } from "@/lib/models";

export interface AgentModelConfig {
  modelId?: string;
  provider?: "openai" | "anthropic" | "google" | "xai";
  apiKey?: string;
}

/**
 * OpenAI's gpt-5/gpt-6/o1/o3 family are reasoning models. Chat Completions
 * forbids function/tool calling while reasoning is on ("use /v1/responses or
 * set reasoning_effort to 'none'").
 *
 * agent-kit 0.13.2 (latest) only knows the chat adapter — its request-parser
 * registry and auth-header handlers are keyed per format and hardcoded to
 * openai-chat/anthropic/gemini/grok/azure-openai, so a Responses-adapter
 * model throws "Cannot read properties of undefined (reading 'request')".
 * Reasoning models therefore run on chat completions with reasoning forced
 * off — the only way OpenAI accepts their function tools there.
 */
function isReasoningModel(modelId: string): boolean {
  return /^(gpt-[56]|o[13])/i.test(modelId);
}

/**
 * Resolves an inngest/agent-kit model instance from a user's model config.
 * Falls back to DEFAULT_MODEL_ID (lib/models.ts) via the server's
 * OPENAI_API_KEY when no config (or an OpenAI provider without an apiKey) is
 * given. Non-OpenAI providers always require the user's own API key.
 */
export function getModelFromConfig(config?: AgentModelConfig) {
  if (!config || !config.provider || config.provider === "openai") {
    const modelId = config?.modelId || DEFAULT_MODEL_ID;

    const opts: Parameters<typeof openai>[0] = {
      model: modelId,
    };

    if (isReasoningModel(modelId)) {
      // Tools + no reasoning on chat completions. `reasoning_effort` predates
      // this package's Input type, hence the cast — it IS sent in the body
      // (the adapter has no schema; it forwards what it's given).
      opts.defaultParameters = { reasoning_effort: "none" } as never;
    }

    if (config?.apiKey) opts.apiKey = config.apiKey;
    return openai(opts);
  }

  if (config.provider === "anthropic") {
    if (!config.modelId) return openai({ model: DEFAULT_MODEL_ID });
    const opts: Parameters<typeof anthropic>[0] = {
      model: config.modelId,
      // NOTE: anthropic expects max_tokens inside `defaultParameters`, not at
      // the top level of the options object.
      defaultParameters: { max_tokens: 8192 },
    };
    if (config.apiKey) opts.apiKey = config.apiKey;
    return anthropic(opts);
  }

  if (config.provider === "google") {
    if (!config.modelId) return openai({ model: DEFAULT_MODEL_ID });
    const opts: Parameters<typeof gemini>[0] = { model: config.modelId };
    if (config.apiKey) opts.apiKey = config.apiKey;
    return gemini(opts);
  }

  if (config.provider === "xai") {
    if (!config.modelId) return openai({ model: DEFAULT_MODEL_ID });
    const opts: Parameters<typeof grok>[0] = { model: config.modelId };
    if (config.apiKey) opts.apiKey = config.apiKey;
    return grok(opts);
  }

  return openai({ model: DEFAULT_MODEL_ID });
}