export type MessageIntent = "nutrition" | "medicine" | "condition" | "general_chat" | "meal_history" | "unknown";

const MEDICINE_WORDS = [
  "medicine", "medication", "drug", "tablet", "capsule", "dose", "dosage", "rx", "advil", "ibuprofen",
  "paracetamol", "acetaminophen", "napa", "aspirin", "metformin", "insulin", "antibiotic",
];

const CONDITION_WORDS = [
  "diabetes", "blood pressure", "hypertension", "cholesterol", "pcos", "anemia", "anaemia", "kidney",
  "thyroid", "pregnancy", "pregnant", "condition", "disease", "icd", "diagnosis", "high blood pressure",
];

const NUTRITION_WORDS = [
  "calorie", "calories", "protein", "carb", "carbs", "fat", "fiber", "nutrition", "vitamin", "mineral",
  "rice", "bhat", "dal", "daal", "chicken", "curry", "fish", "mach", "egg", "dim", "roti", "khichuri",
  "tehari", "biryani", "shak", "vegetable", "food", "eat", "meal", "breakfast", "lunch", "dinner", "iftar",
];

const HISTORY_WORDS = ["history", "logged", "log", "today", "yesterday", "meal history", "what did i eat"];

export function classifyMessageIntent(message: string): MessageIntent {
  const text = message.toLowerCase().replace(/\s+/g, " ").trim();
  if (!text) return "unknown";
  if (HISTORY_WORDS.some((word) => text.includes(word)) && /\b(i|my|today|yesterday|logged|ate)\b/.test(text)) return "meal_history";
  if (MEDICINE_WORDS.some((word) => text.includes(word))) return "medicine";
  if (CONDITION_WORDS.some((word) => text.includes(word))) return "condition";
  if (NUTRITION_WORDS.some((word) => text.includes(word))) return "nutrition";
  if (/^(hi|hello|hey|salam|assalamu|thanks|thank you)\b/.test(text)) return "general_chat";
  if (text.length > 8) return "general_chat";
  return "unknown";
}

export function extractLikelyLookupTerm(message: string, intent: MessageIntent): string {
  let text = message.toLowerCase();
  text = text.replace(/[?.!,]/g, " ").replace(/\s+/g, " ").trim();
  const generic = intent === "medicine"
    ? /\b(what|is|are|the|for|medicine|medication|drug|tablet|capsule|dose|dosage|about|tell|me|please|can|i|take)\b/g
    : intent === "condition"
      ? /\b(what|is|are|the|for|condition|disease|diagnosis|icd|about|tell|me|please|diet|food|with|have|i|my)\b/g
      : /\b(what|is|are|the|calories|nutrition|nutrients|in|for|about|tell|me|please|eat|food|meal|of)\b/g;
  const cleaned = text.replace(generic, " ").replace(/\s+/g, " ").trim();
  return cleaned || text || message;
}
