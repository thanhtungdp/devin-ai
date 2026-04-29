import { tool } from "langchain";
import { z } from "zod";
import {
  createArtifact,
  createKnowledge,
  createSkill,
  listArtifacts,
  listKnowledge,
  listSkills,
} from "@/server/repositories";

export function createPersonalAssistantTools() {
  return [
    tool(
      async ({ title, type, content }) => {
        const artifact = await createArtifact({ title, type, content });
        return JSON.stringify({
          status: "created",
          artifactId: artifact.id,
          title: artifact.title,
          type: artifact.type,
        });
      },
      {
        name: "create_artifact",
        description:
          "Create a reusable artifact such as HTML, Markdown, text, JSON, or an image URL/data reference.",
        schema: z.object({
          title: z.string().describe("Short artifact title"),
          type: z
            .enum(["html", "markdown", "text", "json", "image"])
            .describe("Artifact type"),
          content: z.string().describe("Artifact content"),
        }),
      },
    ),
    tool(
      async () => JSON.stringify(await listArtifacts()),
      {
        name: "list_artifacts",
        description: "List artifacts that have been created in this workspace.",
        schema: z.object({}),
      },
    ),
    tool(
      async ({ title, content, sourceName }) => {
        const item = await createKnowledge({ title, content, sourceName });
        return JSON.stringify({
          status: "uploaded",
          knowledgeId: item.id,
          title: item.title,
        });
      },
      {
        name: "upload_knowledge",
        description: "Save user-provided knowledge so future replies can use it.",
        schema: z.object({
          title: z.string(),
          content: z.string(),
          sourceName: z.string().optional(),
        }),
      },
    ),
    tool(
      async () => JSON.stringify(await listKnowledge()),
      {
        name: "list_knowledge",
        description: "List knowledge uploaded through the web interface.",
        schema: z.object({}),
      },
    ),
    tool(
      async ({ name, description, instructions }) => {
        const skill = await createSkill({ name, description, instructions });
        return JSON.stringify({
          status: "created",
          skillId: skill.id,
          name: skill.name,
        });
      },
      {
        name: "create_skill",
        description:
          "Create a reusable assistant skill with a name, description, and instructions.",
        schema: z.object({
          name: z.string(),
          description: z.string(),
          instructions: z.string(),
        }),
      },
    ),
    tool(
      async () => JSON.stringify(await listSkills()),
      {
        name: "list_skills",
        description: "List assistant skills and whether they are enabled.",
        schema: z.object({}),
      },
    ),
  ];
}
