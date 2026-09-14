export type Provider = "openai" | "anthropic" | "google" | "xai";

// Single source of truth for the default model. The model selector, code
// agent, and question-flow fallbacks all read these — change the default in
// exactly this one place. The expected setup is an OpenAI-compatible completion
// via the server's OPENAI_API_KEY; the rest of the catalog is bring-your-own-key.
export const DEFAULT_MODEL_ID = "gpt-4o-mini";
export const DEFAULT_PROVIDER: Provider = "openai";

export interface ModelConfig {
  modelId: string;
  provider: Provider;
  apiKey?: string;
  baseUrl?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: Provider;
  description: string;
  requiresApiKey: boolean;
  contextWindow: string;
}

export const MODELS: ModelOption[] = [
  // OpenAI
  {
    id: DEFAULT_MODEL_ID,
    name: "GPT-4o Mini",
    provider: DEFAULT_PROVIDER,
    description: "Fast & affordable (default)",
    requiresApiKey: false,
    contextWindow: "128K",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Previous flagship",
    requiresApiKey: true,
    contextWindow: "128K",
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    description: "Cost-efficient and and decent for general task",
    requiresApiKey: true,
    contextWindow: "256K",
  },
  {
    id: "gpt-5-nano",
    name: "GPT-5 Nano",
    provider: "openai",
    description: "Cost-efficient and good for basic web dev",
    requiresApiKey: true,
    contextWindow: "256K",
  },
  {
    id: "gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    provider: "openai",
    description: "Cost-efficient next-gen",
    requiresApiKey: true,
    contextWindow: "256K",
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    provider: "openai",
    description: "Balanced performance",
    requiresApiKey: true,
    contextWindow: "256K",
  },
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "openai",
    description: "OpenAI flagship",
    requiresApiKey: true,
    contextWindow: "256K",
  },
  {
    id: "gpt-6-astra",
    name: "GPT-6 Astra",
    provider: "openai",
    description: "Most intelligent OpenAI model",
    requiresApiKey: true,
    contextWindow: "256K",
  },

  // Anthropic
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    description: "Fast & capable",
    requiresApiKey: true,
    contextWindow: "200K",
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "anthropic",
    description: "Strong coding & reasoning",
    requiresApiKey: true,
    contextWindow: "1M",
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    provider: "anthropic",
    description: "Anthropic flagship",
    requiresApiKey: true,
    contextWindow: "1M",
  },
  {
    id: "claude-fable-5-1",
    name: "Claude Fable 5.1",
    provider: "anthropic",
    description: "Most advanced for long work",
    requiresApiKey: true,
    contextWindow: "1M",
  },

  // Google Gemini
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Fast reasoning model",
    requiresApiKey: true,
    contextWindow: "1M",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "google",
    description: "Intelligent flash model",
    requiresApiKey: true,
    contextWindow: "1M",
  },
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "google",
    description: "Next-gen flash (GA)",
    requiresApiKey: true,
    contextWindow: "1M",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "google",
    description: "Most intelligent flash",
    requiresApiKey: true,
    contextWindow: "1M",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "google",
    description: "Google flagship",
    requiresApiKey: true,
    contextWindow: "1M",
  },

  // xAI Grok
  {
    id: "grok-4.3",
    name: "Grok 4.3",
    provider: "xai",
    description: "Fast & efficient (1M ctx)",
    requiresApiKey: true,
    contextWindow: "1M",
  },
  {
    id: "grok-4.5",
    name: "Grok 4.5",
    provider: "xai",
    description: "Opus-class coding model",
    requiresApiKey: true,
    contextWindow: "500K",
  },
  {
    id: "grok-4.6",
    name: "Grok 4.6",
    provider: "xai",
    description: "xAI flagship (recommended)",
    requiresApiKey: true,
    contextWindow: "500K",
  },
];

export const PROVIDER_LABELS: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google Gemini",
  xai: "xAI Grok",
};

export const PROVIDER_API_KEY_NAMES: Record<Provider, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GEMINI_API_KEY",
  xai: "XAI_API_KEY",
};

const STORAGE_KEY = "v0-clone-model-config";
const PROVIDER_KEYS_KEY = "v0-clone-provider-keys";

// In-memory fallbacks so config still works when localStorage is
// unavailable or blocked (e.g. sandboxed iframes, private mode).
let memoryConfig: ModelConfig | null = null;
const memoryProviderKeys: Partial<Record<Provider, string>> = {};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeModelConfig(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getModelConfig(): ModelConfig | null {
  if (!memoryConfig && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memoryConfig = JSON.parse(raw) as ModelConfig;
    } catch {
      // fall through to memoryConfig
    }
  }
  return memoryConfig;
}

export function setModelConfig(config: ModelConfig): void {
  memoryConfig = config;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // localStorage unavailable — in-memory value still works this session
    }
  }
  emit();
}

export function clearModelConfig(): void {
  memoryConfig = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  }
  emit();
}

/**
 * Per-provider API keys, so entering a key for one provider doesn't
 * "lose" keys you've already saved for others.
 */
export function getProviderKeys(): Partial<Record<Provider, string>> {
  const stored: Partial<Record<Provider, string>> = { ...memoryProviderKeys };
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(PROVIDER_KEYS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return { ...parsed, ...memoryProviderKeys };
        }
      }
    } catch {
      // fall through
    }
  }
  return stored;
}

export function setProviderKey(provider: Provider, key: string): void {
  memoryProviderKeys[provider] = key;
  if (typeof window !== "undefined") {
    try {
      const all = getProviderKeys();
      all[provider] = key;
      localStorage.setItem(PROVIDER_KEYS_KEY, JSON.stringify(all));
    } catch {
      // in-memory value still works this session
    }
  }
  emit();
}

export function getDefaultModelConfig(): ModelConfig {
  return {
    modelId: DEFAULT_MODEL_ID,
    provider: DEFAULT_PROVIDER,
  };
}
