import { NextResponse } from "next/server";
import { searchRelevantChunks } from "@/lib/embeddings";
import { groq, GROQ_MODEL, isGroqConfigured } from "@/lib/groq";
import { connectToDatabase } from "@/lib/mongodb";
import { SUPPORT_PROMPT } from "@/lib/prompts";
import { SupportQuery } from "@/models/SupportQuery";

const ESCALATION_THRESHOLD = 0.45;

export async function POST(request: Request) {
  try {
    const { moduleId, question, traineeId } = await request.json();

    if (!isGroqConfigured) {
      return NextResponse.json(
        { error: "Set GROQ_API_KEY before using support chat." },
        { status: 400 }
      );
    }

    if (!moduleId || !question) {
      return NextResponse.json(
        { error: "Module and question are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const rankedChunks = await searchRelevantChunks(moduleId, question);
    const bestScore = rankedChunks[0]?.score ?? 0;

    let answer = "Please escalate this to a supervisor.";
    let escalated = true;

    // Low-confidence retrieval is treated as an escalation path.
    if (bestScore >= ESCALATION_THRESHOLD) {
      const contextText = rankedChunks
        .map((chunk, index) => `[Context ${index + 1}] ${chunk.text}`)
        .join("\n\n");

      const response = await groq.responses.create({
        model: GROQ_MODEL,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: SUPPORT_PROMPT }]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `SOP context:
${contextText}

Question:
${question}`
              }
            ]
          }
        ]
      });

      answer = response.output_text.trim() || answer;
      escalated = false;
    }

    await SupportQuery.create({
      traineeId: traineeId || "guest",
      question,
      aiAnswer: answer,
      escalated
    });

    return NextResponse.json({ answer, escalated, confidence: bestScore });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not resolve support query." },
      { status: 500 }
    );
  }
}
