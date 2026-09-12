import type { Message, TextMessage } from "@inngest/agent-kit";

export function lastAssistantTextMessageContent(result: { output: Message[] }) {
  const lastAssistantTextMessage = [...result.output]
    .reverse()
    .find(
      (message): message is TextMessage =>
        message.type === "text" && message.role === "assistant"
    );

  if (!lastAssistantTextMessage?.content) return undefined;

  return typeof lastAssistantTextMessage.content === "string"
    ? lastAssistantTextMessage.content
    : lastAssistantTextMessage.content.map((c) => c.text).join("");
}