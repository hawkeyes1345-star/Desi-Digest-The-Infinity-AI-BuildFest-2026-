import { type MealLog } from "./meals.functions";
import { type HabitState } from "./smart-health-nudge";

export type CareCompanionDataSource =
  | "real_meal_logs"
  | "plate_analysis"
  | "dashboard_summary"
  | "smart_nudge"
  | "nudge_feedback"
  | "demo_fallback"
  | "empty_state";

export type CareCompanionConfidence = "low" | "medium" | "high";

export type CareCompanionSummary = {
  periodLabel: string;
  dataSourcesUsed: CareCompanionDataSource[];
  confidence: CareCompanionConfidence;
  mealPatternNotes: string[];
  nutritionDiscussionPoints: string[];
  questionsToAsk: string[];
  suggestedNextSteps: string[];
  trackingSuggestions: string[];
  redFlagReminder: string;
  shareText: string;
  disclaimer: string;
  isDemo?: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const OILY_KEYWORDS = [
  "fried", "bhaji", "puri", "singara", "samosa", "pakora", "paratha", "biryani", 
  "oily", "deep fried", "ভাজি", "পুরি", "সিঙ্গারা", "পরোটা", "বিরিয়ানি", "তেল", "তেলাক্ত"
];

const RICE_KEYWORDS = ["rice", "ভাত", "chal", "biryani", "khichuri", "bhat", "পোলাও", "polao"];

const VEG_KEYWORDS = ["vegetable", "shak", "shobji", "শাক", "সবজি", "সালাদ", "salad", "fruit", "fol"];

const PROTEIN_KEYWORDS = ["egg", "fish", "chicken", "dal", "chola", "milk", "yogurt", "dim", "mach", "murgi", "ডাল", "ছোলা", "ডিম", "মাছ", "মুরগি"];

const PROCESSED_KEYWORDS = ["chips", "chanachur", "noodles", "processed", "salty", "achar", "pickle", "চানাচুর", "নুডলস", "আচার"];

// ─── Helper Functions ────────────────────────────────────────────────────────

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

export function generateCareCompanionSummary(
  profile: any,
  meals: MealLog[],
  habitState: HabitState | null,
  isDemo: boolean
): CareCompanionSummary {
  const dataSources: CareCompanionDataSource[] = [];
  if (isDemo) dataSources.push("demo_fallback");
  if (meals.length > 0) {
    dataSources.push("real_meal_logs");
    if (meals.some(m => m.source === "photo")) dataSources.push("plate_analysis");
  }
  if (habitState && habitState.days.length > 0) dataSources.push("nudge_feedback");
  if (dataSources.length === 0) dataSources.push("empty_state");

  let confidence: CareCompanionConfidence = "low";
  if (meals.length >= 7) confidence = "high";
  else if (meals.length >= 3) confidence = "medium";

  const mealPatternNotes: string[] = [];
  const nutritionDiscussionPoints: string[] = [];
  const questionsToAsk: string[] = [];
  const suggestedNextSteps: string[] = [];
  const trackingSuggestions: string[] = [];

  // 1. Analyze Oily/Fried Patterns
  const oilyMeals = meals.filter(m => containsAny(m.name, OILY_KEYWORDS) || (m.notes && containsAny(m.notes, OILY_KEYWORDS)));
  if (oilyMeals.length > 0) {
    mealPatternNotes.push(`Detected ${oilyMeals.length} meal(s) containing fried or oily items.`);
    nutritionDiscussionPoints.push("Recent meals include fried or oily items. Ask whether reducing deep-fried meals would support your current goals.");
    questionsToAsk.push("Are fried snacks or oily meals okay occasionally, and how often?");
  }

  // 2. Analyze Carbohydrate/Rice Patterns
  const riceMeals = meals.filter(m => containsAny(m.name, RICE_KEYWORDS));
  if (riceMeals.length >= meals.length * 0.5 && meals.length > 0) {
    mealPatternNotes.push("Rice or carbohydrate-based staples appear in the majority of logged meals.");
    nutritionDiscussionPoints.push("Rice portions may be high in some meals. Ask what portion size fits your routine and goals.");
    questionsToAsk.push("What rice portion is suitable for my routine and health goals?");
  }

  // 3. Analyze Vegetable/Fiber Patterns
  const vegMeals = meals.filter(m => containsAny(m.name, VEG_KEYWORDS));
  if (vegMeals.length < meals.length * 0.4 && meals.length > 0) {
    mealPatternNotes.push("Vegetable or fiber intake appears low in the available logs.");
    nutritionDiscussionPoints.push("Vegetable or fiber intake may be low. Discuss adding dal, shak, vegetables, fruits, or whole grains.");
    questionsToAsk.push("How can I increase fiber using local foods like dal, shak, or seasonal vegetables?");
  }

  // 4. Analyze Protein Patterns
  const proteinMeals = meals.filter(m => containsAny(m.name, PROTEIN_KEYWORDS));
  if (proteinMeals.length < meals.length * 0.5 && meals.length > 0) {
    mealPatternNotes.push("Some meals appear to be low in traditional protein sources.");
    nutritionDiscussionPoints.push("Some meals may be low in protein. Discuss affordable options like egg, dal, fish, chicken, chola, milk, or yogurt.");
    questionsToAsk.push("How often should I include dal, fish, egg, chicken, or chola?");
  }

  // 5. Analyze Processed/Salty Patterns
  const processedMeals = meals.filter(m => containsAny(m.name, PROCESSED_KEYWORDS));
  if (processedMeals.length > 0) {
    mealPatternNotes.push(`Detected ${processedMeals.length} instance(s) of processed or salty snacks/meals.`);
    nutritionDiscussionPoints.push("Some meals or snacks may be salty or processed. Ask whether reducing these would fit your health goals.");
    questionsToAsk.push("Are processed snacks or instant noodles affecting my nutrition goals?");
  }

  // 6. Habit/Nudge Feedback
  if (habitState && habitState.days.length > 0) {
    const completedHabits = habitState.days.filter(d => d.answer === "yes" || d.answer === "partly").length;
    mealPatternNotes.push(`Tried habit tracking for ${habitState.days.length} day(s), with ${completedHabits} success(es).`);
    nutritionDiscussionPoints.push("Active participation in habit nudges. Discuss how these small changes are impacting your routine.");
  }

  // General Questions
  questionsToAsk.push("Should I track weight, waist, blood sugar, or blood pressure with a professional?");
  questionsToAsk.push("Are any of my usual foods worth limiting based on my personal health history?");

  // Suggested Next Steps
  suggestedNextSteps.push("Bring this summary to your next appointment with a doctor or dietitian.");
  if (meals.length < 7) {
    suggestedNextSteps.push(`Track ${7 - meals.length > 0 ? 7 - meals.length : 3} more days of meals for a clearer pattern.`);
  }
  suggestedNextSteps.push("Add portion notes (e.g., '1 cup rice', '2 pieces chicken') when logging.");

  // Tracking Suggestions
  trackingSuggestions.push("Continue using the Plate Analyzer for automated portion estimation.");
  trackingSuggestions.push("Record your energy levels or symptoms in the 'Notes' section of your meal logs.");

  // Safety Disclaimer
  const disclaimer = "This summary is for nutritional discussion guidance only and is NOT a medical diagnosis, prescription, or treatment plan. Always consult a healthcare professional for medical advice.";
  const redFlagReminder = "Seek professional medical advice promptly if you have severe symptoms, sudden weight loss, fainting, chest pain, severe abdominal pain, repeated vomiting, blood in stool, very high/low blood sugar readings, or any urgent concern.";

  // Build Share Text
  const userName = profile?.full_name || profile?.display_name || "User";
  const shareText = `Desi Digest — Care Companion Summary
${isDemo ? "(Sample demo data only)" : ""}

User: ${userName}
Confidence: ${confidence.toUpperCase()}
Data used: ${dataSources.join(", ")}

Meal Pattern Notes:
${mealPatternNotes.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Nutrition Discussion Points:
${nutritionDiscussionPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Questions for Doctor/Dietitian:
${questionsToAsk.map((q, i) => `${i + 1}. ${q}`).join("\n")}

General nutrition guidance — not medical advice.`;

  return {
    periodLabel: "Last 7-14 days",
    dataSourcesUsed: dataSources,
    confidence,
    mealPatternNotes: mealPatternNotes.length > 0 ? mealPatternNotes : ["No specific patterns detected yet."],
    nutritionDiscussionPoints: nutritionDiscussionPoints.length > 0 ? nutritionDiscussionPoints : ["Discuss your general eating habits with your doctor."],
    questionsToAsk: questionsToAsk.slice(0, 8),
    suggestedNextSteps,
    trackingSuggestions,
    redFlagReminder,
    shareText,
    disclaimer,
    isDemo
  };
}
