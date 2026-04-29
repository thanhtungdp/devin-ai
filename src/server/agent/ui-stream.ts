import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
  type UIMessageChunk,
  type UIMessageStreamWriter,
} from "ai";
import type { BaseMessageLike } from "@langchain/core/messages";
import { createPersonalAssistantAgent } from "./deep-agent";

type TodoStatus = "pending" | "in_progress" | "completed";

type DeepAgentTodo = {
  content: string;
  status: TodoStatus;
};

type LangGraphStreamChunk =
  | ["messages", unknown]
  | ["tools", DeepAgentToolEvent]
  | ["updates", Record<string, unknown>];

type DeepAgentToolEvent =
  | {
      event: "on_tool_start";
      toolCallId?: string;
      name: string;
      input: unknown;
    }
  | {
      event: "on_tool_end";
      toolCallId?: string;
      name: string;
      output: unknown;
    }
  | {
      event: "on_tool_error";
      toolCallId?: string;
      name: string;
      error: unknown;
    }
  | {
      event: "on_tool_event";
      toolCallId?: string;
      name: string;
      data: unknown;
    };

type DeepAgentMessageChunk = {
  content?: unknown;
  tool_call_chunks?: Array<{
    id?: string;
    name?: string;
    args?: string;
    index?: number;
  }>;
};

type DeepAgentMessageOutput = [
  DeepAgentMessageChunk | { kwargs?: DeepAgentMessageChunk },
  Record<string, unknown>,
];

type DeepAgentUpdate = {
  todos?: DeepAgentTodo[];
  messages?: unknown[];
};

type TodoData = {
  title: string;
  todos: DeepAgentTodo[];
  source: "write_todos" | "agent_state";
};

type ToolInputStreamState = {
  name: string;
  started: boolean;
  text: string;
};

const TEXT_PART_ID = "deepagents-text";
const TODOS_PART_ID = "deepagents-todos";

export function streamPersonalAssistantResponse(
  messages: UIMessage[],
  signal?: AbortSignal,
) {
  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      await streamDeepAgentToUi(messages, writer, signal);
    },
  });

  return createUIMessageStreamResponse({ stream });
}

async function streamDeepAgentToUi(
  messages: UIMessage[],
  writer: UIMessageStreamWriter<UIMessage>,
  signal?: AbortSignal,
) {
  const agent = await createPersonalAssistantAgent("web");
  const langChainMessages = (await convertToModelMessages(
    messages,
  )) as BaseMessageLike[];
  const deepAgentStream = await agent.stream(
    { messages: langChainMessages },
    {
      signal,
      streamMode: ["messages", "tools", "updates"],
    },
  );

  let textStarted = false;
  const toolInputs = new Map<string, ToolInputStreamState>();

  for await (const rawChunk of deepAgentStream as AsyncIterable<LangGraphStreamChunk>) {
    const [mode, payload] = rawChunk;
    if (mode === "messages") {
      textStarted = handleMessageChunk(payload, writer, toolInputs, textStarted);
      continue;
    }

    if (mode === "tools") {
      handleToolEvent(payload, writer, toolInputs);
      continue;
    }

    emitTodosFromUpdate(payload, writer);
  }

  for (const toolCallId of toolInputs.keys()) {
    closeToolInput(toolCallId, writer, toolInputs);
  }

  if (textStarted) {
    writer.write({ type: "text-end", id: TEXT_PART_ID });
  }
}

function handleMessageChunk(
  payload: unknown,
  writer: UIMessageStreamWriter<UIMessage>,
  toolInputs: Map<string, ToolInputStreamState>,
  textStarted: boolean,
) {
  const [message, metadata] = payload as DeepAgentMessageOutput;
  if (metadata.langgraph_node && metadata.langgraph_node !== "model_request") {
    return textStarted;
  }
  const chunk = getDeepAgentMessageChunk(message);

  const contentText = extractContentText(chunk.content);
  if (contentText) {
    for (const toolCallId of toolInputs.keys()) {
      closeToolInput(toolCallId, writer, toolInputs);
    }

    if (!textStarted) {
      writer.write({ type: "text-start", id: TEXT_PART_ID });
      textStarted = true;
    }
    writer.write({ type: "text-delta", id: TEXT_PART_ID, delta: contentText });
  }

  for (const toolCallChunk of chunk.tool_call_chunks ?? []) {
    const toolCallId = toolCallChunk.id;
    if (!toolCallId) continue;

    const existing = toolInputs.get(toolCallId);
    const toolName = toolCallChunk.name ?? existing?.name ?? "tool";
    if (!existing) {
      toolInputs.set(toolCallId, {
        name: toolName,
        started: true,
        text: "",
      });
      writer.write({
        type: "tool-input-start",
        toolCallId,
        toolName: toUiToolName(toolName),
      });
    } else if (toolCallChunk.name && existing.name !== toolCallChunk.name) {
      existing.name = toolCallChunk.name;
    }

    if (toolCallChunk.args) {
      toolInputs.get(toolCallId)!.text += toolCallChunk.args;
      writer.write({
        type: "tool-input-delta",
        toolCallId,
        inputTextDelta: toolCallChunk.args,
      });
    }
  }

  return textStarted;
}

function getDeepAgentMessageChunk(
  message: DeepAgentMessageOutput[0],
): DeepAgentMessageChunk {
  if ("kwargs" in message && message.kwargs) return message.kwargs;
  if ("content" in message || "tool_call_chunks" in message) return message;
  return {};
}

function handleToolEvent(
  event: DeepAgentToolEvent,
  writer: UIMessageStreamWriter<UIMessage>,
  toolInputs: Map<string, ToolInputStreamState>,
) {
  const toolCallId = event.toolCallId ?? `tool-${event.name}`;
  const toolName = toUiToolName(event.name);

  if (event.event === "on_tool_start") {
    const inputText = normalizeToolInput(event.input);
    const existing = toolInputs.get(toolCallId);
    if (!existing) {
      toolInputs.set(toolCallId, {
        name: event.name,
        started: true,
        text: "",
      });
      writer.write({ type: "tool-input-start", toolCallId, toolName });
      if (inputText) {
        toolInputs.get(toolCallId)!.text = inputText;
        writer.write({
          type: "tool-input-delta",
          toolCallId,
          inputTextDelta: inputText,
        });
      }
    } else if (!existing.text && inputText) {
      existing.text = inputText;
      writer.write({
        type: "tool-input-delta",
        toolCallId,
        inputTextDelta: inputText,
      });
    }
    return;
  }

  if (event.event === "on_tool_end") {
    closeToolInput(toolCallId, writer, toolInputs);
    const output = normalizeToolOutput(event.name, event.output);
    writer.write({ type: "tool-output-available", toolCallId, output });
    emitTodosFromToolOutput(event.name, event.output, writer);
    return;
  }

  if (event.event === "on_tool_error") {
    closeToolInput(toolCallId, writer, toolInputs);
    writer.write({
      type: "tool-output-error",
      toolCallId,
      errorText: errorToText(event.error),
    });
  }
}

function closeToolInput(
  toolCallId: string,
  writer: UIMessageStreamWriter<UIMessage>,
  toolInputs: Map<string, ToolInputStreamState>,
) {
  const toolInput = toolInputs.get(toolCallId);
  if (!toolInput) return;

  writer.write({
    type: "tool-input-available",
    toolCallId,
    toolName: toUiToolName(toolInput.name),
    input: parseToolInput(toolInput.text),
  });
  toolInputs.delete(toolCallId);
}

function emitTodosFromUpdate(
  update: Record<string, unknown>,
  writer: UIMessageStreamWriter<UIMessage>,
) {
  for (const nodeUpdate of Object.values(update)) {
    const todos = normalizeTodos((nodeUpdate as DeepAgentUpdate | undefined)?.todos);
    if (todos.length) {
      emitTodos(todos, "agent_state", writer);
    }
  }
}

function emitTodosFromToolOutput(
  toolName: string,
  output: unknown,
  writer: UIMessageStreamWriter<UIMessage>,
) {
  if (toolName !== "write_todos") return;
  const todos = normalizeTodos(
    (output as { update?: { todos?: unknown } } | undefined)?.update?.todos,
  );
  if (todos.length) {
    emitTodos(todos, "write_todos", writer);
  }
}

function emitTodos(
  todos: DeepAgentTodo[],
  source: TodoData["source"],
  writer: UIMessageStreamWriter<UIMessage>,
) {
  writer.write({
    type: "data-todos",
    id: TODOS_PART_ID,
    data: {
      title: "DeepAgents plan",
      todos,
      source,
    } satisfies TodoData,
  } as UIMessageChunk);
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

function extractContentText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (!part || typeof part !== "object") return "";
      const record = part as Record<string, unknown>;
      if (typeof record.text === "string") return record.text;
      if (typeof record.reasoning === "string") return record.reasoning;
      return "";
    })
    .join("");
}

function normalizeToolInput(input: unknown): string {
  if (typeof input === "string") return input;
  if (input == null) return "";
  return JSON.stringify(input);
}

function parseToolInput(input: string): unknown {
  if (!input) return {};
  try {
    return JSON.parse(input);
  } catch {
    return { input };
  }
}

function normalizeToolOutput(toolName: string, output: unknown): unknown {
  if (toolName !== "create_artifact") return output;
  const result = parseJsonObject(extractToolMessageText(output));
  if (!result) return output;
  return {
    id: typeof result.artifactId === "string" ? result.artifactId : undefined,
    title: typeof result.title === "string" ? result.title : undefined,
    type: typeof result.type === "string" ? result.type : undefined,
    viewUrl:
      typeof result.artifactId === "string"
        ? `/api/artifacts?id=${result.artifactId}`
        : undefined,
  };
}

function extractToolMessageText(output: unknown): string {
  if (typeof output === "string") return output;
  const directContent = (
    output as
      | {
          content?: unknown;
          kwargs?: { content?: unknown };
        }
      | undefined
  )?.content;
  const serializedDirectContent = (
    output as
      | {
          kwargs?: { content?: unknown };
        }
      | undefined
  )?.kwargs?.content;
  if (typeof directContent === "string") return directContent;
  if (typeof serializedDirectContent === "string") {
    return serializedDirectContent;
  }
  const messages = (output as { update?: { messages?: unknown[] } } | undefined)
    ?.update?.messages;
  const lastMessage = messages?.at(-1);
  const content = (
    lastMessage as
      | {
          content?: unknown;
          kwargs?: { content?: unknown };
        }
      | undefined
  )?.content;
  const serializedContent = (
    lastMessage as
      | {
          kwargs?: { content?: unknown };
        }
      | undefined
  )?.kwargs?.content;
  if (typeof content === "string") return content;
  if (typeof serializedContent === "string") return serializedContent;
  return "";
}

function parseJsonObject(input: string) {
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function toUiToolName(toolName: string) {
  return toolName === "create_artifact" ? "createArtifact" : toolName;
}

function errorToText(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return JSON.stringify(error);
}
