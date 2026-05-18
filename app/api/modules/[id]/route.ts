import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getModuleById } from "@/lib/dataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireApiUser();

  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;
  const module = await getModuleById(id);

  if (!module) {
    return NextResponse.json({ error: "Module not found." }, { status: 404 });
  }

  return NextResponse.json({ module });
}
