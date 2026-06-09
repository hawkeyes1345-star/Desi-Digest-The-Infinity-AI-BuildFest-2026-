import { type MealLog } from "./meals.functions";

export type NudgeImageKind = "lal-shak" | "dal" | "water" | "egg" | "fish" | "vegetables" | "rice-balance" | "generic";

export type SmartHealthNudgePlanItem = {
  day: number;
  titleBn: string;
  titleEn: string;
  suggestionBn: string;
  suggestionEn: string;
  benefitBn: string;
  benefitEn: string;
  imageKind: NudgeImageKind;
  imageUrl?: string;
};

export type SmartHealthNudge = {
  id: string;
  titleBn: string;
  titleEn: string;
  messageBn: string;
  messageEn: string;
  benefitBn: string;
  benefitEn: string;
  actionLabelBn: string;
  actionLabelEn: string;
  imageKind: NudgeImageKind;
  imageUrl?: string;
  imageSource?: string;
  imageSourceUrl?: string;
  priority: "low" | "medium" | "high";
  reasonBn: string;
  reasonEn: string;
  disclaimerBn: string;
  disclaimerEn: string;
  isDemo?: boolean;
  sevenDayPlan?: SmartHealthNudgePlanItem[];
  checkInQuestionBn?: string;
  checkInQuestionEn?: string;
  exerciseSuggestionBn?: string;
  exerciseSuggestionEn?: string;
};

// Simple helper to safely analyze meals
export function generateSmartNudge(
  profile: any,
  recentMeals: MealLog[],
  isDemo: boolean = false
): SmartHealthNudge | null {
  const disclaimerBn = "General nutrition guidance — not medical advice. Doctor er poramorsho nin.";
  const disclaimerEn = "General nutrition guidance — not medical advice. Consult a professional.";

  if (isDemo) {
    return {
      id: "nudge-demo",
      titleBn: "Sample demo nudge",
      titleEn: "Sample demo nudge",
      messageBn: "Sample data based nudge: dal, shak, and vegetables add korle fiber and meal balance improve hote pare.",
      messageEn: "Sample data based nudge: adding dal, shak, and vegetables can improve fiber and meal balance.",
      benefitBn: "Demo data only.",
      benefitEn: "Demo data only.",
      actionLabelBn: "Bujhte perechi",
      actionLabelEn: "Got it",
      imageKind: "vegetables",
      priority: "high",
      reasonBn: "demo-mode logic search pattern",
      reasonEn: "demo-mode logic search pattern",
      disclaimerBn,
      disclaimerEn,
      isDemo: true,
      checkInQuestionBn: "Dadu bhai, kalke ki vegetables ektu kheyecho?",
      checkInQuestionEn: "Did you manage to eat some vegetables yesterday?",
      exerciseSuggestionBn: "Ajke 10 minute halka walk korun.",
      exerciseSuggestionEn: "Try a light 10-minute walk today."
    };
  }

  // Calculate some simple stats over recent meals
  let totalFiber = 0;
  let totalProtein = 0;
  let totalCalories = 0;
  let totalWater = 0;
  
  // Look at today's meals
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysMeals = recentMeals.filter(m => {
    if (!m.logged_at) return false;
    const d = new Date(m.logged_at);
    return d >= today;
  });

  todaysMeals.forEach(m => {
    totalFiber += (m.fiber_g || 0);
    totalProtein += (m.protein_g || 0);
    totalCalories += (m.calories || 0);
    totalWater += (m.water_ml || 0);
  });

  // Example A: Low fiber pattern (if logged some meals but fiber is very low)
  if (todaysMeals.length >= 1 && totalFiber < 10) {
    return {
      id: "nudge-low-fiber",
      titleBn: "Ajke lal shak ba shobji add korun",
      titleEn: "Add red amaranth or vegetables today",
      messageBn: "Apnar recent meal pattern e fiber kom mone hocche. Lal shak, dal, ba mixed shobji add korle digestion and fullness support pete paren.",
      messageEn: "Your recent meal pattern seems low in fiber. Adding red amaranth, lentils, or mixed vegetables can support digestion and fullness.",
      benefitBn: "Fiber digestion and fullness support kore.",
      benefitEn: "Fiber supports digestion and keeps you full longer.",
      actionLabelBn: "Pusti-somponno idea dekhun",
      actionLabelEn: "View healthier idea",
      imageKind: "lal-shak",
      priority: "high",
      reasonBn: "Fiber intake ektu kom chilo kisu meal e.",
      reasonEn: "Fiber intake was slightly low in recent meals.",
      disclaimerBn,
      disclaimerEn,
      checkInQuestionBn: "Dadu bhai, kalke ki lal shak/shobji kheyecho?",
      checkInQuestionEn: "Did you add any vegetables yesterday?",
      exerciseSuggestionBn: "Ajke ektu beksi walk try korun.",
      exerciseSuggestionEn: "Try walking a bit more today."
    };
  }

  // Example D: High calories but low protein (approximate "high rice/low protein" pattern)
  if (todaysMeals.length >= 1 && totalCalories > 1000 && totalProtein < 30) {
    return {
      id: "nudge-rice-balance",
      titleBn: "Bhat er portion balance korun",
      titleEn: "Balance your rice portion",
      messageBn: "Plate e bhat beshi hole energy intake bere jete pare. Bhat er sathe dal, dim, mach, murgi ba shobji add korle balance better hoy.",
      messageEn: "Too much rice can lead to high energy intake. Balancing it with lentils, eggs, fish, or vegetables helps maintain a healthy plate.",
      benefitBn: "Protein + fiber plate ke more balanced kore.",
      benefitEn: "Protein and fiber make your plate more balanced.",
      actionLabelBn: "Meal balance korun",
      actionLabelEn: "Balance your plate",
      imageKind: "rice-balance",
      priority: "medium",
      reasonBn: "Protein er tulonay bhat ektu beshi chilo.",
      reasonEn: "Rice portion was high compared to protein intake.",
      disclaimerBn,
      disclaimerEn,
      checkInQuestionBn: "Dadu bhai, kalke bhat er sathe ektu protein ba shobji add korte perecho?",
      checkInQuestionEn: "Did you balance your rice portion yesterday?",
      exerciseSuggestionBn: "Halka stretching try korte paren.",
      exerciseSuggestionEn: "Consider some light stretching today."
    };
  }

  // Example B: Generic hydration/fiber reminder if we haven't hit others
  if (todaysMeals.length >= 2 && totalWater < 1000) {
    return {
      id: "nudge-hydration-fiber",
      titleBn: "Pani + fiber reminder",
      titleEn: "Water + fiber reminder",
      messageBn: "Apnar profile/meal pattern theke mone hocche, pani and fiber beshi khele digestion support hobe. Ajke pani intake ektu socheton thakun.",
      messageEn: "Based on your pattern, more water and fiber can support your health. Be mindful of your water intake today.",
      benefitBn: "Hydration and fiber bowel movement support korte pare.",
      benefitEn: "Hydration and fiber support regular bowel movements.",
      actionLabelBn: "Pani pan korun",
      actionLabelEn: "Drink some water",
      imageKind: "water",
      priority: "medium",
      reasonBn: "Pani intake ektu kom chilo kisu meal e.",
      reasonEn: "Water intake was slightly low recently.",
      disclaimerBn,
      disclaimerEn,
      checkInQuestionBn: "Dadu bhai, kalke pani intake ektu barate perecho?",
      checkInQuestionEn: "Did you drink more water yesterday?",
      exerciseSuggestionBn: "10 minute brisk walk try korun.",
      exerciseSuggestionEn: "Try a 10-minute brisk walk today."
    };
  }

  // Default / Empty State
  return {
    id: "nudge-default-balance",
    titleBn: "Aktu balanced Deshi plate diye shuru korun",
    titleEn: "Start with a balanced Deshi plate",
    messageBn: "Bhat ba ruti er sathe dal/protein and shobji add korle meal balance better hoy.",
    messageEn: "Adding lentils, protein, and vegetables to your rice or roti makes for a more balanced meal.",
    benefitBn: "Balanced meal sustained energy provide kore.",
    benefitEn: "Balanced meals provide sustained energy throughout the day.",
    actionLabelBn: "Poroborti meal plan korun",
    actionLabelEn: "Plan your next meal",
    imageKind: "generic",
    priority: "low",
    reasonBn: "General wellness recommendation.",
    reasonEn: "General wellness recommendation.",
    disclaimerBn,
    disclaimerEn,
    checkInQuestionBn: "Dadu bhai, kalke ki balanced plate follow korte perecho?",
    checkInQuestionEn: "Did you have a balanced plate yesterday?",
    exerciseSuggestionBn: "Ajke ektu active thakar chesta korun.",
    exerciseSuggestionEn: "Try to stay active today."
  };
}

export function shouldShowNudge(nudgeId: string): boolean {
  if (typeof window === "undefined") return false;
  
  const key = "desi-digest:nudge-state:v1";
  const stored = localStorage.getItem(key);
  
  const todayDate = new Date().toISOString().split("T")[0];
  
  let state = {
    date: todayDate,
    shownCount: 0,
    lastShownAt: 0,
    dismissedNudgeIds: [] as string[]
  };
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === todayDate) {
        state = { ...state, ...parsed };
      }
    } catch (e) {
      // ignore parsing error
    }
  }
  
  // Has it been dismissed?
  if (state.dismissedNudgeIds.includes(nudgeId)) {
    return false;
  }
  
  // Max 6 times per day
  if (state.shownCount >= 6) {
    return false;
  }
  
  // Min 4 hours gap
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  const now = Date.now();
  if (state.lastShownAt > 0 && (now - state.lastShownAt) < FOUR_HOURS_MS) {
    return false;
  }
  
  return true;
}

export function recordNudgeShown(nudgeId: string) {
  if (typeof window === "undefined") return;
  const key = "desi-digest:nudge-state:v1";
  const stored = localStorage.getItem(key);
  
  const todayDate = new Date().toISOString().split("T")[0];
  let state = {
    date: todayDate,
    shownCount: 0,
    lastShownAt: 0,
    dismissedNudgeIds: [] as string[]
  };
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === todayDate) {
        state = { ...state, ...parsed };
      }
    } catch (e) {
      // ignore
    }
  }
  
  state.shownCount += 1;
  state.lastShownAt = Date.now();
  
  localStorage.setItem(key, JSON.stringify(state));
}

export function dismissNudge(nudgeId: string) {
  if (typeof window === "undefined") return;
  const key = "desi-digest:nudge-state:v1";
  const stored = localStorage.getItem(key);
  
  const todayDate = new Date().toISOString().split("T")[0];
  let state = {
    date: todayDate,
    shownCount: 0,
    lastShownAt: 0,
    dismissedNudgeIds: [] as string[]
  };
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === todayDate) {
        state = { ...state, ...parsed };
      }
    } catch (e) {
      // ignore
    }
  }
  
  if (!state.dismissedNudgeIds.includes(nudgeId)) {
    state.dismissedNudgeIds.push(nudgeId);
  }
  
  localStorage.setItem(key, JSON.stringify(state));
}

const UNSAFE_WORDS = [
  "diagnosis", "cure", "treatment", "guaranteed", 
  "apnar diabetes ache", "apnar rog ache", "rog dhora porse", 
  "medical treatment", "clinically proven", 
  "gemini", "openrouter", "edamam", "api", "provider", "model", 
  "fallback", "cache", "quota", "429", "404"
];

export function sanitizeNudgeText(text: string): string {
  if (!text) return "";
  let sanitized = text;
  for (const word of UNSAFE_WORDS) {
    const regex = new RegExp(word, "gi");
    sanitized = sanitized.replace(regex, "[nutrition guidance]");
  }
  return sanitized;
}

export function validateNudgeSafety(nudge: SmartHealthNudge): boolean {
  try {
    const allText = [
      nudge.titleBn,
      nudge.titleEn,
      nudge.messageBn,
      nudge.messageEn,
      nudge.benefitBn,
      nudge.benefitEn,
      nudge.actionLabelBn,
      nudge.actionLabelEn,
      nudge.reasonBn,
      nudge.reasonEn,
      nudge.checkInQuestionBn || "",
      nudge.checkInQuestionEn || "",
      ...(nudge.sevenDayPlan || []).flatMap(p => [p.titleBn, p.titleEn, p.suggestionBn, p.suggestionEn, p.benefitBn, p.benefitEn])
    ].join(" ").toLowerCase();

    for (const word of UNSAFE_WORDS) {
      if (allText.includes(word.toLowerCase())) {
        return false;
      }
    }

    if (!nudge.disclaimerEn || !nudge.disclaimerEn.includes("not medical advice")) {
      return false;
    }

    if (nudge.sevenDayPlan && nudge.sevenDayPlan.length !== 7) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

// ==========================================
// HABIT LOOP STATE MANAGEMENT
// ==========================================

export type HabitAnswer = "yes" | "partly" | "no" | "skip";

export type HabitDay = {
  date: string;
  nudgeId: string;
  imageKind: NudgeImageKind;
  titleBn: string;
  titleEn: string;
  checkInQuestionBn: string;
  checkInQuestionEn: string;
  answer?: HabitAnswer;
  answeredAt?: number;
};

export type HabitState = {
  activePlanId: string;
  startedAt: string;
  currentDay: number;
  days: HabitDay[];
  lastPopupDate: string;
  lastCheckInDate: string;
  sevenDaySummaryShown?: boolean;
};

const HABIT_STATE_KEY = "desi-digest:nanumoni-habit-loop:v1";

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function getHabitState(): HabitState | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(HABIT_STATE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as HabitState;
  } catch (e) {
    return null;
  }
}

export function saveHabitState(state: HabitState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HABIT_STATE_KEY, JSON.stringify(state));
}

export function initOrUpdateHabitState(nudge: SmartHealthNudge) {
  const today = getTodayStr();
  let state = getHabitState();

  if (!state) {
    state = {
      activePlanId: nudge.id,
      startedAt: today,
      currentDay: 1,
      days: [],
      lastPopupDate: "",
      lastCheckInDate: "",
      sevenDaySummaryShown: false,
    };
  }

  // If the last popup date was today, we already added today's nudge to the cycle.
  if (state.lastPopupDate !== today) {
    state.lastPopupDate = today;
    
    // Add today's nudge to days array if it's not already there for today
    const existingIndex = state.days.findIndex(d => d.date === today);
    const newDay: HabitDay = {
      date: today,
      nudgeId: nudge.id,
      imageKind: nudge.imageKind,
      titleBn: nudge.titleBn,
      titleEn: nudge.titleEn,
      checkInQuestionBn: nudge.checkInQuestionBn || "Dadu bhai, kalke ki suggestion follow korte perecho?",
      checkInQuestionEn: nudge.checkInQuestionEn || "Did you follow yesterday's tip?"
    };

    if (existingIndex >= 0) {
      // update existing
      state.days[existingIndex] = { ...state.days[existingIndex], ...newDay };
    } else {
      state.days.push(newDay);
      // Increment currentDay if we added a new distinct day
      if (state.days.length > 1) {
         state.currentDay = state.days.length;
      }
    }
  }

  saveHabitState(state);
}

export function getPendingCheckIn(): HabitDay | null {
  const state = getHabitState();
  if (!state || state.days.length === 0) return null;

  const today = getTodayStr();

  // We want to check in on the most recent day that is NOT today, and has NO answer yet.
  // Generally, that's yesterday (or the last day they saw a popup).
  const pendingDays = state.days.filter(d => d.date !== today && !d.answer);
  if (pendingDays.length > 0) {
    // Return the latest pending day
    return pendingDays[pendingDays.length - 1];
  }
  return null;
}

export function recordCheckIn(date: string, answer: HabitAnswer) {
  const state = getHabitState();
  if (!state) return;

  const dayIndex = state.days.findIndex(d => d.date === date);
  if (dayIndex >= 0) {
    state.days[dayIndex].answer = answer;
    state.days[dayIndex].answeredAt = Date.now();
    state.lastCheckInDate = getTodayStr();
    saveHabitState(state);
  }
}

export function shouldShowSevenDaySummary(): boolean {
  const state = getHabitState();
  if (!state) return false;
  if (state.sevenDaySummaryShown) return false;
  
  // Only show if we have 7 days recorded, AND all days up to the 7th have answers or we are past day 7
  if (state.days.length >= 7) {
    // For MVP, just show it if we hit 7 days.
    return true;
  }
  return false;
}

export function markSevenDaySummaryShown() {
  const state = getHabitState();
  if (state) {
    state.sevenDaySummaryShown = true;
    saveHabitState(state);
  }
}
