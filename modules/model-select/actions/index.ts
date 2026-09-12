"use server";

import type { Provider } from "@/lib/models";
import { validateApiKeyWithProvider } from "@/lib/provider-heartbeat";

export async function validateApiKey(provider: Provider, apiKey: string) {
  return validateApiKeyWithProvider(provider, apiKey);
}