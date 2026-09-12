import type { Provider } from "@/lib/models";

export interface HeartbeatResult {
  ok: boolean;
  status?: number;
  message?: string;
}

/**
 * Pings the provider's models endpoint with the given API key to verify it
 * works, before it's saved and used for actual generation. Shared by the
 * client-side save flow (via a server action) and the Inngest function's
 * fail-fast step.
 */
export async function validateApiKeyWithProvider(
  provider: Provider,
  apiKey: string
): Promise<HeartbeatResult> {
  const req = buildHeartbeatRequest(provider, apiKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(req.url, {
      headers: req.headers,
      signal: controller.signal,
    });

    if (res.ok) {
      return { ok: true, status: res.status };
    }

    // 401/403 always mean the key itself is rejected.
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: res.status,
        message: "invalid-key",
      };
    }

    return {
      ok: false,
      status: res.status,
      message: `Provider returned HTTP ${res.status}`,
    };
  } catch {
    return {
      ok: false,
      message: "Could not reach the provider. Check your connection.",
    };
  } finally {
    clearTimeout(timer);
  }
}

function buildHeartbeatRequest(provider: Provider, apiKey: string): {
  url: string;
  headers: Record<string, string>;
} {
  switch (provider) {
    case "openai":
      return {
        url: "https://api.openai.com/v1/models",
        headers: { Authorization: `Bearer ${apiKey}` },
      };
    case "anthropic":
      return {
        url: "https://api.anthropic.com/v1/models",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      };
    case "google":
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        headers: {},
      };
    case "xai":
      return {
        url: "https://api.x.ai/v1/models",
        headers: { Authorization: `Bearer ${apiKey}` },
      };
  }
}