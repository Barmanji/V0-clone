import {
  useGetMessages,
  prefetchMessages,
} from "@/modules/messages/hooks/message";
import React, { useEffect, useRef } from "react";
import MessageCard from "./message-card";
import MessageForm from "./message-form";
import { MessageRole } from "@/lib/generated/prisma/enums";
import { useQueryClient } from "@tanstack/react-query";
import MessageLoading from "./message-loading";
import { Spinner } from "@/components/ui/spinner";

const MessagesContainer = ({
  projectId,
  activeFragment,
  setActiveFragment,
}: {
    projectId: string,
    activeFragment: any,
    setActiveFragment: any
  }) => {
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessageIdRef: any = useRef(null);

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

  useEffect(() => { // as we press another fragment the prev one becomes inactive
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

  useEffect(() => { // scrill down to last mesg
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

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
          {isLastMessageUser && <MessageLoading />}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};

export default MessagesContainer;
