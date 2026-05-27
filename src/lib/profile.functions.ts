import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const GOAL_OPTIONS = [
  "weight_loss",
  "muscle_gain",
  "diabetes_friendly",
  "low_sodium",
  "heart_healthy",
  "pcos_friendly",
  "anemia_friendly",
  "pregnancy",
  "student_budget",
  "general_wellness",
  "ramadan_friendly",
] as const;
export type Goal = (typeof GOAL_OPTIONS)[number];

export const HEALTH_CONDITION_OPTIONS = [
  "diabetes",
  "prediabetes",
  "hypertension",
  "anemia",
  "pcos",
  "pregnancy",
  "lactating",
  "high_cholesterol",
  "thyroid",
  "ibs",
  "kidney_care",
  "none",
] as const;
export type HealthCondition = (typeof HEALTH_CONDITION_OPTIONS)[number];

export const DIETARY_OPTIONS = [
  "non_veg",
  "pescatarian",
  "vegetarian",
  "vegan",
  "eggetarian",
] as const;
export type DietaryPreference = (typeof DIETARY_OPTIONS)[number];

export type Profile = {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  age: number | null;
  sex: "female" | "male" | "other" | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: "sedentary" | "moderate" | "active" | "athlete" | null;
  budget_bdt: number | null;
  budget_period: "weekly" | "monthly" | null;
  goals: Goal[];
  health_conditions: HealthCondition[];
  dietary_preference: DietaryPreference | null;
  allergies: string[];
  notes: string | null;
  location: string | null;
  alternative_mode: boolean;
  onboarded_at: string | null;
};

import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const getMyProfile = createServerFn({ method: "GET" })
  .handler(async (): Promise<Profile | null> => {
    // Optional auth: when no bearer token, return null instead of throwing.
    // Prevents 401 crashes when the client session hasn't hydrated yet
    // or when an unauthenticated visitor mounts a profile-aware component.
    const req = getRequest();
    const authHeader = req?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice("Bearer ".length);
    if (!token) return null;

    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: claimsData } = await supabase.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;
    if (!userId) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Profile | null) ?? null;
  });

const UpsertSchema = z.object({
  display_name: z.string().trim().max(80).nullish(),
  full_name: z.string().trim().max(120).nullish(),
  age: z.number().int().min(1).max(120).nullish(),
  sex: z.enum(["female", "male", "other"]).nullish(),
  height_cm: z.number().min(50).max(260).nullish(),
  weight_kg: z.number().min(20).max(400).nullish(),
  activity_level: z.enum(["sedentary", "moderate", "active", "athlete"]).nullish(),
  budget_bdt: z.number().int().min(0).max(1_000_000).nullish(),
  budget_period: z.enum(["weekly", "monthly"]).nullish(),
  goals: z.array(z.enum(GOAL_OPTIONS)).max(12).default([]),
  health_conditions: z.array(z.enum(HEALTH_CONDITION_OPTIONS)).max(12).default([]),
  dietary_preference: z.enum(DIETARY_OPTIONS).nullish(),
  allergies: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  notes: z.string().trim().max(600).nullish(),
  location: z.string().trim().max(120).nullish(),
  alternative_mode: z.boolean().default(false),
  mark_onboarded: z.boolean().optional(),
});

export const upsertMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpsertSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { mark_onboarded, ...rest } = data;
    const payload = {
      user_id: userId,
      ...rest,
      ...(mark_onboarded ? { onboarded_at: new Date().toISOString() } : {}),
    };
    const { data: row, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Profile;
  });

export const setAlternativeMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ enabled: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, alternative_mode: data.enabled }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Required fields for a "complete" Nanumoni profile. */
export function isProfileComplete(p: Profile | null): boolean {
  if (!p) return false;
  return Boolean(
    p.age &&
      p.sex &&
      p.height_cm &&
      p.weight_kg &&
      p.activity_level &&
      p.dietary_preference &&
      p.onboarded_at,
  );
}

export function profileCompleteness(p: Profile | null): number {
  if (!p) return 0;
  const checks = [
    p.full_name || p.display_name,
    p.age,
    p.sex,
    p.height_cm,
    p.weight_kg,
    p.activity_level,
    p.budget_bdt,
    p.dietary_preference,
    p.goals.length > 0 || p.health_conditions.length > 0,
    p.location,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export function computeBMI(p: Profile | null): number | null {
  if (!p?.height_cm || !p?.weight_kg) return null;
  const m = p.height_cm / 100;
  return +(p.weight_kg / (m * m)).toFixed(1);
}

/** Mifflin-St Jeor BMR (kcal/day) */
export function computeBMR(p: Profile | null): number | null {
  if (!p?.height_cm || !p?.weight_kg || !p?.age || !p?.sex) return null;
  const base = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age;
  const bmr = p.sex === "male" ? base + 5 : base - 161;
  return Math.round(bmr);
}

export function computeTDEE(p: Profile | null): number | null {
  const bmr = computeBMR(p);
  if (!bmr) return null;
  const mult =
    p?.activity_level === "athlete"
      ? 1.725
      : p?.activity_level === "active"
        ? 1.55
        : p?.activity_level === "moderate"
          ? 1.375
          : 1.2;
  return Math.round(bmr * mult);
}

export function summarizeProfile(p: Profile | null): string {
  if (!p) return "No profile set — give general healthy Deshi advice.";
  const parts: string[] = [];
  const name = p.full_name || p.display_name;
  if (name) parts.push(`name: ${name}`);
  if (p.age) parts.push(`${p.age}y`);
  if (p.sex) parts.push(p.sex);
  if (p.height_cm) parts.push(`${p.height_cm}cm`);
  if (p.weight_kg) parts.push(`${p.weight_kg}kg`);
  const bmi = computeBMI(p);
  if (bmi) parts.push(`BMI ${bmi}`);
  const tdee = computeTDEE(p);
  if (tdee) parts.push(`TDEE ~${tdee} kcal/d`);
  if (p.activity_level) parts.push(`activity: ${p.activity_level}`);
  if (p.dietary_preference) parts.push(`diet: ${p.dietary_preference}`);
  if (p.budget_bdt) parts.push(`budget: ${p.budget_bdt} BDT/${p.budget_period ?? "weekly"}`);
  if (p.health_conditions.length) parts.push(`health: ${p.health_conditions.join(", ")}`);
  if (p.goals.length) parts.push(`goals: ${p.goals.join(", ")}`);
  if (p.allergies.length) parts.push(`AVOID (allergies): ${p.allergies.join(", ")}`);
  if (p.notes) parts.push(`notes: ${p.notes}`);
  if (p.location) parts.push(`location: ${p.location}`);
  if (p.alternative_mode)
    parts.push("ALTERNATIVE/GHARER RECIPE MODE: hide restaurants, focus on cheap home cooking");
  return parts.join(" · ");
}
