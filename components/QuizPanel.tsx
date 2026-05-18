"use client";

import { useEffect, useState } from "react";
import { parseJsonResponse } from "@/utils/api";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
};

type QuizData = {
  quiz: {
    questions: QuizQuestion[];
  };
};

type QuizResult = {
  score: number;
  passed: boolean;
  results: Array<{
    question: string;
    selectedAnswerIndex: number;
    correctAnswerIndex: number;
    isCorrect: boolean;
    explanation: string;
  }>;
};

type QuizPanelProps = {
  moduleId: string;
  moduleTitle: string;
};

export function QuizPanel({ moduleId, moduleTitle }: QuizPanelProps) {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuiz() {
      try {
        const data = await parseJsonResponse<QuizData>(await fetch(`/api/quizzes/${moduleId}`));
        setQuiz(data.quiz.questions);
        setAnswers(new Array(data.quiz.questions.length).fill(-1));
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Could not load quiz.";

        if (message !== "Quiz not found.") {
          setError(message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadQuiz();
  }, [moduleId]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");

    try {
      const data = await parseJsonResponse<QuizData>(
        await fetch(`/api/modules/${moduleId}/quiz`, {
          method: "POST"
        })
      );

      setQuiz(data.quiz.questions);
      setAnswers(new Array(data.quiz.questions.length).fill(-1));
      setResult(null);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Could not generate quiz.");
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setError("");

    try {
      const data = await parseJsonResponse<QuizResult>(
        await fetch(`/api/quizzes/${moduleId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers,
            traineeName: "Guest Trainee"
          })
        })
      );

      setResult(data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit quiz.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{moduleTitle} quiz</h2>
            <p className="mt-1 text-sm text-slate-600">Five practical MCQs generated from the saved SOP.</p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isGenerating ? "Generating..." : quiz.length ? "Regenerate quiz" : "Generate quiz"}
          </button>
        </div>
      </div>

      {isLoading ? <div className="text-sm text-slate-600">Loading quiz...</div> : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {quiz.length > 0 ? (
        <div className="space-y-4">
          {quiz.map((item, index) => (
            <div key={`${item.question}-${index}`} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-900">
                {index + 1}. {item.question}
              </p>
              <div className="mt-4 grid gap-3">
                {item.options.map((option, optionIndex) => (
                  <label
                    key={`${option}-${optionIndex}`}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-400"
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      checked={answers[index] === optionIndex}
                      onChange={() => {
                        const nextAnswers = [...answers];
                        nextAnswers[index] = optionIndex;
                        setAnswers(nextAnswers);
                      }}
                      className="mt-0.5"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || answers.includes(-1)}
            className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isSubmitting ? "Scoring..." : "Submit quiz"}
          </button>
        </div>
      ) : !isLoading ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
          No quiz found yet. Generate one from the module SOP.
        </div>
      ) : null}

      {result ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Score: {result.score}% ({result.passed ? "Pass" : "Fail"})
          </h3>
          <p className="mt-1 text-sm text-slate-600">Passing mark is 70%.</p>
          <div className="mt-5 space-y-4">
            {result.results
              .filter((item) => !item.isCorrect)
              .map((item, index) => (
                <div key={`${item.question}-${index}`} className="rounded-md bg-rose-50 p-4 text-sm">
                  <p className="font-medium text-rose-900">{item.question}</p>
                  <p className="mt-2 text-rose-700">Explanation: {item.explanation}</p>
                </div>
              ))}
            {result.results.every((item) => item.isCorrect) ? (
              <p className="text-sm text-emerald-700">Great job. All answers were correct.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
