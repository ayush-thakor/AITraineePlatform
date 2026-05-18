import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getQuizByModule } from "@/lib/dataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireApiUser();

  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;
  const quiz = await getQuizByModule(id);

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  return NextResponse.json({ quiz });
}
