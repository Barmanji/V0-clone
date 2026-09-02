import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import z from "zod";
import { useCreateMessages } from "@/modules/messages/hooks/message";
import { toast } from "sonner";

import { useState } from "react";
import { Usage } from "@/modules/usage/components/usage";
import { useStatus } from "@/modules/usage/hooks/usage";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
  content: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message is too long"),
});

const MessageForm = ({ projectId }: { projectId: string }) => {
  const [isFocused, setIsFocused] = useState(false);

  const { mutateAsync, isPending, isError } = useCreateMessages(projectId);
  const { data: usage } = useStatus();

  const showUsage = !!usage; // this changes any value to bool
  const {
    register,
    handleSubmit,
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

  const onSubmit = async (values) => {
    try {
      await mutateAsync(values.content);
      reset();
      toast.success("Message sent successfully");
    } catch (error) {
      toast.error((error as Error).message || "Failed to send message");
    }
  };

  const isButtonDisabled = isPending;

  return (
    <div>
      {showUsage && <Usage />}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-xs",
          showUsage && "rounded-t-none",
        )}
      >
        <TextAreaAutosize
          {...register("content")}
          disabled={isPending}
          placeholder="What would you like to build?"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          minRows={2}
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
          <div className="text-[10px] text-muted-foreground font-mono">
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span>&#8984;</span>Enter
            </kbd>
            &nbsp; to submit
          </div>
          <Button
            className={cn(
              "size-8 rounded-full  bg-green-600",
              isButtonDisabled && "bg-muted-foreground border",
            )}
            disabled={isButtonDisabled}
            type="submit"
          >
            {isPending ? (
              <Spinner className="size-4 animate-spin" />
            ) : (
              <ArrowUpIcon className="size-4 text-white" />
            )}
          </Button>
        </div>
      </form>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-0.5">
        <Tooltip>
          <TooltipTrigger>
            <Info className="size-3.5 shrink-0 cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            Default AI model is gpt-4o-mini,or gemini-3.5-flash.
          </TooltipContent>
        </Tooltip>
        <span className="whitespace-nowrap">
          My budget only allowed for a bargain-bin AI, but the ideas are
          strictly premium.
        </span>
      </div>
    </div>
  );
};

export default MessageForm;
