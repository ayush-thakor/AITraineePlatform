import { NextResponse } from "next/server";
import { createUser } from "@/lib/userStore";
import { setAuthSession } from "@/lib/auth";
import { getRoleHome, type UserRole } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const requestedRole = typeof role === "string" ? (role as UserRole) : "trainee";

    const user = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: requestedRole
    });

    await setAuthSession(user);

    return NextResponse.json({ redirectTo: getRoleHome(user.role) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not register user." },
      { status: 500 }
    );
  }
}
