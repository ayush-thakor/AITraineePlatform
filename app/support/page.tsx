import { PageHeader } from "@/components/PageHeader";
import { SupportChat } from "@/components/SupportChat";
import { requireCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  await requireCurrentUser();

  return (
    <div>
      <PageHeader
        title="Support"
        description="Ask operational questions against existing SOPs. Low-confidence answers are escalated."
      />
      <SupportChat />
    </div>
  );
}
