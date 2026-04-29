import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR, readStore, writeStore } from "./storage";
import type {
  Artifact,
  ArtifactType,
  KnowledgeItem,
  Skill,
  TelegramLogMessage,
  TelegramSettings,
} from "./types";

export async function listArtifacts() {
  return readStore<Artifact[]>("artifacts", []);
}

export async function createArtifact(input: {
  title: string;
  type: ArtifactType;
  content: string;
  mimeType?: string;
}) {
  const artifacts = await listArtifacts();
  const artifact: Artifact = {
    id: randomUUID(),
    title: input.title,
    type: input.type,
    content: input.content,
    mimeType: input.mimeType ?? artifactMimeType(input.type),
    createdAt: new Date().toISOString(),
  };
  await writeStore("artifacts", [artifact, ...artifacts]);
  return artifact;
}

export async function listKnowledge() {
  return readStore<KnowledgeItem[]>("knowledge", []);
}

export async function createKnowledge(input: {
  title: string;
  content: string;
  sourceName?: string;
}) {
  const items = await listKnowledge();
  const item: KnowledgeItem = {
    id: randomUUID(),
    title: input.title,
    content: input.content,
    sourceName: input.sourceName,
    createdAt: new Date().toISOString(),
  };
  await writeStore("knowledge", [item, ...items]);
  return item;
}

export async function listSkills() {
  return readStore<Skill[]>("skills", []);
}

export async function createSkill(input: {
  name: string;
  description: string;
  instructions: string;
  enabled?: boolean;
}) {
  const skills = await listSkills();
  const skill: Skill = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    instructions: input.instructions,
    enabled: input.enabled ?? true,
    createdAt: new Date().toISOString(),
  };
  await writeStore("skills", [skill, ...skills]);
  await writeNativeSkill(skill);
  return skill;
}

export async function updateSkill(
  id: string,
  input: Partial<Pick<Skill, "name" | "description" | "instructions" | "enabled">>,
) {
  const skills = await listSkills();
  const next = skills.map((skill) =>
    skill.id === id ? { ...skill, ...input } : skill,
  );
  await writeStore("skills", next);
  const skill = next.find((item) => item.id === id);
  if (skill) {
    await writeNativeSkill(skill);
  }
  return skill;
}

export async function getTelegramSettings() {
  return readStore<TelegramSettings>("settings", { enabled: false });
}

export async function saveTelegramSettings(settings: TelegramSettings) {
  await writeStore("settings", settings);
  return settings;
}

export async function listTelegramMessages() {
  return readStore<TelegramLogMessage[]>("telegram-messages", []);
}

export async function appendTelegramMessage(
  input: Omit<TelegramLogMessage, "id" | "createdAt">,
) {
  const messages = await listTelegramMessages();
  const message: TelegramLogMessage = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  await writeStore("telegram-messages", [message, ...messages].slice(0, 100));
  return message;
}

function artifactMimeType(type: ArtifactType) {
  switch (type) {
    case "html":
      return "text/html";
    case "json":
      return "application/json";
    case "image":
      return "image/png";
    case "markdown":
      return "text/markdown";
    case "text":
      return "text/plain";
  }
}

async function writeNativeSkill(skill: Skill) {
  const skillDir = path.join(DATA_DIR, "deepagents", "skills", skillSlug(skill));
  if (!skill.enabled) {
    await rm(skillDir, { force: true, recursive: true });
    return;
  }
  await mkdir(skillDir, { recursive: true });
  await writeFile(path.join(skillDir, "SKILL.md"), skillMarkdown(skill), "utf8");
}

function skillSlug(skill: Skill) {
  const slug = skill.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "skill"}-${skill.id.slice(0, 8)}`;
}

function skillMarkdown(skill: Skill) {
  return `---\nname: ${yamlString(skill.name)}\ndescription: ${yamlString(
    skill.description,
  )}\n---\n\n# ${skill.name}\n\n${skill.instructions}\n`;
}

function yamlString(value: string) {
  return JSON.stringify(value);
}
