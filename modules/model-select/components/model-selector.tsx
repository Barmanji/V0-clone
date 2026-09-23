"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckIcon, LockIcon, StarIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  MODELS,
  PROVIDER_LABELS,
  getProviderKeys,
  setProviderKey,
  type Provider,
  type ModelConfig,
  type ModelOption,
} from "@/lib/models";
import { validateApiKey } from "@/modules/model-select/actions";

interface ModelSelectorProps {
  config: ModelConfig;
  onSelect: (config: ModelConfig) => void;
}

const PROVIDER_ORDER: Provider[] = ["openai", "anthropic", "google", "xai"];

export function ModelSelector({ config, onSelect }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<Provider | null>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState<Provider | null>(null);

  // Hydration-safe "is client" flag without setState-in-effect:
  // server snapshot = false, client snapshot = true.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const currentModel = MODELS.find((m) => m.id === config.modelId);

  const hasApiKey = (provider: Provider) => {
    return !!getProviderKeys()[provider];
  };

  const prefillKey = (provider: Provider) => {
    setApiKeyInputs((prev) => ({
      ...prev,
      [provider]: getProviderKeys()[provider] || "",
    }));
  };

  const handleSelectModel = (model: ModelOption) => {
    if (model.requiresApiKey && !hasApiKey(model.provider)) {
      setExpandedProvider(model.provider);
      prefillKey(model.provider);
      return;
    }
    onSelect({
      modelId: model.id,
      provider: model.provider,
      apiKey: getProviderKeys()[model.provider] || undefined,
    });
    setOpen(false);
  };

  const handleSaveApiKey = async (provider: Provider) => {
    const key = apiKeyInputs[provider]?.trim();
    if (!key) return;

    if (key.length < 8) {
      toast.error(
        `That ${PROVIDER_LABELS[provider]} API key looks too short. Please check it.`
      );
      return;
    }

    setValidating(provider);

    const result = await validateApiKey(provider, key);
    if (!result.ok) {
      toast.error(
        result.message === "invalid-key"
          ? `That ${PROVIDER_LABELS[provider]} API key was rejected by the provider. Please check it.`
          : result.message || `Could not verify the ${PROVIDER_LABELS[provider]} API key.`
      );
      setValidating(null);
      return;
    }

    // Persist per-provider so other saved keys aren't lost
    setProviderKey(provider, key);

    toast.success(`${PROVIDER_LABELS[provider]} API key saved & verified`);
    setExpandedProvider(null);
    setValidating(null);
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="h-8 text-xs">
        GPT-6 Luna
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 font-mono"
          />
        }
      >
        {currentModel?.name || config.modelId}
        <ChevronDownIcon className="size-3" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0" showCloseButton={false}>
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Select Model</DialogTitle>
          <DialogDescription>
            Choose an AI model. Some require your own API key.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {PROVIDER_ORDER.map((provider) => {
              const providerModels = MODELS.filter(
                (m) => m.provider === provider
              );
              if (providerModels.length === 0) return null;

              const isExpanded = expandedProvider === provider;
              const providerHasKey = hasApiKey(provider);

              return (
                <div key={provider} className="mb-2">
                  {/* Provider header - clickable to expand API key input */}
                  <button
                    onClick={() => {
                      if (!providerHasKey) {
                        setExpandedProvider(isExpanded ? null : provider);
                        prefillKey(provider);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-2 py-1.5 text-xs font-medium uppercase tracking-wider rounded-md transition-colors",
                      providerHasKey
                        ? "text-emerald-500 cursor-default"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{PROVIDER_LABELS[provider]}</span>
                      {providerHasKey ? (
                        <StarIcon className="size-3 text-emerald-500 fill-emerald-500" />
                      ) : (
                        <LockIcon className="size-3" />
                      )}
                    </div>
                    {!providerHasKey && (
                      <ChevronRightIcon
                        className={cn(
                          "size-3 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    )}
                  </button>

                  {/* API key input (collapsible, once per provider) */}
                  {isExpanded && !providerHasKey && (
                    <div className="flex items-center gap-2 px-2 py-2 ml-4">
                      <Input
                        type="password"
                        placeholder={`Enter ${PROVIDER_LABELS[provider]} API key`}
                        value={apiKeyInputs[provider] || ""}
                        onChange={(e) =>
                          setApiKeyInputs((prev) => ({
                            ...prev,
                            [provider]: e.target.value,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        className="h-8 shrink-0"
                        onClick={() => handleSaveApiKey(provider)}
                        disabled={!apiKeyInputs[provider] || validating === provider}
                      >
                        {validating === provider ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}

                  {/* Model list */}
                  <div className="space-y-0.5">
                    {providerModels.map((model) => {
                      const isSelected = config.modelId === model.id;
                      const canSelect = !model.requiresApiKey || providerHasKey;

                      return (
                        <button
                          key={model.id}
                          onClick={() => handleSelectModel(model)}
                          disabled={!canSelect}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                            canSelect
                              ? "hover:bg-accent/50"
                              : "opacity-50 cursor-not-allowed",
                            isSelected && "bg-accent"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {model.name}
                              </span>
                              {!model.requiresApiKey && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  Free
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {model.description}
                            </span>
                          </div>
                          {isSelected && (
                            <CheckIcon className="size-4 text-primary shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
