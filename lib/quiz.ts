import { groq, GROQ_MODEL } from "@/lib/groq";
import { QUIZ_PROMPT } from "@/lib/prompts";

export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
};

type QuizPayload = {
  questions: QuizQuestion[];
};

function normalizeQuizPayload(payload: QuizPayload) {
  return payload.questions.slice(0, 5).map((question) => ({
    question: String(question.question || "").trim(),
    options: Array.isArray(question.options)
      ? question.options.slice(0, 4).map((option) => String(option).trim())
      : [],
    correctAnswerIndex: Number(question.correctAnswerIndex),
    explanation: String(question.explanation || "").trim()
  }));
}

export async function generateQuizFromSop(sopContent: string): Promise<QuizQuestion[]> {
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    response_format: {
      type: "json_object"
    },
    messages: [
      {
        role: "system",
        content: `${QUIZ_PROMPT}

Return valid JSON only. Do not include markdown or extra commentary.`
      },
      {
        role: "user",
        content: `Create exactly 5 multiple-choice questions from this SOP.

Return JSON in this exact shape:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswerIndex": 0,
      "explanation": "string"
    }
  ]
}

Rules:
- Provide exactly 5 questions
- Provide exactly 4 options per question
- correctAnswerIndex must be 0, 1, 2, or 3
- Keep explanations short and simple

SOP:
${sopContent}`
      }
    ]
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content) as QuizPayload;
  const questions = normalizeQuizPayload(parsed).filter(
    (question) =>
      question.question &&
      question.options.length === 4 &&
      question.correctAnswerIndex >= 0 &&
      question.correctAnswerIndex <= 3 &&
      question.explanation
  );

  if (questions.length !== 5) {
    throw new Error("Quiz generation returned an invalid response. Please try again.");
  }

  return questions;
}
