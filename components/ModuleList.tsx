import Link from "next/link";

type ModuleItem = {
  _id: string;
  title: string;
  description?: string;
  createdAt: string | Date;
};

type ModuleProgress = {
  score: number;
  passed: boolean;
  attemptedAt?: string;
  attempts: number;
};

type ModuleListProps = {
  modules: ModuleItem[];
  canTrain?: boolean;
  canTakeQuiz?: boolean;
  progressByModule?: Record<string, ModuleProgress>;
};

export function ModuleList({
  modules,
  canTrain = true,
  canTakeQuiz = true,
  progressByModule
}: ModuleListProps) {
  if (modules.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
        No modules yet. Create one to start training and quiz generation.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {modules.map((module) => {
        const progress = progressByModule?.[module._id];

        return (
          <div key={module._id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{module.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{module.description || "No description provided."}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Created {new Date(module.createdAt).toLocaleDateString()}</span>
                  {progress ? (
                    <span className={progress.passed ? "text-emerald-700" : "text-amber-700"}>
                      Latest quiz {progress.score}% {progress.passed ? "pass" : "needs retry"} across{" "}
                      {progress.attempts} {progress.attempts === 1 ? "attempt" : "attempts"}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {canTrain ? (
                  <Link
                    href={`/training/${module._id}`}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                  >
                    Training
                  </Link>
                ) : null}
                {canTakeQuiz ? (
                  <Link
                    href={`/quiz/${module._id}`}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    Quiz
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
