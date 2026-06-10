import { type MealLog } from "./meals.functions";
import { type HabitState } from "./smart-health-nudge";
import { reviewRecentMealPatternSafety, normalizeHealthConcerns, sanitizeClinicalSafetyText } from "./clinical-nutrition-safety";

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

  // Call Safety Engine
  const safetyReview = reviewRecentMealPatternSafety({
    recentMeals: meals.map(m => ({
      name: m.name,
      mealText: m.notes || "",
      ingredients: [],
      nutrition: {
        calories: m.calories ?? 0,
        protein_g: m.protein_g ?? 0,
        fat_g: m.fat_g ?? 0,
        carbs_g: m.carbs_g ?? 0,
        fiber_g: m.fiber_g ?? 0,
        sugar_g: m.sugar_g ?? 0,
        sodium_mg: m.sodium_mg ?? 0,
      }
    })),
    healthConcerns: normalizeHealthConcerns(profile),
    isDemo
  });

  safetyReview.flags.forEach(f => {
    mealPatternNotes.push(sanitizeClinicalSafetyText(f.message));
    nutritionDiscussionPoints.push(sanitizeClinicalSafetyText(`${f.title}: ${f.reason}`));
    if (f.doctorDiscussionQuestion) {
      questionsToAsk.push(sanitizeClinicalSafetyText(f.doctorDiscussionQuestion));
    }
  });

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
