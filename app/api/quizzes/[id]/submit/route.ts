import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { Trainee } from "@/models/Trainee";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { answers, traineeName } = await request.json();

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: "Answers are required." }, { status: 400 });
    }

    await connectToDatabase();

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

    const results = quiz.questions.map((question, index) => {
      const selectedAnswerIndex = Number.isInteger(answers[index]) ? answers[index] : -1;
      const isCorrect = selectedAnswerIndex === question.correctAnswerIndex;

      return {
        question: question.question,
        selectedAnswerIndex,
        correctAnswerIndex: question.correctAnswerIndex,
        isCorrect,
        explanation: question.explanation
      };
    });

    // Pass/fail stays deterministic in app code, not in the model output.
    const correctCount = results.filter((item) => item.isCorrect).length;
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= 70;
    const safeTraineeName =
      typeof traineeName === "string" && traineeName.trim() ? traineeName.trim() : "Guest Trainee";

    const trainee = await Trainee.findOneAndUpdate(
      { name: safeTraineeName },
      {
        $setOnInsert: { name: safeTraineeName },
        $addToSet: { completedModules: id },
        $push: {
          scores: {
            moduleId: id,
            score,
            passed
          }
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      traineeId: trainee.id,
      score,
      passed,
      results
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not score quiz." },
      { status: 500 }
    );
  }
}
