"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseJsonResponse } from "@/utils/api";

export function ModuleForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sopContent, setSopContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = await parseJsonResponse<{ module: { _id: string } }>(
        await fetch("/api/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, sopContent })
        })
      );

      router.push(`/training/${data.module._id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save module.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Module title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          placeholder="Customer onboarding"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          placeholder="High-level purpose of this SOP"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">SOP content</label>
        <textarea
          value={sopContent}
          onChange={(event) => setSopContent(event.target.value)}
          required
          rows={16}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          placeholder="Paste the SOP text here..."
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Saving module..." : "Save module"}
      </button>
    </form>
  );
}
