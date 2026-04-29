import { createKnowledge, listKnowledge } from "@/server/repositories";

export async function GET() {
  return Response.json({ knowledge: await listKnowledge() });
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "file is required" }, { status: 400 });
    }
    const item = await createKnowledge({
      title: String(form.get("title") || file.name),
      sourceName: file.name,
      content: await file.text(),
    });
    return Response.json({ knowledge: item }, { status: 201 });
  }

  const body = (await req.json()) as {
    title?: string;
    content?: string;
    sourceName?: string;
  };
  if (!body.title || !body.content) {
    return Response.json(
      { error: "title and content are required" },
      { status: 400 },
    );
  }
  const item = await createKnowledge({
    title: body.title,
    content: body.content,
    sourceName: body.sourceName,
  });
  return Response.json({ knowledge: item }, { status: 201 });
}
