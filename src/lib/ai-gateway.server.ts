import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { AiPlateAnalysisSchema, type AiPlateAnalysisData, defaultAiPlateAnalysis } from "@/lib/plate/ai-schema";
import {
  tryConsumeGeminiQuota,
  isGeminiOnCooldown,
  setGeminiCooldown,
  detectAndMapAiError
} from "@/lib/gemini-quota.server";

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

export async function generatePlateAnalysisInsights(
  detectedFoods: any[],
  nutrition: any,
  userProfile: any
): Promise<{ data: AiPlateAnalysisData; usedGemini: boolean; fallbackReason?: string }> {
  if (isGeminiOnCooldown()) {
    const localInsights = getLocalPlateInsights(detectedFoods, nutrition, userProfile);
    return { data: localInsights, usedGemini: false, fallbackReason: "AI_QUOTA_EXCEEDED" };
  }

  const quota = tryConsumeGeminiQuota();
  if (!quota.allowed) {
    const localInsights = getLocalPlateInsights(detectedFoods, nutrition, userProfile);
    return { data: localInsights, usedGemini: false, fallbackReason: quota.reason || "Gemini unavailable" };
  }

  try {
    logAiModelUse("explanation", CHAT_MODEL_NAME);
    const result = await generateObject({
      model: createGeminiProvider()(CHAT_MODEL_NAME),
      schema: AiPlateAnalysisSchema,
      system: `You are Nanumoni, a senior clinical-style HealthTech AI nutritionist for Deshi Digest (Bangladesh).
You are analyzing a user's plate of food. We have already calculated the exact calories and macros.
Do NOT recalculate macros. Your job is ONLY to provide personalized insights, tips, and explanations based on the provided data.

CRITICAL RULES:
1. OUTPUT ONLY VALID JSON matching the requested schema. No markdown fences, no backticks, no conversational text outside the JSON.
2. DO NOT provide medical diagnoses, prescribe treatments, or claim to cure diseases (like diabetes). Keep advice framed as general clinical-style nutritional estimates. Do NOT claim doctor/certified/device approval.
3. Be culturally relevant to Bangladesh/South Asia. Recommend local Desi food examples (e.g., reduce bhat/rice portion, add dal, add local shak/shobji, choose grilled/boiled rui/ilish fish or chicken, swap paratha with roti, reduce ghee/mustard oil, swap mishti doi with unsweetened tok doi). Do NOT suggest Western-only foods like kale salad or quinoa.
4. All advice must be short, scannable, action-oriented, and specific to the detected foods, avoiding generic filler.
5. In 'healthExplanation', you MUST write exactly 5 sentences. The sentences must cover: 1-2 sentences of Executive Summary, 1 sentence on Main Nutrition Concern, 1 sentence on Best Improvement, 1 sentence on a Local Healthier Swap, and 1 sentence of Confidence/Accuracy Note.
6. If you are uncertain, use safe, generic fallback advice.`,
      prompt: `Analyze this plate and provide insights.
      
Detected Foods: ${JSON.stringify(detectedFoods)}
Calculated Nutrition: ${JSON.stringify(nutrition)}
User Profile & Goals: ${JSON.stringify(userProfile || {})}
`,
    });

    return { data: result.object, usedGemini: true };
  } catch (error) {
    const mapped = detectAndMapAiError(error);
    if (mapped.isQuotaOrRateLimit) {
      setGeminiCooldown(30);
      console.info("[image-analysis] vision estimate quota-limited; using local estimate");
    } else {
      console.info("[image-analysis] vision estimate failed; using local estimate");
    }
    
    if (process.env.DEBUG_ANALYSIS === "true") {
      console.error("[generatePlateAnalysisInsights] Gemini failed:", error);
    }
    
    const localInsights = getLocalPlateInsights(detectedFoods, nutrition, userProfile);
    return {
      data: localInsights,
      usedGemini: false,
      fallbackReason: mapped.code,
    };
  }
}

export const GeminiVisionFoodSchema = z.object({
  detected: z.boolean().describe("True if a plate of food or food item is clearly visible in the image."),
  foods: z.array(z.object({ name: z.string() })).describe("List of main food components visible in the image, favoring Bangladeshi/South Asian names when applicable. Limit to 5 items."),
});

export type GeminiVisionFoodResult = z.infer<typeof GeminiVisionFoodSchema>;

export async function analyzeImageWithGeminiVision(
  imageBase64: string,
  mimeType: string
): Promise<{ detected: boolean; foods: Array<{ name: string }>; error?: string }> {
  if (isGeminiOnCooldown()) {
    return { detected: false, foods: [], error: "AI_QUOTA_EXCEEDED" };
  }

  const quota = tryConsumeGeminiQuota();
  if (!quota.allowed) {
    return { detected: false, foods: [], error: quota.reason || "Gemini unavailable" };
  }

  try {
    logAiModelUse("explanation", CHAT_MODEL_NAME);
    const result = await generateObject({
      model: createGeminiProvider()(CHAT_MODEL_NAME),
      schema: GeminiVisionFoodSchema,
      system: `You are Nanumoni, a HealthTech AI assistant for Deshi Digest (Bangladesh).
Your job is to look at the provided image and identify the food items on the plate.
CRITICAL RULES:
1. OUTPUT ONLY VALID JSON matching the requested schema.
2. Favor Bangladeshi/South Asian food names (e.g. "bhat", "rui macher jhol", "shak", "dal") if appropriate.
3. If no food is clearly visible, set detected to false.`,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What food is on this plate?" },
            {
              type: "image",
              image: Buffer.from(imageBase64, "base64"),
            },
          ],
        },
      ],
    });

    return { detected: result.object.detected, foods: result.object.foods };
  } catch (error) {
    const mapped = detectAndMapAiError(error);
    if (mapped.isQuotaOrRateLimit) {
      setGeminiCooldown(30);
      console.info("[image-analysis] vision estimate quota-limited; using local estimate");
    } else {
      console.info("[image-analysis] vision estimate failed; using local estimate");
    }

    if (process.env.DEBUG_ANALYSIS === "true") {
      console.error("[analyzeImageWithGeminiVision] Gemini failed:", error);
    }

    return {
      detected: false,
      foods: [],
      error: mapped.code,
    };
  }
}

export function getLocalPlateInsights(
  detectedFoods: Array<{ name: string }>,
  nutrition: any,
  profile: any
): AiPlateAnalysisData {
  const foodsLower = detectedFoods.map(f => f.name.toLowerCase());

  const hasRice = foodsLower.some(n => /rice|bhat|polao|khichuri|biryani|tehari/i.test(n));
  const hasDal = foodsLower.some(n => /dal|daal|lentil/i.test(n));
  const hasFish = foodsLower.some(n => /fish|mach|maach|ilish|rohu|pabda|katla|koi/i.test(n));
  const hasMeat = foodsLower.some(n => /chicken|beef|mutton|meat|curry|gorur|khashir|morog/i.test(n) && !/fish/i.test(n));
  const hasEgg = foodsLower.some(n => /egg|dim/i.test(n));
  const hasBread = foodsLower.some(n => /ruti|roti|paratha|porota|luchi|naan/i.test(n));
  const hasVeg = foodsLower.some(n => /shak|shaak|shobji|vegetable|begun|aloo|posto|bhaji|bhorta/i.test(n));
  const hasSweets = foodsLower.some(n => /doi|yogurt|rosogolla|jilapi|sweet|dessert/i.test(n));

  let s1 = "This meal provides a traditional South Asian combination, centering on ";
  if (hasRice) s1 += "steamed rice or grains ";
  else if (hasBread) s1 += "flatbread staples ";
  else s1 += "mixed food items ";
  s1 += "paired with ";
  if (hasMeat || hasFish || hasEgg) s1 += "protein from meat or fish curries.";
  else if (hasDal) s1 += "plant-based protein from dal.";
  else s1 += "side components.";

  let s2 = "";
  if (hasVeg) {
    s2 = "The inclusion of leafy greens or vegetables adds crucial micronutrients and dietary fiber to the plate.";
  } else {
    s2 = "The plate is relatively low in green vegetables, indicating a need for more fiber to balance the carbohydrates.";
  }

  let s3 = "The primary nutritional focus is managing the glycemic load and sodium levels, particularly from rich gravies.";
  if (nutrition.calories > 700) {
    s3 = "The main concern is the high energy density and calorie count, largely driven by cooking oil or refined starch.";
  } else if (nutrition.sodium_mg > 800) {
    s3 = "The main concern is the elevated sodium levels, which are commonly found in commercial seasonings and heavy curries.";
  } else if (nutrition.carbs_g > 80) {
    s3 = "The main concern is the high glycemic load from the refined carbohydrates, which can cause rapid blood sugar fluctuations.";
  }

  let s4 = "To optimize this plate, try reducing the portion of white rice or swapping fried parathas for dry whole wheat rotis.";
  if (hasSweets) {
    s4 = "To make this healthier, consider replacing sweet yogurt or desserts with unsweetened sour curd (tok doi).";
  } else if (hasMeat && !hasVeg) {
    s4 = "For a better balance, add a side of steamed vegetables or leafy greens (shak) to increase fiber and support digestion.";
  } else if (hasRice && !hasDal && !hasMeat && !hasFish && !hasEgg) {
    s4 = "To balance the starch, add a portion of lentils (dal) or lean fish to introduce high-quality protein.";
  }

  const s5 = "This is a deterministic nutritional analysis and estimate derived from standard Bangladeshi food recipes.";

  const healthExplanation = `${s1} ${s2} ${s3} ${s4} ${s5}`;

  let hygieneNotes = "Ensure all curries and protein elements are fully cooked and served hot to prevent foodborne illness.";
  if (foodsLower.some(n => /fuchka|chotpoti|jhal muri|street/i.test(n))) {
    hygieneNotes = "Street food should be consumed from clean, trusted stalls, ensuring fresh spice water and clean serving utensils.";
  }

  let idealPlateComparison = "This plate is slightly carb-heavy compared to a balanced Deshi diet.";
  if (hasVeg && (hasMeat || hasFish || hasEgg || hasDal)) {
    idealPlateComparison = "This meal aligns reasonably well with a balanced Deshi plate, though starch portion control is key.";
  } else if (!hasVeg) {
    idealPlateComparison = "This plate lacks green vegetables. A balanced Deshi plate recommends half the space for greens and vegetables.";
  }

  let shak_shobji_pct = 10;
  if (hasVeg) shak_shobji_pct = 35;
  if (foodsLower.some(n => /shak|shaak|spinach/i.test(n))) shak_shobji_pct += 10;

  let dal_protein_pct = 15;
  if (hasMeat || hasFish || hasEgg) dal_protein_pct = 30;
  else if (hasDal) dal_protein_pct = 25;

  let bhat_carbs_pct = 100 - shak_shobji_pct - dal_protein_pct;
  if (bhat_carbs_pct < 10) {
    bhat_carbs_pct = 10;
    shak_shobji_pct = 100 - bhat_carbs_pct - dal_protein_pct;
  }

  const idealPlateBreakdown = {
    shak_shobji_pct,
    bhat_carbs_pct,
    dal_protein_pct,
    notes: "Proportions are estimated based on typical serving weights of ingredients.",
  };

  const goalAlignment: Array<{ goal: string; verdict: "great" | "okay" | "risky"; reason: string }> = [];
  const goals = profile?.goals ?? [];
  for (const g of goals) {
    if (g === "diabetes_friendly") {
      if (nutrition.carbs_g > 65) {
        goalAlignment.push({
          goal: g,
          verdict: "risky",
          reason: "This meal has a high carbohydrate load (~" + Math.round(nutrition.carbs_g) + "g), which may cause blood sugar spikes. Try halving the rice or swapping for roti.",
        });
      } else {
        goalAlignment.push({
          goal: g,
          verdict: "great",
          reason: "The carbohydrate portion is well-controlled, supporting stable blood glucose management.",
        });
      }
    } else if (g === "weight_loss") {
      if (nutrition.calories > 600) {
        goalAlignment.push({
          goal: g,
          verdict: "risky",
          reason: "The calorie content (~" + Math.round(nutrition.calories) + " kcal) is relatively high for weight loss. Reducing oil/gravy or starch portion is recommended.",
        });
      } else {
        goalAlignment.push({
          goal: g,
          verdict: "great",
          reason: "The calorie count is moderate (~" + Math.round(nutrition.calories) + " kcal), which fits well within a calorie-controlled meal plan.",
        });
      }
    } else if (g === "muscle_gain") {
      if (nutrition.protein_g < 20) {
        goalAlignment.push({
          goal: g,
          verdict: "okay",
          reason: "The protein content (~" + Math.round(nutrition.protein_g) + "g) is a bit low for muscle synthesis. Consider adding an egg, fish, or chicken curry.",
        });
      } else {
        goalAlignment.push({
          goal: g,
          verdict: "great",
          reason: "Excellent protein content (~" + Math.round(nutrition.protein_g) + "g) to support muscle repair and growth goals.",
        });
      }
    } else if (g === "heart_healthy" || g === "low_sodium") {
      if (nutrition.sodium_mg > 700 || nutrition.fat_g > 22) {
        goalAlignment.push({
          goal: g,
          verdict: "risky",
          reason: "The meal contains high sodium (~" + Math.round(nutrition.sodium_mg) + "mg) or fat, which can affect blood pressure. Limit rich gravies and oil.",
        });
      } else {
        goalAlignment.push({
          goal: g,
          verdict: "great",
          reason: "This meal is low in sodium and saturated fats, supporting long-term cardiovascular health.",
        });
      }
    }
  }

  const personalizedSuggestions: string[] = [];
  if (!hasVeg) {
    personalizedSuggestions.push("Aim to fill half your plate with leafy greens like Lal Shak or Pui Shak to double your fiber intake.");
  } else {
    personalizedSuggestions.push("Great job adding vegetables! Continue to pair starch with high-fiber sides to slow digestion.");
  }
  if (nutrition.sodium_mg > 800) {
    personalizedSuggestions.push("Drink plenty of water throughout the day to help balance and flush excess sodium.");
  }

  const makeItHealthierTips: string[] = [];
  if (hasRice && nutrition.carbs_g > 60) {
    makeItHealthierTips.push("Limit the cooked rice portion to one tea-cup (about 150g) to control carbohydrate density.");
  }
  if (hasMeat || hasFish) {
    makeItHealthierTips.push("Enjoy the meat or fish pieces, but leave the heavy oil-soaked gravy behind on the plate.");
  }
  if (!hasVeg) {
    makeItHealthierTips.push("Add a quick side of cucumber, carrot, or tomato salad to easily boost vitamins and fiber.");
  }

  const substitutions: Array<{ from: string; to: string; why: string }> = [];
  if (foodsLower.some(n => /paratha|porota/i.test(n))) {
    substitutions.push({
      from: "Paratha",
      to: "Attar Roti",
      why: "Attar roti is dry-roasted, reducing fat by 90% and saving over 130 calories per piece.",
    });
  }
  if (foodsLower.some(n => /rice|bhat/i.test(n)) && !foodsLower.some(n => /lal bhat|red rice/i.test(n))) {
    substitutions.push({
      from: "Steamed White Rice",
      to: "Lal Bhat (Red Rice)",
      why: "Red rice is unrefined, retaining fiber and minerals that prevent quick insulin spikes.",
    });
  }
  if (foodsLower.some(n => /mishti doi|misti doi/i.test(n))) {
    substitutions.push({
      from: "Mishti Doi",
      to: "Tok Doi (Sour Yogurt)",
      why: "Sour curd contains no added sugars and offers active probiotics for digestion.",
    });
  }

  let portionAdjustment = "Enjoy standard portions. Keep rice to 1-1.5 cups and meat curries to 1 medium piece.";
  if (nutrition.calories > 750) {
    portionAdjustment = "Consider reducing the staple portion (rice/bread) by one-third to balance the overall energy intake of this meal.";
  }

  const budgetAlternatives: string[] = [];
  if (hasMeat) {
    budgetAlternatives.push("Red lentils (dal) or eggs are highly affordable proteins to swap in place of chicken or beef.");
  }
  if (hasFish && foodsLower.some(n => /ilish|chingri/i.test(n))) {
    budgetAlternatives.push("Substitute expensive fish with small indigenous fish (like Mola) or Rohu for budget-friendly Omega-3s.");
  }

  return {
    healthExplanation,
    hygieneNotes,
    idealPlateComparison,
    idealPlateBreakdown,
    goalAlignment,
    personalizedSuggestions: personalizedSuggestions.slice(0, 3),
    makeItHealthierTips: makeItHealthierTips.slice(0, 3),
    substitutions: substitutions.slice(0, 2),
    portionAdjustment,
    budgetAlternatives,
  };
}
