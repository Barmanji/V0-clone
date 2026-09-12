import { gemini, openai, anthropic, grok } from "@inngest/agent-kit";
import { DEFAULT_MODEL_ID } from "@/lib/models";

export interface AgentModelConfig {
  modelId?: string;
  provider?: "openai" | "anthropic" | "google" | "xai";
  apiKey?: string;
}

/**
 * Resolves an inngest/agent-kit model instance from a user's model config.
 * Falls back to DEFAULT_MODEL_ID (lib/models.ts) via the server's
 * OPENAI_API_KEY when no config (or an OpenAI provider without an apiKey) is
 * given. Non-OpenAI providers always require the user's own API key.
 */
export function getModelFromConfig(config?: AgentModelConfig) {
  if (!config || !config.provider || config.provider === "openai") {
    const opts: Parameters<typeof openai>[0] = {
      model: config?.modelId || DEFAULT_MODEL_ID,
    };
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