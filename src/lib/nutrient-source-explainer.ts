
export type NutrientKind =
  | "protein"
  | "carbs"
  | "fiber"
  | "fat"
  | "vitamins_minerals"
  | "hydration"
  | "mixed";

export type NutrientSource = {
  ingredient: string;
  normalizedIngredient: string;
  nutrient: NutrientKind;
  title: string;
  message: string;
  evidence: string[];
  confidence: "high" | "medium" | "low";
};

export type NutrientSourceExplanation = {
  summary: string;
  sources: NutrientSource[];
  confidence: "high" | "medium" | "low";
  dataQualityNote: string;
  disclaimer: string;
};

export type NutrientSourceInput = {
  mealName?: string;
  foodText?: string;
  detectedIngredients?: string[];
  nutrition?: {
    calories?: number;
    carbs_g?: number;
    protein_g?: number;
    fat_g?: number;
    fiber_g?: number;
  };
  isDemo?: boolean;
};

const NUTRIENT_MAPPING: Record<string, { kind: NutrientKind; title: string; message: string }> = {
  // Protein
  "chicken": { kind: "protein", title: "Chicken (Murgi)", message: "Provides animal protein, supporting muscle repair and satiety." },
  "beef": { kind: "protein", title: "Beef (Gorur Mangsho)", message: "High protein and iron source." },
  "mutton": { kind: "protein", title: "Mutton/Goat", message: "Rich source of protein and essential minerals." },
  "fish": { kind: "protein", title: "Fish (Mach)", message: "Provides high-quality protein and healthy fats." },
  "egg": { kind: "protein", title: "Egg (Dim)", message: "Complete protein source, great for daily nutrition." },
  "dal": { kind: "protein", title: "Lentils (Dal)", message: "Important plant protein and fiber source in Desi diets." },
  "chola": { kind: "protein", title: "Chickpeas (Chola)", message: "Provides plant protein and sustained energy." },
  "milk": { kind: "protein", title: "Milk (Dudh)", message: "Source of protein and calcium." },
  "yogurt": { kind: "protein", title: "Yogurt (Doi)", message: "Provides protein and probiotics for gut health." },
  "paneer": { kind: "protein", title: "Paneer", message: "Concentrated dairy protein source." },

  // Carbs
  "rice": { kind: "carbs", title: "Rice (Bhat)", message: "Primary source of carbohydrates for daily energy." },
  "roti": { kind: "carbs", title: "Flatbread (Roti/Ruti)", message: "Provides complex carbohydrates and some fiber if whole grain." },
  "bread": { kind: "carbs", title: "Bread", message: "Quick source of energy from carbohydrates." },
  "paratha": { kind: "carbs", title: "Paratha", message: "Energy-dense carb source, often higher in fats." },
  "potato": { kind: "carbs", title: "Potato (Alu)", message: "Starchy vegetable providing carbohydrates and potassium." },
  "chira": { kind: "carbs", title: "Flattened Rice (Chira)", message: "Easily digestible carbohydrate source." },
  "muri": { kind: "carbs", title: "Puffed Rice (Muri)", message: "Light carbohydrate snack." },
  "oats": { kind: "carbs", title: "Oats", message: "Fiber-rich carbohydrate source for sustained energy." },
  "biryani": { kind: "carbs", title: "Biryani/Polao", message: "Rich energy source from flavored rice and fats." },

  // Fiber / Veggies
  "shak": { kind: "fiber", title: "Leafy Greens (Shak)", message: "Excellent source of fiber, vitamins, and minerals." },
  "vegetables": { kind: "fiber", title: "Mixed Vegetables", message: "Provides essential fiber and micronutrients." },
  "lau": { kind: "fiber", title: "Bottle Gourd (Lau)", message: "Low-calorie, hydrating vegetable with fiber." },
  "begun": { kind: "fiber", title: "Eggplant (Begun)", message: "Provides fiber and antioxidants." },
  "cucumber": { kind: "fiber", title: "Cucumber", message: "Hydrating vegetable with some fiber." },
  "tomato": { kind: "fiber", title: "Tomato", message: "Source of vitamins C, K, and antioxidants." },
  "carrot": { kind: "fiber", title: "Carrot", message: "Rich in vitamin A and fiber." },
  "fruit": { kind: "fiber", title: "Fruit", message: "Natural source of vitamins, fiber, and healthy sugars." },

  // Fat
  "oil": { kind: "fat", title: "Cooking Oil", message: "Provides essential fats and concentrated calories." },
  "ghee": { kind: "fat", title: "Ghee", message: "Traditional fat source, use in moderation for flavor and energy." },
  "butter": { kind: "fat", title: "Butter", message: "Saturated fat source for energy and flavor." },

  // Hydration
  "water": { kind: "hydration", title: "Water", message: "Essential for all bodily functions and hydration." },
};

export function normalizeNutrientIngredient(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("murgi") || lower.includes("chicken")) return "chicken";
  if (lower.includes("gorur") || lower.includes("beef")) return "beef";
  if (lower.includes("chagol") || lower.includes("khashi") || lower.includes("mutton")) return "mutton";
  if (lower.includes("mach") || lower.includes("fish") || lower.includes("ilish") || lower.includes("rui")) return "fish";
  if (lower.includes("dim") || lower.includes("egg")) return "egg";
  if (lower.includes("dal") || lower.includes("lentil")) return "dal";
  if (lower.includes("chola") || lower.includes("boot")) return "chola";
  if (lower.includes("dudh") || lower.includes("milk")) return "milk";
  if (lower.includes("doi") || lower.includes("yogurt")) return "yogurt";
  
  if (lower.includes("bhat") || lower.includes("rice")) return "rice";
  if (lower.includes("ruti") || lower.includes("roti")) return "roti";
  if (lower.includes("bread")) return "bread";
  if (lower.includes("paratha") || lower.includes("porota")) return "paratha";
  if (lower.includes("alu") || lower.includes("potato")) return "potato";
  if (lower.includes("chira")) return "chira";
  if (lower.includes("muri")) return "muri";
  if (lower.includes("oats")) return "oats";
  if (lower.includes("biryani") || lower.includes("polao") || lower.includes("khichuri")) return "biryani";

  if (lower.includes("shak") || lower.includes("spinach")) return "shak";
  if (lower.includes("shobji") || lower.includes("vegetable")) return "vegetables";
  if (lower.includes("lau")) return "lau";
  if (lower.includes("begun") || lower.includes("eggplant")) return "begun";
  if (lower.includes("cucumber") || lower.includes("shosa")) return "cucumber";
  if (lower.includes("tomato")) return "tomato";
  if (lower.includes("carrot") || lower.includes("gajor")) return "carrot";
  if (lower.includes("fruit") || lower.includes("fol")) return "fruit";

  if (lower.includes("oil") || lower.includes("tel")) return "oil";
  if (lower.includes("ghee")) return "ghee";
  if (lower.includes("butter")) return "butter";

  if (lower.includes("water") || lower.includes("pani")) return "water";

  return null;
}

export function getNutrientRoleForIngredient(ingredient: string): NutrientSource | null {
  const normalized = normalizeNutrientIngredient(ingredient);
  if (!normalized || !NUTRIENT_MAPPING[normalized]) return null;

  const data = NUTRIENT_MAPPING[normalized];
  return {
    ingredient,
    normalizedIngredient: normalized,
    nutrient: data.kind,
    title: data.title,
    message: data.message,
    evidence: [`Detected via keyword: ${normalized}`],
    confidence: "medium",
  };
}

export function explainNutrientSources(input: NutrientSourceInput): NutrientSourceExplanation {
  const sources: NutrientSource[] = [];
  const ingredients = input.detectedIngredients || [];
  
  // Also try to extract from meal name or food text
  const extraText = [input.mealName, input.foodText].filter(Boolean).join(" ");
  const allPossible = [...ingredients];
  if (extraText) {
    // Simple split for manual text
    allPossible.push(...extraText.split(/[\s,]+/));
  }

  const seen = new Set<string>();
  for (const raw of allPossible) {
    const role = getNutrientRoleForIngredient(raw);
    if (role && !seen.has(role.normalizedIngredient)) {
      sources.push(role);
      seen.add(role.normalizedIngredient);
    }
  }

  // Demo Fallback
  if (input.isDemo && sources.length === 0) {
    const demoIngredients = ["Chicken Curry", "Steamed Rice", "Dal"];
    for (const raw of demoIngredients) {
      const role = getNutrientRoleForIngredient(raw);
      if (role) sources.push(role);
    }
  }

  return {
    summary: sources.length > 0 
      ? `Main nutrient sources: ${sources.map(s => s.normalizedIngredient).join(", ")}.`
      : "No specific nutrient sources could be clearly identified from the meal text.",
    sources,
    confidence: sources.length > 0 ? "medium" : "low",
    dataQualityNote: "Estimated from detected foods.",
    disclaimer: "Estimated from detected foods — not medical advice."
  };
}
