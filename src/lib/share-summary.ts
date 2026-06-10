import type { MealLog } from "./meals.functions";
import { reviewRecentMealPatternSafety, normalizeHealthConcerns, sanitizeClinicalSafetyText } from "./clinical-nutrition-safety";

export interface ShareSummaryData {
  userName?: string;
  isDemo?: boolean;
  hasData: boolean;
  period?: string;
  avgCalories?: number;
  avgProtein?: number;
  avgCarbs?: number;
  avgFiber?: number;
  highRiskCount?: number;
  suggestions?: string[];
  safetyNotes?: string[];
}

export function startOf7DaysAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Extracts and calculates the 7-day average metrics and top suggestions.
 */
export function calculateSummaryData(
  profile: any,
  allMeals: MealLog[],
  isDemo: boolean
): ShareSummaryData {
  const limit = startOf7DaysAgo();
  const last7DaysMeals = Array.isArray(allMeals)
    ? allMeals.filter((m) => m && m.logged_at && new Date(m.logged_at) >= limit)
    : [];

  if (last7DaysMeals.length === 0) {
    return {
      userName: profile?.full_name || profile?.display_name || "User",
      isDemo,
      hasData: false,
    };
  }

  const totalCal = last7DaysMeals.reduce((acc, m) => acc + (m.calories ?? 0), 0);
  const totalPro = last7DaysMeals.reduce((acc, m) => acc + (m.protein_g ?? 0), 0);
  const totalCarb = last7DaysMeals.reduce((acc, m) => acc + (m.carbs_g ?? 0), 0);
  const totalFiber = last7DaysMeals.reduce((acc, m) => acc + (m.fiber_g ?? 0), 0);

  const distinctDays = new Set(
    last7DaysMeals.map((m) => m.logged_at?.split("T")[0]).filter(Boolean)
  ).size || 1;

  const avgCal = totalCal / distinctDays;
  const avgPro = totalPro / distinctDays;
  const avgCarb = totalCarb / distinctDays;
  const avgFiber = totalFiber / distinctDays;

  const highRiskCount = last7DaysMeals.filter(
    (m) => typeof m.health_score === "number" && m.health_score < 6
  ).length;

  const swaps: string[] = [];
  for (const m of last7DaysMeals) {
    if (m.analysis && typeof m.analysis === "object") {
      const a = m.analysis as any;
      if (Array.isArray(a.substitutions)) {
        for (const s of a.substitutions) {
          const txt = typeof s === "string" ? s : s.why ? `${s.from} ➔ ${s.to}: ${s.why}` : s.from && s.to ? `${s.from} ➔ ${s.to}` : "";
          if (txt && !swaps.includes(txt)) {
            swaps.push(txt);
          }
        }
      }
      if (Array.isArray(a.makeItHealthierTips)) {
        for (const t of a.makeItHealthierTips) {
          if (t && typeof t === "string" && !swaps.includes(t)) {
            swaps.push(t);
          }
        }
      }
      if (Array.isArray(a.personalizedSuggestions)) {
        for (const t of a.personalizedSuggestions) {
          if (t && typeof t === "string" && !swaps.includes(t)) {
            swaps.push(t);
          }
        }
      }
    }
  }

  // Filter out any technical jargon, provider names, or API keywords
  const cleanSuggestions = swaps
    .filter(Boolean)
    .map((s) => {
      return s
        .replace(/\b(?:gemini|openrouter|edamam|api|llm|gpt|claude|deepseek|openai|google|flash-lite|fallback)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter((s) => s.length > 0);

  const safetyReview = reviewRecentMealPatternSafety({
    recentMeals: last7DaysMeals.map(m => ({
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
  
  const safetyNotes = safetyReview.flags.slice(0, 3).map(f => sanitizeClinicalSafetyText(f.message));

  return {
    userName: profile?.full_name || profile?.display_name || "User",
    isDemo,
    hasData: true,
    period: "Last 7 days",
    avgCalories: avgCal,
    avgProtein: avgPro,
    avgCarbs: avgCarb,
    avgFiber: avgFiber,
    highRiskCount,
    suggestions: cleanSuggestions.slice(0, 3),
    safetyNotes,
  };
}

/**
 * Builds the plain-text doctor-shareable summary message.
 */
export function buildDoctorShareSummary(data: ShareSummaryData): string {
  if (!data.hasData) {
    return `Desi Digest Nutrition Summary

No complete meal history found for the selected period yet.
Tip: Log meals or analyze a plate to generate a better summary.

General nutrition guidance only — not medical advice.`;
  }

  const rawName = data.userName?.trim();
  const firstName = rawName ? rawName.split(/\s+/)[0] : "User";

  const header = `Desi Digest Nutrition Summary${data.isDemo ? "\nSample demo data only." : ""}`;

  const stats = `User: ${firstName}
Period: ${data.period || "Last 7 days"}
Avg Calories: ${typeof data.avgCalories === "number" ? Math.round(data.avgCalories).toLocaleString() : 0} kcal/day
Avg Protein: ${typeof data.avgProtein === "number" ? Math.round(data.avgProtein) : 0}g/day
Avg Carbs: ${typeof data.avgCarbs === "number" ? Math.round(data.avgCarbs) : 0}g/day
Avg Fiber: ${typeof data.avgFiber === "number" ? Math.round(data.avgFiber) : 0}g/day
High-risk meals: ${data.highRiskCount ?? 0}`;

  let suggestionsSection = "";
  if (data.suggestions && data.suggestions.length > 0) {
    suggestionsSection = `\nTop suggestions:\n\n` + data.suggestions
      .map((s, i) => `${i + 1}. ${s}`)
      .join("\n") + "\n";
  }

  let safetySection = "";
  if (data.safetyNotes && data.safetyNotes.length > 0) {
    safetySection = `\nNutrition Safety Notes:\n\n` + data.safetyNotes
      .map((s) => `- ${s}`)
      .join("\n") + "\n";
  }

  const footer = `Note: These are estimated nutrition values for general guidance only, not medical advice.`;

  return `${header}

${stats}
${safetySection}${suggestionsSection}
${footer}`;
}

/**
 * Builds the WhatsApp sharing URL.
 */
export function buildWhatsAppShareUrl(summaryText: string): string {
  return `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
}

/**
 * Copies the summary text to the clipboard.
 */
export async function copyShareSummary(summaryText: string): Promise<boolean> {
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(summaryText);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to copy summary to clipboard:", err);
    return false;
  }
}
