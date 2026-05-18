import { NextResponse } from "next/server";
import { saveModuleChunks } from "@/lib/embeddings";
import { connectToDatabase } from "@/lib/mongodb";
import { TrainingModule } from "@/models/TrainingModule";

export async function GET() {
  await connectToDatabase();

  const modules = await TrainingModule.find({}, { title: 1, description: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ modules });
}

export async function POST(request: Request) {
  try {
    const { title, description, sopContent } = await request.json();

    if (!title || !sopContent) {
      return NextResponse.json(
        { error: "Title and SOP content are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const module = await TrainingModule.create({
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
