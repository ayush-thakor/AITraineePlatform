"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_USERS, ROLE_LABELS, type UserRole } from "@/lib/users";
import { parseJsonResponse } from "@/utils/api";

type LoginResponse = {
  redirectTo: string;
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_USERS[0].email);
  const [password, setPassword] = useState(DEMO_USERS[0].password);
  const [selectedRole, setSelectedRole] = useState<UserRole>(DEMO_USERS[0].role);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function selectDemoUser(role: UserRole) {
    const user = DEMO_USERS.find((item) => item.role === role);

    if (!user) {
      return;
    }

    setSelectedRole(user.role);
    setEmail(user.email);
    setPassword(user.password);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = await parseJsonResponse<LoginResponse>(
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        })
      );

      router.push(data.redirectTo);
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Could not sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <p className="text-sm font-medium text-slate-500">AI Trainee Platform</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Choose a role to enter the right workspace for training, content upload, or management.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {DEMO_USERS.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectDemoUser(user.role)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                selectedRole === user.role
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <span className="block font-medium">{ROLE_LABELS[user.role]}</span>
              <span
                className={`mt-1 block text-xs ${
                  selectedRole === user.role ? "text-slate-200" : "text-slate-500"
                }`}
              >
                {user.description}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Demo accounts</h2>
        <div className="mt-4 space-y-4">
          {DEMO_USERS.map((user) => (
            <div key={`${user.id}-credentials`} className="rounded-md bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-900">{ROLE_LABELS[user.role]}</p>
              <p className="mt-2 text-slate-600">{user.email}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">{user.password}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
