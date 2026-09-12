"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  subscribeModelConfig,
  getModelConfig,
  setModelConfig,
  clearModelConfig,
  getProviderKeys,
  DEFAULT_MODEL_ID,
  DEFAULT_PROVIDER,
  type ModelConfig,
  type Provider,
} from "@/lib/models";

const FALLBACK_CONFIG: ModelConfig = {
  modelId: DEFAULT_MODEL_ID,
  provider: DEFAULT_PROVIDER,
};

const getSnapshot = () => getModelConfig() || FALLBACK_CONFIG;

const getServerSnapshot = () => FALLBACK_CONFIG;

export function useModel() {
  const config = useSyncExternalStore(
    subscribeModelConfig,
    getSnapshot,
    getServerSnapshot
  );

  const updateModel = useCallback(
    (newConfig: ModelConfig) => {
      setModelConfig(newConfig);
    },
    []
  );

  const updateApiKey = useCallback(
    (provider: Provider, apiKey: string) => {
      setModelConfig({
        ...(getModelConfig() || FALLBACK_CONFIG),
        provider,
        apiKey,
      });
    },
    []
  );

  const hasApiKey = useCallback((provider: Provider) => {
    return !!getProviderKeys()[provider];
  }, []);

  const resetModel = useCallback(() => {
    clearModelConfig();
  }, []);

  return {
    config,
    updateModel,
    updateApiKey,
    hasApiKey,
    resetModel,
  };
}