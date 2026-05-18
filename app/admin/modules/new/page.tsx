import { ModuleForm } from "@/components/ModuleForm";
import { PageHeader } from "@/components/PageHeader";

export default function NewModulePage() {
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
