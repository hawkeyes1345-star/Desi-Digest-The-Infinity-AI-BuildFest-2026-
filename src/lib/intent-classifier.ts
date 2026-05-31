export type MessageIntent =
  | "nutrition"
  | "medicine"
  | "condition"
  | "health_safe_food_recommendation"
  | "general_chat"
  | "logged_meal_review"
  | "meal_history"
  | "unknown";

const MEDICINE_WORDS = [
  "medicine", "medication", "drug", "tablet", "capsule", "dose", "dosage", "rx", "advil", "ibuprofen",
  "paracetamol", "acetaminophen", "napa", "aspirin", "metformin", "insulin", "antibiotic",
];

const CONDITION_WORDS = [
  "diabetes", "blood pressure", "hypertension", "cholesterol", "pcos", "anemia", "anaemia", "kidney",
  "thyroid", "pregnancy", "pregnant", "condition", "disease", "icd", "diagnosis", "high blood pressure",
  "shastho", "heart", "diabates", "diabetic", "sugar", "pressure", "bp",
];

const NUTRITION_WORDS = [
  "calorie", "calories", "protein", "carb", "carbs", "fat", "fiber", "nutrition", "vitamin", "mineral",
  "rice", "bhat", "dal", "daal", "chicken", "curry", "fish", "mach", "egg", "dim", "roti", "khichuri",
  "tehari", "biryani", "shak", "vegetable", "food", "eat", "meal", "breakfast", "lunch", "dinner", "iftar",
  "mangsho", "murgi", "gorur mangsho", "goru", "khashi", "khabar", "khaoa", "khaw", "khete", "iccha", "meat",
];

const HEALTH_RECOMMENDATION_WORDS = [
  "kom tk", "kom taka", "budget", "healthy", "low sodium", "kom lobon", "lobon kom", "option", "better",
  "recommend", "suggest", "khabo", "safe", "valo", "advice", "jabe", "kontar", "konta",
];

const HISTORY_WORDS = ["history", "logged", "log", "today", "yesterday", "meal history", "what did i eat"];

const LOGGED_MEAL_REVIEW_PATTERNS = [
  /\b(today|ajke|ajker|aaj|aajker)\b.*\b(logged|log|meal|plate|khabar|khawa|khaisi|kheyechi|eat|ate)\b/,
  /\b(logged|log)\b.*\b(meal|plate|food|khabar)\b/,
  /\b(last|latest|recent)\b.*\b(plate|meal|food|khabar)\b/,
  /\b(my|amar)\b.*\b(plate|meal|logged meal|meal history)\b/,
];

export function classifyMessageIntent(message: string): MessageIntent {
  const text = message.toLowerCase().replace(/\s+/g, " ").trim();
  if (!text) return "unknown";

  // Simple cheap greetings or very short unclear messages shouldn't use Gemini
  if (/^(hi|hello|hey|salam|assalamu|assalamu alaikum|nanu|hola|namaste)$/.test(text)) return "general_chat";
  if (text.length < 3) return "unknown";

  if (LOGGED_MEAL_REVIEW_PATTERNS.some((pattern) => pattern.test(text))) return "logged_meal_review";
  if (HISTORY_WORDS.some((word) => text.includes(word)) && /\b(i|my|today|yesterday|logged|ate)\b/.test(text)) return "meal_history";

  if (/\b(skip|light|something light)\b.*\b(dinner|meal|khabar)\b/.test(text)) return "general_chat";

  const hasNutrition = NUTRITION_WORDS.some((word) => text.includes(word));
  const hasCondition = CONDITION_WORDS.some((word) => text.includes(word));
  const hasHealthRec = HEALTH_RECOMMENDATION_WORDS.some((word) => text.includes(word));

  // "Can I eat X", "Is X safe", "khawa jabe?", etc.
  const isQuestioningSafety = /\b(jabe|khaw|khawa|good|better|safe|best|should|can|i|eat)\b/i.test(text) && text.includes("?");

  if ((hasHealthRec || isQuestioningSafety) && (hasNutrition || hasCondition)) return "health_safe_food_recommendation";

  // Short broad nutrition/condition mentions often need natural conversation/Gemini rather than raw lookup
  if (text.length < 12 && (text === "need food" || text === "healthy food" || text === "diet plan")) return "general_chat";

  if (MEDICINE_WORDS.some((word) => text.includes(word))) return "medicine";
  if (hasCondition) return "condition";
  if (hasNutrition) return "nutrition";

  // If it's a real question but didn't match keywords, use general_chat to trigger Gemini
  if (text.length > 8 || text.includes("?")) return "general_chat";

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
