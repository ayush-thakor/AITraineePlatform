"use client";

import { useEffect, useState } from "react";
import { parseJsonResponse } from "@/utils/api";

type ModuleItem = {
  _id: string;
  title: string;
};

type SupportResponse = {
  answer: string;
  escalated: boolean;
};

export function SupportChat() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [moduleId, setModuleId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isEscalated, setIsEscalated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadModules() {
      try {
        const data = await parseJsonResponse<{ modules: ModuleItem[] }>(await fetch("/api/modules"));
        setModules(data.modules);
        if (data.modules[0]) {
          setModuleId(data.modules[0]._id);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load modules.");
      } finally {
        setIsLoading(false);
      }
    }

    loadModules();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setError("");

    try {
      const data = await parseJsonResponse<SupportResponse>(
        await fetch("/api/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId,
            question
          })
        })
      );

      setAnswer(data.answer);
      setIsEscalated(data.escalated);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not resolve query.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Support request</h2>
        <p className="mt-1 text-sm text-slate-600">Operational questions are answered from the SOP only.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Module</label>
            <select
              value={moduleId}
              onChange={(event) => setModuleId(event.target.value)}
              disabled={isLoading || modules.length === 0}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
            >
              {modules.map((module) => (
                <option key={module._id} value={module._id}>
                  {module.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Question</label>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={6}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
              placeholder="Ask an operational question..."
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSending || !moduleId}
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSending ? "Checking..." : "Resolve question"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Response</h2>
        <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          {answer || "Your SOP-based answer will appear here."}
        </div>
        {isEscalated ? (
          <p className="mt-3 text-sm font-medium text-amber-700">This one needs supervisor escalation.</p>
        ) : null}
      </section>
    </div>
  );
}
