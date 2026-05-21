import { NextResponse } from "next/server";
import { sendEscalationEmail } from "@/lib/notification";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

function getApiKeyFromRequest(request: Request) {
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  return request.headers.get("x-api-key") || request.headers.get("x-flowise-key") || null;
}

export async function POST(request: Request, _context: RouteContext) {
  try {
    const apiKey = getApiKeyFromRequest(request);

    if (!apiKey || apiKey !== process.env.FLOWISE_PROXY_KEY) {
      return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
    }

    const payload = await request.json();
    const deadlineInput = typeof payload.deadline === "string" ? payload.deadline : undefined;

    if (!deadlineInput) {
      return NextResponse.json({ error: "deadline is required" }, { status: 400 });
    }

    const deadline = new Date(deadlineInput);

    if (Number.isNaN(deadline.getTime())) {
      return NextResponse.json({ error: "Invalid deadline date" }, { status: 400 });
    }

    const overrides = {
      subject: typeof payload.subject === "string" ? payload.subject : undefined,
      body: typeof payload.body === "string" ? payload.body : undefined
    } as { subject?: string; body?: string };

    const email = await sendEscalationEmail(deadline, overrides);

    return NextResponse.json({
      message: "Escalation processed via proxy",
      recipient: email.recipient,
      subject: email.subject,
      overdueCount: email.overdueTrainees.length,
      scoresAfterDeadlineCount: email.scoresAfterDeadline.length
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
