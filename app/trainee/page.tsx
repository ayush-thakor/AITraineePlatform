import { ModuleList } from "@/components/ModuleList";
import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/auth";
import { getTraineeForUser, listModules } from "@/lib/dataStore";

type TraineeScore = {
  moduleId: string;
  score: number;
  passed: boolean;
  attemptedAt?: string | Date;
};

type TraineeRecord = {
  scores?: TraineeScore[];
  completedModules?: string[];
};

export const dynamic = "force-dynamic";

export default async function TraineeDashboardPage() {
  const user = await requireRole(["trainee"]);

  const [modules, trainee] = await Promise.all([listModules(), getTraineeForUser(user)]);

  const progressByModule: Record<
    string,
    { score: number; passed: boolean; attemptedAt?: string; attempts: number }
  > = {};

  for (const score of trainee?.scores ?? []) {
    const moduleId = String(score.moduleId);
    const previous = progressByModule[moduleId];

    progressByModule[moduleId] = {
      score: score.score,
      passed: score.passed,
      attemptedAt: score.attemptedAt ? new Date(score.attemptedAt).toISOString() : undefined,
      attempts: (previous?.attempts ?? 0) + 1
    };
  }

  const totalAttempts = Object.values(progressByModule).reduce((sum, item) => sum + item.attempts, 0);
  const passedModules = Object.values(progressByModule).filter((item) => item.passed).length;
  const latestScores = Object.values(progressByModule);
  const averageScore = latestScores.length
    ? Math.round(latestScores.reduce((sum, item) => sum + item.score, 0) / latestScores.length)
    : 0;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name}`}
        description="Open a module to chat with the SOP trainer, take quizzes, and track your own progress."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Quiz attempts</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalAttempts}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Passed modules</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{passedModules}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Average latest score</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{averageScore}%</p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Available modules</h2>
      </div>
      <ModuleList
        modules={modules}
        progressByModule={progressByModule}
      />
    </div>
  );
}
