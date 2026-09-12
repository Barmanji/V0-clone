"use client";

import { cn } from "@/lib/utils";
import type { GeneratedQuestion } from "../actions";

interface QuestionMessageProps {
  question: GeneratedQuestion;
  selectedAnswer: string | null;
  onSelect: (label: string) => void;
  disabled?: boolean;
}

export function QuestionMessage({
  question,
  selectedAnswer,
  onSelect,
  disabled = false,
}: QuestionMessageProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">{question.question}</p>
      <div className="flex flex-wrap gap-2">
        {question.options.map((option) => (
          <button
            key={option.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option.label)}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm transition-all",
              "hover:border-primary/50 hover:bg-primary/5",
              disabled && "opacity-50 cursor-not-allowed",
              selectedAnswer === option.label
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-border"
            )}
          >
            <span className="font-medium">{option.label}</span>
            {option.description && (
              <span className="block text-xs text-muted-foreground mt-0.5">
                {option.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
