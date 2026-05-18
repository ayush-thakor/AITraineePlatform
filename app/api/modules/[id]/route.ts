import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TrainingModule } from "@/models/TrainingModule";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  await connectToDatabase();

  const { id } = await params;
  const module = (await TrainingModule.findById(id).lean()) as
    | { _id: string; title: string; description?: string; sopContent: string }
    | null;

  if (!module) {
    return NextResponse.json({ error: "Module not found." }, { status: 404 });
  }

  return NextResponse.json({ module });
}
