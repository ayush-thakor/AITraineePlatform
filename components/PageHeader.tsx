import Link from "next/link";

type Action = {
  href: string;
  label: string;
};

type PageHeaderProps = {
  title: string;
  description: string;
  action?: Action;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
