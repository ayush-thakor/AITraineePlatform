import { ModuleList } from "@/components/ModuleList";
import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/auth";
import { listModules } from "@/lib/dataStore";
import { UPLOAD_ROLES } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function AdminModulesPage() {
  await requireRole(UPLOAD_ROLES);

  const modules = await listModules();

  return (
    <div>
      <PageHeader
        title="Training Modules"
        description="Upload SOP content, prepare module training, and generate quizzes from the same source material."
        action={{ href: "/admin/modules/new", label: "New module" }}
      />
      <ModuleList modules={modules} />
    </div>
  );
}
