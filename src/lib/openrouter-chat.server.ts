import { getOpenRouterApiKey, getOpenRouterTextModels } from "@/lib/env.server";
import { z } from "zod";

async function callOpenRouterApi(
  apiKey: string,
  modelName: string,
  system: string,
  user: string,
  isJson: boolean
): Promise<string> {
  if (!apiKey) {
    throw new Error("Missing OpenRouter API key. Skipping OpenRouter.");
  }

  const referer = process.env.NODE_ENV === "development" 
    ? "http://localhost:3000" 
    : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://project-rae6k.vercel.app");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "HTTP-Referer": referer,
    "X-Title": "Desi Digest",
  };

  const body: any = {
    model: modelName,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.3,
    max_tokens: 450,
    reasoning: {
      effort: "none",
      exclude: true
    },
    provider: {
      sort: "latency",
      require_parameters: true
    }
  };

  if (isJson) {
    body.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(`[openrouter-chat] model ${modelName} failed with status ${response.status}`);
      throw new Error(`OpenRouter API HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const content = message?.content;

    if (typeof content === "string" && content.trim() !== "") {
      return content.trim();
    }

    throw new Error("OpenRouter API returned empty content.");
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.warn(`[openrouter-chat] model ${modelName} timed out (25s)`);
      throw new Error("OpenRouter chat request timed out.");
    }
    throw error;
  }
}

export async function generateOpenRouterText(system: string, user: string): Promise<string> {
  let apiKey = "";
  try {
    apiKey = getOpenRouterApiKey();
  } catch (err) {}
  
  const models = getOpenRouterTextModels();
  
  for (const model of models) {
    try {
      console.info(`[openrouter-chat] trying model: ${model}`);
      return await callOpenRouterApi(apiKey, model, system, user, false);
    } catch (error) {
      console.error(`[openrouter-chat] model ${model} failed, trying next...`);
    }
  }

  throw new Error("All OpenRouter text models failed.");
}

export async function generateOpenRouterObject<T>(
  schema: z.ZodSchema<T>,
  system: string,
  user: string
): Promise<T> {
  let apiKey = "";
  try {
    apiKey = getOpenRouterApiKey();
  } catch (err) {}

  const models = getOpenRouterTextModels();
  
  for (const model of models) {
    try {
      console.info(`[openrouter-chat] trying model (object): ${model}`);
      const content = await callOpenRouterApi(apiKey, model, system, user, true);

      let cleanContent = content.trim();
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent
          .replace(/^```json\s*/i, "")
          .replace(/```$/, "")
          .trim();
      }

      const parsed = JSON.parse(cleanContent);
      return schema.parse(parsed);
    } catch (error) {
      console.error(`[openrouter-chat] model ${model} (object) failed, trying next...`);
    }
  }

  throw new Error("All OpenRouter text models (object) failed.");
}
