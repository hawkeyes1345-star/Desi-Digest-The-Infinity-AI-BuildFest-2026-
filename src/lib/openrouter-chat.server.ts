import { getOpenRouterApiKey } from "@/lib/env.server";
import { z } from "zod";

export async function generateOpenRouterText(system: string, user: string): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  const modelName = process.env.OPENROUTER_CHAT_MODEL || "google/gemini-2.5-flash";

  console.info(`[openrouter-chat] calling OpenRouter API text with model ${modelName}...`);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://project-rae6k.vercel.app",
      "X-OpenRouter-Title": "Desi Digest",
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API HTTP error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter API returned an empty completion content.");
  }

  return content;
}

export async function generateOpenRouterObject<T>(
  schema: z.ZodSchema<T>,
  system: string,
  user: string
): Promise<T> {
  const apiKey = getOpenRouterApiKey();
  const modelName = process.env.OPENROUTER_CHAT_MODEL || "google/gemini-2.5-flash";

  console.info(`[openrouter-chat] calling OpenRouter API object with model ${modelName}...`);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://project-rae6k.vercel.app",
      "X-OpenRouter-Title": "Desi Digest",
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API HTTP error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter API returned an empty completion content.");
  }

  let cleanContent = content.trim();
  if (cleanContent.startsWith("\`\`\`")) {
    cleanContent = cleanContent
      .replace(/^\`\`\`json\s*/i, "")
      .replace(/\`\`\`$/, "")
      .trim();
  }

  const parsed = JSON.parse(cleanContent);
  return schema.parse(parsed);
}
