import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { tryConsumeGeminiQuota } from "@/lib/gemini-quota.server";

export const CHAT_MODEL_NAME = "gemini-2.5-flash-lite" as const;
type AiPhase = "chat" | "explanation";
type AiModelName = typeof CHAT_MODEL_NAME;

export function logAiModelUse(phase: AiPhase, model: AiModelName) {
  console.info("[ai] using model", { phase, model });
}

export function getGeminiApiKey() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing Gemini API key");
  }
  return apiKey;
}

export function createGeminiProvider() {
  return createGoogleGenerativeAI({ apiKey: getGeminiApiKey() });
}



export async function generateFriendlyExplanation(input: {
  userMessage: string;
  template: string;
  context?: unknown;
}): Promise<{ text: string; usedGemini: boolean; fallbackReason?: string }> {
  const quota = tryConsumeGeminiQuota();
  if (!quota.allowed) return { text: input.template, usedGemini: false, fallbackReason: quota.reason || "Gemini unavailable" };

  try {
    logAiModelUse("explanation", CHAT_MODEL_NAME);
    const result = await generateText({
      model: createGeminiProvider()(CHAT_MODEL_NAME),
      system: "You are Nanumoni, a warm Bangladeshi nutrition assistant. Rewrite the provided factual template in friendly, concise language. Do not add new nutrition facts, medicine facts, disease facts, calculations, warnings, or lookup results. Preserve source labels and fallback labels exactly when present.",
      messages: [
        {
          role: "user",
          content: "User message: " + input.userMessage + "\n\nRetrieved data/context JSON:\n" + JSON.stringify(input.context ?? {}) + "\n\nFactual template to rewrite:\n" + input.template,
        },
      ],
    });
    const text = result.text?.trim();
    if (!text) return { text: input.template, usedGemini: false, fallbackReason: "Gemini returned an empty explanation" };
    return { text: text + "\n\nAI explanation generated from retrieved data", usedGemini: true };
  } catch (error) {
    return {
      text: input.template,
      usedGemini: false,
      fallbackReason: error instanceof Error ? error.message : "Gemini explanation failed",
    };
  }
}
