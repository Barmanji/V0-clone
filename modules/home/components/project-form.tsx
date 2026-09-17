"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import z from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCreateProject } from "@/modules/projects/hooks/create-and-getProjectbyId";
import { useCreditLimit } from "@/modules/usage/hooks/use-credit-limit";
import { useAuth } from "@clerk/nextjs";
import { ModelSelector } from "@/modules/model-select/components/model-selector";
import { useModel } from "@/modules/model-select/hooks/use-model";

const PENDING_PROMPT_KEY = "v0-clone-pending-prompt";

const formSchema = z.object({
  content: z
    .string()
    .min(1, "Project description is required")
    .max(1000, "Description is too long"),
});

type ProjectFormValues = z.infer<typeof formSchema>;

const PROJECT_TEMPLATES = [
  {
    emoji: "🎬",
    title: "Build a Netflix clone",
    prompt:
      "Build a Netflix-style homepage using the existing project setup. Use shadcn/ui components where appropriate, mock movie data, and local React state. Include a hero section, movie sections, responsive movie cards, and a movie-details modal. Use a dark theme. Do not add unnecessary dependencies, use external APIs, or assume API keys are available.",
  },
  {
    emoji: "📦",
    title: "Build an admin dashboard",
    prompt:
      "Build a modern admin dashboard using the existing project setup and shadcn/ui components where appropriate. Include a sidebar, stat cards, a chart using an already-installed chart library if available, and a table with filtering and pagination using local state and mock data. Keep the UI responsive and professional. Do not add unnecessary dependencies or assume external APIs/services exist.",
  },
  {
    emoji: "📋",
    title: "Build a kanban board",
    prompt:
      "Build a kanban board using the existing project setup and shadcn/ui components where appropriate. Support adding, editing, deleting, and moving tasks between columns using local React state. Use a drag-and-drop library only if one is already installed; otherwise implement the interaction without adding unnecessary dependencies. Do not use deprecated libraries or assume external services.",
  },
  {
    emoji: "🗂️",
    title: "Build a file manager",
    prompt:
      "Build a file-manager-style interface using the existing project setup and shadcn/ui components where appropriate. Include a folder sidebar, file grid/list, and actions for renaming and deleting items using mock data and local state. Use consistent icons and responsive layouts. This is a UI simulation only; do not access the real filesystem or assume a backend exists.",
  },
  {
    emoji: "📺",
    title: "Build a YouTube clone",
    prompt:
      "Build a YouTube-style homepage using the existing project setup and shadcn/ui components where appropriate. Use mock video data and local React state. Include a category/sidebar navigation, responsive video grid, and a modal for viewing video details. Do not use the YouTube API, external services, API keys, or unnecessary dependencies.",
  },
  {
    emoji: "🛍️",
    title: "Build a store page",
    prompt:
      "Build a modern e-commerce store page using the existing project setup and shadcn/ui components where appropriate. Include category filtering, a responsive product grid, and a local shopping cart that supports adding and removing products and changing quantities. Use mock product data and local state. Do not integrate payments, external APIs, or unnecessary dependencies.",
  },
  {
    emoji: "🏡",
    title: "Build an Airbnb clone",
    prompt:
      "Build an Airbnb-style property listings page using the existing project setup and shadcn/ui components where appropriate. Use mock property data and local React state. Include a responsive listings grid, filter controls, and a property-details modal. Focus on polished spacing, typography, and responsive behavior. Do not use external APIs, maps, authentication, payments, or unnecessary dependencies.",
  },
  {
    emoji: "🎵",
    title: "Build a Spotify clone",
    prompt:
      "Build a Spotify-style music player UI using the existing project setup and shadcn/ui components where appropriate. Use mock playlists and songs with local React state. Include a sidebar, playlist/song views, song selection, and playback controls. Simulate playback state only; do not use the Spotify API, external audio services, authentication, or API keys. Use a dark theme.",
  },
];

const ProjectForm = () => {
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const { config: modelConfig, updateModel } = useModel();
  const { mutateAsync, isPending } = useCreateProject();
  const { handleCreditLimit, creditLimitDialog } = useCreditLimit();
  const { isSignedIn } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const pendingPrompt = window.sessionStorage.getItem(PENDING_PROMPT_KEY);
    if (pendingPrompt) {
      setValue("content", pendingPrompt, { shouldValidate: true });
      window.sessionStorage.removeItem(PENDING_PROMPT_KEY);
    }
  }, [setValue]);

  const handleTemplate = (prompt: string) => {
    setValue("content", prompt, { shouldValidate: true });
  };

  const onSubmit = async (values: ProjectFormValues) => {
    if (isSignedIn === false) {
      window.sessionStorage.setItem(PENDING_PROMPT_KEY, values.content);
      toast.info("Sign in to continue building");
      router.push("/sign-in?redirect_url=/");
      return;
    }

    try {
      const res = await mutateAsync({
        value: values.content,
        modelConfig,
      });

      if (!res.success) {
        if (res.code === "LIMIT_REACHED") {
          handleCreditLimit(res.isPro);
        } else {
          toast.error("Failed to create project");
        }
        return;
      }

      router.push(`/projects/${res.project.id}`);
      toast.success("Project created successfully");
      reset();
    } catch (error) {
      toast.error((error as Error).message || "Failed to create project");
    }
  };

  const contentValue = watch("content");
  const isButtonDisabled = isPending || !contentValue?.trim();

  return (
    <div className="space-y-8">
      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PROJECT_TEMPLATES.map((template, index) => (
          <button
            key={index}
            onClick={() => handleTemplate(template.prompt)}
            disabled={isPending}
            className="group relative p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:border-primary/30"
          >
            <div className="flex flex-col gap-2">
              <span className="text-3xl" role="img" aria-label={template.title}>
                {template.emoji}
              </span>
              <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                {template.title}
              </h3>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or describe your own idea
          </span>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-lg ring-2 ring-primary/20",
        )}
      >
        <TextAreaAutosize
          {...register("content")}
          disabled={isPending}
          placeholder="Describe what you want to create..."
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          minRows={3}
          maxRows={8}
          className={cn(
            "pt-4 resize-none border-none w-full outline-none bg-transparent",
            isPending && "opacity-50",
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }
          }}
        />
        {errors.content && (
          <p className="text-xs text-destructive px-1 pt-1">
            {errors.content.message}
          </p>
        )}

        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="flex items-center gap-2">
            <ModelSelector config={modelConfig} onSelect={updateModel} />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-muted-foreground font-mono">
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span>&#8984;</span>Enter
              </kbd>
              &nbsp; to submit
            </div>
            <Button
              className={cn(
                "size-8 rounded-full",
                isButtonDisabled && "bg-muted-foreground border",
              )}
              disabled={isButtonDisabled}
              type="submit"
            >
              {isPending ? (
                <Spinner className="size-4 animate-spin" />
              ) : (
                <ArrowUpIcon className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </form>
      {creditLimitDialog}
    </div>
  );
};

export default ProjectForm;
