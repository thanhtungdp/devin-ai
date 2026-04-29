export type ArtifactType = "html" | "markdown" | "text" | "json" | "image";

export type Artifact = {
  id: string;
  title: string;
  type: ArtifactType;
  content: string;
  mimeType: string;
  createdAt: string;
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  enabled: boolean;
  createdAt: string;
};

export type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  sourceName?: string;
  createdAt: string;
};

export type TelegramSettings = {
  botToken?: string;
  webhookSecret?: string;
  defaultChatId?: string;
  enabled: boolean;
};

export type TelegramLogMessage = {
  id: string;
  chatId: string;
  from?: string;
  text: string;
  direction: "inbound" | "outbound";
  createdAt: string;
};
