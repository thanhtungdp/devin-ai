import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { createAiSdkModel, assertOpenAIConfigured } from "@/server/agent/model";
import { buildSystemPrompt } from "@/server/agent/prompts";
import { createArtifact } from "@/server/repositories";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    assertOpenAIConfigured();
    const { messages } = (await req.json()) as { messages: UIMessage[] };
    const result = streamText({
      model: createAiSdkModel(),
      system: await buildSystemPrompt("web"),
      messages: await convertToModelMessages(messages),
      tools: {
        createArtifact: {
          description:
            "Create an artifact when the user asks for HTML, a document, JSON, a reusable file, or repeated UI.",
          inputSchema: z.object({
            title: z.string(),
            type: z.enum(["html", "markdown", "text", "json", "image"]),
            content: z.string(),
          }),
          execute: async (input: {
            title: string;
            type: "html" | "markdown" | "text" | "json" | "image";
            content: string;
          }) => {
            const artifact = await createArtifact(input);
            return {
              id: artifact.id,
              title: artifact.title,
              type: artifact.type,
              viewUrl: `/api/artifacts?id=${artifact.id}`,
            };
          },
        },
      },
    });

    return result.toUIMessageStreamResponse({ originalMessages: messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process chat request";
    return Response.json({ error: message }, { status: 500 });
  }
}
