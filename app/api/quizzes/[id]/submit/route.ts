import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getQuizByModule, recordQuizAttempt } from "@/lib/dataStore";
import { QUIZ_SUBMIT_ROLES } from "@/lib/users";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireApiUser(QUIZ_SUBMIT_ROLES);

    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const { answers } = await request.json();

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: "Answers are required." }, { status: 400 });
    }

    const quiz = await getQuizByModule(id);

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

    const traineeId = await recordQuizAttempt(auth.user, id, score, passed);

    return NextResponse.json({
      traineeId,
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
