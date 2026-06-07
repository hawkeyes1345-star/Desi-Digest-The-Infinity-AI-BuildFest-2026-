import type { MealLog } from "@/lib/meals.functions";
import type { Profile } from "@/lib/profile.functions";
import type { PlateAnalysis } from "@/lib/analyze-plate.functions";

const DEMO_SESSION_KEY = "deshi-digest-demo-session";
const DEMO_MEALS_KEY = "deshi-digest-demo-meals";
const DEMO_PROFILE_KEY = "deshi-digest-demo-profile";

export function isDemoSession() {
  return typeof window !== "undefined" && localStorage.getItem(DEMO_SESSION_KEY) === "1";
}

export const demoProfile: Profile = {
  user_id: "demo-user",
  display_name: "Tasfiq / Demo User",
  full_name: "Tasfiq / Demo User",
  age: 22,
  sex: "male",
  height_cm: 172,
  weight_kg: 70,
  activity_level: "moderate",
  budget_bdt: 2500,
  budget_period: "weekly",
  goals: ["diabetes_friendly", "weight_loss", "student_budget", "heart_healthy", "ramadan_friendly"],
  health_conditions: ["diabetes"],
  dietary_preference: "non_veg",
  allergies: [],
  notes: "Dhaka University student. Budget-conscious. High risk of blood sugar spikes.",
  location: "Dhaka",
  alternative_mode: false,
  onboarded_at: new Date().toISOString(),
};

// Preloaded meals builder for 7 days
function generateDemoMeals(): MealLog[] {
  const meals: MealLog[] = [];
  const MS_PER_DAY = 86_400_000;
  const now = new Date();

  // Helper to construct date string
  const relativeDate = (daysAgo: number, hours: number, minutes: number) => {
    const d = new Date(now.getTime() - daysAgo * MS_PER_DAY);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  // Preloaded Plates Mock Data
  const mealsList = [
    {
      day: 0,
      hour: 13,
      min: 30,
      type: "lunch",
      name: "Rice, Dal, Chicken Curry, Mixed Vegetables",
      cal: 620,
      pro: 32,
      fat: 14,
      carbs: 85,
      fiber: 5,
      sodium: 580,
      score: 8,
      source: "photo",
      img: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80",
      analysis: "Rice, dal, chicken curry"
    },
    {
      day: 0,
      hour: 20,
      min: 0,
      type: "dinner",
      name: "Fish Thali with Rice, Dal, Rohu Curry, Salad",
      cal: 750,
      pro: 28,
      fat: 18,
      carbs: 110,
      fiber: 4,
      sodium: 650,
      score: 6,
      source: "photo",
      img: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80",
      analysis: "Fish thali"
    },
    {
      day: 1,
      hour: 14,
      min: 0,
      type: "lunch",
      name: "Kacchi Biryani with Borhani",
      cal: 980,
      pro: 35,
      fat: 38,
      carbs: 120,
      fiber: 2,
      sodium: 1100,
      score: 4,
      source: "photo",
      img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      analysis: "Kacchi Biryani"
    },
    {
      day: 2,
      hour: 9,
      min: 15,
      type: "breakfast",
      name: "Paratha with Egg Bhuna",
      cal: 510,
      pro: 14,
      fat: 24,
      carbs: 58,
      fiber: 2,
      sodium: 420,
      score: 5,
      source: "photo",
      img: null,
      analysis: "Paratha & Egg"
    },
    {
      day: 3,
      hour: 13,
      min: 45,
      type: "lunch",
      name: "Vegetable Khichuri",
      cal: 480,
      pro: 12,
      fat: 12,
      carbs: 78,
      fiber: 6,
      sodium: 460,
      score: 7,
      source: "photo",
      img: null,
      analysis: "Vegetable khichuri"
    },
    {
      day: 4,
      hour: 17,
      min: 30,
      type: "snack",
      name: "Mishti Doi",
      cal: 280,
      pro: 6,
      fat: 10,
      carbs: 38,
      fiber: 0,
      sodium: 90,
      score: 5,
      source: "photo",
      img: null,
      analysis: "Mishti doi"
    },
    {
      day: 5,
      hour: 20,
      min: 15,
      type: "dinner",
      name: "Rice, Dal, Fish Curry",
      cal: 650,
      pro: 26,
      fat: 16,
      carbs: 95,
      fiber: 4,
      sodium: 520,
      score: 7,
      source: "photo",
      img: null,
      analysis: "Rice, dal, fish"
    }
  ];

  // Map to MealLogs
  for (const m of mealsList) {
    meals.push({
      id: `demo-${m.day}-${m.type}-${m.hour}`,
      logged_at: relativeDate(m.day, m.hour, m.min),
      meal_type: m.type as any,
      name: m.name,
      notes: m.source === "photo" ? "Preloaded demo scan." : "Preloaded manual log.",
      calories: m.cal,
      protein_g: m.pro,
      fat_g: m.fat,
      carbs_g: m.carbs,
      sugar_g: 0,
      sodium_mg: m.sodium,
      fiber_g: m.fiber,
      water_ml: 0,
      health_score: m.score,
      source: m.source as any,
      image_url: m.img,
      analysis: m.analysis ? (getDemoPlateAnalysis(m.analysis) as any) : null,
    });
  }

  // Water logs (specifically for today to fill macro ring)
  meals.push({
    id: "demo-water-1",
    logged_at: relativeDate(0, 10, 0),
    meal_type: "snack",
    name: "Water",
    notes: null,
    calories: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    fiber_g: 0,
    water_ml: 500,
    health_score: null,
    source: "manual",
    image_url: null,
    analysis: null,
  });

  meals.push({
    id: "demo-water-2",
    logged_at: relativeDate(0, 15, 0),
    meal_type: "snack",
    name: "Water",
    notes: null,
    calories: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    fiber_g: 0,
    water_ml: 1000,
    health_score: null,
    source: "manual",
    image_url: null,
    analysis: null,
  });

  meals.push({
    id: "demo-water-3",
    logged_at: relativeDate(0, 21, 0),
    meal_type: "snack",
    name: "Water",
    notes: null,
    calories: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    fiber_g: 0,
    water_ml: 500,
    health_score: null,
    source: "manual",
    image_url: null,
    analysis: null,
  });

  return meals;
}

export function startDemoSession() {
  if (typeof window === "undefined") return;

  localStorage.setItem(DEMO_SESSION_KEY, "1");
  localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(demoProfile));
  localStorage.setItem(DEMO_MEALS_KEY, JSON.stringify(generateDemoMeals()));
}

export function endDemoSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(DEMO_SESSION_KEY);
  localStorage.removeItem(DEMO_MEALS_KEY);
  localStorage.removeItem(DEMO_PROFILE_KEY);
  localStorage.removeItem("deshi-digest-demo-threads");
}

export function getDemoMeals() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(DEMO_MEALS_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as MealLog[]) : [];
  } catch {
    return [];
  }
}

type DemoMealInput = Pick<
  MealLog,
  "meal_type" | "name" | "calories" | "protein_g" | "fat_g" | "carbs_g" | "fiber_g" | "source"
> & Partial<Pick<MealLog, "health_score" | "image_url" | "analysis" | "notes" | "logged_at" | "sugar_g" | "sodium_mg" | "water_ml">>;

export function addDemoMeal(input: DemoMealInput) {
  const meal: MealLog = {
    id: "demo-" + crypto.randomUUID(),
    logged_at: input.logged_at || new Date().toISOString(),
    meal_type: input.meal_type,
    name: input.name,
    notes: input.notes || null,
    calories: input.calories,
    protein_g: input.protein_g,
    fat_g: input.fat_g,
    carbs_g: input.carbs_g,
    sugar_g: input.sugar_g ?? 0,
    sodium_mg: input.sodium_mg ?? 0,
    fiber_g: input.fiber_g,
    water_ml: input.water_ml ?? 0,
    health_score: input.health_score ?? null,
    source: input.source,
    image_url: input.image_url ?? null,
    analysis: input.analysis ?? null,
  };
  const meals = [meal, ...getDemoMeals()];
  if (typeof window !== "undefined") localStorage.setItem(DEMO_MEALS_KEY, JSON.stringify(meals));
  return meal;
}

export function deleteDemoMeal(id: string) {
  const meals = getDemoMeals().filter((meal) => meal.id !== id);
  if (typeof window !== "undefined") localStorage.setItem(DEMO_MEALS_KEY, JSON.stringify(meals));
  return meals;
}

// ─── Local Mock Plate Analysis Database ───────────────────────────────────────
export function getDemoPlateAnalysis(sampleName: string): PlateAnalysis {
  const normalized = sampleName.toLowerCase();

  // Common properties
  const common = {
    detected: true,
    blurry: false,
    nutritionEstimated: true,
    modelUsed: "demo-sample" as const,
    sources: ["FCTB Database", "Edamam Lookup"],
    nutritionSources: ["FCTB"],
    goalAdjustedTargets: {
      calories: 1650,
      protein_g: 75,
      carbs_g: 45,
      fat_g: 22,
      fiber_g: 8,
      sodium_mg_max: 500,
      notes: "Diabetes friendly & weight loss targets active."
    },
    goalAlignment: [
      { goal: "diabetes_friendly", verdict: "okay" as const, reason: "Carbohydrate portion controlled." },
      { goal: "weight_loss", verdict: "great" as const, reason: "Appropriate calorie window." },
      { goal: "student_budget", verdict: "great" as const, reason: "Highly affordable ingredients." }
    ] as Array<{ goal: string; verdict: "great" | "okay" | "risky"; reason: string }>,
    idealPlateBreakdown: {
      shak_shobji_pct: 35,
      bhat_carbs_pct: 35,
      dal_protein_pct: 30,
      notes: "Decent balance, but could increase leafy greens."
    },
    hygieneNotes: "Ingredients are home-style cooked. Ensure fish/chicken is fully washed.",
    portionAdjustment: "Keep white rice portions moderate (1 to 1.5 cups maximum).",
    budgetAlternatives: ["Swap premium fish for egg curry to reduce daily cost by 40 Tk."],
  };

  if (normalized.includes("kacchi") || normalized.includes("biryani")) {
    return {
      ...common,
      nanumoniMessage: "Kacchi biryani is very delicious, shona, but it is high in calorie and fat. Enjoy in moderation!",
      healthScore: 4,
      dishes: [
        {
          name: "Kacchi Biryani",
          portion: "400g",
          calories: 850,
          protein_g: 30,
          carbs_g: 100,
          fat_g: 32,
          fiber_g: 2,
          sodium_mg: 950,
          typical_portion_grams: 400,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any,
        {
          name: "Borhani",
          portion: "200ml",
          calories: 130,
          protein_g: 5,
          carbs_g: 20,
          fat_g: 6,
          fiber_g: 0,
          sodium_mg: 150,
          typical_portion_grams: 200,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any
      ],
      nutrition: {
        calories: 980,
        protein_g: 35,
        carbs_g: 120,
        fat_g: 38,
        fiber_g: 2,
        sodium_mg: 1100,
        iron_mg: 2.2,
        vitaminA_ugRAE: 80,
        zinc_mg: 3.5
      },
      healthExplanation: "Very high saturated fat from ghee/oil and sodium content. Low dietary fiber content makes it cause rapid blood sugar spikes.",
      idealPlateComparison: "Carbs and fats occupy over 80% of the plate. Leafy greens or fresh salad are completely missing.",
      goalAlignment: [
        { goal: "diabetes_friendly", verdict: "risky" as const, reason: "Refined basmati rice and high fat cause severe glucose spikes." },
        { goal: "weight_loss", verdict: "risky" as const, reason: "Exceeds half of your daily calorie targets in one meal." },
        { goal: "heart_healthy", verdict: "risky" as const, reason: "High saturated fats and sodium can raise cholesterol and blood pressure." }
      ],
      personalizedSuggestions: [
        "Portion control is key: eat half of the served portion and wrap the rest.",
        "Order a plate of cucumber/tomato salad first and eat that before touching the biryani."
      ],
      makeItHealthierTips: [
        "Skip the sweet borhani/soft drink and have plain water instead.",
        "Ask for a lean piece of beef/mutton with less oil gravy."
      ],
      substitutions: [
        { from: "Kacchi Biryani", to: "Chicken Khichuri (oil controlled)", why: "Reduces saturated fat by 60%." }
      ],
      nutritionNote: "Estimated for typical kacchi portion; database cross-check.",
    };
  }

  if (normalized.includes("fish") || normalized.includes("thali") || normalized.includes("rohu")) {
    return {
      ...common,
      nanumoniMessage: "Traditional fish thali is a balanced meal! Just watch out for the white rice portion, shona.",
      healthScore: 6,
      dishes: [
        {
          name: "Steamed White Rice (Bhat)",
          portion: "300g",
          calories: 390,
          protein_g: 7,
          carbs_g: 85,
          fat_g: 1,
          fiber_g: 1,
          sodium_mg: 10,
          typical_portion_grams: 300,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any,
        {
          name: "Rohu Fish Curry",
          portion: "120g",
          calories: 180,
          protein_g: 16,
          carbs_g: 5,
          fat_g: 10,
          fiber_g: 1,
          sodium_mg: 350,
          typical_portion_grams: 120,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any,
        {
          name: "Masoor Dal (Red Lentil)",
          portion: "150g",
          calories: 110,
          protein_g: 8,
          carbs_g: 16,
          fat_g: 4,
          fiber_g: 4,
          sodium_mg: 210,
          typical_portion_grams: 150,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any,
        {
          name: "Pui Shak (Malabar Spinach)",
          portion: "80g",
          calories: 70,
          protein_g: 2,
          carbs_g: 4,
          fat_g: 3,
          fiber_g: 3,
          sodium_mg: 80,
          typical_portion_grams: 80,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any
      ],
      nutrition: {
        calories: 750,
        protein_g: 28,
        carbs_g: 110,
        fat_g: 18,
        fiber_g: 9,
        sodium_mg: 650,
        iron_mg: 3.8,
        vitaminA_ugRAE: 240,
        zinc_mg: 2.1
      },
      healthExplanation: "Great combination of lean protein (fish), fiber (shak), and complex nutrition (dal). However, the rice portion is double what is ideal.",
      idealPlateComparison: "Steamed rice takes up 55% of the plate. Leafy greens should be increased to fill the gap.",
      goalAlignment: [
        { goal: "diabetes_friendly", verdict: "okay" as const, reason: "The presence of fiber from shak and protein from fish/dal buffers the rice sugar spike, but rice size is still high." },
        { goal: "weight_loss", verdict: "okay" as const, reason: "Calorie size is decent, but carbs are high." }
      ],
      personalizedSuggestions: [
        "Add a wedge of lebu (lemon) — vitamin C increases iron absorption from pui shak and dal.",
        "Try to reduce the white rice by one-third."
      ],
      makeItHealthierTips: [
        "Request or cook with less oil in the rohu fish gravy.",
        "Add cucumber slices for extra volume and hydration."
      ],
      substitutions: [
        { from: "White Rice", to: "Red Rice (Lal Chal Bhat)", why: "Lal chal has lower glycemic index and keeps you full longer." }
      ],
      nutritionNote: "Calculated with FCTB standard values; photo verified.",
    };
  }

  if (normalized.includes("chicken") || normalized.includes("curry") || normalized.includes("shobji")) {
    return {
      ...common,
      nanumoniMessage: "Perfect balanced meal! Clean protein, good fiber, and moderate carbs. Well done!",
      healthScore: 8,
      dishes: [
        {
          name: "Steamed White Rice (Bhat)",
          portion: "200g",
          calories: 260,
          protein_g: 5,
          carbs_g: 58,
          fat_g: 0.5,
          fiber_g: 0.5,
          sodium_mg: 5,
          typical_portion_grams: 200,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any,
        {
          name: "Chicken Curry (Murghir Jhol)",
          portion: "150g",
          calories: 220,
          protein_g: 18,
          carbs_g: 4,
          fat_g: 12,
          fiber_g: 0.5,
          sodium_mg: 320,
          typical_portion_grams: 150,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any,
        {
          name: "Masoor Dal (Red Lentil)",
          portion: "150g",
          calories: 110,
          protein_g: 8,
          carbs_g: 16,
          fat_g: 4,
          fiber_g: 4,
          sodium_mg: 210,
          typical_portion_grams: 150,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any,
        {
          name: "Mixed Vegetables (Shobji)",
          portion: "100g",
          calories: 80,
          protein_g: 3,
          carbs_g: 12,
          fat_g: 3,
          fiber_g: 4,
          sodium_mg: 90,
          typical_portion_grams: 100,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any
      ],
      nutrition: {
        calories: 670,
        protein_g: 34,
        carbs_g: 90,
        fat_g: 19.5,
        fiber_g: 9,
        sodium_mg: 625,
        iron_mg: 3.1,
        vitaminA_ugRAE: 190,
        zinc_mg: 2.8
      },
      healthExplanation: "Outstanding macro ratios! Protein meets targets, vegetables supply dietary fiber, and sodium is well within limits.",
      idealPlateComparison: "Almost perfect alignment with the Deshi healthy plate template (1/4 protein, 1/4 carbs, 1/2 veggies/lentils).",
      goalAlignment: [
        { goal: "diabetes_friendly", verdict: "great" as const, reason: "Excellent ratio of fiber and protein to slow down starch absorption." },
        { goal: "weight_loss", verdict: "great" as const, reason: "Highly satiating at under 700 kcal." },
        { goal: "student_budget", verdict: "great" as const, reason: "Uses common, affordable local ingredients." }
      ],
      personalizedSuggestions: [
        "This is your benchmark meal template! Keep logging meals that look like this.",
        "Add a side of lemon to boost digestion."
      ],
      makeItHealthierTips: [
        "Cook chicken without skin to reduce saturated fat further.",
        "Ensure shobji is lightly cooked to retain micronutrients."
      ],
      substitutions: [
        { from: "Steamed White Rice", to: "Lal Atta Ruti", why: "Further improves glycemic index profile." }
      ],
      nutritionNote: "Verified balanced plate. Calculated from FCTB datasets.",
    };
  }

  if (normalized.includes("paratha") || normalized.includes("egg")) {
    return {
      ...common,
      nanumoniMessage: "Paratha has extra oil, shona. Egg is a fantastic protein but watch the frying oil.",
      healthScore: 5,
      dishes: [
        {
          name: "Paratha",
          portion: "1 piece (80g)",
          calories: 290,
          protein_g: 5,
          carbs_g: 42,
          fat_g: 15,
          fiber_g: 1,
          sodium_mg: 180,
          typical_portion_grams: 80,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any,
        {
          name: "Egg Bhuna",
          portion: "1 egg (60g)",
          calories: 140,
          protein_g: 7,
          carbs_g: 2,
          fat_g: 11,
          fiber_g: 0,
          sodium_mg: 210,
          typical_portion_grams: 60,
          nutrition_confidence: "high",
          nutrition_source: "FCTB",
        } as any
      ],
      nutrition: {
        calories: 430,
        protein_g: 12,
        carbs_g: 44,
        fat_g: 26,
        fiber_g: 1,
        sodium_mg: 390,
        iron_mg: 1.8,
        vitaminA_ugRAE: 90,
        zinc_mg: 1.2
      },
      healthExplanation: "Paratha is cooked with a high amount of oil/dalda, which raises saturated fat. Combined with egg bhuna, it provides a solid amount of protein but lacks dietary fiber.",
      idealPlateComparison: "Very high fat percentage (~55% of calories). No shobji or fiber.",
      goalAlignment: [
        { goal: "diabetes_friendly", verdict: "okay" as const, reason: "Egg protein helps but paratha's white flour (maida) raises sugar." },
        { goal: "weight_loss", verdict: "okay" as const, reason: "Calorie load is low enough, but fat percentage is high." }
      ],
      personalizedSuggestions: [
        "Swap paratha for ruti to cut oil by 80%.",
        "Add a side of mixed vegetables or papaya bhaji."
      ],
      makeItHealthierTips: [
        "Pat dry the paratha with a tissue to remove excess oil.",
        "Boil the egg instead of frying/bhuna in oil."
      ],
      substitutions: [
        { from: "Paratha", to: "Lal Atta Ruti", why: "Provides complex carbs and removes frying oil entirely." }
      ],
      nutritionNote: "FCTB lookup for paratha and egg.",
    };
  }

  // Default fallback (e.g. Mishti Doi / General)
  return {
    ...common,
    nanumoniMessage: "Khabar scan complete! Looks tasty, shona. Keep an eye on sugar and portion sizes.",
    healthScore: 5,
    dishes: [
      {
        name: sampleName || "Demo Plate",
        portion: "1 portion",
        calories: 280,
        protein_g: 6,
        carbs_g: 38,
        fat_g: 10,
        fiber_g: 0,
        sodium_mg: 90,
        typical_portion_grams: 150,
        nutrition_confidence: "medium",
        nutrition_source: "FCTB",
      } as any
    ],
    nutrition: {
      calories: 280,
      protein_g: 6,
      carbs_g: 38,
      fat_g: 10,
      fiber_g: 0,
      sodium_mg: 90,
      iron_mg: 0.5,
      vitaminA_ugRAE: 20,
      zinc_mg: 0.4
    },
    healthExplanation: "Sweetened local dessert. High in refined sugar and moderate in dairy fat. Fine as an occasional treat, but watch out for blood sugar spikes.",
    idealPlateComparison: "Pure dessert, should not replace a main meal.",
    goalAlignment: [
      { goal: "diabetes_friendly", verdict: "risky" as const, reason: "Contains added sugar, which spikes blood glucose quickly." },
      { goal: "weight_loss", verdict: "okay" as const, reason: "Fine if taken in a small cup portion (~100g)." }
    ],
    personalizedSuggestions: [
      "Limit to once or twice a week.",
      "Prefer Tok Doi (sour yogurt) which has no added sugar and supports gut health."
    ],
    makeItHealthierTips: [
      "Share with a friend to cut portion size.",
      "Pair with raw almonds/nuts to buffer sugar absorption."
    ],
    substitutions: [
      { from: "Mishti Doi", to: "Tok Doi (Sour Yogurt)", why: "Contains zero added sugars and active probiotics." }
    ],
    nutritionNote: "Calculated for Sweet Yogurt from FCTB dataset.",
  };
}

// ─── Local Mock Chat Responses ────────────────────────────────────────────────
export function getLocalDemoResponse(prompt: string): string {
  const prefix = "Dadubhai, demo mode-e ami limited sample guidance dite pari. Full personalized Nanumoni AI chat use korte Gmail diye sign in korun.\n\nShort answer: ";
  const raw = getRawLocalDemoResponse(prompt);
  if (raw.startsWith("Sona, demo mode-e ami suggested")) return raw;
  return prefix + raw;
}

function getRawLocalDemoResponse(prompt: string): string {
  const p = prompt.toLowerCase();

  if (p.includes("alu na dim") || p.includes("dim na alu")) {
    return "Sona, duitar moddhe **dim (egg)** khaoata shobcheye beneficial! Dime high-quality protein ebong healthy fat thake, ja shorirer jonno dorkari complete nutrient. Alu holo carbohydrate ba starch, ja energy diley-o dime thaka protein alute pabe na.\n\nTobe alu ekebare kharap na. Jodi tori-torkarite ba shobji hishebe alu khan, sheta energy dibe. But daily diet e dim rakhle muscle build-up ebong immunity barate help korbe.\n\n**Nanumoni Suggestion**: Din er moddhe ekta ba duita boiled dim (shiddho dim) khaoar cheshtha koro. R alu khele poriman thik rekhe bhaat ba ruti ektu komiye khao.\n\n*General nutrition guidance — not medical advice.*";
  }

  if (p.includes("diabetes") && p.includes("biryani")) {
    return "Khabo na bollei to mon manbe na 😄 Tobe shona, diabetes thakle **bina niyontrone biryani na khaoatai safe**. Biryani-te proshur porimane refined white rice (bhat) ebong saturated fat thake, ja blood sugar hothat khub baraye dite pare.\n\nJodi khub khete icche kore, nicheer niyom gulo follow koro:\n- Portion control koro, choto ek bati biryani khao.\n- Biryani-r shathe double plate shosh/shobji/salata khao, eta carbohydrate digestion slow korbe.\n- Chicken/beef er lean piece khao, chorbi avoid koro.\n\n**Nanumoni Suggestion**: Biryani khaoar por ektu hete nio (light walk). Eta insulin sensitivity barate help korbe.\n\n*General nutrition guidance — not medical advice.*";
  }

  if (p.includes("student budget") || p.includes("sosta protein") || p.includes("sostay protein") || p.includes("protein ki khabo")) {
    return "Sona, student budget e thakle protein niye chinta korar kisu nai! Bangladesh e protein er cheap and best source holo **dim, masoor dal, ebong chola/chinabadam**.\n\n- **Dim (Egg)**: Proti-pice dime pray 6g protein thake, khub sashroyee source.\n- **Dal & Chola**: Dal-bhat e protein complementary protein hoy. R chola-bhedano/badam khub sosta high-protein snack.\n- **Punti/Mola mach**: Sosta choto mach.\n\n**Nanumoni Suggestion**: Daily active student diet e 1-2 ti shiddho dim, ekti bati ghono dal ebong badam rakho. Budget e protein er chinta dur hobe.\n\n*General nutrition guidance — not medical advice.*";
  }

  if (p.includes("rice na roti") || p.includes("bhat na ruti")) {
    return "Sona, weight loss ebong diabetes er jonno **ruti (lal atta ruti) best option**. Karongi rutite fiber beshi thake, ja blood sugar control e rakhe ebong pet onekkhon bhora rakhe.\n\nTobe, bhaat (rice) khele-o problem nai. Bhaat khub shohoje digestible energy dey, shudhu porimaner dike kheyal rakhte hobe. Bhaat beshi khele carbohydrate intake barhe ebong blood sugar spike hote pare.\n\n**Nanumoni Suggestion**: Dupur er meal e 1.5 cup bhaat ebong raat e 2 ta ruti khete paro. Shonge oboshoy ghono dal ebong shobji rakhbe.\n\n*General nutrition guidance — not medical advice.*";
  }

  if (p.includes("air fryer") && p.includes("cancer")) {
    return "Eishob kothay kan dio na, sona! Air fryer e khele **cancer hoy na**. As असल (ashol) kotha holo, air fryer e deep fry er cheye onek kom tel (oil) use kora hoy. Tai eta onnano bhaja-pora theke generally beshi healthy.\n\nTobe kono khabar-i jodi excessively puriye (charred/burnt) khao, tahole shekhan theke acrylamide toiri hote pare ja health er jonno kharap. Tai air fryer ba normal chula—jemon e hok, khabar puriye fela thik na.\n\n**Nanumoni Suggestion**: Air fryer e chicken ba shobji roast korle temperature moderate rekho ebong khabar purte dio na.\n\n*General nutrition guidance — not medical advice.*";
  }

  if ((p.includes("goru") || p.includes("beef")) && (p.includes("murgi") || p.includes("chicken"))) {
    return "Sona, daily khaoar jonno **murgi (chicken) better option**. Murgi holo lean protein, jate saturated fat (chorbi) kom thake. Regular murgi khele heart er upor pressure pore na ebong weight control e thake.\n\nGoru (beef) e high-quality protein ebong iron thakleo, er sathe proshur saturated fat thake ja cholesterol barate pare. Tai gorur mangsho occasionally (majhe majhe) khaoatai safe.\n\n**Nanumoni Suggestion**: Daily basis e murgi ba mach khao, ar maashe 1-2 din gorur mangsho khete paro, kintu chorbi chara (lean cut) niyo.\n\n*General nutrition guidance — not medical advice.*";
  }

  if (p.includes("chotpoti") && p.includes("daler bora")) {
    return "Dui tai to majhe majhe khete mon chay! Tobe **chotpoti beshi healthy** option. Chotpotite dabli (motor/peas) thake ja fiber ebong plant protein er bhalo utsho. Tok (tamarind) ebong fresh shobji/kacha morich add korle vitamin o pawa jay.\n\nDaler bora on the other hand, beshir bhag shomoy deep fry kora hoy (onek tele bhaja), ja calories ebong fat onek baraye dey.\n\n**Nanumoni Suggestion**: Baire theke khaoar shomoy chotpoti try koro, tobe mishti tok (sweet sauce) kom niyo. Daler bora khele bashay alpo tele bhaja ta khao.\n\n*General nutrition guidance — not medical advice.*";
  }

  if (p.includes("dudh") || p.includes("dush")) {
    if (p.includes("murgir")) {
      return "Arre sona, **murgir to dudh hoy na!** 😄 Murgi dim dey, ja theke amra excellent protein pai.\n\nJodi apni janwarer dudh er kotha bolen, tahole gorur dudh (cow's milk) holo bhalo source ja theke calcium ebong protein pawa jay.\n\n**Nanumoni Suggestion**: Protidin ek glass gorur dudh (kom fat/skimmed hole better) khete paren. Ar murgi theke dim naben!\n\n*General nutrition guidance — not medical advice.*";
    }
  }

  return "Sona, demo mode-e ami suggested questions gulo khub bhalo bhabhe uttor dite pari! Apni nicher suggested question gulo check korte paren ba normal dashboard explore korte paren. Ami apnar profile goals 'diabetes friendly, weight loss' ebong 'student budget' er upor vitti kore help korchi.\n\n*General nutrition guidance — not medical advice.*";
}
