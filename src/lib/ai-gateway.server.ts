import { createGoogleGenerativeAI } from "@ai-sdk/google";

const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
export const GEMINI_EMBEDDING_DIMS = 1536;

export function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  return apiKey;
}

export function createGeminiProvider() {
  return createGoogleGenerativeAI({ apiKey: getGeminiApiKey() });
}

export function createGeminiEmbeddingModel() {
  return createGeminiProvider().embedding(GEMINI_EMBEDDING_MODEL);
}
