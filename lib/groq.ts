import OpenAI from "openai";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";

export const groq = new OpenAI({
  apiKey: GROQ_API_KEY || "missing-api-key",
  baseURL: GROQ_BASE_URL
});

export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
export const GROQ_EMBEDDING_MODEL = process.env.GROQ_EMBEDDING_MODEL || "";
export const GROQ_USE_EMBEDDINGS =
  (process.env.GROQ_USE_EMBEDDINGS || "false") === "true";
export const isGroqConfigured = Boolean(GROQ_API_KEY);
