export type HealthConcern =
  | "diabetes_concern"
  | "blood_pressure_concern"
  | "gastric_ulcer_concern"
  | "kidney_concern"
  | "pregnancy"
  | "weight_loss"
  | "heart_health"
  | "allergy"
  | "general";

export type NutritionSafetySeverity = "info" | "caution" | "discuss";

export type NutritionSafetyEvidence = {
  source:
    | "nutrition_value"
    | "ingredient_match"
    | "meal_text"
    | "recent_pattern"
    | "profile_goal"
    | "allergy_match"
    | "demo";
  label: string;
  value?: string | number;
};

export type NutritionSafetyFlag = {
  id: string;
  severity: NutritionSafetySeverity;
  title: string;
  message: string;
  reason: string;
  evidence: NutritionSafetyEvidence[];
  suggestedSwap?: string;
  doctorDiscussionQuestion?: string;
};

export type ClinicalNutritionReview = {
  overallLevel: "normal" | "caution" | "discuss";
  flags: NutritionSafetyFlag[];
  safeSummary: string;
  confidence: "low" | "medium" | "high";
  dataQualityNote: string;
  disclaimer: string;
  isDemo?: boolean;
};

export type ReviewMealSafetyInput = {
  mealName?: string;
  mealText?: string;
  ingredients?: string[];
  nutrition?: {
    calories?: number;
    carbs_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
    fat_g?: number;
    saturatedFat_g?: number;
    fiber_g?: number;
    protein_g?: number;
  };
  recentMeals?: Array<{
    name?: string;
    mealText?: string;
    ingredients?: string[];
    nutrition?: ReviewMealSafetyInput["nutrition"];
  }>;
  userProfile?: any;
  goals?: string[];
  allergiesOrAvoids?: string[];
  healthConcerns?: HealthConcern[];
  isDemo?: boolean;
};

const RICE_KEYWORDS = ["rice", "ভাত", "chal", "biryani", "khichuri", "bhat", "polao", "পোলাও", "sweets", "soft drink"];
const FRIED_KEYWORDS = ["fried", "oily", "bhaji", "puri", "singara", "samosa", "pakora", "paratha", "biryani", "deep fried", "ভাজি", "পুরি", "সিঙ্গারা", "পরোটা"];
const SALTY_KEYWORDS = ["chips", "chanachur", "instant noodles", "processed meat", "achar", "pickle", "salty snack", "চানাচুর", "আচার", "নুডলস"];
const VEG_KEYWORDS = ["shak", "shobji", "vegetable", "fruit", "dal", "whole grain", "শাক", "সবজি", "ফল", "ডাল"];
const PROTEIN_KEYWORDS = ["egg", "fish", "chicken", "dal", "chola", "milk", "yogurt", "bean", "ডিম", "মাছ", "মুরগি", "ডাল", "ছোলা"];

function containsAny(text: string, keywords: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

export function sanitizeClinicalSafetyText(text: string): string {
  if (!text) return "";
  let clean = text;
  clean = clean.replace(/\byou have diabetes\b/gi, "if diabetes is a concern");
  clean = clean.replace(/\bdiabetes-safe\b/gi, "may fit some blood sugar goals; discuss with a professional");
  clean = clean.replace(/\bulcer-safe\b/gi, "may be gentler for some people; discuss with a professional");
  clean = clean.replace(/\bcure\b/gi, "support");
  clean = clean.replace(/\btreatment\b/gi, "discussion point");
  clean = clean.replace(/\bmedicine\b/gi, "professional medical advice");
  return clean;
}

export function normalizeHealthConcerns(profileOrInput: any): HealthConcern[] {
  const concerns = new Set<HealthConcern>();
  
  if (!profileOrInput) return [];
  
  const goals = Array.isArray(profileOrInput.goals) ? profileOrInput.goals : [];
  const conditions = Array.isArray(profileOrInput.health_conditions) ? profileOrInput.health_conditions : [];

  if (goals.includes("diabetes_friendly") || conditions.includes("diabetes") || conditions.includes("prediabetes")) {
    concerns.add("diabetes_concern");
  }
  if (goals.includes("heart_healthy") || conditions.includes("high_cholesterol")) {
    concerns.add("heart_health");
  }
  if (goals.includes("low_sodium") || conditions.includes("hypertension")) {
    concerns.add("blood_pressure_concern");
  }
  if (goals.includes("weight_loss")) {
    concerns.add("weight_loss");
  }
  if (conditions.includes("pregnancy") || goals.includes("pregnancy") || conditions.includes("lactating")) {
    concerns.add("pregnancy");
  }
  if (conditions.includes("kidney_care")) {
    concerns.add("kidney_concern");
  }
  if (conditions.includes("ibs")) { // Proxy for gastric/ulcer
    concerns.add("gastric_ulcer_concern");
  }

  // Also check notes or text for "ulcer", "gastric", "allergy"
  const notes = typeof profileOrInput.notes === "string" ? profileOrInput.notes.toLowerCase() : "";
  if (notes.includes("ulcer") || notes.includes("gastric")) {
    concerns.add("gastric_ulcer_concern");
  }

  return Array.from(concerns);
}

export function reviewMealSafety(input: ReviewMealSafetyInput): ClinicalNutritionReview {
  const flags: NutritionSafetyFlag[] = [];
  const n = input.nutrition;
  const mealCombinedText = [input.mealName, input.mealText, ...(input.ingredients || [])].join(" ").toLowerCase();
  
  const concerns = input.healthConcerns || [];
  const allergies = input.allergiesOrAvoids || [];

  const hasNutrition = n && Object.keys(n).length > 0 && ((n.calories || 0) > 0 || (n.protein_g || 0) > 0);
  const confidence: "low" | "medium" | "high" = input.isDemo ? "low" : (hasNutrition && input.ingredients?.length ? "high" : (mealCombinedText && hasNutrition ? "medium" : "low"));
  
  let dataQualityNote = "Based on estimated nutrition values and detected ingredients.";
  if (input.isDemo) {
    dataQualityNote = "Sample demo data only.";
  } else if (!hasNutrition) {
    dataQualityNote = "Based on limited meal text, so this is only a discussion starter.";
  }

  // A. Carb/rice/sugar-heavy pattern
  const isCarbHeavyText = containsAny(mealCombinedText, RICE_KEYWORDS);
  if ((n?.carbs_g && n.carbs_g > 80) || (n?.sugar_g && n.sugar_g > 25) || isCarbHeavyText) {
    flags.push({
      id: "carb_heavy",
      severity: "discuss",
      title: "Carbohydrate portion discussion",
      message: "This meal appears carbohydrate-heavy based on the available estimate. It may be worth asking a doctor/dietitian what rice or carbohydrate portion fits your routine.",
      reason: "High estimated carbs/sugar or frequent rice/sweets detected.",
      evidence: [
        ...(n?.carbs_g ? [{ source: "nutrition_value" as const, label: "Carbs", value: `${n.carbs_g}g` }] : []),
        ...(isCarbHeavyText ? [{ source: "meal_text" as const, label: "Matched", value: "Rice/Staples" }] : [])
      ],
      suggestedSwap: "Add dal/protein/vegetables and consider a smaller rice portion.",
      doctorDiscussionQuestion: "What rice or carbohydrate portion is suitable for my routine and goals?"
    });
  }

  // B. Fried/oily pattern
  const isFriedText = containsAny(mealCombinedText, FRIED_KEYWORDS);
  if ((n?.fat_g && n.fat_g > 30) || isFriedText) {
    flags.push({
      id: "fried_oily",
      severity: "discuss",
      title: "Fried/oily pattern",
      message: "Frequent fried/oily meals can increase calorie and fat intake. Consider discussing lower-oil cooking or portion balance.",
      reason: "High estimated fat or fried items detected.",
      evidence: [
        ...(n?.fat_g ? [{ source: "nutrition_value" as const, label: "Fat", value: `${n.fat_g}g` }] : []),
        ...(isFriedText ? [{ source: "meal_text" as const, label: "Matched", value: "Fried/Oily" }] : [])
      ],
      doctorDiscussionQuestion: "How can I balance fried foods or use lower-oil cooking methods?"
    });
  }

  // C. Sodium/salty/processed pattern
  const isSaltyText = containsAny(mealCombinedText, SALTY_KEYWORDS);
  if ((n?.sodium_mg && n.sodium_mg > 800) || isSaltyText) {
    flags.push({
      id: "sodium_heavy",
      severity: "caution",
      title: "Sodium/salty pattern",
      message: "This meal may be salty or processed based on the available data. It may be worth discussing sodium intake if blood pressure or heart health is a concern.",
      reason: "High estimated sodium or processed items detected.",
      evidence: [
        ...(n?.sodium_mg ? [{ source: "nutrition_value" as const, label: "Sodium", value: `${n.sodium_mg}mg` }] : []),
        ...(isSaltyText ? [{ source: "meal_text" as const, label: "Matched", value: "Processed/Salty" }] : [])
      ],
      doctorDiscussionQuestion: "Should I monitor my sodium intake closely?"
    });
  }

  // D. Low fiber / low vegetable pattern
  const hasVegText = containsAny(mealCombinedText, VEG_KEYWORDS);
  if (hasNutrition && (n?.fiber_g !== undefined && n.fiber_g < 3) && !hasVegText) {
    flags.push({
      id: "low_fiber",
      severity: "info",
      title: "Low fiber / low vegetable pattern",
      message: "Fiber or vegetable intake may be low in the available logs. Consider discussing ways to add dal, shak, vegetables, fruits, or whole grains.",
      reason: "Low estimated fiber and no vegetables/shak detected.",
      evidence: [
        { source: "nutrition_value", label: "Fiber", value: `${n?.fiber_g}g` },
      ],
      suggestedSwap: "Include a portion of shak, mixed vegetables, or a fresh side salad.",
      doctorDiscussionQuestion: "How can I easily add more fiber to my daily meals?"
    });
  }

  // E. Low protein pattern
  const hasProteinText = containsAny(mealCombinedText, PROTEIN_KEYWORDS);
  if (hasNutrition && (n?.protein_g !== undefined && n.protein_g < 10) && !hasProteinText) {
    flags.push({
      id: "low_protein",
      severity: "info",
      title: "Low protein pattern",
      message: "Some meals may be low in protein. Discuss affordable options like egg, dal, fish, chicken, chola, milk, or yogurt.",
      reason: "Low estimated protein and no clear protein source detected.",
      evidence: [
        { source: "nutrition_value", label: "Protein", value: `${n?.protein_g}g` },
      ],
      doctorDiscussionQuestion: "What are some accessible protein sources I should eat daily?"
    });
  }

  // F. Gastric/ulcer concern
  if (concerns.includes("gastric_ulcer_concern") && (isFriedText || containsAny(mealCombinedText, ["spicy", "chili", "jhal", "ঝাল"]))) {
    flags.push({
      id: "gastric_concern",
      severity: "discuss",
      title: "Gastric/ulcer concern support",
      message: "Spicy or oily meals may be uncomfortable for some people with gastric concerns. If this applies to you, discuss gentler meal options with a clinician.",
      reason: "Spicy/fried items detected with gastric concern.",
      evidence: [{ source: "meal_text", label: "Matched", value: "Spicy/Oily" }],
      suggestedSwap: "Soft rice/khichuri, dal, boiled egg, and non-spicy vegetables may be easier options for some people.",
      doctorDiscussionQuestion: "Are there specific spices or cooking methods I should avoid for gastric comfort?"
    });
  }

  // G. Kidney concern
  if (concerns.includes("kidney_concern")) {
    flags.push({
      id: "kidney_concern",
      severity: "discuss",
      title: "Kidney concern support",
      message: "Kidney-related nutrition needs can vary significantly. Please discuss protein, salt, potassium, and fluid choices with a qualified clinician.",
      reason: "Kidney concern noted in profile.",
      evidence: [{ source: "profile_goal", label: "Health Concern", value: "Kidney" }],
      doctorDiscussionQuestion: "What specific limits on protein, sodium, or potassium should I follow?"
    });
  }

  // H. Pregnancy support
  if (concerns.includes("pregnancy")) {
    flags.push({
      id: "pregnancy_concern",
      severity: "info",
      title: "Pregnancy support",
      message: "During pregnancy, food safety and nutrient needs matter. Discuss fish choices, dairy safety, iron, folate, and supplements with a qualified clinician.",
      reason: "Pregnancy noted in profile.",
      evidence: [{ source: "profile_goal", label: "Health Concern", value: "Pregnancy" }],
      doctorDiscussionQuestion: "Are there any specific local foods or supplements I should prioritize or avoid right now?"
    });
  }

  // I. Allergy / avoid foods
  if (allergies.length > 0) {
    const matchedAllergies = allergies.filter(a => mealCombinedText.includes(a.toLowerCase()));
    if (matchedAllergies.length > 0) {
      flags.push({
        id: "allergy_match",
        severity: "discuss",
        title: "Allergy / avoid foods",
        message: "This meal may include an ingredient you marked as an allergy or avoid item. Please check ingredients carefully and discuss with a clinician if needed.",
        reason: "Matched avoid item.",
        evidence: matchedAllergies.map(a => ({ source: "allergy_match", label: "Avoid item", value: a })),
      });
    }
  }

  // J. Weight loss
  if (concerns.includes("weight_loss") && ((n?.calories && n.calories > 700) || (n?.fat_g && n.fat_g > 25) || isFriedText)) {
    flags.push({
      id: "weight_loss_density",
      severity: "info",
      title: "Weight loss / calorie density",
      message: "This meal may be calorie-dense based on the available estimate. Consider discussing portion size and lower-oil preparation styles.",
      reason: "High estimated calories/fat or fried items with weight loss goal.",
      evidence: [{ source: "nutrition_value", label: "Calories", value: `${n?.calories}kcal` }],
      doctorDiscussionQuestion: "What portion sizes are recommended for my weight goals?"
    });
  }

  // K. Heart health
  if ((concerns.includes("heart_health") || concerns.includes("blood_pressure_concern")) && ((n?.sodium_mg && n.sodium_mg > 600) || (n?.fat_g && n.fat_g > 20) || isSaltyText || isFriedText)) {
    flags.push({
      id: "heart_health",
      severity: "discuss",
      title: "Heart health & sodium",
      message: "Meals higher in sodium or fat may impact heart health goals. Consider discussing heart-friendly deshi recipes with a clinician.",
      reason: "High estimated sodium/fat with heart health concern.",
      evidence: [{ source: "profile_goal", label: "Health Concern", value: "Heart/BP" }],
      doctorDiscussionQuestion: "Are there heart-healthy swaps for my favorite deshi meals?"
    });
  }

  const overallLevel = flags.some(f => f.severity === "discuss") ? "discuss" : flags.some(f => f.severity === "caution") ? "caution" : "normal";

  // Deduplicate flags by ID
  const uniqueFlags = Array.from(new Map(flags.map(item => [item.id, item])).values());

  return {
    overallLevel,
    flags: uniqueFlags,
    safeSummary: "General nutrition guidance — not medical advice.",
    confidence,
    dataQualityNote,
    disclaimer: "General nutrition guidance — not medical advice. For medical conditions, consult a qualified doctor or dietitian.",
    isDemo: input.isDemo
  };
}

export function reviewRecentMealPatternSafety(input: ReviewMealSafetyInput): ClinicalNutritionReview {
  // If no recent meals are provided, just review the single meal
  if (!input.recentMeals || input.recentMeals.length === 0) {
    return reviewMealSafety(input);
  }

  const allFlags: NutritionSafetyFlag[] = [];
  
  for (const meal of input.recentMeals) {
    const res = reviewMealSafety({
      ...input,
      mealName: meal.name,
      mealText: meal.mealText,
      ingredients: meal.ingredients,
      nutrition: meal.nutrition
    });
    allFlags.push(...res.flags);
  }

  // Count occurrences of flags
  const flagCounts = new Map<string, number>();
  const flagMap = new Map<string, NutritionSafetyFlag>();
  
  for (const flag of allFlags) {
    flagCounts.set(flag.id, (flagCounts.get(flag.id) || 0) + 1);
    if (!flagMap.has(flag.id)) {
      flagMap.set(flag.id, flag);
    }
  }

  const repeatedFlags: NutritionSafetyFlag[] = [];
  for (const [id, count] of flagCounts.entries()) {
    // If a pattern appears multiple times (or if it's a critical profile-based flag), include it
    if (count > 1 || ["kidney_concern", "pregnancy_concern", "gastric_concern", "allergy_match"].includes(id)) {
      repeatedFlags.push(flagMap.get(id)!);
    }
  }

  // Fallback to top 3 if nothing repeated
  let finalFlags = repeatedFlags.length > 0 ? repeatedFlags : allFlags.slice(0, 3);
  finalFlags = Array.from(new Map(finalFlags.map(item => [item.id, item])).values());

  const overallLevel = finalFlags.some(f => f.severity === "discuss") ? "discuss" : finalFlags.some(f => f.severity === "caution") ? "caution" : "normal";
  const confidence = input.isDemo ? "low" : (input.recentMeals.length >= 3 ? "high" : "medium");

  return {
    overallLevel,
    flags: finalFlags,
    safeSummary: "General nutrition guidance — not medical advice.",
    confidence,
    dataQualityNote: input.isDemo ? "Sample demo data only." : "Based on recent meal pattern logs.",
    disclaimer: "General nutrition guidance — not medical advice. For medical conditions, consult a qualified doctor or dietitian.",
    isDemo: input.isDemo
  };
}
