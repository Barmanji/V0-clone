import { gemini, openai, anthropic, grok } from "@inngest/agent-kit";

export interface AgentModelConfig {
  modelId?: string;
  provider?: "openai" | "anthropic" | "google" | "xai";
  apiKey?: string;
}

/**
 * Resolves an inngest/agent-kit model instance from a user's model config.
 * Falls back to gpt-4o-mini via the server's OPENAI_API_KEY when no config
 * (or an OpenAI provider without an apiKey) is given.
 */
export function getModelFromConfig(config?: AgentModelConfig) {
  if (!config || !config.provider || config.provider === "openai") {
    const opts: any = { model: config?.modelId || "gpt-4o-mini" };
    if (config?.apiKey) opts.apiKey = config.apiKey;
    return openai(opts);
  }

  if (config.provider === "anthropic") {
    const opts: any = {
      model: config.modelId,
      max_tokens: 8192,
    };
    if (config.apiKey) opts.apiKey = config.apiKey;
    return anthropic(opts);
  }

  if (config.provider === "google") {
    const opts: any = { model: config.modelId };
    if (config.apiKey) opts.apiKey = config.apiKey;
    return gemini(opts);
  }

  if (config.provider === "xai") {
    const opts: any = { model: config.modelId };
    if (config.apiKey) opts.apiKey = config.apiKey;
    return grok(opts);
  }

  return openai({ model: "gpt-4o-mini" });
}