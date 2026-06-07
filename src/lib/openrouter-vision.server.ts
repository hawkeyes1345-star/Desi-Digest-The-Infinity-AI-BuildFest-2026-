import { z } from "zod";
import { getOpenRouterApiKey as getEnvOpenRouterApiKey } from "@/lib/env.server";

const OpenRouterVisionResultSchema = z.object({
  detected: z.boolean(),
  foods: z.array(z.object({ name: z.string() })),
});

export type OpenRouterVisionResult = z.infer<typeof OpenRouterVisionResultSchema>;

/**
 * Helper to get the OpenRouter API key and run strong server-side validation.
 */
export function getOpenRouterApiKey(): string {
  return getEnvOpenRouterApiKey();
}

/**
 * Analyzes an image using OpenRouter's vision capabilities.
 * Designed to act as a resilient fallback for plate analysis.
 * 
 * @param imageBase64 The base64-encoded image data.
 * @param mimeType The image MIME type (e.g. image/jpeg, image/png).
 */
export async function analyzeImageWithOpenRouterVision(
  imageBase64: string,
  mimeType: string
): Promise<{ detected: boolean; foods: Array<{ name: string }>; error?: string }> {
  try {
    const apiKey = getOpenRouterApiKey();
    const modelName = process.env.OPENROUTER_VISION_MODEL || "google/gemini-2.5-flash";

    console.info(`[openrouter-vision] calling OpenRouter API with model ${modelName}...`);

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
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[openrouter-vision] HTTP error: ${response.status} - ${errorText}`);
      throw new Error(`OpenRouter API HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter API returned an empty completion content.");
    }

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
    console.error("[openrouter-vision] analysis failed:", error);
    
    // Return a clean error indicator instead of leaking raw database/provider errors
    return {
      detected: false,
      foods: [],
      error: error instanceof Error ? error.message : "OpenRouter vision analysis failed",
    };
  }
}
