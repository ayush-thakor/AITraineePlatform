import { PageHeader } from "@/components/PageHeader";
import { QuizPanel } from "@/components/QuizPanel";
import { requireCurrentUser } from "@/lib/auth";
import { getModuleById } from "@/lib/dataStore";
import { QUIZ_SUBMIT_ROLES, UPLOAD_ROLES } from "@/lib/users";
import { notFound } from "next/navigation";

type QuizPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: QuizPageProps) {
  const user = await requireCurrentUser();
  const { id } = await params;

  const module = await getModuleById(id);

  if (!module) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="Quiz"
        description="Generate a lightweight MCQ test from the saved SOP and score it with deterministic pass/fail rules."
      />
      <QuizPanel
        moduleId={String(module._id)}
        moduleTitle={module.title}
        currentUserName={user.name}
        canManageQuiz={UPLOAD_ROLES.includes(user.role)}
        canSubmit={QUIZ_SUBMIT_ROLES.includes(user.role)}
      />
    </div>
  );
}
