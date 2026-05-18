import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import {
  DEMO_USERS,
  getRoleHome,
  getUserById,
  type AuthUser,
  type UserRole
} from "@/lib/users";

const AUTH_COOKIE_NAME = "ai-trainee-session";
const SESSION_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  userId: string;
  role: UserRole;
  expiresAt: number;
};

type ApiAuthResult =
  | { user: AuthUser; response: null }
  | { user: AuthUser | null; response: NextResponse };

function getAuthSecret() {
  return process.env.AUTH_SECRET || "local-ai-trainee-platform-dev-secret";
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeSession(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

  return `${body}.${sign(body)}`;
}

function decodeSession(value?: string): SessionPayload | null {
  if (!value) {
    return null;
  }

  const [body, signature] = value.split(".");

  if (!body || !signature || !signaturesMatch(signature, sign(body))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;

    if (!payload.userId || !payload.role || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function authenticateUser(email: string, password: string): AuthUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  const user = DEMO_USERS.find(
    (item) => item.email.toLowerCase() === normalizedEmail && item.password === password
  );

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const payload = decodeSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!payload) {
    return null;
  }

  const user = getUserById(payload.userId);

  if (!user || user.role !== payload.role) {
    return null;
  }

  return user;
}

export async function setAuthSession(user: AuthUser) {
  const cookieStore = await cookies();

  cookieStore.set(
    AUTH_COOKIE_NAME,
    encodeSession({
      userId: user.id,
      role: user.role,
      expiresAt: Date.now() + SESSION_SECONDS * 1000
    }),
    {
      httpOnly: true,
      maxAge: SESSION_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    }
  );
}

export async function clearAuthSession() {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: readonly UserRole[]) {
  const user = await requireCurrentUser();

  if (!roles.includes(user.role)) {
    redirect(getRoleHome(user.role));
  }

  return user;
}

export async function requireApiUser(roles?: readonly UserRole[]): Promise<ApiAuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Please sign in to continue." }, { status: 401 })
    };
  }

  if (roles && !roles.includes(user.role)) {
    return {
      user,
      response: NextResponse.json({ error: "You do not have access to this action." }, { status: 403 })
    };
  }

  return { user, response: null };
}
