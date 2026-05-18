import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { isGroqConfigured } from "@/lib/groq";
import { generateQuizFromSop } from "@/lib/quiz";
import { Quiz } from "@/models/Quiz";
import { TrainingModule } from "@/models/TrainingModule";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!isGroqConfigured) {
      return NextResponse.json(
        { error: "Set GROQ_API_KEY before generating quizzes." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const module = (await TrainingModule.findById(id).lean()) as
      | { _id: string; title: string; description?: string; sopContent: string }
      | null;

    if (!module) {
      return NextResponse.json({ error: "Module not found." }, { status: 404 });
    }

    const questions = await generateQuizFromSop(module.sopContent);

    const quiz = await Quiz.findOneAndUpdate(
      { moduleId: id },
      { moduleId: id, questions },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({ quiz });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not generate quiz." },
      { status: 500 }
    );
  }
}
