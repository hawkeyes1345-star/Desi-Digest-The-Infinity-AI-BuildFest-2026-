
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { FOODS, type FoodSeed } from "@/lib/foods-dataset";

function contentHash(f: FoodSeed): string {
  return createHash("sha1").update(JSON.stringify(f)).digest("hex").slice(0, 16);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreFood(query: string, food: FoodSeed) {
  const q = normalize(query);
  const haystack = normalize([food.name_en, food.name_bn, food.category, food.common_combinations, food.health_tags.join(" ")].join(" "));
  if (!q) return 0;
  if (haystack.includes(q)) return 0.9;
  const words = q.split(" ").filter(Boolean);
  if (!words.length) return 0;
  return words.filter((word) => haystack.includes(word)).length / words.length;
}

export const seedFoods = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const rows = FOODS.map((f) => ({
      food_id: f.food_id,
      name_en: f.name_en,
      name_bn: f.name_bn,
      category: f.category,
      typical_portion_grams: f.typical_portion_grams,
      nutrition_per_portion: f.nutrition_per_portion,
      visual_description: f.visual_description,
      common_combinations: f.common_combinations,
      health_tags: f.health_tags,
      nanumoni_friendly_note: f.nanumoni_friendly_note,
      embedding: null,
      embedding_source: "lexical:" + contentHash(f),
    }));
    const { error } = await supabaseAdmin.from("foods").upsert(rows, { onConflict: "food_id" });
    if (error) throw new Error(error.message);
    return { total: FOODS.length, embedded: 0, skipped: 0, model: "lexical-search-no-gemini" };
  });

export const searchFoods = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ query: z.string().min(1).max(1000), limit: z.number().int().min(1).max(20).default(6) }).parse(input))
  .handler(async ({ data, context }) => {
    const localMatches = FOODS.map((food) => ({ food, similarity: scoreFood(data.query, food) }))
      .filter((item) => item.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, data.limit)
      .map(({ food, similarity }) => ({
        food_id: food.food_id,
        name_en: food.name_en,
        name_bn: food.name_bn,
        category: food.category,
        typical_portion_grams: food.typical_portion_grams,
        nutrition_per_portion: food.nutrition_per_portion,
        visual_description: food.visual_description,
        common_combinations: food.common_combinations,
        health_tags: food.health_tags,
        nanumoni_friendly_note: food.nanumoni_friendly_note,
        similarity,
      }));

    if (localMatches.length) return { matches: localMatches, source: "local lexical search" };

    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("foods")
      .select("food_id,name_en,name_bn,category,typical_portion_grams,nutrition_per_portion,visual_description,common_combinations,health_tags,nanumoni_friendly_note")
      .or("name_en.ilike.%" + data.query.replace(/[%_]/g, "") + "%,name_bn.ilike.%" + data.query.replace(/[%_]/g, "") + "%")
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { matches: (rows ?? []).map((row: any) => ({ ...row, similarity: 0.7 })), source: "Supabase lexical search" };
  });
