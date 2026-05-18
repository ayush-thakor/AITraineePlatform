import Link from "next/link";

type ModuleItem = {
  _id: string;
  title: string;
  description?: string;
  createdAt: string;
};

type ModuleListProps = {
  modules: ModuleItem[];
};

export function ModuleList({ modules }: ModuleListProps) {
  if (modules.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
        No modules yet. Create one to start training and quiz generation.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {modules.map((module) => (
        <div key={module._id} className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{module.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{module.description || "No description provided."}</p>
              <p className="mt-3 text-xs text-slate-500">
                Created {new Date(module.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/training/${module._id}`}
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Training
              </Link>
              <Link
                href={`/quiz/${module._id}`}
                className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Quiz
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
