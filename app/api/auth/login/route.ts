import { NextResponse } from "next/server";
import { authenticateUser, setAuthSession } from "@/lib/auth";
import { getRoleHome } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = authenticateUser(email, password);

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await setAuthSession(user);

    return NextResponse.json({
      user,
      redirectTo: getRoleHome(user.role)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not sign in." },
      { status: 500 }
    );
  }
}
