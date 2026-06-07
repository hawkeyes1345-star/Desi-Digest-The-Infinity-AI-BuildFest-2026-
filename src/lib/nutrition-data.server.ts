import { FOODS, type FoodNutrition, type FoodSeed } from "@/lib/foods-dataset";

export type NutritionSource = "local_db" | "usda" | "fallback";

export type NutritionTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  iron_mg: number;
  vitaminA_ugRAE: number;
  zinc_mg: number;
  sodium_mg: number;
};

export type DetectedFoodForEnrichment = {
  name: string;
  portion?: string;
  portion_grams?: number;
  confidence?: "high" | "medium" | "low";
  nutrition?: Partial<NutritionTotals>;
  note?: string;
};

export type EnrichedFood = DetectedFoodForEnrichment & {
  localName?: string;
  portion: string;
  portion_grams: number;
  nutrition: NutritionTotals;
  source: NutritionSource;
  nutrition_source: NutritionSource;
  nutrition_confidence: "high" | "medium" | "low";
  matched_food_name?: string;
  nutrition_note: string;
};

type LocalMatch = {
  food: FoodSeed;
  similarity: number;
};

type FoodDataCentralSearchFood = {
  fdcId?: number;
  description?: string;
  dataType?: string;
};

type FoodDataCentralFood = {
  fdcId?: number;
  description?: string;
  foodNutrients?: Array<{
    amount?: number;
    nutrientNumber?: string;
    nutrientName?: string;
    nutrient?: {
      number?: string;
      name?: string;
    };
  }>;
};

const ZERO_TOTALS: NutritionTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  iron_mg: 0,
  vitaminA_ugRAE: 0,
  zinc_mg: 0,
  sodium_mg: 0,
};

const FOOD_ALIASES: Record<string, string> = {
  bhat: "steamed white rice",
  "shada bhat": "steamed white rice",
  "sada bhat": "steamed white rice",
  "white rice": "steamed white rice",
  rice: "steamed white rice",
  "cooked rice": "steamed white rice",
  "cooked white rice": "steamed white rice",
  dal: "masoor dal",
  daal: "masoor dal",
  lentil: "masoor dal",
  lentils: "masoor dal",
  dim: "egg bhuna",
  egg: "egg bhuna",
  mach: "rohu fish",
  maach: "rohu fish",
  fish: "rohu fish",
  shak: "pui shak",
  shaak: "pui shak",
  greens: "pui shak",
  ruti: "whole wheat roti",
  roti: "whole wheat roti",
  paratha: "paratha",
  khichuri: "khichuri",
  tehari: "tehari",
  bhorta: "aloo bhorta",
};

const PORTION_GRAMS_BY_FOOD: Record<string, Record<string, number>> = {
  "steamed white rice": {
    cup: 158,
    bowl: 200,
    small: 100,
    medium: 180,
    large: 250,
    portion: 180,
    default: 180,
  },
  "masoor dal": {
    cup: 200,
    bowl: 180,
    small: 90,
    medium: 150,
    large: 220,
    portion: 150,
    default: 150,
  },
  "egg bhuna": {
    piece: 55,
    small: 55,
    medium: 110,
    large: 150,
    portion: 110,
    default: 110,
  },
  default: {
    cup: 150,
    bowl: 180,
    piece: 80,
    small: 100,
    medium: 150,
    large: 220,
    portion: 150,
    default: 150,
  },
};

const FALLBACK_PER_100G: Record<string, NutritionTotals> = {
  "steamed white rice": {
    calories: 130,
    protein_g: 2.7,
    carbs_g: 28.2,
    fat_g: 0.3,
    fiber_g: 0.4,
    iron_mg: 0.4,
    vitaminA_ugRAE: 0,
    zinc_mg: 0.5,
    sodium_mg: 3,
  },
  "masoor dal": {
    calories: 113,
    protein_g: 8,
    carbs_g: 16,
    fat_g: 2.7,
    fiber_g: 5.3,
    iron_mg: 2.3,
    vitaminA_ugRAE: 10,
    zinc_mg: 1,
    sodium_mg: 200,
  },
  "egg bhuna": {
    calories: 167,
    protein_g: 9.3,
    carbs_g: 4.7,
    fat_g: 12,
    fiber_g: 1.3,
    iron_mg: 1.5,
    vitaminA_ugRAE: 120,
    zinc_mg: 1.1,
    sodium_mg: 333,
  },
  "rohu fish": {
    calories: 138,
    protein_g: 17.7,
    carbs_g: 0,
    fat_g: 6.2,
    fiber_g: 0,
    iron_mg: 0.8,
    vitaminA_ugRAE: 23,
    zinc_mg: 0.7,
    sodium_mg: 54,
  },
  "pui shak": {
    calories: 45,
    protein_g: 4,
    carbs_g: 7,
    fat_g: 1,
    fiber_g: 5,
    iron_mg: 2.5,
    vitaminA_ugRAE: 450,
    zinc_mg: 0.6,
    sodium_mg: 50,
  },
  default: {
    calories: 120,
    protein_g: 4,
    carbs_g: 16,
    fat_g: 4,
    fiber_g: 2,
    iron_mg: 1,
    vitaminA_ugRAE: 30,
    zinc_mg: 0.7,
    sodium_mg: 180,
  },
};

export function normalizeFoodName(foodName: string): string {
  const normalized = foodName
    .toLowerCase()
    .replace(/[()/_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (FOOD_ALIASES[normalized]) return FOOD_ALIASES[normalized];

  for (const [alias, canonical] of Object.entries(FOOD_ALIASES)) {
    if (normalized.includes(alias)) return canonical;
  }

  return normalized;
}

export function estimatePortionGrams(foodName: string, portionText?: string, explicitGrams?: number): number {
  if (explicitGrams && explicitGrams > 0) return Math.round(explicitGrams);

  const portion = (portionText || "").toLowerCase();
  const gramsMatch = portion.match(/(\d+(?:\.\d+)?)\s*g(?:ram|rams)?\b/);
  if (gramsMatch) return Math.round(Number(gramsMatch[1]));

  const foodKey = normalizeFoodName(foodName);
  const defaults = PORTION_GRAMS_BY_FOOD[foodKey] ?? PORTION_GRAMS_BY_FOOD.default;
  const multiplier = portion.match(/(\d+(?:\.\d+)?)\s*(?:cup|bowl|piece|serving|portion)/)?.[1];
  const count = multiplier ? Number(multiplier) : 1;

  if (portion.includes("cup")) return Math.round((defaults.cup ?? defaults.default) * count);
  if (portion.includes("bowl") || portion.includes("bati")) return Math.round((defaults.bowl ?? defaults.default) * count);
  if (portion.includes("piece") || portion.includes("pc")) return Math.round((defaults.piece ?? defaults.default) * count);
  if (portion.includes("small")) return defaults.small ?? defaults.default;
  if (portion.includes("medium") || portion.includes("visible")) return defaults.medium ?? defaults.default;
  if (portion.includes("large")) return defaults.large ?? defaults.default;
  if (portion.includes("serving") || portion.includes("portion")) return defaults.portion ?? defaults.default;

  return defaults.default;
}

export async function lookupLocalFoodDb(
  foodName: string,
  supabase?: { from: (table: string) => any },
): Promise<LocalMatch | null> {
  const normalized = normalizeFoodName(foodName);
  const localMatch = matchLocalFood(normalized);
  if (localMatch && localMatch.similarity >= 0.72) return localMatch;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("foods")
        .select("food_id,name_en,name_bn,category,typical_portion_grams,nutrition_per_portion,visual_description,common_combinations,health_tags")
        .or(`name_en.ilike.%${escapeSupabaseLike(normalized)}%,name_bn.ilike.%${escapeSupabaseLike(foodName)}%`)
        .limit(1);

      if (!error && Array.isArray(data) && data[0]) {
        const row = data[0];
        return {
          food: {
            food_id: row.food_id,
            name_en: row.name_en,
            name_bn: row.name_bn,
            category: row.category,
            typical_portion_grams: Number(row.typical_portion_grams || 150),
            nutrition_per_portion: row.nutrition_per_portion,
            visual_description: row.visual_description,
            common_combinations: row.common_combinations ?? "",
            health_tags: row.health_tags ?? [],
            nanumoni_friendly_note: "",
          },
          similarity: 0.76,
        };
      }
    } catch (error) {
      if (process.env.DEBUG === "true") {
        console.error("[nutrition-enrichment] local DB lookup error details", error);
      }
    }
  }

  return localMatch && localMatch.similarity >= 0.6 ? localMatch : null;
}

export async function searchFoodDataCentral(query: string): Promise<FoodDataCentralSearchFood | null> {
  const apiKey = process.env.DATA_GOV_API_KEY?.trim();
  if (!apiKey) return null;

  const baseUrl = process.env.USDA_FDC_BASE_URL?.trim() || "https://api.nal.usda.gov/fdc/v1";
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/foods/search`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "5");
  url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS)");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`FoodData Central search failed: ${response.status}`);
  const json = await response.json();
  const foods = Array.isArray(json.foods) ? json.foods : [];
  return foods.find((food: FoodDataCentralSearchFood) => food.fdcId) ?? null;
}

export async function getFoodNutrition(fdcId: string | number): Promise<NutritionTotals | null> {
  const apiKey = process.env.DATA_GOV_API_KEY?.trim();
  if (!apiKey) return null;

  const baseUrl = process.env.USDA_FDC_BASE_URL?.trim() || "https://api.nal.usda.gov/fdc/v1";
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/food/${fdcId}`);
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`FoodData Central food lookup failed: ${response.status}`);
  const food = (await response.json()) as FoodDataCentralFood;
  return nutritionFromFoodDataCentral(food);
}

export async function estimateNutritionForFood(
  foodName: string,
  portionText?: string,
  explicitGrams?: number,
  supabase?: { from: (table: string) => any },
): Promise<EnrichedFood> {
  const portion = portionText || "1 portion";
  const grams = estimatePortionGrams(foodName, portion, explicitGrams);
  const normalized = normalizeFoodName(foodName);

  const local = await lookupLocalFoodDb(foodName, supabase);
  if (local) {
    return {
      name: foodName,
      localName: local.food.name_bn,
      portion,
      portion_grams: grams,
      nutrition: scaleNutrition(localNutritionToTotals(local.food.nutrition_per_portion), grams, local.food.typical_portion_grams),
      source: "local_db",
      nutrition_source: "local_db",
      nutrition_confidence: local.similarity >= 0.82 ? "high" : "medium",
      matched_food_name: local.food.name_en,
      nutrition_note: "Estimated from local Bangladeshi food data and image-based portion size.",
    };
  }

  try {
    const searchResult = await searchFoodDataCentral(normalized);
    if (searchResult?.fdcId) {
      const per100g = await getFoodNutrition(searchResult.fdcId);
      if (per100g && hasMeaningfulNutrition(per100g)) {
        return {
          name: foodName,
          portion,
          portion_grams: grams,
          nutrition: scaleNutrition(per100g, grams, 100),
          source: "usda",
          nutrition_source: "usda",
          nutrition_confidence: "medium",
          matched_food_name: searchResult.description,
          nutrition_note: "Estimated from USDA FoodData Central and image-based portion size.",
        };
      }
    }
  } catch (error) {
    if (process.env.DEBUG === "true") {
      console.error("[nutrition-enrichment] USDA lookup error details", error);
    }
  }

  console.warn(`[nutrition-enrichment] lookup unavailable for ${foodName}; using estimate`);
  const fallback = FALLBACK_PER_100G[normalized] ?? FALLBACK_PER_100G.default;
  return {
    name: foodName,
    portion,
    portion_grams: grams,
    nutrition: scaleNutrition(fallback, grams, 100),
    source: "fallback",
    nutrition_source: "fallback",
    nutrition_confidence: "low",
    matched_food_name: normalized === foodName.toLowerCase() ? undefined : normalized,
    nutrition_note: "Nutrition is estimated because portion size is based on the image.",
  };
}

export async function enrichFoodsWithNutrition(
  foods: DetectedFoodForEnrichment[],
  supabase?: { from: (table: string) => any },
): Promise<EnrichedFood[]> {
  const enriched = await Promise.all(
    foods.map(async (food) => {
      const result = await estimateNutritionForFood(food.name, food.portion, food.portion_grams, supabase);
      return {
        ...food,
        ...result,
        note: food.note || result.nutrition_note,
      };
    }),
  );

  return enriched.map((food) => {
    if (hasMeaningfulNutrition(food.nutrition)) return food;
    const grams = estimatePortionGrams(food.name, food.portion, food.portion_grams);
    return {
      ...food,
      portion_grams: grams,
      nutrition: scaleNutrition(FALLBACK_PER_100G.default, grams, 100),
      source: "fallback",
      nutrition_source: "fallback",
      nutrition_confidence: "low",
      nutrition_note: "Nutrition is estimated because portion size is based on the image.",
    };
  });
}

export type NutritionSearchResult = {
  query: string;
  name: string;
  portion: string;
  portion_grams: number;
  nutrition: NutritionTotals;
  source: NutritionSource;
  sourceLabel: string;
  confidence: "high" | "medium" | "low";
  matchedFoodName?: string;
  note: string;
};

export async function searchNutritionByQuery(
  query: string,
  supabase?: { from: (table: string) => any },
): Promise<NutritionSearchResult> {
  const enriched = await estimateNutritionForFood(query, "1 portion", undefined, supabase);
  return {
    query,
    name: enriched.localName ? `${enriched.name} (${enriched.localName})` : enriched.name,
    portion: enriched.portion,
    portion_grams: enriched.portion_grams,
    nutrition: enriched.nutrition,
    source: enriched.nutrition_source,
    sourceLabel: formatNutritionSourceLabel(enriched.nutrition_source),
    confidence: enriched.nutrition_confidence,
    matchedFoodName: enriched.matched_food_name,
    note: enriched.nutrition_note,
  };
}

export function formatNutritionSourceLabel(source: NutritionSource): string {
  if (source === "local_db") return "Supabase Desi Food Database";
  if (source === "usda") return "USDA FoodData Central";
  return "Template fallback response";
}

export function aggregateNutrition(foods: EnrichedFood[]): NutritionTotals {
  return roundTotals(
    foods.reduce<NutritionTotals>(
      (sum, food) => ({
        calories: sum.calories + food.nutrition.calories,
        protein_g: sum.protein_g + food.nutrition.protein_g,
        carbs_g: sum.carbs_g + food.nutrition.carbs_g,
        fat_g: sum.fat_g + food.nutrition.fat_g,
        fiber_g: sum.fiber_g + food.nutrition.fiber_g,
        iron_mg: sum.iron_mg + food.nutrition.iron_mg,
        vitaminA_ugRAE: sum.vitaminA_ugRAE + food.nutrition.vitaminA_ugRAE,
        zinc_mg: sum.zinc_mg + food.nutrition.zinc_mg,
        sodium_mg: sum.sodium_mg + food.nutrition.sodium_mg,
      }),
      { ...ZERO_TOTALS },
    ),
  );
}

function matchLocalFood(normalized: string): LocalMatch | null {
  let best: LocalMatch | null = null;
  for (const food of FOODS) {
    const candidates = [
      food.name_en,
      food.name_bn,
      food.food_id,
      food.category,
      food.common_combinations,
    ].map((value) => normalizeLoose(value));

    const score = Math.max(...candidates.map((candidate) => scoreMatch(normalized, candidate)));
    if (!best || score > best.similarity) best = { food, similarity: score };
  }
  return best;
}

function scoreMatch(query: string, candidate: string): number {
  if (!query || !candidate) return 0;
  if (query === candidate) return 1;
  if (candidate.includes(query) || query.includes(candidate)) return 0.86;

  const queryTokens = new Set(query.split(" ").filter(Boolean));
  const candidateTokens = new Set(candidate.split(" ").filter(Boolean));
  const overlap = [...queryTokens].filter((token) => candidateTokens.has(token)).length;
  return overlap / Math.max(queryTokens.size, candidateTokens.size, 1);
}

function normalizeLoose(value: string): string {
  const lowered = value
    .toLowerCase()
    .replace(/[()/_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return FOOD_ALIASES[lowered] ?? lowered;
}

function escapeSupabaseLike(value: string): string {
  return value.replace(/[%_]/g, "");
}

function localNutritionToTotals(nutrition: FoodNutrition): NutritionTotals {
  return {
    calories: numberOrZero(nutrition.calories),
    protein_g: numberOrZero(nutrition.protein_g),
    carbs_g: numberOrZero(nutrition.carbs_g),
    fat_g: numberOrZero(nutrition.fat_g),
    fiber_g: numberOrZero(nutrition.fiber_g),
    iron_mg: numberOrZero(nutrition.iron_mg),
    vitaminA_ugRAE: numberOrZero(nutrition.vitamin_a_mcg),
    zinc_mg: 0,
    sodium_mg: numberOrZero(nutrition.sodium_mg),
  };
}

function nutritionFromFoodDataCentral(food: FoodDataCentralFood): NutritionTotals | null {
  const totals = { ...ZERO_TOTALS };
  for (const item of food.foodNutrients ?? []) {
    const amount = numberOrZero(item.amount);
    const number = item.nutrientNumber ?? item.nutrient?.number ?? "";
    const name = (item.nutrientName ?? item.nutrient?.name ?? "").toLowerCase();

    if (number === "208" || name.includes("energy")) totals.calories = amount;
    if (number === "203" || name === "protein") totals.protein_g = amount;
    if (number === "205" || name.includes("carbohydrate")) totals.carbs_g = amount;
    if (number === "204" || name.includes("total lipid") || name === "fat") totals.fat_g = amount;
    if (number === "291" || name.includes("fiber")) totals.fiber_g = amount;
    if (number === "307" || name.includes("sodium")) totals.sodium_mg = amount;
    if (number === "303" || name.includes("iron")) totals.iron_mg = amount;
    if (number === "320" || name.includes("vitamin a, rae")) totals.vitaminA_ugRAE = amount;
    if (number === "309" || name.includes("zinc")) totals.zinc_mg = amount;
  }

  return hasMeaningfulNutrition(totals) ? totals : null;
}

function scaleNutrition(nutrition: NutritionTotals, grams: number, baseGrams: number): NutritionTotals {
  const factor = grams / Math.max(baseGrams, 1);
  return roundTotals({
    calories: nutrition.calories * factor,
    protein_g: nutrition.protein_g * factor,
    carbs_g: nutrition.carbs_g * factor,
    fat_g: nutrition.fat_g * factor,
    fiber_g: nutrition.fiber_g * factor,
    iron_mg: nutrition.iron_mg * factor,
    vitaminA_ugRAE: nutrition.vitaminA_ugRAE * factor,
    zinc_mg: nutrition.zinc_mg * factor,
    sodium_mg: nutrition.sodium_mg * factor,
  });
}

function roundTotals(nutrition: NutritionTotals): NutritionTotals {
  return {
    calories: Math.round(nutrition.calories),
    protein_g: roundOne(nutrition.protein_g),
    carbs_g: roundOne(nutrition.carbs_g),
    fat_g: roundOne(nutrition.fat_g),
    fiber_g: roundOne(nutrition.fiber_g),
    iron_mg: roundOne(nutrition.iron_mg),
    vitaminA_ugRAE: Math.round(nutrition.vitaminA_ugRAE),
    zinc_mg: roundOne(nutrition.zinc_mg),
    sodium_mg: Math.round(nutrition.sodium_mg),
  };
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function numberOrZero(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function hasMeaningfulNutrition(nutrition: NutritionTotals): boolean {
  return nutrition.calories > 0 || nutrition.protein_g > 0 || nutrition.carbs_g > 0 || nutrition.fat_g > 0;
}
