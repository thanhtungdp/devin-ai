import { type UIMessage } from "ai";
import { assertOpenAIConfigured } from "@/server/agent/model";
import { streamPersonalAssistantResponse } from "@/server/agent/ui-stream";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    assertOpenAIConfigured();
    const { messages } = (await req.json()) as { messages: UIMessage[] };
    return streamPersonalAssistantResponse(messages, req.signal);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process chat request";
    return Response.json({ error: message }, { status: 500 });
  }
}
