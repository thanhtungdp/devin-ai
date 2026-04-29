import { listKnowledge, listSkills } from "@/server/repositories";

export async function buildSystemPrompt(channel: "web" | "telegram") {
  const [skills, knowledge] = await Promise.all([listSkills(), listKnowledge()]);
  const enabledSkills = skills.filter((skill) => skill.enabled);
  const skillText = enabledSkills.length
    ? enabledSkills
        .map(
          (skill) =>
            `## ${skill.name}\n${skill.description}\n${skill.instructions}`,
        )
        .join("\n\n")
    : "No custom skills are enabled yet.";
  const knowledgeText = knowledge.length
    ? knowledge
        .slice(0, 12)
        .map((item) => `## ${item.title}\n${item.content}`)
        .join("\n\n")
    : "No uploaded knowledge yet.";

  return `You are a Vietnamese-first personal assistant running on ${channel}.

Core behavior:
- Be concise, proactive, and useful.
- Use Vietnamese unless the user asks for another language.
- For repeated workflows, prefer creating structured artifacts.
- When the user asks to make files, pages, plans, reports, JSON, or HTML, use create_artifact.
- Use skills and uploaded knowledge when relevant.
- Do not reveal secrets or API keys.
- If Telegram context is limited, ask one focused follow-up.
- For any request with more than one meaningful step, use DeepAgents native write_todos first, keep exactly one todo in_progress while working, and update todos as steps complete.
- Use DeepAgents native filesystem tools for long drafts, reusable files, and multi-step artifact work when helpful.
- Use the task subagent for isolated research, analysis, writing, or artifact design that can be delegated.

Enabled skills:
${skillText}

Uploaded knowledge:
${knowledgeText}`;
}
