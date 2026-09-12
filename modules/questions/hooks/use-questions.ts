import { useMutation } from "@tanstack/react-query";
import { generateQuestions, enhancePrompt } from "../actions";
import type { AgentModelConfig } from "@/lib/agent-model";

export const useGenerateQuestions = () => {
  return useMutation({
    mutationFn: ({
      prompt,
      modelConfig,
    }: {
      prompt: string;
      modelConfig?: AgentModelConfig;
    }) => generateQuestions(prompt, modelConfig),
  });
};

export const useEnhancePrompt = () => {
  return useMutation({
    mutationFn: ({
      originalPrompt,
      answers,
      modelConfig,
    }: {
      originalPrompt: string;
      answers: Record<string, string>;
      modelConfig?: AgentModelConfig;
    }) => enhancePrompt(originalPrompt, answers, modelConfig),
  });
};