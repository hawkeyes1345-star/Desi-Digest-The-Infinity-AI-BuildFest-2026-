import type { MealLog } from "@/lib/meals.functions";
import type { Profile } from "@/lib/profile.functions";

const DEMO_SESSION_KEY = "deshi-digest-demo-session";
const DEMO_MEALS_KEY = "deshi-digest-demo-meals";

export function isDemoSession() {
  return typeof window !== "undefined" && localStorage.getItem(DEMO_SESSION_KEY) === "1";
}

export function startDemoSession() {
  if (typeof window === "undefined") return;

  localStorage.setItem(DEMO_SESSION_KEY, "1");
  localStorage.setItem(DEMO_MEALS_KEY, "[]");
}

export function endDemoSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(DEMO_SESSION_KEY);
  localStorage.removeItem(DEMO_MEALS_KEY);
}

export const demoProfile: Profile = {
  user_id: "demo-user",
  display_name: "Demo User",
  full_name: "Demo User",
  age: 24,
  sex: "male",
  height_cm: 170,
  weight_kg: 68,
  activity_level: "moderate",
  budget_bdt: 2500,
  budget_period: "weekly",
  goals: ["general_wellness", "student_budget"],
  health_conditions: ["none"],
  dietary_preference: "non_veg",
  allergies: [],
  notes: "Frontend preview mode before Supabase backend setup.",
  location: "Dhaka",
  alternative_mode: false,
  onboarded_at: new Date().toISOString(),
};

type DemoMealInput = Pick<
  MealLog,
  "meal_type" | "name" | "calories" | "protein_g" | "fat_g" | "carbs_g" | "fiber_g" | "water_ml" | "source"
>;

function saveDemoMeals(meals: MealLog[]) {
  if (typeof window !== "undefined") localStorage.setItem(DEMO_MEALS_KEY, JSON.stringify(meals));
}

export function getDemoMeals() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(DEMO_MEALS_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as MealLog[]) : [];
  } catch {
    return [];
  }
}

export function addDemoMeal(input: DemoMealInput) {
  const meal: MealLog = {
    id: "demo-" + crypto.randomUUID(),
    logged_at: new Date().toISOString(),
    meal_type: input.meal_type,
    name: input.name,
    notes: null,
    calories: input.calories,
    protein_g: input.protein_g,
    fat_g: input.fat_g,
    carbs_g: input.carbs_g,
    sugar_g: 0,
    sodium_mg: 0,
    fiber_g: input.fiber_g,
    water_ml: input.water_ml,
    health_score: null,
    source: input.source,
    image_url: null,
    analysis: null,
  };
  const meals = [meal, ...getDemoMeals()];
  saveDemoMeals(meals);
  return meal;
}

export function deleteDemoMeal(id: string) {
  const meals = getDemoMeals().filter((meal) => meal.id !== id);
  saveDemoMeals(meals);
  return meals;
}
