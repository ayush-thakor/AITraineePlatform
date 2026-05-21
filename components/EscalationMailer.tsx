"use client";

import { useState } from "react";

export default function EscalationMailer() {
  const [deadline, setDeadline] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().slice(0, 10);
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/manager/escalation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ deadline })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not send escalation email.");
      }

      setStatus(
        `Escalation email prepared for ${result.recipient}. ${result.overdueCount} overdue trainee(s), ${result.scoresAfterDeadlineCount} score updates after deadline.`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Send deadline escalation</h2>
          <p className="text-sm text-slate-500">
            Create a manager escalation email for trainees who did not complete their training by the selected deadline.
          </p>
        </div>
      </div>

      <form onSubmit={handleSend} className="grid gap-4 sm:grid-cols-[auto,1fr,auto] items-end">
        <div>
          <label htmlFor="deadline-date" className="mb-2 block text-sm font-medium text-slate-700">
            Deadline date
          </label>
          <input
            id="deadline-date"
            type="date"
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </div>
        <div className="sm:col-span-1">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Preparing email..." : "Send escalation"}
          </button>
        </div>
      </form>

      {status ? (
        <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {status}
        </p>
      ) : null}
    </section>
  );
}
