import { createDeepAgent } from "deepagents";
import type { BaseMessageLike } from "@langchain/core/messages";
import { createLangChainModel } from "./model";
import { buildSystemPrompt } from "./prompts";
import { createPersonalAssistantTools } from "./tools";

export async function createPersonalAssistantAgent(channel: "web" | "telegram") {
  return createDeepAgent({
    model: createLangChainModel(),
    tools: createPersonalAssistantTools(),
    systemPrompt: await buildSystemPrompt(channel),
  });
}

export async function invokePersonalAssistant(
  channel: "web" | "telegram",
  messages: BaseMessageLike[],
) {
  const agent = await createPersonalAssistantAgent(channel);
  const response = await agent.invoke({ messages });
  const lastMessage = response.messages.at(-1);
  const content = lastMessage?.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if ("text" in part && typeof part.text === "string") return part.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "Tôi đã xử lý xong yêu cầu.";
}
