import { PageHeader } from "@/components/PageHeader";
import { QuizPanel } from "@/components/QuizPanel";
import { connectToDatabase } from "@/lib/mongodb";
import { TrainingModule } from "@/models/TrainingModule";
import { notFound } from "next/navigation";

type QuizPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params;

  await connectToDatabase();

  const module = (await TrainingModule.findById(id).lean()) as
    | { _id: string; title: string; description?: string; sopContent: string }
    | null;

  if (!module) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="Quiz"
        description="Generate a lightweight MCQ test from the saved SOP and score it with deterministic pass/fail rules."
      />
      <QuizPanel moduleId={String(module._id)} moduleTitle={module.title} />
    </div>
  );
}
