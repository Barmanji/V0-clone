"use server";

import { createAgent } from "@inngest/agent-kit";
import { QUESTION_GENERATION_PROMPT, PROMPT_ENHANCER_PROMPT } from "../lib/question-prompts";
import { getModelFromConfig, type AgentModelConfig } from "@/lib/agent-model";

export interface QuestionOption {
  label: string;
  description: string;
}

export interface GeneratedQuestion {
  question: string;
  options: QuestionOption[];
}

export const generateQuestions = async (
  prompt: string,
  modelConfig?: AgentModelConfig
): Promise<GeneratedQuestion[]> => {
  try {
    // Use the same model resolution as the code agent — falls back to
    // gpt-4o-mini on the server's OPENAI_API_KEY, or uses the user's
    // selected provider + their API key.
    const model = getModelFromConfig(modelConfig);

    const questionAgent = createAgent({
      name: "question-generator",
      description: "Generates clarifying questions for web app prompts",
      system: QUESTION_GENERATION_PROMPT,
      model,
    });

    const { output } = await questionAgent.run(
      `User wants to build: "${prompt}"\n\nGenerate 3-5 clarifying questions with multiple choice options.`
    );

    const textContent = output.find((o) => o.type === "text");
    if (!textContent) {
      console.error("[generateQuestions] No text content in agent output:", output);
      return getDefaultQuestions();
    }

    const rawText =
      typeof textContent.content === "string"
        ? textContent.content
        : Array.isArray(textContent.content)
          ? textContent.content.map((c: any) => (typeof c === "string" ? c : c.text || "")).join("")
          : "";

    const cleaned = rawText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((q: any) => ({
        question: q.question || "Any preferences?",
        options: Array.isArray(q.options)
          ? q.options.map((o: any) => ({
              label: o.label || "Option",
              description: o.description || "",
            }))
          : [
              { label: "Yes", description: "" },
              { label: "No", description: "" },
            ],
      }));
    }
    console.error("[generateQuestions] Parsed result is not a non-empty array:", parsed);
    return getDefaultQuestions();
  } catch (error) {
    console.error("[generateQuestions] Error generating questions:", error);
    return getDefaultQuestions();
  }
};

export const enhancePrompt = async (
  originalPrompt: string,
  answers: Record<string, string>,
  modelConfig?: AgentModelConfig
): Promise<string> => {
  try {
    const model = getModelFromConfig(modelConfig);

    const enhancerAgent = createAgent({
      name: "prompt-enhancer",
      description: "Enhances prompts with user preferences",
      system: PROMPT_ENHANCER_PROMPT,
      model,
    });

    const answerText = Object.entries(answers)
      .map(([q, a]) => `${q}: ${a}`)
      .join("\n");

    const { output } = await enhancerAgent.run(
      `Original prompt: "${originalPrompt}"\n\nUser answers:\n${answerText}\n\nCreate an enhanced prompt.`
    );

    const textContent = output.find((o) => o.type === "text");
    if (!textContent) {
      console.error("[enhancePrompt] No text content in agent output:", output);
      return originalPrompt;
    }

    const rawText =
      typeof textContent.content === "string"
        ? textContent.content
        : Array.isArray(textContent.content)
          ? textContent.content.map((c: any) => (typeof c === "string" ? c : c.text || "")).join("")
          : "";

    return rawText.trim() || originalPrompt;
  } catch (error) {
    console.error("[enhancePrompt] Error enhancing prompt:", error);
    return originalPrompt;
  }
};

function getDefaultQuestions(): GeneratedQuestion[] {
  return [
    {
      question: "What design style do you prefer?",
      options: [
        { label: "Modern & Clean", description: "Minimalist with whitespace" },
        { label: "Bold & Vibrant", description: "Strong colors, dynamic" },
        { label: "Dark & Cinematic", description: "Deep blacks, rich tones" },
      ],
    },
    {
      question: "What layout works best?",
      options: [
        { label: "Sidebar Navigation", description: "Fixed sidebar with content" },
        { label: "Top Navbar", description: "Horizontal navigation bar" },
        { label: "Full-width Grid", description: "Card-based grid layout" },
      ],
    },
    {
      question: "Any specific features?",
      options: [
        { label: "Search & Filter", description: "Find content quickly" },
        { label: "Animations", description: "Smooth transitions & hover effects" },
        { label: "Charts & Data", description: "Visual data representations" },
        { label: "All of the above", description: "Include everything" },
      ],
    },
  ];
}