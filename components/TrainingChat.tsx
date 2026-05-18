"use client";

import { useState } from "react";
import { parseJsonResponse } from "@/utils/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type TrainingChatProps = {
  moduleId: string;
  moduleTitle: string;
  sopPreview: string;
};

export function TrainingChat({ moduleId, moduleTitle, sopPreview }: TrainingChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Welcome to ${moduleTitle}. Ask anything about this SOP and I will teach from the saved process only.`
    }
  ]);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!question.trim()) {
      return;
    }

    const previousMessages = messages;
    const userMessage = { role: "user" as const, content: question.trim() };
    const nextMessages = [...previousMessages, userMessage];

    setMessages(nextMessages);
    setQuestion("");
    setError("");
    setIsSending(true);

    try {
      const data = await parseJsonResponse<{ answer: string }>(
        await fetch(`/api/modules/${moduleId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: userMessage.content })
        })
      );

      setMessages([...nextMessages, { role: "assistant", content: data.answer }]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not get a response.");
      setMessages(previousMessages);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Training chat</h2>
          <p className="mt-1 text-sm text-slate-600">Answers stay grounded in the SOP for this module.</p>
        </div>

        <div className="space-y-4 px-5 py-5">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-3xl rounded-md px-4 py-3 text-sm ${
                message.role === "assistant"
                  ? "bg-slate-100 text-slate-800"
                  : "ml-auto bg-slate-900 text-white"
              }`}
            >
              {message.content}
            </div>
          ))}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
              placeholder="Ask a question about this SOP..."
            />
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSending ? "Thinking..." : "Send question"}
            </button>
          </form>
        </div>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">SOP preview</h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{sopPreview}</p>
      </aside>
    </div>
  );
}
