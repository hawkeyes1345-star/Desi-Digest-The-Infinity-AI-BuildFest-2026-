import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createGeminiProvider } from "@/lib/ai-gateway.server";
import { BOUDI_KNOWLEDGE } from "@/lib/nanumoni-knowledge";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { summarizeProfile, type Profile } from "@/lib/profile.functions";

const NutritionShape = z.object({
  calories: z.number(),
  protein_g: z.number(),
  fat_g: z.number(),
  carbs_g: z.number(),
  fiber_g: z.number().default(0),
  sugar_g: z.number().default(0),
  sodium_mg: z.number().default(0),
  iron_mg: z.number().default(0),
  vitaminA_ugRAE: z.number().default(0),
});

const MealSuggestion = z.object({
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name: z.string().describe("Local dish name e.g. 'Lal chal + masoor dal + pui shak'"),
  portion: z.string().describe("Bangladeshi household portion e.g. '1 cup bhat + ½ cup dal'"),
  nutrition: NutritionShape,
  est_cost_bdt: z.number().describe("Per-serving cost in BDT"),
  reasoning: z.string().describe("Why this meal fits the user (2-3 sentences citing nutrients)"),
  swap_tip: z.string().describe("Healthier swap suggestion grounded in knowledge base"),
});

const RestaurantPick = z.object({
  name: z.string(),
  dish: z.string(),
  area: z.string().describe("Area / location hint, e.g. 'Dhanmondi', 'Sylhet zindabazar'"),
  est_cost_bdt: z.number(),
  why: z.string(),
});

const PlanSchema = z.object({
  nanumoni_opener: z.string().describe("1-2 line warm Nanumoni-voice opener tied to user's profile"),
  daily_targets: z.object({
    calories: z.number(),
    protein_g: z.number(),
    fiber_g: z.number(),
    water_ml: z.number(),
  }),
  meals: z.array(MealSuggestion).min(3).max(6),
  weekly_focus: z.string().describe("This week's nutritional focus in 2-3 sentences"),
  substitutions: z.array(z.string()).describe("3-5 healthier swap rules tailored to goals"),
  restaurant_picks: z
    .array(RestaurantPick)
    .describe(
      "Local restaurant / street-food picks that match budget+goals. EMPTY array if alternative_mode is true.",
    ),
  reasoning_steps: z
    .array(z.string())
    .describe("Transparent chain-of-thought: 3-5 bullet steps explaining how this plan was built"),
});

export type NutritionPlan = z.infer<typeof PlanSchema>;

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NutritionPlan> => {
    const { supabase, userId } = context;
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const profile = (p as Profile | null) ?? null;

    let model;
    try {
      model = createGeminiProvider()("gemini-2.5-flash");
    } catch {
      throw new Error("Gemini is not configured. Set GEMINI_API_KEY.");
    }

    const sys = `You are Nanumoni, a warm Bangladeshi nutrition expert. Build a personalised daily plan that is:
- Hyper-local: rice, dal, mach, shak, bhorta, seasonal fruits.
- Realistic Bangladeshi household portions.
- Honest about budget (BDT) and goals.
- Explainable: every meal gets a "reasoning" tied to nutrients in the knowledge base.

If alternative_mode = ON, OMIT all restaurant_picks (return []) and bias every meal to ultra-cheap, easily-available, home-cooked Deshi ingredients.

Knowledge base (treat as ground truth for nutrients):
---
${BOUDI_KNOWLEDGE}
---`;

    const userMsg = `USER PROFILE: ${summarizeProfile(profile)}

Build today's plan (3-5 meals: breakfast, lunch, dinner, optional snacks). Total daily calories should match activity+goals. Show explicit reasoning_steps. Use Bangladeshi names everywhere.`;

    try {
      const { experimental_output } = await generateText({
        model,
        system: sys,
        experimental_output: Output.object({ schema: PlanSchema }),
        messages: [{ role: "user", content: userMsg }],
      });
      // Force restaurants empty in alt mode regardless of model output
      if (profile?.alternative_mode) experimental_output.restaurant_picks = [];
      return experimental_output;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/429/.test(msg)) throw new Error("Nanumoni is busy — try again in a moment.");
      if (/402/.test(msg)) throw new Error("Gemini API quota exhausted — check your Google AI billing.");
      console.error("[generatePlan]", err);
      throw new Error("Nanumoni couldn't draft a plan right now.");
    }
  });
