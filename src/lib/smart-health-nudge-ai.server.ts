import { generateOpenRouterObject } from "./openrouter-chat.server";
import { type SmartHealthNudge, generateSmartNudge } from "./smart-health-nudge";
import { verifyNudgePlan3 } from "./smart-health-nudge-verifier.server";
import { type MealLog } from "./meals.functions";
import { getPersistentNudgeImage } from "./nudge-image-service.server";
import { z } from "zod";

const NudgeGenerationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  benefit: z.string(),
  actionLabel: z.string(),
  imageKind: z.enum(["lal-shak", "dal", "water", "egg", "fish", "vegetables", "rice-balance", "generic"]),
  priority: z.enum(["low", "medium", "high"]),
  reason: z.string(),
  disclaimer: z.string(),
  sevenDayPlan: z.array(z.object({
    day: z.number(),
    title: z.string(),
    suggestion: z.string(),
    benefit: z.string(),
    imageKind: z.enum(["lal-shak", "dal", "water", "egg", "fish", "vegetables", "rice-balance", "generic"])
  }))
});

export async function generatePersonalizedNudge(
  profile: any,
  recentMeals: MealLog[],
  isDemo: boolean = false,
  chatKeywords: string[] = []
): Promise<SmartHealthNudge> {
  // 1. Generate deterministic fallback
  const fallbackNudge = generateSmartNudge(profile, recentMeals, isDemo);
  if (!fallbackNudge) {
    throw new Error("Failed to generate fallback nudge.");
  }

  // If AI is disabled or it's demo mode, just return the fallback
  // Actually, wait, demo mode can still use the generated fallback to make it fast.
  if (process.env.SMART_NUDGE_AI_ENABLED !== "true" || isDemo) {
    return fallbackNudge;
  }

  // 2. Prepare AI prompt
  const systemPrompt = `You are a highly empathetic and knowledgeable Bangladeshi HealthTech AI Assistant (Nanumoni).
Your goal is to generate a personalized "Smart Health Nudge" and a 7-day suggested plan for the user based on their recent meal logs and profile.

CRITICAL SAFETY RULES:
- DO NOT diagnose any disease.
- DO NOT claim to cure or treat anything.
- NEVER use phrases like "Apnar diabetes ache", "apnar rog dhora porse".
- NEVER expose AI terms like "Gemini", "OpenRouter", "API", or "model".
- MUST use safe language: "Apnar meal pattern theke mone hocche...", "may help", "can support".
- The 'disclaimer' field MUST EXACTLY BE: "General nutrition guidance — not medical advice."
- The 'sevenDayPlan' MUST contain exactly 7 items (one for each day).
- Output strict JSON only.`;

  const userContext = {
    profileSummary: profile,
    recentMealsSummary: recentMeals.map(m => ({
      name: m.name,
      type: m.meal_type,
      calories: m.calories,
      protein: m.protein_g,
      fiber: m.fiber_g,
      water: m.water_ml
    })),
    chatKeywords,
    baselineNudge: fallbackNudge
  };

  const userPrompt = `Based on the following data, generate a highly personalized, culturally relevant (Bangladeshi/South Asian) health nudge in simple Banglish/English.
Data: ${JSON.stringify(userContext, null, 2)}`;

  let generatedNudge: SmartHealthNudge;

  try {
    const aiResult = await generateOpenRouterObject(NudgeGenerationSchema, systemPrompt, userPrompt);
    generatedNudge = aiResult as SmartHealthNudge;
  } catch (e) {
    console.error("[Smart Nudge AI] Failed to generate AI nudge. Using fallback.", e);
    return fallbackNudge;
  }

  // 3. Plan 3 Cross-Check Verification
  const verifiedNudge = await verifyNudgePlan3(generatedNudge, fallbackNudge);

  // 4. Attach persistent real image URLs
  try {
    const mainImageUrl = await getPersistentNudgeImage(verifiedNudge.imageKind);
    if (mainImageUrl) verifiedNudge.imageUrl = mainImageUrl;

    if (verifiedNudge.sevenDayPlan) {
      for (const item of verifiedNudge.sevenDayPlan) {
        const itemImageUrl = await getPersistentNudgeImage(item.imageKind);
        if (itemImageUrl) item.imageUrl = itemImageUrl;
      }
    }
  } catch (e) {
    console.error("[Smart Nudge AI] Failed to attach images.", e);
  }

  return verifiedNudge;
}
