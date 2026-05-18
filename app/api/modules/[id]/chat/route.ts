import { NextResponse } from "next/server";
import { searchRelevantChunks } from "@/lib/embeddings";
import { groq, GROQ_MODEL, isGroqConfigured } from "@/lib/groq";
import { connectToDatabase } from "@/lib/mongodb";
import { TRAINING_PROMPT } from "@/lib/prompts";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { question } = await request.json();

    if (!isGroqConfigured) {
      return NextResponse.json(
        { error: "Set GROQ_API_KEY before using training chat." },
        { status: 400 }
      );
    }

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    await connectToDatabase();

    const rankedChunks = await searchRelevantChunks(id, question);
    const contextText = rankedChunks
      .map((chunk, index) => `[Context ${index + 1}] ${chunk.text}`)
      .join("\n\n");

    const response = await groq.responses.create({
      model: GROQ_MODEL,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: TRAINING_PROMPT }]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `SOP context:
${contextText || "No SOP context found."}

Trainee question:
${question}`
            }
          ]
        }
      ]
    });

    return NextResponse.json({ answer: response.output_text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not answer training question." },
      { status: 500 }
    );
  }
}
