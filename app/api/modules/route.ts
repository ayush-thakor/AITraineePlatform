import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { createTrainingModule, listModules } from "@/lib/dataStore";
import { saveModuleChunks } from "@/lib/embeddings";
import { UPLOAD_ROLES } from "@/lib/users";

export async function GET() {
  const auth = await requireApiUser();

  if (auth.response) {
    return auth.response;
  }

  const modules = await listModules();

  return NextResponse.json({ modules });
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser(UPLOAD_ROLES);

    if (auth.response) {
      return auth.response;
    }

    const { title, description, sopContent } = await request.json();

    if (!title || !sopContent) {
      return NextResponse.json(
        { error: "Title and SOP content are required." },
        { status: 400 }
      );
    }

    const module = await createTrainingModule({
      title,
      description,
      sopContent
    });

    await saveModuleChunks(String(module._id), sopContent);

    return NextResponse.json({ module }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create module." },
      { status: 500 }
    );
  }
}
