
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ALLOWED_IMAGE_MIME_TYPES, normalizeImageMimeType, parseImageDataUrl } from "@/lib/image-mime";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type Profile, computeBMI, computeTDEE } from "@/lib/profile.functions";
import { aggregateNutrition, enrichFoodsWithNutrition, type EnrichedFood } from "@/lib/nutrition-data.server";
import { lookupEdamamImageFood } from "@/lib/external-api.server";
import { analyzeImageWithGeminiVision, generatePlateAnalysisInsights } from "@/lib/ai-gateway.server";
import { analyzeImageWithOpenRouterVision } from "@/lib/openrouter-vision.server";
import { routeAiCall } from "@/lib/ai-router.server";

const InputSchema = z
  .object({
    imageBase64: z.string().min(32).max(8_000_000).optional(),
    mimeType: z.string().max(64).optional(),
    imageDataUrl: z.string().min(32).max(8_000_000).optional(),
    userContext: z.string().max(500).optional(),
    typedMeal: z.string().max(100).optional(),
    demoSample: z.string().max(100).optional(),
  })
  .refine((input) => Boolean(input.imageBase64 || input.imageDataUrl || input.typedMeal || input.demoSample), { message: "Image payload or manual entry is required" });

export type PlateAnalysis = {
  detected: boolean;
  blurry: boolean;
  nanumoniMessage: string;
  dishes: EnrichedFood[];
  nutrition: ReturnType<typeof aggregateNutrition>;
  healthScore: number;
  healthExplanation: string;
  hygieneNotes: string;
  idealPlateComparison: string;
  idealPlateBreakdown: { shak_shobji_pct: number; bhat_carbs_pct: number; dal_protein_pct: number; notes: string };
  goalAlignment: Array<{ goal: string; verdict: "great" | "okay" | "risky"; reason: string }>;
  goalAdjustedTargets: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; sodium_mg_max: number; notes: string };
  personalizedSuggestions: string[];
  makeItHealthierTips: string[];
  substitutions: Array<{ from: string; to: string; why: string }>;
  portionAdjustment: string;
  budgetAlternatives: string[];
  sources: string[];
  nutritionEstimated: boolean;
  nutritionSources: string[];
  nutritionNote: string;
  modelUsed: "edamam-image-food" | "gemini-vision-fallback" | "openrouter-vision-fallback" | "manual-entry" | "demo-sample" | "template-fallback";
  fallbackReason?: string;
  detectionUnavailable?: boolean;
  debugMessage?: string;
  errorCode?: string;
  profileIncomplete?: boolean;
  missingProfileFields?: string[];
  bmi?: number | null;
  ragGrounding?: { dish: string; matched: string; similarity: number }[];
};

function missingProfileFields(p: Profile | null): string[] {
  const m: string[] = [];
  if (!p) return ["age", "sex", "height", "weight", "activity level", "health goals"];
  if (!p.age) m.push("age");
  if (!p.sex) m.push("sex");
  if (!p.height_cm) m.push("height");
  if (!p.weight_kg) m.push("weight");
  if (!p.activity_level) m.push("activity level");
  if (!p.goals?.length) m.push("health goals");
  return m;
}

function emptyNutrition() {
  return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, iron_mg: 0, vitaminA_ugRAE: 0, zinc_mg: 0, sodium_mg: 0 };
}

function healthScoreFor(n: ReturnType<typeof aggregateNutrition>, p: Profile | null) {
  let score = 7;
  if (n.fiber_g < 5) score -= 1;
  if (n.protein_g < 10) score -= 1;
  if (n.sodium_mg > 800) score -= 1;
  if (p?.goals?.includes("diabetes_friendly") && n.carbs_g > 70) score -= 2;
  if (p?.goals?.includes("weight_loss") && n.calories > 750) score -= 1;
  return Math.max(1, Math.min(10, Math.round(score)));
}

function targetsFor(p: Profile | null) {
  const tdee = computeTDEE(p);
  const calories = tdee ? Math.round(tdee * 0.3) : 600;
  return {
    calories,
    protein_g: p?.weight_kg ? Math.round(p.weight_kg * 0.35) : 20,
    carbs_g: p?.goals?.includes("diabetes_friendly") ? 45 : 75,
    fat_g: 22,
    fiber_g: 8,
    sodium_mg_max: p?.goals?.includes("low_sodium") || p?.goals?.includes("heart_healthy") ? 500 : 700,
    notes: "Targets are calculated with normal profile math and goal rules, not Gemini.",
  };
}

export function parseTypedMeal(typedMeal: string): string[] {
  let clean = typedMeal
    .replace(/\band\b/gi, ",")
    .replace(/\bwith\b/gi, ",")
    .replace(/\+/g, ",")
    .replace(/&/g, ",");
  
  let parts = clean.split(",").map(p => p.trim()).filter(Boolean);
  
  if (parts.length === 1) {
    const single = parts[0].toLowerCase();
    const detected: string[] = [];
    
    const keywords = [
      { key: "kacchi biryani", canonical: "Kacchi Biryani" },
      { key: "chicken curry", canonical: "Chicken Curry" },
      { key: "fish curry", canonical: "Rohu Fish" },
      { key: "beef curry", canonical: "Beef Bhuna" },
      { key: "egg bhuna", canonical: "Egg Bhuna" },
      { key: "begun bhaji", canonical: "Begun Bhaji" },
      { key: "aloo bhorta", canonical: "Aloo Bhorta" },
      { key: "mishti doi", canonical: "Sweet Yogurt (Mishti Doi)" },
      { key: "misti doi", canonical: "Sweet Yogurt (Mishti Doi)" },
      { key: "shak", canonical: "Pui Shak" },
      { key: "shaak", canonical: "Pui Shak" },
      { key: "rice", canonical: "Steamed White Rice (Bhat)" },
      { key: "bhat", canonical: "Steamed White Rice (Bhat)" },
      { key: "dal", canonical: "Masoor Dal (Red Lentil)" },
      { key: "daal", canonical: "Masoor Dal (Red Lentil)" },
      { key: "fish", canonical: "Rohu Fish" },
      { key: "chicken", canonical: "Chicken Curry" },
      { key: "beef", canonical: "Beef Bhuna" },
      { key: "mutton", canonical: "Mutton Curry" },
      { key: "egg", canonical: "Egg Bhuna" },
      { key: "dim", canonical: "Egg Bhuna" },
      { key: "paratha", canonical: "Paratha" },
      { key: "porota", canonical: "Paratha" },
      { key: "roti", canonical: "Whole Wheat Flatbread" },
      { key: "ruti", canonical: "Whole Wheat Flatbread" },
      { key: "vegetables", canonical: "Mixed Vegetables" },
      { key: "shobji", canonical: "Mixed Vegetables" },
      { key: "sojbi", canonical: "Mixed Vegetables" },
    ];
    
    let temp = single;
    for (const kw of keywords) {
      if (temp.includes(kw.key)) {
        detected.push(kw.canonical);
        temp = temp.replace(new RegExp(kw.key, 'g'), "");
      }
    }
    
    if (detected.length > 0) {
      return detected;
    }
  }
  
  return parts;
}

export const analyzePlate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<PlateAnalysis> => {
    const parsedDataUrl = data.imageDataUrl ? parseImageDataUrl(data.imageDataUrl) : null;
    const imageBase64 = data.imageBase64 ?? parsedDataUrl?.imageBase64 ?? "";
    const mimeType = normalizeImageMimeType(data.mimeType) ?? parsedDataUrl?.mimeType ?? null;
    if (!data.typedMeal && !data.demoSample) {
      if (!imageBase64 || imageBase64.length < 1000) throw new Error("Image upload failed. Please reupload the photo.");
      if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) throw new Error("Please upload a PNG, JPG, JPEG, or WEBP image.");
    }

    const { supabase, userId } = context;
    const { data: profileRow } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    const profile = (profileRow as Profile | null) ?? null;
    const profileMeta = { profileIncomplete: missingProfileFields(profile).length > 0, missingProfileFields: missingProfileFields(profile), bmi: computeBMI(profile) };

    let edamam: Awaited<ReturnType<typeof lookupEdamamImageFood>> | null = null;
    let gemini: Awaited<ReturnType<typeof analyzeImageWithGeminiVision>> | null = null;
    let modelUsed: PlateAnalysis["modelUsed"] = "template-fallback";
    let detectedFoods: Array<{ name: string; portion?: string; confidence?: "high" | "medium" | "low"; note?: string }> = [];
    let detected = false;
    let fallbackReason: string | undefined;
    let errorCode: string | undefined;

    if (data.demoSample) {
      modelUsed = "demo-sample";
      detected = true;
      const sample = data.demoSample.trim();
      let names = [sample];
      if (sample.toLowerCase().includes("kacchi biryani")) {
        names = ["Kacchi Biryani"];
      } else if (sample.toLowerCase().includes("rice, dal, fish")) {
        names = ["Steamed White Rice (Bhat)", "Masoor Dal (Red Lentil)", "Rohu Fish"];
      } else if (sample.toLowerCase().includes("paratha and egg")) {
        names = ["Paratha", "Egg Bhuna"];
      } else if (sample.toLowerCase().includes("mishti doi")) {
        names = ["Sweet Yogurt (Mishti Doi)"];
      } else if (sample.toLowerCase().includes("rice, dal, chicken curry")) {
        names = ["Steamed White Rice (Bhat)", "Masoor Dal (Red Lentil)", "Chicken Curry"];
      }
      detectedFoods = names.map((n) => ({
        name: n,
        portion: "1 portion",
        confidence: "high",
        note: "Used demo sample."
      }));
    } else if (data.typedMeal) {
      modelUsed = "manual-entry";
      detected = true;
      const parsed = parseTypedMeal(data.typedMeal);
      detectedFoods = parsed.map((n) => ({
        name: n,
        portion: "1 portion",
        confidence: "medium",
        note: "Manual typed entry."
      }));
    } else {
      const imageDataUrl = data.imageDataUrl || "data:" + mimeType + ";base64," + imageBase64;
      edamam = await lookupEdamamImageFood(imageDataUrl);
      
      if (edamam.detected && edamam.foods.length) {
        modelUsed = "edamam-image-food";
        detected = true;
        detectedFoods = edamam.foods.slice(0, 5).map((food) => ({
          name: food.name,
          portion: "1 visible portion",
          confidence: "medium",
          note: "Detected by Edamam; nutrition was calculated by local/USDA lookup.",
        }));
      } else {
        // Fallback to Vision AI
        console.info(`[image-analysis] external provider limited; using vision estimate`);

        const geminiCall = () => analyzeImageWithGeminiVision(imageBase64, mimeType!);
        const openRouterCall = async () => {
          const res = await analyzeImageWithOpenRouterVision(imageBase64, mimeType!);
          if (res.error) throw new Error(res.error);
          return res;
        };
        const fallbackCall = () => {
          return { detected: false, foods: [], fallbackReason: "Image food detection failed." };
        };

        const visionResult = await routeAiCall(geminiCall, openRouterCall, fallbackCall, "vision");

        if (visionResult.result.detected && visionResult.result.foods.length) {
          modelUsed = visionResult.provider === 'openrouter' ? "openrouter-vision-fallback" : "gemini-vision-fallback";
          detected = true;
          detectedFoods = visionResult.result.foods.slice(0, 5).map((food) => ({
            name: food.name,
            portion: "1 visible portion",
            confidence: "medium",
            note: `Detected by ${visionResult.provider === 'openrouter' ? 'OpenRouter' : 'Gemini'} Vision; nutrition was calculated by local/USDA lookup.`,
          }));
        } else {
          fallbackReason = (visionResult.result as any).fallbackReason || visionResult.fallbackReason || "Image food detection failed.";
          errorCode = visionResult.fallbackReason;
        }
      }
    }

    if (!detected || !detectedFoods.length) {
      let publicMessage = fallbackReason || "I could not identify food from this image. Try typing the food name for a nutrition lookup.";
      if (fallbackReason && (
        fallbackReason.includes("AI_QUOTA_EXCEEDED") ||
        fallbackReason.includes("AI_TEMPORARILY_UNAVAILABLE") ||
        fallbackReason.toLowerCase().includes("quota") ||
        fallbackReason.toLowerCase().includes("exhausted") ||
        fallbackReason.toLowerCase().includes("gemini")
      )) {
        publicMessage = "Nutrition scan is temporarily busy. You can still type the meal name or use a demo sample.";
      }

      return {
        detected: false,
        blurry: false,
        nanumoniMessage: publicMessage,
        dishes: [],
        nutrition: emptyNutrition(),
        healthScore: 0,
        healthExplanation: "No food was detected, so no nutrition calculation was made.",
        hygieneNotes: "Image preview is shown, but automated food detection did not complete.",
        idealPlateComparison: "Manual food entry is recommended for this image.",
        idealPlateBreakdown: { shak_shobji_pct: 0, bhat_carbs_pct: 0, dal_protein_pct: 0, notes: "No detected plate composition." },
        goalAlignment: [],
        goalAdjustedTargets: targetsFor(profile),
        personalizedSuggestions: ["Type the visible food name, such as rice, dal, chicken curry, or shak, to use USDA/local nutrition lookup."],
        makeItHealthierTips: [],
        substitutions: [],
        portionAdjustment: "No portion guidance available until a food is identified.",
        budgetAlternatives: [],
        sources: [],
        nutritionEstimated: false,
        nutritionSources: [],
        nutritionNote: "Nutrition estimate based on standard food data.",
        modelUsed: "template-fallback",
        fallbackReason: fallbackReason || "Image food detection is temporarily unavailable",
        detectionUnavailable: true,
        debugMessage: undefined,
        errorCode: errorCode,
        ragGrounding: [],
        ...profileMeta,
      };
    }

    const dishes = await enrichFoodsWithNutrition(detectedFoods, supabase);
    const nutrition = aggregateNutrition(dishes);
    const nutritionSources = Array.from(new Set(dishes.map((dish) => dish.nutrition_source)));
    const score = healthScoreFor(nutrition, profile);
    const goals = profile?.goals ?? [];

    const aiResult = await generatePlateAnalysisInsights(detectedFoods, nutrition, profile);
    const ai = aiResult.data;

    let nanumoniMessage = "Plate scan complete. We identified the visible meal components, cross-checked likely nutrition values, and generated a safety-focused nutrition estimate.";
    if (modelUsed === "demo-sample") nanumoniMessage = "Demo scan complete. We cross-checked typical nutrition values for this demo meal.";
    else if (modelUsed === "manual-entry") nanumoniMessage = "Meal estimate complete. We cross-checked typical nutrition values for the typed ingredients.";

    let nutritionNote = "Estimated from meal components; nutrition database cross-check.";
    if (modelUsed === "demo-sample" || modelUsed === "manual-entry") {
      nutritionNote = "Estimated from typed ingredients; nutrition database cross-check.";
    }

    const compositeKeywords = ["thali", "meal", "plate", "bengali style", "biryani", "curry", "rice"];
    const isComposite = detectedFoods.some(f => compositeKeywords.some(k => f.name.toLowerCase().includes(k)));
    if (isComposite && nutrition.calories > 0 && (nutrition.carbs_g === 0 || nutrition.fiber_g === 0)) {
      nutritionNote = "Nutrition estimate may be incomplete for a full meal. Please confirm or type the main items.";
    }

    return {
      detected: true,
      blurry: false,
      nanumoniMessage,
      dishes,
      nutrition,
      healthScore: score,
      healthExplanation: ai.healthExplanation,
      hygieneNotes: ai.hygieneNotes,
      idealPlateComparison: ai.idealPlateComparison,
      idealPlateBreakdown: ai.idealPlateBreakdown,
      goalAlignment: ai.goalAlignment as any,
      goalAdjustedTargets: targetsFor(profile),
      personalizedSuggestions: ai.personalizedSuggestions,
      makeItHealthierTips: ai.makeItHealthierTips,
      substitutions: ai.substitutions,
      portionAdjustment: ai.portionAdjustment,
      budgetAlternatives: ai.budgetAlternatives,
      sources: ["Edamam", ...nutritionSources, ...(aiResult.usedGemini ? ["Gemini AI"] : [])],
      nutritionEstimated: true,
      nutritionSources,
      nutritionNote,
      modelUsed,
      fallbackReason: aiResult.fallbackReason,
      ragGrounding: dishes.filter((dish) => dish.matched_food_name).map((dish) => ({ dish: dish.name, matched: dish.matched_food_name || "", similarity: dish.nutrition_confidence === "high" ? 0.9 : dish.nutrition_confidence === "medium" ? 0.75 : 0.5 })),
      ...profileMeta,
    };
  });
