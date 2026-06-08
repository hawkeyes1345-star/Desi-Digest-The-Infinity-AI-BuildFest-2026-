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
  | "milk_dairy"
  | "rice_comparison"
  | "meat_comparison"
  | "budget_protein"
  | "fish_roe"
  | "fruit_comparison"
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

  // Simple cheap greetings or very short unclear messages shouldn't use Gemini
  if (/^(hi|hello|hey|salam|assalamu|assalamu alaikum|nanu|hola|namaste)$/.test(text)) return "general_chat";

  // Follow-up phrases that need thread context rather than raw lookup
  const isFollowUp = /^(vat khbo|khabo|eta khabo|ar ki|konta better|tahole eta|tahole|ok|acha|accha|thik ache|ruti khabo|dim khabo)$/i.test(text);
  if (isFollowUp) return "general_chat";

  // Core user logs/history (High priority so it doesn't get intercepted by food checks)
  if (LOGGED_MEAL_REVIEW_PATTERNS.some((pattern) => pattern.test(text))) return "logged_meal_review";
  if (HISTORY_WORDS.some((word) => text.includes(word)) && /\b(i|my|today|yesterday|logged|ate)\b/.test(text)) return "meal_history";

  // 1. impossible/unsafe food detection (checked at chat.ts level)

  // 2. milk/dairy phrases
  const hasMilk = /(gorur?\s+dudh?|cow\s+milk|\bdudh?\b|\bdud\b|দুধ|গরুর\s+দুধ)/i.test(text);
  if (hasMilk) return "milk_dairy";

  // 2.5. fish roe / macher dim
  const hasFishRoe = /(macher?\s+dim|fish\s+egg|fish\s+roe|ইলিশের\s+ডিম|রুইয়ের\s+ডিম|মাছের\s+ডিম)/i.test(text);
  if (hasFishRoe) return "fish_roe";

  // 2.6. fruit comparison / dragon fruit / cactus
  const hasFruitComparison = /(mango\s+vs\s+cactus|aam\s+vs\s+cactus|mango\s+vs\s+dragon|aam\s+vs\s+dragon|cactus\s+fruit|dragon\s+fruit|আম\s+বনাম\s+ক্যাকটাস|ড্রাগন\s+ফল)/i.test(text) ||
    (/(mango|aam|cactus|dragon\s+fruit)/i.test(text) && /\b(vs|naki|na|better|comparison|compare|valo|bhalo|tulanay)\b/i.test(text));
  if (hasFruitComparison) return "fruit_comparison";

  // 3. rice variety comparison
  const hasRiceComparison = /(chinigura|najir|nazir|shail|miniket|\b28\b|আটাশ|atash)/i.test(text);
  if (hasRiceComparison) return "rice_comparison";

  // 4. egg/fish/meat comparison (or general food comparison of >= 2 foods)
  const entities = extractFoodEntities(message);
  if (entities.length >= 2) {
    const hasMeat = entities.some(e => e.category === "proteins");
    if (hasMeat) return "meat_comparison";
    return "food_comparison";
  }

  const isMeatOrEggOrFish = /(dim|egg|mach|fish|murgi|chicken|beef|goru|mutton|khashi|mangsho|meat|ডিম|মাছ|মুরগি|গরু|খাসি|মাংস)/i.test(text);
  const isComparisonQuery = /\b(konta|kontar|better|best|vs|versus|na|or|ar|tulanay|tulara|compare|comparison|prefer|preference|valo|bhalo|pushti|nutrition|calorie|protein|uchit)\b/i.test(text) ||
    /\b(কোনটা|কোনটির|বেশি|ভালো|ভলো|না|আর|এবং|তুলনা|পছন্দ|উচিত)\b/i.test(text) ||
    text.includes("?") ||
    text.includes(" vs ") ||
    text.includes(" versus ");

  if (isMeatOrEggOrFish && isComparisonQuery) {
    return "meat_comparison";
  }

  // 6. budget protein
  const hasBudget = /(budget|kom\s*tk|kom\s*taka|150\s*tk|150\s*taka|tk|taka|টাকা|টাকায়)/i.test(text);
  if (hasBudget && (isMeatOrEggOrFish || text.includes("khabar") || text.includes("food") || text.includes("suggest"))) {
    return "budget_protein";
  }

  // 5. diabetes/weight loss/heart health
  const hasCondition = CONDITION_WORDS.some((word) => text.includes(word)) ||
    /(diabetes|diabates|diabetic|sugar|weight\s*loss|diet|heart|pressure|bp|hypertension|cholesterol|ulcer|gastric|gastrick|kidney|thyroid|pregnancy|pregnant|ডায়াবেটিস|ওজন|হার্ট|প্রেসার|আলসার|কিডনি)/i.test(text);
  if (hasCondition) return "condition";

  // 7. generic nutrition
  const hasNutrition = NUTRITION_WORDS.some((word) => text.includes(word));
  if (entities.length > 0 || hasNutrition) {
    return "nutrition";
  }

  if (/\b(skip|light|something light)\b.*\b(dinner|meal|khabar)\b/.test(text)) return "general_chat";

  if (MEDICINE_WORDS.some((word) => text.includes(word))) return "medicine";

  if (text.length < 3) return "unknown";
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
