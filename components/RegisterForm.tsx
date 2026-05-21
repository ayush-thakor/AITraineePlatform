"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseJsonResponse } from "@/utils/api";
import { ROLE_LABELS, type UserRole } from "@/lib/users";

type RegisterResponse = {
  redirectTo: string;
};

const roleOptions: UserRole[] = ["trainee", "content-uploader", "manager"];

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("trainee");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = await parseJsonResponse<RegisterResponse>(
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role })
        })
      );

      router.push(data.redirectTo);
      router.refresh();
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Could not register.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Create a new account</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Register</h1>
        <p className="mt-2 text-sm text-slate-600">
          Register with a real email address and password to access the training portal as a trainee, content uploader, or manager.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label htmlFor="register-role" className="mb-2 block text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="register-role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Registering..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account? <Link href="/login" className="font-semibold text-slate-900">Sign in</Link>.
      </p>
    </div>
  );
}
