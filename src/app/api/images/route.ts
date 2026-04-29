import { experimental_generateImage as generateImage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createArtifact } from "@/server/repositories";
import { assertOpenAIConfigured, getOpenAIConfig } from "@/server/agent/model";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    assertOpenAIConfigured();
    const { prompt } = (await req.json()) as { prompt?: string };
    if (!prompt) {
      return Response.json({ error: "prompt is required" }, { status: 400 });
    }

    const config = getOpenAIConfig();
    const provider = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    const result = await generateImage({
      model: provider.image(config.imageModel),
      prompt,
      size: "1024x1024",
    });
    const image = result.image;
    const artifact = await createArtifact({
      title: prompt.slice(0, 80),
      type: "image",
      content: `data:${image.mediaType};base64,${image.base64}`,
      mimeType: image.mediaType,
    });

    return Response.json({ artifact });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate image";
    return Response.json({ error: message }, { status: 500 });
  }
}
