import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export type MealLog = {
  id: string;
  logged_at: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  notes: string | null;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  sugar_g: number;
  sodium_mg: number;
  fiber_g: number;
  water_ml: number;
  health_score: number | null;
  source: "manual" | "photo" | "recommendation";
  image_url: string | null;
  analysis: Json | null;
};

const LogSchema = z.object({
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(500).optional().nullable(),
  calories: z.number().min(0).max(10000).default(0),
  protein_g: z.number().min(0).max(500).default(0),
  fat_g: z.number().min(0).max(500).default(0),
  carbs_g: z.number().min(0).max(1000).default(0),
  sugar_g: z.number().min(0).max(500).default(0),
  sodium_mg: z.number().min(0).max(20000).default(0),
  fiber_g: z.number().min(0).max(200).default(0),
  water_ml: z.number().min(0).max(10000).default(0),
  health_score: z.number().min(0).max(10).optional().nullable(),
  source: z.enum(["manual", "photo", "recommendation"]).default("manual"),
  image_url: z.string().url().max(1000).optional().nullable(),
  analysis: z.unknown().optional().nullable(),
});

export const logMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LogSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("meal_logs")
      .insert({ user_id: userId, ...data, analysis: (data.analysis ?? null) as Json | null })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as MealLog;
  });

export const deleteMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("meal_logs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listRecentMeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("meal_logs")
      .select("*")
      .gte("logged_at", since)
      .order("logged_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as MealLog[];
  });

export const listPlateHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("source", "photo")
      .order("logged_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as MealLog[];
  });
