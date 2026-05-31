
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ALLOWED_IMAGE_MIME_TYPES, normalizeImageMimeType, parseImageDataUrl } from "@/lib/image-mime";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type Profile, computeBMI, computeTDEE } from "@/lib/profile.functions";
import { aggregateNutrition, enrichFoodsWithNutrition } from "@/lib/nutrition-data.server";
import { lookupEdamamImageFood } from "@/lib/external-api.server";

const InputSchema = z
  .object({
    imageBase64: z.string().min(32).max(8_000_000).optional(),
    mimeType: z.string().max(64).optional(),
    imageDataUrl: z.string().min(32).max(8_000_000).optional(),
    userContext: z.string().max(500).optional(),
  })
  .refine((input) => Boolean(input.imageBase64 || input.imageDataUrl), { message: "Image payload is required" });

export type PlateAnalysis = {
  detected: boolean;
  blurry: boolean;
  nanumoniMessage: string;
  dishes: any[];
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
  modelUsed: "edamam-image-food" | "template-fallback";
  fallbackReason?: string;
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

export const analyzePlate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<PlateAnalysis> => {
    const parsedDataUrl = data.imageDataUrl ? parseImageDataUrl(data.imageDataUrl) : null;
    const imageBase64 = data.imageBase64 ?? parsedDataUrl?.imageBase64 ?? "";
    const mimeType = normalizeImageMimeType(data.mimeType) ?? parsedDataUrl?.mimeType ?? null;
    if (!imageBase64 || imageBase64.length < 1000) throw new Error("Image upload failed. Please reupload the photo.");
    if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) throw new Error("Please upload a PNG, JPG, JPEG, or WEBP image.");

    const { supabase, userId } = context;
    const { data: profileRow } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    const profile = (profileRow as Profile | null) ?? null;
    const profileMeta = { profileIncomplete: missingProfileFields(profile).length > 0, missingProfileFields: missingProfileFields(profile), bmi: computeBMI(profile) };
    const imageDataUrl = data.imageDataUrl || "data:" + mimeType + ";base64," + imageBase64;

    const edamam = await lookupEdamamImageFood(imageDataUrl);
    if (!edamam.detected || !edamam.foods.length) {
      return {
        detected: false,
        blurry: false,
        nanumoniMessage: edamam.error
          ? "Food image detection is temporarily unavailable. You can still type the food name and I will search the nutrition database."
          : "I could not identify food from this image. Try typing the food name for a nutrition lookup.",
        dishes: [],
        nutrition: emptyNutrition(),
        healthScore: 0,
        healthExplanation: "No food was detected by Edamam, so no nutrition calculation was made.",
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
        sources: ["Edamam"],
        nutritionEstimated: false,
        nutritionSources: [],
        nutritionNote: "Template fallback response.",
        modelUsed: "template-fallback",
        fallbackReason: edamam.error,
        ragGrounding: [],
        ...profileMeta,
      };
    }

    const detectedFoods = edamam.foods.slice(0, 5).map((food) => ({
      name: food.name,
      portion: "1 visible portion",
      confidence: "medium" as const,
      note: "Detected by Edamam; nutrition was calculated by local/USDA lookup.",
    }));
    const dishes = await enrichFoodsWithNutrition(detectedFoods, supabase);
    const nutrition = aggregateNutrition(dishes);
    const nutritionSources = Array.from(new Set(dishes.map((dish) => dish.nutrition_source)));
    const score = healthScoreFor(nutrition, profile);
    const goals = profile?.goals ?? [];

    return {
      detected: true,
      blurry: false,
      nanumoniMessage: "I found food in your image using Edamam, then calculated nutrition from the database.",
      dishes,
      nutrition,
      healthScore: score,
      healthExplanation: "Food detection came from Edamam. Calories and nutrients were calculated from local Desi food data, USDA, or curated fallback data. Gemini was not used for detection or calculation.",
      hygieneNotes: "I cannot reliably judge hygiene from this API result, so treat freshness visually yourself.",
      idealPlateComparison: "A balanced Deshi plate usually has half shak-shobji, one quarter bhat/ruti, and one quarter dal/fish/meat/egg.",
      idealPlateBreakdown: { shak_shobji_pct: 0, bhat_carbs_pct: 0, dal_protein_pct: 0, notes: "Edamam detects foods, but does not provide reliable plate-area percentages here." },
      goalAlignment: goals.map((goal) => ({ goal, verdict: score >= 7 ? "great" : score >= 4 ? "okay" : "risky", reason: "Verdict is based on calculated calories, macros, fiber, and sodium." })),
      goalAdjustedTargets: targetsFor(profile),
      personalizedSuggestions: ["Use the source labels below to judge confidence.", "For better nutrition estimates, type the dish name if the image result looks wrong."],
      makeItHealthierTips: ["Add dal, egg, fish, or chicken if protein is low.", "Add shak or vegetables to improve fiber and micronutrients."],
      substitutions: nutrition.carbs_g > 70 ? [{ from: "large white rice portion", to: "smaller rice portion plus more dal/shak", why: "This can make the meal gentler on blood sugar." }] : [],
      portionAdjustment: "Portions are estimated because image APIs do not reliably measure grams. Confirm by typing the food and portion for a tighter estimate.",
      budgetAlternatives: profile?.goals?.includes("student_budget") ? ["Dal + egg + seasonal shak is usually cheaper than restaurant protein."] : [],
      sources: ["Edamam", ...nutritionSources],
      nutritionEstimated: true,
      nutritionSources,
      nutritionNote: "Detected by Edamam; nutrition calculated from local/USDA/fallback data. Template fallback response if Edamam is unavailable.",
      modelUsed: "edamam-image-food",
      ragGrounding: dishes.filter((dish) => dish.matched_food_name).map((dish) => ({ dish: dish.name, matched: dish.matched_food_name || "", similarity: dish.nutrition_confidence === "high" ? 0.9 : dish.nutrition_confidence === "medium" ? 0.75 : 0.5 })),
      ...profileMeta,
    };
  });
