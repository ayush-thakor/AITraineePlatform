import { ModuleForm } from "@/components/ModuleForm";
import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/auth";
import { UPLOAD_ROLES } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function NewModulePage() {
  await requireRole(UPLOAD_ROLES);

  return (
    <div>
      <PageHeader
        title="Create Module"
        description="Paste the SOP text, save it, and the platform will chunk and embed it for training and support."
      />
      <ModuleForm />
    </div>
  );
}
