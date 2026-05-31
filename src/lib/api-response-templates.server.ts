import type { MessageIntent } from "@/lib/intent-classifier";
import type { NutritionSearchResult } from "@/lib/nutrition-data.server";

export type MedicineLookupResult = {
  query: string;
  rxcui?: string;
  name?: string;
  candidates: Array<{ rxcui: string; name: string }>;
  sourceLabel: string;
  error?: string;
};

export type OpenFdaLookupResult = {
  query: string;
  brandNames: string[];
  genericNames: string[];
  purposes: string[];
  indications: string[];
  warnings: string[];
  dosage: string[];
  sourceLabel: string;
  error?: string;
};

export type ConditionLookupResult = {
  query: string;
  matches: Array<{ title: string; code?: string; uri?: string }>;
  sourceLabel: string;
  error?: string;
};

function round(value: number | undefined, digits = 0) {
  if (!Number.isFinite(value)) return "0";
  return Number(value).toFixed(digits).replace(/\.0+$/, "");
}

export function nutritionTemplate(result: NutritionSearchResult) {
  const n = result.nutrition;
  return [
    "Here are the nutrition facts I found for " + result.name + ":",
    "Calories: " + round(n.calories) + " kcal for about " + round(result.portion_grams) + "g (" + result.portion + ").",
    "Macros: " + round(n.protein_g, 1) + "g protein, " + round(n.carbs_g, 1) + "g carbs, " + round(n.fat_g, 1) + "g fat, " + round(n.fiber_g, 1) + "g fiber.",
    "Key minerals: " + round(n.iron_mg, 1) + "mg iron and " + round(n.sodium_mg) + "mg sodium.",
    result.matchedFoodName ? "Matched food: " + result.matchedFoodName + "." : "",
    "Source: " + result.sourceLabel + ".",
    "Template fallback response.",
  ].filter(Boolean).join("\n");
}

export function medicineTemplate(rx?: MedicineLookupResult, fda?: OpenFdaLookupResult) {
  if (rx?.error && fda?.error) return "Medicine lookup is temporarily unavailable. Please check with a pharmacist or doctor for medicine advice.\nTemplate fallback response.";
  const lines = ["Here is the medicine information I found:"];
  if (rx && !rx.error) {
    lines.push("RxNorm match: " + (rx.name || rx.query) + (rx.rxcui ? " (RxCUI " + rx.rxcui + ")" : "") + ".");
    lines.push("Source: " + rx.sourceLabel + ".");
  }
  if (fda && !fda.error) {
    if (fda.genericNames.length) lines.push("Generic name: " + fda.genericNames.slice(0, 3).join(", ") + ".");
    if (fda.brandNames.length) lines.push("Brand names: " + fda.brandNames.slice(0, 3).join(", ") + ".");
    if (fda.warnings.length) lines.push("Label warning: " + fda.warnings[0]);
    if (fda.dosage.length) lines.push("Dosage label note: " + fda.dosage[0]);
    lines.push("Source: " + fda.sourceLabel + ".");
  }
  lines.push("This is drug label/reference information, not medical advice. Ask a doctor or pharmacist before changing medicine use.");
  lines.push("Template fallback response.");
  return lines.join("\n");
}

export function conditionTemplate(result: ConditionLookupResult) {
  if (result.error || !result.matches.length) return "Condition lookup is temporarily unavailable. I can still give general healthy eating guidance, but a clinician should confirm diagnosis-specific advice.\nTemplate fallback response.";
  const top = result.matches[0];
  return [
    "I found a condition classification match for " + result.query + ":",
    top.title + (top.code ? " (" + top.code + ")" : "") + ".",
    "Source: " + result.sourceLabel + ".",
    "For condition-based diet changes, use this as reference context and follow a clinician's advice for diagnosis and treatment.",
    "Template fallback response.",
  ].join("\n");
}

export function generalChatTemplate(message: string) {
  if (/breakfast/i.test(message)) {
    return "For a simple Deshi breakfast, try atta ruti or a small bowl of bhat with egg, dal, or chola, plus fruit if available. Keep it balanced: carb + protein + fiber.\nTemplate fallback response.";
  }
  return "I can help with Deshi food, nutrition facts, medicine reference lookup, and condition-aware meal ideas. Ask me a food, medicine, or condition and I will use the normal databases first.\nTemplate fallback response.";
}

export function unknownTemplate() {
  return "I could not confidently classify that. Try asking about a food, medicine, health condition, or general meal idea.\nTemplate fallback response.";
}

export function sourceLabelForIntent(intent: MessageIntent) {
  if (intent === "nutrition") return "Source: nutrition database";
  if (intent === "medicine") return "Source: RxNorm/openFDA";
  if (intent === "condition") return "Source: WHO ICD";
  return "Template fallback response";
}
