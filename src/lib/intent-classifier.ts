import { extractFoodEntities } from "./bangladeshi-food-knowledge";

export type MessageIntent =
  | "nutrition"
  | "medicine"
  | "condition"
  | "health_safe_food_recommendation"
  | "general_chat"
  | "logged_meal_review"
  | "meal_history"
  | "language_rewrite"
  | "food_comparison"
  | "unknown";

export const MEDICINE_WORDS = [
  "medicine", "medication", "drug", "tablet", "capsule", "dose", "dosage", "rx", "advil", "ibuprofen",
  "paracetamol", "acetaminophen", "napa", "aspirin", "metformin", "insulin", "antibiotic",
];

export const CONDITION_WORDS = [
  "diabetes", "blood pressure", "hypertension", "cholesterol", "pcos", "anemia", "anaemia", "kidney",
  "thyroid", "pregnancy", "pregnant", "condition", "disease", "icd", "diagnosis", "high blood pressure",
  "shastho", "heart", "diabates", "diabetic", "sugar", "pressure", "bp",
];

export const NUTRITION_WORDS = [
  "calorie", "calories", "protein", "carb", "carbs", "fat", "fiber", "nutrition", "vitamin", "mineral",
  "rice", "bhat", "dal", "daal", "chicken", "curry", "fish", "mach", "egg", "dim", "roti", "khichuri",
  "tehari", "biryani", "shak", "vegetable", "food", "eat", "meal", "breakfast", "lunch", "dinner", "iftar",
  "mangsho", "murgi", "gorur mangsho", "goru", "khashi", "khabar", "khaoa", "khaw", "khete", "iccha", "meat",
];

export function isLanguageRewriteRequest(message: string): boolean {
  if (extractFoodEntities(message).length > 0) return false;

  const text = message.toLowerCase().replace(/[?.!,]/g, " ").replace(/\s+/g, " ").trim();
  
  const langIndicators = [
    "banglay likho", "banglay bolo", "bangla okkhore", "bangla letters", "bangla font", "bangla horof",
    "বাংলায় বলো", "বাংলায় বলো", "বাংলায় লিখো", "বাংলায় লিখো", "বাংলা অক্ষরে", "বাংলা হরফে",
    "rewrite in bangla", "translate to bangla", "make it bangla", "bangla script", "banglay daw",
    "banglai likho", "banglai bolo", "banglai daw", "banglay likh", "banglay bolo na", "banglai lekho",
    "banglay lekho", "banglaly likho"
  ];
  
  const hasLangIndicator = langIndicators.some(indicator => text.includes(indicator)) ||
    /\b(banglay|bangla okkhore|bangla letters|বাংলা অক্ষরে|বাংলায়|বাংলায়)\b/i.test(text);

  if (!hasLangIndicator) return false;

  const hasNewQuery = NUTRITION_WORDS.some(word => text.includes(word)) ||
    MEDICINE_WORDS.some(word => text.includes(word)) ||
    CONDITION_WORDS.some(word => text.includes(word));

  return !hasNewQuery;
}

export function detectRequestedLanguage(message: string): "bangla_script" | "banglish" | "english" | null {
  const text = message.toLowerCase();
  
  const banglaScriptIndicators = [
    "banglay", "bangla okkhore", "bangla letters", "bangla font", "bangla horof", "bangla script",
    "বাংলায়", "বাংলায়", "বাংলা অক্ষরে", "বাংলা হরফে", "banglai", "in bangla"
  ];
  
  const banglishIndicators = [
    "banglish", "banglish e", "banglish ey", "banglish okkhore", "banglish letters"
  ];

  const englishIndicators = [
    "english", "english e", "english ey", "in english", "english letters"
  ];

  if (banglaScriptIndicators.some(ind => text.includes(ind))) {
    return "bangla_script";
  }
  if (banglishIndicators.some(ind => text.includes(ind))) {
    return "banglish";
  }
  if (englishIndicators.some(ind => text.includes(ind))) {
    return "english";
  }
  
  return null;
}

export function getMessageLanguage(message: string): "bangla_script" | "banglish" | "english" {
  const explicit = detectRequestedLanguage(message);
  if (explicit) return explicit;

  if (/[\u0980-\u09FF]/.test(message)) {
    return "bangla_script";
  }

  const text = message.toLowerCase();
  
  const englishOnly = [
    "should i", "what is", "how many", "tell me about", "is it safe", "can i eat", 
    "which one", "health benefits", "side effects", "recommendation", "alternative"
  ];
  
  const hasEnglishOnly = englishOnly.some(phrase => text.includes(phrase));
  
  const banglishWords = [
    "khabo", "kheyechi", "khalem", "khelam", "khaoa", "khawa", "khaw", "khete", 
    "bhat", "dim", "mach", "mangsho", "hobe", "sathe", "shathe", "kotha", 
    "apni", "tumi", "amar", "amader", "konta", "kontar", "valobashi", "valo", 
    "bhalo", "thakle", "napa", "ranna", "tel", "lobon", "ruti", "diye"
  ];
  
  const hasBanglish = banglishWords.some(word => text.includes(word));

  if (hasEnglishOnly && !hasBanglish) {
    return "english";
  }
  
  return "banglish";
}

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

  if (isLanguageRewriteRequest(message)) return "language_rewrite";

  const entities = extractFoodEntities(message);
  if (entities.length >= 2) {
    const isComparisonQuery = /\b(konta|kontar|better|best|vs|versus|na|or|ar|tulanay|tulara|compare|comparison|maximum|jekono|choice|choise|prefer|preference|valo|bhalo|pushti|nutrition|calorie|protein)\b/i.test(text) ||
      /\b(কোনটা|কোনটির|বেশি|ভালো|ভলো|না|আর|এবং|তুলনা|পছন্দ)\b/i.test(text) ||
      text.includes("?") ||
      text.includes(" vs ") ||
      text.includes(" versus ");
      
    if (isComparisonQuery) {
      return "food_comparison";
    }
  } else if (entities.length === 1) {
    const hasExplicitVs = /\b(vs|versus|naki)\b/i.test(text) || /\b(নাকি|না)\b/i.test(text);
    const hasComparisonKeyword = /\b(better|best|compare|comparison|tulanay|tula)\b/i.test(text) || /\b(ভালো|বেশি|তুলনা)\b/i.test(text);
    if (hasExplicitVs && hasComparisonKeyword && text.includes("?")) {
      return "food_comparison";
    }
  }

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
