import { type MealLog } from "./meals.functions";

export type NudgeImageKind = "lal-shak" | "dal" | "water" | "egg" | "fish" | "vegetables" | "rice-balance" | "generic";

export type SmartHealthNudgePlanItem = {
  day: number;
  title: string;
  suggestion: string;
  benefit: string;
  imageKind: NudgeImageKind;
  imageUrl?: string;
};

export type SmartHealthNudge = {
  id: string;
  title: string;
  message: string;
  benefit: string;
  actionLabel: string;
  imageKind: NudgeImageKind;
  imageUrl?: string;
  priority: "low" | "medium" | "high";
  reason: string;
  disclaimer: string;
  isDemo?: boolean;
  sevenDayPlan?: SmartHealthNudgePlanItem[];
};

// Simple helper to safely analyze meals
export function generateSmartNudge(
  profile: any,
  recentMeals: MealLog[],
  isDemo: boolean = false
): SmartHealthNudge | null {
  const disclaimer = "General nutrition guidance — not medical advice.";

  if (isDemo) {
    return {
      id: "nudge-demo",
      title: "Sample demo nudge",
      message: "Sample data based nudge: dal, shak, and vegetables add korle fiber and meal balance improve hote pare.",
      benefit: "Demo data only.",
      actionLabel: "Got it",
      imageKind: "vegetables",
      priority: "high",
      reason: "demo-mode",
      disclaimer,
      isDemo: true,
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
      title: "Ajke lal shak ba vegetables add korun",
      message: "Apnar recent meal pattern e fiber kom mone hocche. Lal shak, dal, lau, mixed vegetables add korle fullness and digestion support pete paren.",
      benefit: "Fiber digestion and fullness support kore.",
      actionLabel: "View healthier idea",
      imageKind: "lal-shak",
      priority: "high",
      reason: "low-fiber",
      disclaimer
    };
  }

  // Example D: High calories but low protein (approximate "high rice/low protein" pattern)
  if (todaysMeals.length >= 1 && totalCalories > 1000 && totalProtein < 30) {
    return {
      id: "nudge-rice-balance",
      title: "Rice portion balance korun",
      message: "Plate e rice beshi hole energy intake bere jete pare. Rice er sathe dal, dim, fish, chicken, or vegetables add korle balance better hoy.",
      benefit: "Protein + fiber plate ke more balanced kore.",
      actionLabel: "Balance your plate",
      imageKind: "rice-balance",
      priority: "medium",
      reason: "low-protein-high-cal",
      disclaimer
    };
  }

  // Example B: Generic hydration/fiber reminder if we haven't hit others
  if (todaysMeals.length >= 2 && totalWater < 1000) {
    return {
      id: "nudge-hydration-fiber",
      title: "Pani + fiber reminder",
      message: "Apnar profile/meal pattern theke mone hocche, pani and fiber beshi khele digestion support hobe. Ajke pani intake ektu conscious thakun.",
      benefit: "Hydration and fiber bowel movement support korte pare.",
      actionLabel: "Drink some water",
      imageKind: "water",
      priority: "medium",
      reason: "hydration-reminder",
      disclaimer
    };
  }

  // Default / Empty State
  return {
    id: "nudge-default-balance",
    title: "Start with one balanced Deshi plate",
    message: "Rice/roti er sathe dal/protein and vegetables add korle meal balance better hoy.",
    benefit: "Balanced meals provide sustained energy.",
    actionLabel: "Plan your next meal",
    imageKind: "generic",
    priority: "low",
    reason: "default-nudge",
    disclaimer
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
      nudge.title,
      nudge.message,
      nudge.benefit,
      nudge.actionLabel,
      nudge.reason,
      ...(nudge.sevenDayPlan || []).flatMap(p => [p.title, p.suggestion, p.benefit])
    ].join(" ").toLowerCase();

    for (const word of UNSAFE_WORDS) {
      if (allText.includes(word.toLowerCase())) {
        return false;
      }
    }

    if (!nudge.disclaimer || !nudge.disclaimer.includes("not medical advice")) {
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
