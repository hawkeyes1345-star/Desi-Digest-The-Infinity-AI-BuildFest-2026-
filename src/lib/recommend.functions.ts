
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeTDEE, summarizeProfile, type Profile } from "@/lib/profile.functions";
import { FOODS } from "@/lib/foods-dataset";

export type NutritionPlan = {
  nanumoni_opener: string;
  daily_targets: { calories: number; protein_g: number; fiber_g: number; water_ml: number };
  meals: Array<{
    meal_type: "breakfast" | "lunch" | "dinner" | "snack";
    name: string;
    portion: string;
    nutrition: { calories: number; protein_g: number; fat_g: number; carbs_g: number; fiber_g: number; sugar_g: number; sodium_mg: number; iron_mg: number; vitaminA_ugRAE: number };
    est_cost_bdt: number;
    reasoning: string;
    swap_tip: string;
  }>;
  weekly_focus: string;
  substitutions: string[];
  restaurant_picks: Array<{ name: string; dish: string; area: string; est_cost_bdt: number; why: string }>;
  reasoning_steps: string[];
};

type MealType = NutritionPlan["meals"][number]["meal_type"];

function toPlanNutrition(food: (typeof FOODS)[number]) {
  const n = food.nutrition_per_portion;
  return {
    calories: n.calories,
    protein_g: n.protein_g,
    fat_g: n.fat_g,
    carbs_g: n.carbs_g,
    fiber_g: n.fiber_g,
    sugar_g: n.sugar_g,
    sodium_mg: n.sodium_mg,
    iron_mg: n.iron_mg,
    vitaminA_ugRAE: n.vitamin_a_mcg,
  };
}

function pickFood(ids: string[]) {
  return ids.map((id) => FOODS.find((food) => food.food_id === id)).filter(Boolean) as (typeof FOODS)[number][];
}

function meal(meal_type: MealType, foods: (typeof FOODS)[number][], cost: number, reasoning: string, swap: string) {
  const nutrition = foods.reduce((sum, food) => {
    const n = toPlanNutrition(food);
    return {
      calories: sum.calories + n.calories,
      protein_g: sum.protein_g + n.protein_g,
      fat_g: sum.fat_g + n.fat_g,
      carbs_g: sum.carbs_g + n.carbs_g,
      fiber_g: sum.fiber_g + n.fiber_g,
      sugar_g: sum.sugar_g + n.sugar_g,
      sodium_mg: sum.sodium_mg + n.sodium_mg,
      iron_mg: sum.iron_mg + n.iron_mg,
      vitaminA_ugRAE: sum.vitaminA_ugRAE + n.vitaminA_ugRAE,
    };
  }, { calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0, iron_mg: 0, vitaminA_ugRAE: 0 });
  return {
    meal_type,
    name: foods.map((food) => food.name_en).join(" + "),
    portion: foods.map((food) => Math.round(food.typical_portion_grams) + "g " + food.name_bn).join(" + "),
    nutrition,
    est_cost_bdt: cost,
    reasoning,
    swap_tip: swap,
  };
}

export function buildPlan(profile: Profile | null): NutritionPlan {
  const tdee = computeTDEE(profile) || 2000;
  const weightLoss = profile?.goals?.includes("weight_loss");
  const muscle = profile?.goals?.includes("muscle_gain");
  const diabetes = profile?.goals?.includes("diabetes_friendly") || profile?.health_conditions?.includes("diabetes");
  const lowSodium = profile?.goals?.includes("low_sodium") || profile?.goals?.includes("heart_healthy") || profile?.health_conditions?.includes("hypertension");
  const targetCalories = Math.round(tdee * (weightLoss ? 0.82 : muscle ? 1.1 : 1));
  const proteinTarget = profile?.weight_kg ? Math.round(profile.weight_kg * (muscle ? 1.6 : 1.1)) : 70;

  const breakfast = meal(
    "breakfast",
    pickFood(["dim-bhuna", "ruti"]).length ? pickFood(["dim-bhuna", "ruti"]) : pickFood(["dim-bhuna", "masoor-dal"]),
    70,
    "Egg or dal adds protein, while a controlled staple portion keeps breakfast practical.",
    diabetes ? "Use atta ruti and avoid sweet tea." : "Add fruit if you need more energy.",
  );
  const lunch = meal(
    "lunch",
    pickFood(["bhat-steamed", "masoor-dal", "pui-shak", "rohu-mach"]),
    130,
    "This follows the Deshi plate pattern: staple, dal, greens, and protein.",
    diabetes ? "Reduce bhat by one third and add more shak." : "Keep oil moderate in fish curry.",
  );
  const dinner = meal(
    "dinner",
    pickFood(["chicken-curry", "pui-shak", "masoor-dal"]),
    150,
    "Dinner emphasizes protein and fiber so it is filling without relying only on rice.",
    lowSodium ? "Cook with less salt and skip achar/shutki." : "Add a small rice or ruti portion if still hungry.",
  );
  const snack = meal(
    "snack",
    pickFood(["chotpoti"]),
    60,
    "Chickpea-based snacks give fiber and some protein; portion still matters.",
    "Choose less tamarind-salt water and avoid extra chanachur if sodium is a concern.",
  );

  return {
    nanumoni_opener: "Here is a database-built Deshi meal plan from your profile. Local food datasets were used for nutrition lookup and calculations.",
    daily_targets: { calories: targetCalories, protein_g: proteinTarget, fiber_g: 25, water_ml: 2200 },
    meals: [breakfast, lunch, dinner, snack],
    weekly_focus: diabetes
      ? "Keep carbs consistent and pair rice/ruti with dal, fish, egg, chicken, and shak. Avoid sweet drinks and large refined-carb portions."
      : lowSodium
        ? "Keep salt moderate this week. Limit achar, shutki, packaged snacks, and restaurant gravies."
        : "Build most meals around the Deshi plate: half vegetables/greens, one quarter staple, one quarter protein.",
    substitutions: [
      diabetes ? "Swap large white bhat portions for smaller bhat plus extra dal and shak." : "Swap deep-fried sides for bhaji or boiled egg when possible.",
      lowSodium ? "Use lemon, chili, coriander, and roasted cumin instead of extra salt." : "Use seasonal vegetables to increase fiber without raising cost much.",
      muscle ? "Add egg, chicken, fish, or extra dal to each main meal." : "Keep protein visible in each meal, even on budget days.",
    ],
    restaurant_picks: profile?.alternative_mode ? [] : [
      { name: "Local bhat hotel", dish: "Bhat + dal + fish + shak", area: profile?.location || "nearby", est_cost_bdt: 150, why: "A common affordable option that can match the Deshi plate pattern." },
    ],
    reasoning_steps: [
      "Calculated daily calories from profile TDEE when available.",
      "Selected foods from the local Desi food dataset.",
      "Summed calories and macros from stored nutrition values.",
      "Applied goal rules for diabetes, sodium, weight, muscle, and budget.",
      "Used template explanations so the plan works even when AI analysis is temporarily busy.",
    ],
  };
}

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NutritionPlan> => {
    const { supabase, userId } = context;
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    const profile = (p as Profile | null) ?? null;
    const plan = buildPlan(profile);
    plan.reasoning_steps.unshift("Profile used: " + summarizeProfile(profile));
    return plan;
  });
