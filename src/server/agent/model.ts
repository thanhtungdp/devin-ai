import { createOpenAI } from "@ai-sdk/openai";
import { ChatOpenAI } from "@langchain/openai";

export const DEFAULT_MODEL = "gpt-4o-mini";
export const DEFAULT_IMAGE_MODEL = "gpt-image-1";

export function getOpenAIConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    imageModel: process.env.OPENAI_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL,
  };
}

export function createAiSdkModel() {
  const config = getOpenAIConfig();
  const provider = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
  return provider.chat(config.model);
}

export function createLangChainModel() {
  const config = getOpenAIConfig();
  return new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    temperature: 0.3,
    streaming: true,
    configuration: {
      baseURL: config.baseURL,
    },
  });
}

export function assertOpenAIConfigured() {
  const { apiKey } = getOpenAIConfig();
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
}
