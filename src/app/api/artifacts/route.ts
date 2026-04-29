import { createArtifact, listArtifacts } from "@/server/repositories";
import type { ArtifactType } from "@/server/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const artifacts = await listArtifacts();

  if (!id) {
    return Response.json({ artifacts });
  }

  const artifact = artifacts.find((item) => item.id === id);
  if (!artifact) {
    return Response.json({ error: "Artifact not found" }, { status: 404 });
  }

  if (searchParams.get("raw") === "1") {
    return new Response(artifact.content, {
      headers: {
        "content-type": `${artifact.mimeType}; charset=utf-8`,
      },
    });
  }

  return Response.json({ artifact });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    title?: string;
    type?: ArtifactType;
    content?: string;
  };
  if (!body.title || !body.type || !body.content) {
    return Response.json(
      { error: "title, type, and content are required" },
      { status: 400 },
    );
  }
  const artifact = await createArtifact({
    title: body.title,
    type: body.type,
    content: body.content,
  });
  return Response.json({ artifact }, { status: 201 });
}
