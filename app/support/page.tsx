import { PageHeader } from "@/components/PageHeader";
import { SupportChat } from "@/components/SupportChat";

export default function SupportPage() {
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
