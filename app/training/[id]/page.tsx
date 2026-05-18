import { PageHeader } from "@/components/PageHeader";
import { TrainingChat } from "@/components/TrainingChat";
import { requireCurrentUser } from "@/lib/auth";
import { getModuleById } from "@/lib/dataStore";
import { notFound } from "next/navigation";

type TrainingPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function TrainingPage({ params }: TrainingPageProps) {
  await requireCurrentUser();

  const { id } = await params;

  const module = await getModuleById(id);

  if (!module) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={module.title}
        description={module.description || "Ask SOP-based questions and get guided training answers."}
      />
      <TrainingChat
        moduleId={String(module._id)}
        moduleTitle={module.title}
        sopPreview={`${module.sopContent.slice(0, 1200)}${module.sopContent.length > 1200 ? "..." : ""}`}
      />
    </div>
  );
}
