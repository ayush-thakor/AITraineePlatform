import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/auth";
import { listModules, listTrainees } from "@/lib/dataStore";
import { MANAGER_ROLES } from "@/lib/users";

type ScoreRecord = {
  moduleId: string;
  score: number;
  passed: boolean;
  attemptedAt?: string | Date;
};

type TraineeRecord = {
  name: string;
  scores?: ScoreRecord[];
  completedModules?: string[];
};

type ModuleRecord = {
  _id: unknown;
  title: string;
};

export const dynamic = "force-dynamic";

export default async function ManagerProgressPage() {
  await requireRole(MANAGER_ROLES);

  const [modules, trainees] = await Promise.all([listModules(), listTrainees()]);

  const moduleTitles = new Map<string, string>();

  for (const module of modules) {
    moduleTitles.set(String(module._id), module.title);
  }

  const attempts = trainees
    .flatMap((trainee) =>
      (trainee.scores ?? []).map((score) => ({
        traineeName: trainee.name,
        moduleId: String(score.moduleId),
        moduleTitle: moduleTitles.get(String(score.moduleId)) ?? "Deleted module",
        score: score.score,
        passed: score.passed,
        attemptedAt: score.attemptedAt ? new Date(score.attemptedAt) : null
      }))
    )
    .sort((left, right) => (right.attemptedAt?.getTime() ?? 0) - (left.attemptedAt?.getTime() ?? 0));

  const activeTrainees = trainees.filter((trainee) => (trainee.scores ?? []).length > 0).length;
  const averageScore = attempts.length
    ? Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length)
    : 0;
  const passRate = attempts.length
    ? Math.round((attempts.filter((item) => item.passed).length / attempts.length) * 100)
    : 0;

  const traineeSummaries = trainees.map((trainee) => {
    const scores = trainee.scores ?? [];
    const latest = scores[scores.length - 1];

    return {
      name: trainee.name,
      attempts: scores.length,
      completedModules: trainee.completedModules?.length ?? 0,
      latest: latest
        ? {
            moduleTitle: moduleTitles.get(String(latest.moduleId)) ?? "Deleted module",
            score: latest.score,
            passed: latest.passed
          }
        : null
    };
  });

  return (
    <div>
      <PageHeader
        title="Trainee Progress"
        description="Review quiz attempts, pass rates, and module completion across trainee accounts."
        action={{ href: "/admin/modules/new", label: "Upload content" }}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active trainees</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{activeTrainees}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Quiz attempts</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{attempts.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Average score</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{averageScore}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pass rate</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{passRate}%</p>
        </div>
      </div>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Trainees</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Completed modules</th>
                <th className="px-5 py-3 font-medium">Attempts</th>
                <th className="px-5 py-3 font-medium">Latest result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {traineeSummaries.length ? (
                traineeSummaries.map((trainee) => (
                  <tr key={trainee.name}>
                    <td className="px-5 py-4 font-medium text-slate-900">{trainee.name}</td>
                    <td className="px-5 py-4 text-slate-600">{trainee.completedModules}</td>
                    <td className="px-5 py-4 text-slate-600">{trainee.attempts}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {trainee.latest ? (
                        <span className={trainee.latest.passed ? "text-emerald-700" : "text-amber-700"}>
                          {trainee.latest.moduleTitle}: {trainee.latest.score}%{" "}
                          {trainee.latest.passed ? "pass" : "needs retry"}
                        </span>
                      ) : (
                        "No attempts yet"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-6 text-slate-600" colSpan={4}>
                    No trainee progress has been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Recent quiz attempts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Trainee</th>
                <th className="px-5 py-3 font-medium">Module</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Attempted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attempts.length ? (
                attempts.map((attempt, index) => (
                  <tr key={`${attempt.traineeName}-${attempt.moduleId}-${index}`}>
                    <td className="px-5 py-4 font-medium text-slate-900">{attempt.traineeName}</td>
                    <td className="px-5 py-4 text-slate-600">{attempt.moduleTitle}</td>
                    <td className="px-5 py-4 text-slate-600">{attempt.score}%</td>
                    <td className="px-5 py-4">
                      <span className={attempt.passed ? "text-emerald-700" : "text-amber-700"}>
                        {attempt.passed ? "Pass" : "Needs retry"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {attempt.attemptedAt ? attempt.attemptedAt.toLocaleString() : "Previous attempt"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-6 text-slate-600" colSpan={5}>
                    Recent quiz results will appear after trainees submit quizzes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
