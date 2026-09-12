"use client";

import {
  useGetMessages,
  prefetchMessages,
} from "@/modules/messages/hooks/message";
import React, { useEffect, useRef, useState, useCallback } from "react";
import MessageCard from "./message-card";
import MessageForm from "./message-form";
import { MessageRole } from "@/lib/generated/prisma/enums";
import { useQueryClient } from "@tanstack/react-query";
import MessageLoading from "./message-loading";
import { Spinner } from "@/components/ui/spinner";
import { QuestionMessage } from "@/modules/questions/components/question-message";
import { useGenerateQuestions, useEnhancePrompt } from "@/modules/questions/hooks/use-questions";
import { useTriggerCodeAgent, useApplyEnhancedPrompt } from "@/modules/projects/hooks/create-and-getProjectbyId";
import { useModel } from "@/modules/model-select/hooks/use-model";
import { toast } from "sonner";
import type { GeneratedQuestion } from "@/modules/questions/actions";
import type { Fragment } from "@/lib/generated/prisma/client";
import Image from "next/image";

interface MessagesContainerProps {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void;
  onBuildingChange?: (isBuilding: boolean) => void;
}

const MessagesContainer = ({
  projectId,
  activeFragment,
  setActiveFragment,
  onBuildingChange,
}: MessagesContainerProps) => {
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessageIdRef = useRef<string | null>(null);
  const questionFlowStartedRef = useRef(false);

  // Question flow state
  const [questionFlow, setQuestionFlow] = useState<{
    active: boolean;
    questions: GeneratedQuestion[];
    currentStep: number;
    answers: Record<string, string>;
    enhancing: boolean;
    hasGenerated: boolean; // Track if we've already tried generating
  }>({
    active: false,
    questions: [],
    currentStep: 0,
    answers: {},
    enhancing: false,
    hasGenerated: false,
  });

  const { config: modelConfig } = useModel();
  const generateQuestionsMutation = useGenerateQuestions();
  const enhancePromptMutation = useEnhancePrompt();
  const applyEnhancedPromptMutation = useApplyEnhancedPrompt();
  const triggerCodeAgentMutation = useTriggerCodeAgent();

  const enhancementStartedRef = useRef(false);

  useEffect(() => {
    if (projectId) {
      prefetchMessages(queryClient, projectId);
    }
  }, [projectId, queryClient]);

  const {
    data: messages,
    isPending,
    isError,
    error,
  } = useGetMessages(projectId);

  // Detect new project and start question flow — only once per project
  useEffect(() => {
    if (!messages || messages.length !== 1) return;
    if (messages[0].role !== MessageRole.USER) return;
    if (questionFlowStartedRef.current) return;

    const userPrompt = messages[0].content;

    questionFlowStartedRef.current = true;
    enhancementStartedRef.current = false;

    generateQuestionsMutation.mutate(
      { prompt: userPrompt, modelConfig },
      {
        onSuccess: (questions) => {
          if (questions && questions.length > 0) {
            setQuestionFlow({
              active: true,
              questions,
              currentStep: 0,
              answers: {},
              enhancing: false,
              hasGenerated: true,
            });
          }
        },
        onError: () => {
          // If question generation fails, skip and trigger agent directly
          triggerCodeAgentMutation.mutate({
            projectId,
            value: userPrompt,
            modelConfig,
          });
        },
      }
    );
  }, [messages, projectId, modelConfig]);

  // Notify parent about building state
  useEffect(() => {
    if (!onBuildingChange) return;
    const isBuilding =
      questionFlow.active ||
      questionFlow.enhancing ||
      triggerCodeAgentMutation.isPending;
    onBuildingChange(isBuilding);
  }, [questionFlow.active, questionFlow.enhancing, triggerCodeAgentMutation.isPending, onBuildingChange]);

  useEffect(() => {
    const lastAssistantMessage = messages?.findLast(
      (message) => message.role === MessageRole.ASSISTANT
    );
    if (
      lastAssistantMessage?.fragments &&
      lastAssistantMessage.id !== lastAssistantMessageIdRef.current
    ) {
      setActiveFragment(lastAssistantMessage?.fragments);
      lastAssistantMessageIdRef.current = lastAssistantMessage.id;
    }
  }, [messages, setActiveFragment]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length, questionFlow.currentStep]);

  const handleQuestionSelect = useCallback(
    (questionText: string, label: string) => {
      // Pure updater — no side effects. React (StrictMode in dev) double-invokes
      // updaters, so anything async must NOT live here.
      setQuestionFlow((prev) => {
        const newAnswers = { ...prev.answers, [questionText]: label };
        const nextStep = prev.currentStep + 1;
        const isLastStep = nextStep >= prev.questions.length;

        return {
          ...prev,
          answers: newAnswers,
          currentStep: nextStep,
          enhancing: isLastStep,
        };
      });
    },
    []
  );

  const triggerEnhancement = useCallback(
    async (originalPrompt: string, answers: Record<string, string>) => {
      try {
        const enhanced = await enhancePromptMutation.mutateAsync({
          originalPrompt,
          answers,
          modelConfig,
        });

        // Replace the original user message with the enhanced prompt and
        // trigger the agent exactly once.
        await applyEnhancedPromptMutation.mutateAsync({
          projectId,
          value: enhanced,
          modelConfig,
        });

        setQuestionFlow((prev) => ({ ...prev, active: false, enhancing: false }));
      } catch {
        // Fallback to the raw prompt, still a single agent trigger.
        await triggerCodeAgentMutation.mutateAsync({
          projectId,
          value: originalPrompt,
          modelConfig,
        });

        setQuestionFlow((prev) => ({ ...prev, active: false, enhancing: false }));
      }
    },
    [modelConfig, projectId, enhancePromptMutation, applyEnhancedPromptMutation, triggerCodeAgentMutation]
  );

  // Fire the enhancement exactly once when the last answer lands.
  useEffect(() => {
    if (!questionFlow.enhancing || enhancementStartedRef.current) return;
    enhancementStartedRef.current = true;

    const userPrompt = messages?.[0]?.content || "";
    void triggerEnhancement(userPrompt, questionFlow.answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionFlow.enhancing, questionFlow.answers]);

  const handleSkipAll = useCallback(() => {
    const userPrompt = messages?.[0]?.content || "";
    setQuestionFlow((prev) => ({ ...prev, active: false }));

    triggerCodeAgentMutation.mutate({
      projectId,
      value: userPrompt,
      modelConfig,
    });
  }, [messages, modelConfig, projectId]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="animate-spin size-4 text-emerald-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Error: {error?.message || "Failed to load messages"}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No messages yet. Start a conversation!
        </div>
        <div className="relative p-3 pt-1">
          <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
          <MessageForm projectId={projectId} />
        </div>
      </div>
    );
  }

  const lastMessage = messages[messages.length - 1];
  const isLastMessageUser = lastMessage.role === MessageRole.USER;

  // Current question to display (if in question flow)
  const currentQuestion =
    questionFlow.active && questionFlow.currentStep < questionFlow.questions.length
      ? questionFlow.questions[questionFlow.currentStep]
      : null;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="pt-2 pr-1">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              content={message.content}
              role={message.role}
              fragment={message.fragments}
              createdAt={message.createdAt}
              isActiveFragment={activeFragment?.id === message.fragments?.id}
              onFragmentClick={() => setActiveFragment(message.fragments)}
              type={message.type}
            />
          ))}

          {/* Generating questions indicator */}
          {generateQuestionsMutation.isPending &&
            !questionFlow.active && (
              <div className="flex flex-col group px-2 pb-4">
                <div className="flex items-center gap-2 pl-2 mb-2">
                  <Image
                    src="/logo.svg"
                    alt="V0"
                    width={20}
                    height={20}
                    className="invert dark:invert-0"
                  />
                  <span className="text-sm font-medium">V0</span>
                </div>
                <div className="pl-8.5 flex items-center gap-2">
                  <Spinner className="size-3 animate-spin text-emerald-400" />
                  <span className="text-sm text-muted-foreground">
                    Asking you a few questions...
                  </span>
                </div>
              </div>
            )}

          {/* Question flow messages */}
          {questionFlow.active &&
            questionFlow.questions.slice(0, questionFlow.currentStep).map((q, i) => (
              <div key={`answered-${i}`} className="flex flex-col group px-2 pb-4">
                <div className="flex items-center gap-2 pl-2 mb-2">
                  <Image
                    src="/logo.svg"
                    alt="V0"
                    width={20}
                    height={20}
                    className="invert dark:invert-0"
                  />
                  <span className="text-sm font-medium">V0</span>
                </div>
                <div className="pl-8.5">
                  <QuestionMessage
                    question={q}
                    selectedAnswer={questionFlow.answers[q.question] || null}
                    onSelect={() => {}}
                    disabled
                  />
                </div>
              </div>
            ))}

          {/* Current active question */}
          {currentQuestion && (
            <div className="flex flex-col group px-2 pb-4">
              <div className="flex items-center gap-2 pl-2 mb-2">
                <Image
                  src="/logo.svg"
                  alt="V0"
                  width={20}
                  height={20}
                  className="invert dark:invert-0"
                />
                <span className="text-sm font-medium">V0</span>
              </div>
              <div className="pl-8.5">
                <QuestionMessage
                  question={currentQuestion}
                  selectedAnswer={null}
                  onSelect={(label) =>
                    handleQuestionSelect(currentQuestion.question, label)
                  }
                />
              </div>
            </div>
          )}

          {/* Skip button during question flow */}
          {questionFlow.active && questionFlow.currentStep < questionFlow.questions.length && (
            <div className="px-2 pb-4 pl-10">
              <button
                onClick={handleSkipAll}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Skip all questions and build with my original prompt
              </button>
            </div>
          )}

          {/* Enhancing/loading state */}
          {questionFlow.enhancing && (
            <div className="flex flex-col group px-2 pb-4">
              <div className="flex items-center gap-2 pl-2 mb-2">
                <Image
                  src="/logo.svg"
                  alt="V0"
                  width={20}
                  height={20}
                  className="invert dark:invert-0"
                />
                <span className="text-sm font-medium">V0</span>
              </div>
              <div className="pl-8.5 flex items-center gap-2">
                <Spinner className="size-3 animate-spin text-emerald-400" />
                <span className="text-sm text-muted-foreground">
                  Enhancing your prompt and building...
                </span>
              </div>
            </div>
          )}

          {/* Regular loading shimmer */}
          {isLastMessageUser &&
            !generateQuestionsMutation.isPending &&
            !questionFlow.active &&
            !questionFlow.enhancing &&
            !triggerCodeAgentMutation.isPending && (
              <MessageLoading />
          )}

          <div ref={bottomRef} />
        </div>
      </div>
      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
        <MessageForm
          projectId={projectId}
          disabled={
            generateQuestionsMutation.isPending ||
            questionFlow.active ||
            questionFlow.enhancing
          }
        />
      </div>
    </div>
  );
};

export default MessagesContainer;
