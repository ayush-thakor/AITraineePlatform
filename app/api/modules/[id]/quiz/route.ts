import { NextResponse } from "next/server";
import { isGroqConfigured } from "@/lib/groq";
import { requireApiUser } from "@/lib/auth";
import { getModuleById, upsertQuiz } from "@/lib/dataStore";
import { generateQuizFromSop } from "@/lib/quiz";
import { UPLOAD_ROLES } from "@/lib/users";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const auth = await requireApiUser(UPLOAD_ROLES);

    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;

    if (!isGroqConfigured) {
      return NextResponse.json(
        { error: "Set GROQ_API_KEY before generating quizzes." },
        { status: 400 }
      );
    }

    const module = await getModuleById(id);

    if (!module) {
      return NextResponse.json({ error: "Module not found." }, { status: 404 });
    }

    const questions = await generateQuizFromSop(module.sopContent);

    const quiz = await upsertQuiz(id, questions);

    return NextResponse.json({ quiz });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not generate quiz." },
      { status: 500 }
    );
  }
}
