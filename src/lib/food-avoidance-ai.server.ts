import { z } from "zod";
import { generateObject } from "ai";
import { createGeminiProvider, logAiModelUse } from "@/lib/ai-gateway.server";
import { generateOpenRouterObject } from "@/lib/openrouter-chat.server";
import { routeAiCall } from "@/lib/ai-router.server";

export const AiAvoidanceExtractionSchema = z.object({
  possibleIngredients: z.array(z.string()),
  possibleAvoidanceMatches: z.array(z.object({
    userAvoidItem: z.string(),
    matchedText: z.string(),
    confidence: z.enum(["low", "medium", "high"]),
    reason: z.string(),
  })),
  uncertaintyNote: z.string().optional(),
});

export type AiAvoidanceExtraction = z.infer<typeof AiAvoidanceExtractionSchema>;

export async function extractFoodAvoidanceAi(input: {
  mealText?: string;
  ingredients?: string[];
  basketItems?: string[];
  userAvoidList: string[];
}): Promise<AiAvoidanceExtraction> {
  const combinedText = [
    input.mealText,
    ...(input.ingredients || []),
    ...(input.basketItems || [])
  ].filter(Boolean).join(", ");

  const systemPrompt = `You are a clinical-safety support AI assisting with food avoidance and allergy matching for a South Asian/Bangladeshi diet app.
Your task is to analyze the user's meal text/ingredients against their list of avoided/allergy foods.
CRITICAL RULES:
1. Parse Banglish/Bangla aliases:
   - "chingri", "chingri bhuna" -> shrimp/prawn
   - "gorur mangsho", "goru" -> beef
   - "dim", "dim bhaji" -> egg
   - "shorishar tel", "sorisha" -> mustard/mustard oil
2. Check for hidden ingredients commonly found in Bangladeshi dishes (e.g. mustard oil in bhortas, ghee/dairy in polao, egg in cutlets).
3. Do NOT make definitive medical diagnoses or guarantee safety.
4. Output JSON matching the requested schema.`;

  const userPrompt = `Meal Combined Text: "${combinedText}"
User Avoid/Allergy List: ${JSON.stringify(input.userAvoidList)}`;

  const geminiFlashCall = async () => {
    logAiModelUse("explanation", "gemini-2.5-flash");
    const result = await generateObject({
      model: createGeminiProvider()("gemini-2.5-flash"),
      schema: AiAvoidanceExtractionSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });
    return result.object;
  };

  const geminiLiteCall = async () => {
    logAiModelUse("explanation", "gemini-2.5-flash-lite");
    const result = await generateObject({
      model: createGeminiProvider()("gemini-2.5-flash-lite"),
      schema: AiAvoidanceExtractionSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });
    return result.object;
  };

  const openRouterCall = async () => {
    logAiModelUse("explanation", "openrouter");
    return await generateOpenRouterObject(AiAvoidanceExtractionSchema, systemPrompt, userPrompt);
  };

  const fallbackCall = (): AiAvoidanceExtraction => {
    return {
      possibleIngredients: [],
      possibleAvoidanceMatches: [],
      uncertaintyNote: "AI analysis unavailable. Reverting to local check."
    };
  };

  const response = await routeAiCall({
    geminiFlash: geminiFlashCall,
    geminiLite: geminiLiteCall,
    openRouter: openRouterCall,
    fallback: fallbackCall
  }, "avoidance_extraction");

  return response.result;
}
