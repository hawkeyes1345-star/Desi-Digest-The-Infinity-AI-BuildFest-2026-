import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { analyzeImageWithOpenRouterVision } from "@/lib/openrouter-vision.server";
import { AiPlateAnalysisSchema, type AiPlateAnalysisData, defaultAiPlateAnalysis } from "@/lib/plate/ai-schema";
import {
  tryConsumeGeminiQuota,
  detectAndMapAiError
} from "@/lib/gemini-quota.server";
import { NANUMONI_KNOWLEDGE } from "@/lib/nanumoni-knowledge";
import { getGeminiApiKey as getEnvGeminiApiKey } from "@/lib/env.server";
import { routeAiCall } from "@/lib/ai-router.server";
import { generateOpenRouterText, generateOpenRouterObject } from "@/lib/openrouter-chat.server";

export const CHAT_MODEL_NAME = "gemini-2.5-flash";
type AiPhase = "chat" | "explanation";
type AiModelName = string;

export function logAiModelUse(phase: AiPhase, model: AiModelName) {
  console.info("[ai] using model", { phase, model });
}

export function getGeminiApiKey() {
  return getEnvGeminiApiKey();
}

export function createGeminiProvider() {
  return createGoogleGenerativeAI({ apiKey: getGeminiApiKey() });
}



import { isAiConsensusModeEnabled } from "@/lib/env.server";

const ConsensusVerdictSchema = z.object({
  verdict: z.enum(["approve", "revise", "uncertain"]),
  issues: z.array(z.string()),
  correctedFacts: z.array(z.string()),
  finalAnswer: z.string().optional(),
});

async function runConsensusChat(input: Parameters<typeof generateChatResponse>[0], initialDraft: string): Promise<string> {
  try {
    const verifierSystem = `You are a strict Nutrition Verifier for Deshi Digest (Bangladesh).
Your task is to review an AI assistant's draft answer for accuracy, safety, and local relevance.
CRITICAL RULES:
1. Identify impossible calories/macros or unrealistic portions.
2. Check for unsafe medical claims (must include "General nutrition guidance — not medical advice.").
3. Verify Bangladeshi food context.
4. If the draft is good, set verdict to "approve".
5. If facts are wrong, set verdict to "revise" and provide "finalAnswer".
6. If unsure, set "uncertain" and provide a cautious "finalAnswer" with ranges.
OUTPUT ONLY VALID JSON matching the requested schema.`;

    const verifierUser = `Draft Answer to Review:
"${initialDraft}"

User Original Question:
"${input.userMessage}"

Provide your verdict in JSON format.`;

    const consensus = await generateOpenRouterObject(ConsensusVerdictSchema, verifierSystem, verifierUser);
    
    if (consensus.verdict === "approve") {
      return initialDraft;
    }
    
    if (consensus.finalAnswer) {
      return consensus.finalAnswer;
    }
    
    return initialDraft;
  } catch (error) {
    console.error("[consensus-chat] verification failed, using initial draft", error);
    return initialDraft;
  }
}

export async function generateChatResponse(input: {
  userMessage: string;
  template: string;
  context?: unknown;
  userProfile?: unknown;
  requestedLanguage?: "bangla_script" | "banglish" | "english";
  previousAssistantMessage?: string;
  conversationHistory?: Array<{role: string, text: string}>;
}): Promise<{ text: string; usedGemini: boolean; fallbackReason?: string }> {
  
  let formattedHistory = "";
  if (input.conversationHistory && input.conversationHistory.length > 0) {
    formattedHistory = "\n\nRecent Conversation History (for context):\n" + 
      input.conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join("\n");
  }

  const systemPrompt = `You are Nanumoni — a warm, knowledgeable Bangladeshi nutrition helper in the Deshi Digest app.

CORE IDENTITY:
- You are a friendly deshi nutrition assistant, NOT a doctor.
- You give practical, specific food advice using Bangladeshi/South Asian food examples.
- You feel like a trusted local friend who knows nutrition well.

CHART & TABLE REQUESTS (STRICT):
- If the user asks for a "pie chart", "chart", "graph", "table", "data", or "compare X and Y", return a clean Markdown table.
- Do NOT pretend a visual chart was generated.
- Add: "Visual chart is not available inside chat yet, so I’m showing it as a clear comparison table."
- Columns: | Item | Calories (est.) | Protein (est.) | Health Verdict |

NUTRITION ACCURACY & SAFETY (STRICT):
- Use estimated/range-based values when exact data is unavailable.
- Do NOT invent fake precise numbers (e.g., "3.24g"). Use "approx 3g" or "~3g".
- For homemade Bangladeshi foods, mention variation from oil, salt, and portion size.
- Plain cooked rice (Bhat): fat and sodium are negligible (~0) unless oil/salt/ghee is added.
- Oily/fried/bhuna foods: mention oil-based variation.
- Use phrasing: "Estimated per 100g", "Approximate for one medium serving", "Values can vary by oil, salt, and portion size".

LANGUAGE RULES (ABSOLUTE):
1. Match the user's language exactly:
   - If requestedLanguage is "bangla_script" or user asks "banglay"/"বাংলায়"/"bangla okkhore" → reply ENTIRELY in Bangla script.
   - If requestedLanguage is "banglish" or user writes Banglish → reply in warm, natural Banglish.
   - If requestedLanguage is "english" or user writes English → reply in clear English.
2. Translation/Rewrite: If "Rewrite previous answer" is provided, ONLY translate. Keep all facts identical.

FOOD COMPARISON FORMAT (STRICT — for "X na Y?" questions):
1. **Direct answer first**: Clearly state which is better.
2. **Reason**: 1-2 sentences on protein, sugar, or fat.
3. **When the other is okay**: Context for the less healthy choice.
4. **Practical local tip**: e.g., "Add 1 cup shak to balance the rice."
5. **Short disclaimer**: "General nutrition guidance — not medical advice."

ANSWER QUALITY:
- Max ONE emoji per response.
- Max 3-4 short paragraphs.
- Spell "healthy" and "protein" correctly.
- Do NOT repeat profile data back.

DO NOT mention: "Gemini", "API", "OpenRouter", "User Safety: safe", "Safety Rating", "RESOURCE_EXHAUSTED", "429", "model", "provider", "Template", "Source:".

BANGLADESHI FOOD KNOWLEDGE BASE:
` + NANUMONI_KNOWLEDGE;

  const userPrompt = [
    input.userMessage,
    input.requestedLanguage ? "[Language: " + input.requestedLanguage + "]" : "",
    input.previousAssistantMessage ? "[Rewrite this previous answer in the requested language: " + input.previousAssistantMessage + "]" : "",
    formattedHistory,
    input.userProfile ? "[Profile: " + JSON.stringify(input.userProfile) + "]" : "",
    input.context && Object.keys(input.context as Record<string, unknown>).length > 0 ? "[Food data: " + JSON.stringify(input.context) + "]" : "",
    input.template ? "[Reference hints: " + input.template + "]" : "",
  ].filter(Boolean).join("\n");

  const geminiFlashCall = async () => {
    logAiModelUse("chat", "gemini-2.5-flash");
    const result = await generateText({
      model: createGeminiProvider()("gemini-2.5-flash"),
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = result.text?.trim();
    if (!text) throw new Error("AI assistant returned an empty response");
    return text;
  };

  const geminiLiteCall = async () => {
    logAiModelUse("chat", "gemini-2.5-flash-lite");
    const result = await generateText({
      model: createGeminiProvider()("gemini-2.5-flash-lite"),
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = result.text?.trim();
    if (!text) throw new Error("AI assistant returned an empty response");
    return text;
  };

  const openRouterCall = async () => {
    logAiModelUse("chat", "openrouter");
    return await generateOpenRouterText(systemPrompt, userPrompt);
  };

  const fallbackCall = () => {
    return input.template;
  };

  const result = await routeAiCall({
    geminiFlash: geminiFlashCall,
    geminiLite: geminiLiteCall,
    openRouter: openRouterCall,
    fallback: fallbackCall
  }, "chat");

  let finalOutput = result.result;

  // Consensus mode for high-value tasks
  if (isAiConsensusModeEnabled() && result.provider.startsWith("gemini")) {
    const needsConsensus = /calorie|protein|carb|fat|estimate|chart|table|data|compare|healthy|diabetes|weight|heart|sodium|medicine|symptom/i.test(input.userMessage);
    if (needsConsensus) {
      console.info("[consensus] running verification for high-value task");
      finalOutput = await runConsensusChat(input, finalOutput);
    }
  }

  return {
    text: finalOutput,
    usedGemini: result.provider !== 'fallback',
    fallbackReason: result.fallbackReason
  };
}


export async function generatePlateAnalysisInsights(
  detectedFoods: any[],
  nutrition: any,
  userProfile: any
): Promise<{ data: AiPlateAnalysisData; usedGemini: boolean; fallbackReason?: string }> {
  const systemPrompt = `You are Nanumoni, a senior clinical-style HealthTech AI nutritionist for Deshi Digest (Bangladesh).
You are analyzing a user's plate of food. We have already calculated the exact calories and macros.
Do NOT recalculate macros. Your job is ONLY to provide personalized insights, tips, and explanations based on the provided data.

CRITICAL RULES:
1. OUTPUT ONLY VALID JSON matching the requested schema. No markdown fences, no backticks, no conversational text outside the JSON.
2. DO NOT provide medical diagnoses, prescribe treatments, or claim to cure diseases (like diabetes). Keep advice framed as general clinical-style nutritional estimates. Do NOT claim doctor/certified/device approval.
3. Be culturally relevant to Bangladesh/South Asia. Recommend local Desi food examples (e.g., reduce bhat/rice portion, add dal, add local shak/shobji, choose grilled/boiled rui/ilish fish or chicken, swap paratha with roti, reduce ghee/mustard oil, swap mishti doi with unsweetened tok doi). Do NOT suggest Western-only foods like kale salad or quinoa.
4. All advice must be short, scannable, action-oriented, and specific to the detected foods, avoiding generic filler.
5. In 'healthExplanation', you MUST write exactly 5 sentences. The sentences must cover: 1-2 sentences of Executive Summary, 1 sentence on Main Nutrition Concern, 1 sentence on Best Improvement, 1 sentence on a Local Healthier Swap, and 1 sentence of Confidence/Accuracy Note.
6. If you are uncertain, use safe, generic fallback advice.`;

  const userPrompt = `Analyze this plate and provide insights.
      
Detected Foods: ${JSON.stringify(detectedFoods)}
Calculated Nutrition: ${JSON.stringify(nutrition)}
User Profile & Goals: ${JSON.stringify(userProfile || {})}
`;

  const geminiFlashCall = async () => {
    logAiModelUse("explanation", "gemini-2.5-flash");
    const result = await generateObject({
      model: createGeminiProvider()("gemini-2.5-flash"),
      schema: AiPlateAnalysisSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });
    return result.object;
  };

  const geminiLiteCall = async () => {
    logAiModelUse("explanation", "gemini-2.5-flash-lite");
    const result = await generateObject({
      model: createGeminiProvider()("gemini-2.5-flash-lite"),
      schema: AiPlateAnalysisSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });
    return result.object;
  };

  const openRouterCall = async () => {
    logAiModelUse("explanation", "openrouter");
    return await generateOpenRouterObject(AiPlateAnalysisSchema, systemPrompt, userPrompt);
  };

  const fallbackCall = () => {
    return getLocalPlateInsights(detectedFoods, nutrition, userProfile);
  };

  const result = await routeAiCall({
    geminiFlash: geminiFlashCall,
    geminiLite: geminiLiteCall,
    openRouter: openRouterCall,
    fallback: fallbackCall
  }, "insights");

  return {
    data: result.result,
    usedGemini: result.provider !== 'fallback',
    fallbackReason: result.fallbackReason,
  };
}

export const GeminiVisionFoodSchema = z.object({
  detected: z.boolean().describe("True if a plate of food or food item is clearly visible in the image."),
  foods: z.array(z.object({ name: z.string() })).describe("List of main food components visible in the image, favoring Bangladeshi/South Asian names when applicable. Limit to 5 items."),
});

export type GeminiVisionFoodResult = z.infer<typeof GeminiVisionFoodSchema>;

async function runConsensusVision(initialResult: GeminiVisionFoodResult): Promise<GeminiVisionFoodResult> {
  try {
    const verifierSystem = `You are a strict Nutrition Vision Verifier for Deshi Digest (Bangladesh).
Your task is to review detected food items from an image analysis for accuracy and realism.
CRITICAL RULES:
1. Identify impossible food combinations.
2. Check for unrealistic portions.
3. Ensure Bangladeshi food context is accurate.
4. If the detection looks good, set verdict to "approve".
5. If items look wrong or unrealistic, set verdict to "revise" and provide "correctedFoods".
OUTPUT ONLY VALID JSON:
{
  "verdict": "approve" | "revise",
  "correctedFoods": [{"name": string}]
}`;

    const verifierUser = `Detected Foods to Review:
${JSON.stringify(initialResult.foods)}

Provide your verdict in JSON format.`;

    const consensus = await generateOpenRouterObject(z.object({
      verdict: z.enum(["approve", "revise"]),
      correctedFoods: z.array(z.object({ name: z.string() })).optional(),
    }), verifierSystem, verifierUser);
    
    if (consensus.verdict === "approve" || !consensus.correctedFoods) {
      return initialResult;
    }
    
    return {
      detected: initialResult.detected,
      foods: consensus.correctedFoods
    };
  } catch (error) {
    console.error("[consensus-vision] verification failed, using initial result", error);
    return initialResult;
  }
}

export async function analyzeImageWithGeminiVision(
  imageBase64: string,
  mimeType: string
): Promise<{ 
  detected: boolean; 
  foods: Array<{ name: string }>; 
  usedGemini: boolean; 
  provider?: string;
  fallbackReason?: string 
}> {
  
  const geminiFlashCall = async () => {
    logAiModelUse("explanation", "gemini-2.5-flash");
    const result = await generateObject({
      model: createGeminiProvider()("gemini-2.5-flash"),
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
    return result.object;
  };

  const openRouterCall = async () => {
    logAiModelUse("explanation", "openrouter-vision");
    const res = await analyzeImageWithOpenRouterVision(imageBase64, mimeType);
    return { detected: res.detected, foods: res.foods };
  };

  const fallbackCall = () => {
    return { detected: false, foods: [] };
  };

  const result = await routeAiCall({
    geminiFlash: geminiFlashCall,
    openRouter: openRouterCall,
    fallback: fallbackCall
  }, "vision");

  let finalResult = result.result;

  // Consensus mode for vision
  if (isAiConsensusModeEnabled() && result.provider.startsWith("gemini") && finalResult.detected) {
    console.info("[consensus] running vision verification");
    finalResult = await runConsensusVision(finalResult);
  }

  return { 
    detected: finalResult.detected, 
    foods: finalResult.foods,
    usedGemini: result.provider === 'gemini-flash',
    provider: result.provider,
    fallbackReason: result.fallbackReason
  };
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
