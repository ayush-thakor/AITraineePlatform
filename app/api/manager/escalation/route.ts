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

    return NextResponse.json({
      message: "Escalation email has been prepared.",
      recipient: email.recipient,
      subject: email.subject,
      overdueCount: email.overdueTrainees.length,
      scoresAfterDeadlineCount: email.scoresAfterDeadline.length,
      bodyPreview: email.body.slice(0, 200) + (email.body.length > 200 ? "..." : "")
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not build escalation email." },
      { status: 500 }
    );
  }
}
