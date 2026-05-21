import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { MANAGER_ROLES } from "@/lib/users";
import { sendEscalationEmail } from "@/lib/notification";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export async function POST(request: Request, _context: RouteContext) {
  try {
    const auth = await requireApiUser(MANAGER_ROLES);

    if (auth.response) {
      return auth.response;
    }

    const payload = await request.json();
    const deadlineInput = typeof payload.deadline === "string" ? payload.deadline : undefined;

    if (!deadlineInput) {
      return NextResponse.json({ error: "Deadline date is required." }, { status: 400 });
    }

    const deadline = new Date(deadlineInput);

    if (Number.isNaN(deadline.getTime())) {
      return NextResponse.json({ error: "Invalid deadline date." }, { status: 400 });
    }

    const email = await sendEscalationEmail(deadline);
    const deliveryStatus = email.delivery?.status ?? "logged";

    return NextResponse.json({
      message: deliveryStatus === "sent"
        ? "Escalation email has been sent."
        : "Escalation email has been prepared, but SMTP is not configured so it was logged instead of sent.",
      recipient: email.delivery?.recipient ?? email.recipient,
      subject: email.subject,
      overdueCount: email.overdueTrainees.length,
      scoresAfterDeadlineCount: email.scoresAfterDeadline.length,
      deliveryStatus,
      deliveryMessage: email.delivery?.message,
      bodyPreview: email.body.slice(0, 200) + (email.body.length > 200 ? "..." : "")
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not build escalation email." },
      { status: 500 }
    );
  }
}
