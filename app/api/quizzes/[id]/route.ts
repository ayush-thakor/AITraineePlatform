import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  await connectToDatabase();

  const { id } = await params;
  const quiz = (await Quiz.findOne({ moduleId: id }).lean()) as
    | {
        moduleId: string;
        questions: Array<{
          question: string;
          options: string[];
          correctAnswerIndex: number;
          explanation: string;
        }>;
      }
    | null;

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  return NextResponse.json({ quiz });
}
