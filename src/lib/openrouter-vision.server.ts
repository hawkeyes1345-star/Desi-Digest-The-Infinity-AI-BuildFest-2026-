import { z } from "zod";
import { getOpenRouterApiKey as getEnvOpenRouterApiKey, getOpenRouterVisionModels } from "@/lib/env.server";

const OpenRouterVisionResultSchema = z.object({
  detected: z.boolean(),
  foods: z.array(z.object({ name: z.string() })),
});

export type OpenRouterVisionResult = z.infer<typeof OpenRouterVisionResultSchema>;

export function getOpenRouterApiKey(): string {
  return getEnvOpenRouterApiKey();
}

async function callOpenRouterVisionApi(
  apiKey: string,
  modelName: string,
  imageBase64: string,
  mimeType: string,
  referer: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": referer,
        "X-Title": "Desi Digest",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are Nanumoni, a HealthTech AI assistant for Deshi Digest (Bangladesh).
Your job is to look at the provided image and identify the food items on the plate.
Output ONLY a valid JSON object matching this schema:
{
  "detected": boolean,
  "foods": [{"name": string}]
}
Favor Bangladeshi/South Asian food names (e.g. "bhat", "rui macher jhol", "shak", "dal") if appropriate. Limit to 5 items.
If no food is clearly visible, set detected to false.
Do not include markdown fences, backticks, or any other conversational text.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1200,
        reasoning: {
          effort: "none",
          exclude: true
        },
        provider: {
          sort: "latency",
          require_parameters: true
        }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter API HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const content = message?.content;

    if (typeof content !== "string" || content.trim() === "") {
      throw new Error("OpenRouter vision API returned empty content.");
    }

    return content.trim();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("OpenRouter vision request timed out.");
    }
    throw error;
  }
}

export async function analyzeImageWithOpenRouterVision(
  imageBase64: string,
  mimeType: string
): Promise<{ detected: boolean; foods: Array<{ name: string }>; error?: string }> {
  try {
    const apiKey = getOpenRouterApiKey();
    if (!apiKey) {
      throw new Error("Missing OpenRouter API key. Skipping OpenRouter.");
    }

    const models = getOpenRouterVisionModels();
    const referer = process.env.NODE_ENV === "development" 
      ? "http://localhost:3000" 
      : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://project-rae6k.vercel.app");

    for (const model of models) {
      try {
        console.info(`[openrouter-vision] trying model: ${model}`);
        const content = await callOpenRouterVisionApi(apiKey, model, imageBase64, mimeType, referer);

        let cleanContent = content.trim();
        if (cleanContent.startsWith("```")) {
          cleanContent = cleanContent
            .replace(/^```json\s*/i, "")
            .replace(/```$/, "")
            .trim();
        }

        const parsed = JSON.parse(cleanContent);
        const validated = OpenRouterVisionResultSchema.parse(parsed);

        return {
          detected: validated.detected,
          foods: validated.foods,
        };
      } catch (error) {
        console.error(`[openrouter-vision] model ${model} failed, trying next...`, error);
      }
    }

    throw new Error("All OpenRouter vision models failed.");
  } catch (error) {
    console.error("[openrouter-vision] analysis failed:", error);
    return {
      detected: false,
      foods: [],
      error: error instanceof Error ? error.message : "OpenRouter vision analysis failed",
    };
  }
}
