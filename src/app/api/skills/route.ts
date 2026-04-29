import { createSkill, listSkills, updateSkill } from "@/server/repositories";

export async function GET() {
  return Response.json({ skills: await listSkills() });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    id?: string;
    name?: string;
    description?: string;
    instructions?: string;
    enabled?: boolean;
  };

  if (body.id) {
    const skill = await updateSkill(body.id, {
      name: body.name,
      description: body.description,
      instructions: body.instructions,
      enabled: body.enabled,
    });
    if (!skill) return Response.json({ error: "Skill not found" }, { status: 404 });
    return Response.json({ skill });
  }

  if (!body.name || !body.description || !body.instructions) {
    return Response.json(
      { error: "name, description, and instructions are required" },
      { status: 400 },
    );
  }

  const skill = await createSkill({
    name: body.name,
    description: body.description,
    instructions: body.instructions,
    enabled: body.enabled,
  });
  return Response.json({ skill }, { status: 201 });
}
