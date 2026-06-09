import { generateOpenRouterObject } from "./openrouter-chat.server";
import { type SmartHealthNudge, generateSmartNudge } from "./smart-health-nudge";
import { verifyNudgePlan3 } from "./smart-health-nudge-verifier.server";
import { type MealLog } from "./meals.functions";
import { getPersistentNudgeImage } from "./nudge-image-service.server";
import { z } from "zod";

const NudgeGenerationSchema = z.object({
  id: z.string(),
  titleBn: z.string(),
  titleEn: z.string(),
  messageBn: z.string(),
  messageEn: z.string(),
  benefitBn: z.string(),
  benefitEn: z.string(),
  actionLabelBn: z.string(),
  actionLabelEn: z.string(),
  imageKind: z.enum(["lal-shak", "dal", "water", "egg", "fish", "vegetables", "rice-balance", "generic"]),
  priority: z.enum(["low", "medium", "high"]),
  reasonBn: z.string(),
  reasonEn: z.string(),
  disclaimerBn: z.string(),
  disclaimerEn: z.string(),
  sevenDayPlan: z.array(z.object({
    day: z.number(),
    titleBn: z.string(),
    titleEn: z.string(),
    suggestionBn: z.string(),
    suggestionEn: z.string(),
    benefitBn: z.string(),
    benefitEn: z.string(),
    imageKind: z.enum(["lal-shak", "dal", "water", "egg", "fish", "vegetables", "rice-balance", "generic"])
  })),
  checkInQuestionBn: z.string(),
  checkInQuestionEn: z.string(),
  exerciseSuggestionBn: z.string().optional(),
  exerciseSuggestionEn: z.string().optional(),
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
  if (process.env.SMART_NUDGE_AI_ENABLED !== "true" || isDemo) {
    return fallbackNudge;
  }

  // 2. Prepare AI prompt
  const systemPrompt = `You are a highly empathetic and knowledgeable Bangladeshi HealthTech AI Assistant (Nanumoni).
Your goal is to generate a personalized "Smart Health Nudge", a 7-day suggested plan, an optional exercise suggestion, and a check-in question for the next day based on their recent meal logs and profile.

CRITICAL SAFETY RULES:
- DO NOT diagnose any disease (e.g., "Apni diabetes e akranto").
- DO NOT claim to cure or treat anything.
- NEVER use phrases like "Apnar diabetes ache", "apnar rog dhora porse".
- NEVER expose AI terms like "Gemini", "OpenRouter", "API", or "model".
- MUST use safe language: "Apnar meal pattern theke mone hocche...", "may help", "can support", "consider".
- The 'disclaimerEn' MUST EXACTLY BE: "General nutrition guidance — not medical advice."
- The 'disclaimerBn' MUST EXACTLY BE: "General nutrition guidance — not medical advice. Doctor er poramorsho nin."
- The 'sevenDayPlan' MUST contain exactly 7 items (one for each day).
- Provide 'checkInQuestionBn' (Bangla) and 'checkInQuestionEn' (English) asking if they followed today's tip. The question MUST be encouraging and non-shaming. Example: "Dadu bhai, kalke ki lal shak kheyecho?"
- Provide content in BOTH Bangla (Bn) and English (En). Use simple, friendly Bangla.
- Output strict JSON only.`;

  const userContext = {
    profileSummary: {
      age: profile.age,
      sex: profile.sex,
      goals: profile.goals,
      conditions: profile.health_conditions,
      activityLevel: profile.activity_level
    },
    recentMealsSummary: recentMeals.slice(0, 15).map(m => ({
      name: m.name,
      type: m.meal_type,
      calories: m.calories,
      protein: m.protein_g,
      fiber: m.fiber_g,
      water: m.water_ml,
      loggedAt: m.logged_at
    })),
    chatKeywords,
    baselineNudge: fallbackNudge
  };

  const userPrompt = `Based on the following data, generate a highly personalized, culturally relevant (Bangladeshi/South Asian) health nudge. 
The nudge should address specific patterns like low fiber, high rice intake, dehydration, or lack of protein if visible in the data.
It can also suggest a simple 10-15 min exercise if appropriate.

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
    const mainImage = await getPersistentNudgeImage(verifiedNudge.imageKind);
    if (mainImage) {
      verifiedNudge.imageUrl = mainImage.url;
      verifiedNudge.imageSource = mainImage.source;
      verifiedNudge.imageSourceUrl = mainImage.sourceUrl;
    }

    if (verifiedNudge.sevenDayPlan) {
      for (const item of verifiedNudge.sevenDayPlan) {
        const itemImage = await getPersistentNudgeImage(item.imageKind);
        if (itemImage) item.imageUrl = itemImage.url;
      }
    }
  } catch (e) {
    console.error("[Smart Nudge AI] Failed to attach images.", e);
  }

  return verifiedNudge;
}
