import { createDeepAgent, FilesystemBackend } from "deepagents";
import path from "node:path";
import type { BaseMessageLike } from "@langchain/core/messages";
import { createLangChainModel } from "./model";
import { buildSystemPrompt } from "./prompts";
import { createPersonalAssistantTools } from "./tools";
import { DATA_DIR } from "@/server/storage";

type TodoStatus = "pending" | "in_progress" | "completed";

type DeepAgentTodo = {
  content: string;
  status: TodoStatus;
};

export async function createPersonalAssistantAgent(channel: "web" | "telegram") {
  return createDeepAgent({
    model: createLangChainModel(),
    tools: createPersonalAssistantTools(),
    systemPrompt: await buildSystemPrompt(channel),
    backend: new FilesystemBackend({
      rootDir: path.join(DATA_DIR, "deepagents"),
      virtualMode: true,
    }),
    skills: ["/skills/"],
  });
}

export async function invokePersonalAssistant(
  channel: "web" | "telegram",
  messages: BaseMessageLike[],
) {
  const agent = await createPersonalAssistantAgent(channel);
  const response = await agent.invoke({ messages });
  const lastMessage = response.messages.at(-1);
  const answer = messageContentToText(lastMessage?.content);
  return {
    answer: answer || "Tôi đã xử lý xong yêu cầu.",
    todos: normalizeTodos(response.todos),
  };
}

function messageContentToText(content: unknown) {
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
  return "";
}

function normalizeTodos(value: unknown): DeepAgentTodo[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((todo) => {
      if (!todo || typeof todo !== "object") return null;
      const record = todo as Record<string, unknown>;
      if (typeof record.content !== "string") return null;
      if (!isTodoStatus(record.status)) return null;
      return {
        content: record.content,
        status: record.status,
      };
    })
    .filter((todo): todo is DeepAgentTodo => Boolean(todo));
}

function isTodoStatus(value: unknown): value is TodoStatus {
  return (
    value === "pending" || value === "in_progress" || value === "completed"
  );
}
