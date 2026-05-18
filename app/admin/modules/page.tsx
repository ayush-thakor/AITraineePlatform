import { ModuleList } from "@/components/ModuleList";
import { PageHeader } from "@/components/PageHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { TrainingModule } from "@/models/TrainingModule";

export const dynamic = "force-dynamic";

export default async function AdminModulesPage() {
  await connectToDatabase();

  const modules = await TrainingModule.find({}, { title: 1, description: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div>
      <PageHeader
        title="Training Modules"
        description="Create SOP-driven modules, then launch training chats and quizzes from the same source content."
        action={{ href: "/admin/modules/new", label: "New module" }}
      />
      <ModuleList modules={JSON.parse(JSON.stringify(modules))} />
    </div>
  );
}
