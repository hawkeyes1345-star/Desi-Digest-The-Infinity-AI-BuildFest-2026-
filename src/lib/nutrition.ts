// Shared nutrition types + badge derivation. Pure helpers (client + server safe).

export type NutritionFacts = {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  sugar_g?: number;
  sodium_mg?: number;
  fiber_g?: number;
  iron_mg?: number;
  vitaminA_ugRAE?: number;
  zinc_mg?: number;
};

export type FoodBadge =
  | "High Protein"
  | "Low Oil"
  | "Diabetic Friendly"
  | "Heart Friendly"
  | "Iron-Rich"
  | "Vitamin-A Rich"
  | "Budget-Friendly"
  | "High Fiber"
  | "Low Sodium"
  | "Easy Digest";

export function deriveBadges(n: NutritionFacts, opts?: { costBdt?: number }): FoodBadge[] {
  const b: FoodBadge[] = [];
  if (n.protein_g >= 15) b.push("High Protein");
  if (n.fat_g <= 8) b.push("Low Oil");
  if ((n.fiber_g ?? 0) >= 5) b.push("High Fiber");
  if ((n.sugar_g ?? 0) <= 8 && (n.fiber_g ?? 0) >= 4) b.push("Diabetic Friendly");
  if (n.fat_g <= 12 && (n.sodium_mg ?? 0) <= 500) b.push("Heart Friendly");
  if ((n.iron_mg ?? 0) >= 3) b.push("Iron-Rich");
  if ((n.vitaminA_ugRAE ?? 0) >= 300) b.push("Vitamin-A Rich");
  if ((n.sodium_mg ?? Infinity) <= 300) b.push("Low Sodium");
  if (opts?.costBdt !== undefined && opts.costBdt <= 60) b.push("Budget-Friendly");
  return b;
}

// Rough digestion-friendliness score (0-10) tuned for Bangladeshi eating context.
export function digestionScore(n: NutritionFacts): number {
  let s = 7;
  if (n.fat_g > 20) s -= 2;
  if (n.fat_g > 35) s -= 1;
  if ((n.fiber_g ?? 0) >= 5) s += 1;
  if ((n.sodium_mg ?? 0) > 1000) s -= 1;
  if ((n.sugar_g ?? 0) > 25) s -= 1;
  if (n.calories > 900) s -= 1;
  return Math.max(0, Math.min(10, s));
}

export const DAILY_TARGETS = {
  calories: 2000,
  protein_g: 60,
  fiber_g: 28,
  iron_mg: 18,
  water_ml: 2500,
};
