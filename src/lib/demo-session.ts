import type { MealLog } from "@/lib/meals.functions";
import type { Profile } from "@/lib/profile.functions";

const DEMO_SESSION_KEY = "deshi-digest-demo-session";

export function isDemoSession() {
  return typeof window !== "undefined" && localStorage.getItem(DEMO_SESSION_KEY) === "1";
}

export function startDemoSession() {
  if (typeof window !== "undefined") localStorage.setItem(DEMO_SESSION_KEY, "1");
}

export function endDemoSession() {
  if (typeof window !== "undefined") localStorage.removeItem(DEMO_SESSION_KEY);
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

export const demoMeals: MealLog[] = [
  {
    id: "demo-breakfast",
    logged_at: new Date().toISOString(),
    meal_type: "breakfast",
    name: "Ruti + dim bhaji + cha",
    notes: "Demo meal",
    calories: 430,
    protein_g: 18,
    fat_g: 16,
    carbs_g: 52,
    sugar_g: 8,
    sodium_mg: 520,
    fiber_g: 5,
    water_ml: 300,
    health_score: 7,
    source: "manual",
    image_url: null,
    analysis: null,
  },
  {
    id: "demo-lunch",
    logged_at: new Date().toISOString(),
    meal_type: "lunch",
    name: "Bhat + masoor dal + rui mach + pui shak",
    notes: "Demo meal",
    calories: 720,
    protein_g: 34,
    fat_g: 22,
    carbs_g: 92,
    sugar_g: 5,
    sodium_mg: 780,
    fiber_g: 11,
    water_ml: 500,
    health_score: 8,
    source: "manual",
    image_url: null,
    analysis: null,
  },
];
