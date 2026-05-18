import { groq, GROQ_EMBEDDING_MODEL, GROQ_USE_EMBEDDINGS } from "@/lib/groq";
import { SopChunk } from "@/models/SopChunk";
import { chunkText } from "@/utils/chunkText";
import { cosineSimilarity } from "@/utils/cosineSimilarity";
import { lexicalScore } from "@/utils/lexicalScore";

type RankedChunk = {
  moduleId: string;
  text: string;
  embedding: number[];
  score: number;
};

export async function createEmbedding(text: string) {
  if (!GROQ_EMBEDDING_MODEL) {
    throw new Error("No embedding model configured.");
  }

  const response = await groq.embeddings.create({
    model: GROQ_EMBEDDING_MODEL,
    input: text
  });

  return response.data[0].embedding;
}

export async function saveModuleChunks(moduleId: string, sopContent: string) {
  const chunks = chunkText(sopContent);

  await SopChunk.deleteMany({ moduleId });

  if (chunks.length === 0) {
    return [];
  }

  const embeddings = GROQ_USE_EMBEDDINGS
    ? await Promise.all(chunks.map((chunk) => createEmbedding(chunk)))
    : chunks.map(() => []);

  const records = chunks.map((text, index) => ({
    moduleId,
    text,
    embedding: embeddings[index]
  }));

  await SopChunk.insertMany(records);
  return records;
}

export async function searchRelevantChunks(moduleId: string, question: string, limit = 4) {
  const chunks = (await SopChunk.find({ moduleId }).lean()) as unknown as Array<{
    moduleId: string;
    text: string;
    embedding: number[];
  }>;

  if (!GROQ_USE_EMBEDDINGS || !GROQ_EMBEDDING_MODEL) {
    return chunks
      .map((chunk) => ({
        ...chunk,
        score: lexicalScore(question, chunk.text)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit) as RankedChunk[];
  }

  const queryEmbedding = await createEmbedding(question);

  // Keep retrieval simple for the first version: rank stored chunks in memory.
  return chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit) as RankedChunk[];
}
