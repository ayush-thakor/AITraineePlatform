import { NextResponse } from "next/server";
import { listTrainees } from "@/lib/dataStore";

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

export async function GET(request: Request, _context: RouteContext) {
  try {
    const apiKey = getApiKeyFromRequest(request);

    if (!apiKey || apiKey !== process.env.FLOWISE_PROXY_KEY) {
      return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
    }

    const trainees = await listTrainees();

    return NextResponse.json(trainees);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
