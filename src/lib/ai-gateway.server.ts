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



export async function generateChatResponse(input: {
  userMessage: string;
  template: string;
  context?: unknown;
  userProfile?: unknown;
}): Promise<{ text: string; usedGemini: boolean; fallbackReason?: string }> {
  const quota = tryConsumeGeminiQuota();
  if (!quota.allowed) return { text: input.template, usedGemini: false, fallbackReason: quota.reason || "Gemini unavailable" };

  try {
    logAiModelUse("chat", CHAT_MODEL_NAME);
    const result = await generateText({
      model: createGeminiProvider()(CHAT_MODEL_NAME),
      system: `You are Nanumoni, a warm Bangladeshi nutrition assistant for Deshi Digest.

Response style:
- Focus on the latest user message and answer it directly first.
- Match the user's language style. If the user writes Banglish, reply in natural Banglish.
- Keep replies concise, warm, practical, and culturally familiar for Bangladesh/desi food.
- "Aha, shona" or similar warmth is okay sometimes, but do not greet every time.
- Use short sections only when they help: Main answer, Why this helps, Quick nutrition / practical tip, Soft disclaimer.
- Do not over-explain, do not moralize, and do not add unrelated goals.

Profile and context rules:
- Treat profile data as quiet background context only. Never list the profile back to the user.
- Mention Ramadan, diabetes, muscle gain, weight loss, budget, beef preference, or similar profile details only when the current user message directly asks or makes it relevant.
- If factual Supabase/API context is provided, use only that data for meal/history claims.
- Do not invent logged meals or plate history.
- Do not include source labels in the answer text; the API attaches the source separately.

Safety:
- Keep advice safe and avoid medical diagnosis.
- For diabetes/heart/BP/cholesterol questions, briefly say it is general guidance, not medical advice.
- Do not claim any food prevents diabetes or cures disease. Use "diabetes-friendly" or "lower risk choice".
- Recommend a doctor or dietitian for serious medical conditions.`,
      messages: [
        {
          role: "user",
          content: `Latest user message:
${input.userMessage}

Quiet background profile context. Use only when directly relevant; never repeat it back:
${JSON.stringify(input.userProfile ?? {})}

Retrieved Supabase/API context. If empty, do not claim retrieved data exists:
${JSON.stringify(input.context ?? {})}

Template fallback if Gemini cannot answer. Preserve its facts, but do not copy source labels into your answer:
${input.template}`,
        },
      ],
    });
    const text = result.text?.trim();
    if (!text) return { text: input.template, usedGemini: false, fallbackReason: "Gemini returned an empty response" };
    return { text, usedGemini: true };
  } catch (error) {
    return {
      text: input.template,
      usedGemini: false,
      fallbackReason: error instanceof Error ? error.message : "Gemini chat failed",
    };
  }
}
