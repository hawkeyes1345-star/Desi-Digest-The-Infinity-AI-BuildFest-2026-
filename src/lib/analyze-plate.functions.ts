import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { embedMany, generateText, Output } from "ai";
import { createGeminiEmbeddingModel, createGeminiProvider, GEMINI_EMBEDDING_DIMS } from "@/lib/ai-gateway.server";
import { BOUDI_KNOWLEDGE } from "@/lib/nanumoni-knowledge";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type Goal, type Profile, summarizeProfile } from "@/lib/profile.functions";

const EMBED_MODEL = "text-embedding-004";
const EMBED_DIMS = GEMINI_EMBEDDING_DIMS;

type RagMatch = {
  food_id: string;
  name_en: string;
  name_bn: string;
  category: string;
  typical_portion_grams: number;
  nutrition_per_portion: Record<string, number>;
  nanumoni_friendly_note: string | null;
  similarity: number;
};

async function embedBatch(inputs: string[]): Promise<number[][]> {
  if (!inputs.length) return [];
  try {
    const { embeddings } = await embedMany({
      model: createGeminiEmbeddingModel(),
      values: inputs,
      providerOptions: {
        google: {
          taskType: "SEMANTIC_SIMILARITY",
        },
      },
    });
    // Pad each embedding vector to EMBED_DIMS (1536) to match the pgvector(1536) database column
    return embeddings.map(emb => {
      const padded = new Array(EMBED_DIMS).fill(0);
      for (let i = 0; i < Math.min(emb.length, EMBED_DIMS); i++) {
        padded[i] = emb[i];
      }
      return padded;
    });
  } catch (error) {
    console.warn("[analyzePlate] Gemini embed failed", error);
    return [];
  }
}


const InputSchema = z.object({
  imageDataUrl: z
    .string()
    .min(32)
    .max(8_000_000)
    .refine((s) => s.startsWith("data:image/"), "Must be a data:image/... URL"),
  userContext: z.string().max(500).optional(),
});

const AnalysisSchema = z.object({
  detected: z.boolean().describe("True if recognizable food is visible"),
  blurry: z.boolean().describe("True if the image is too blurry to analyze"),
  nanumoniMessage: z
    .string()
    .describe(
      "1-2 line warm message in Nanumoni voice (gentle Bangla-English mix). Used when no food / blurry too.",
    ),
  dishes: z
    .array(
      z.object({
        name: z.string().describe("Local name e.g. 'Macher Jhol (Rui)', 'Aloo Bhorta', 'Bhat'"),
        portion: z.string().describe("Estimated portion e.g. '1 cup', '1 medium piece, ~80g'"),
        portion_grams: z.number().describe("Estimated grams for this dish piece"),
        confidence: z.enum(["high", "medium", "low"]),
        nutrition: z
          .object({
            calories: z.number(),
            protein_g: z.number(),
            carbs_g: z.number(),
            fat_g: z.number(),
            fiber_g: z.number(),
            iron_mg: z.number(),
            sodium_mg: z.number(),
          })
          .describe("Per-dish nutrition for the estimated portion"),
        note: z.string().describe("1-line Nanumoni note on this specific item (warm, local)"),
      }),
    )
    .default([]),

  nutrition: z
    .object({
      calories: z.number().describe("Total kcal for the whole plate"),
      protein_g: z.number(),
      carbs_g: z.number(),
      fat_g: z.number(),
      fiber_g: z.number(),
      iron_mg: z.number(),
      vitaminA_ugRAE: z.number(),
      zinc_mg: z.number(),
      sodium_mg: z.number(),
    })
    .optional(),
  healthScore: z
    .number()
    .min(0)
    .max(10)
    .describe(
      "0-10 healthiness, calibrated to the user's goals (e.g. white-rice-heavy meal scores lower for a diabetes_friendly user).",
    ),
  healthExplanation: z
    .string()
    .describe("Why this score for THIS user given their goals, 2-3 sentences"),
  hygieneNotes: z
    .string()
    .describe("Freshness / oil / portion observations from visual cues"),
  idealPlateComparison: z
    .string()
    .describe(
      "Compare to ideal Deshi plate (½ shak-shobji, ¼ bhat, ¼ dal+mach) BIASED to the user's goals.",
    ),
  idealPlateBreakdown: z
    .object({
      shak_shobji_pct: z.number().min(0).max(100).describe("Estimated % of the plate that is vegetables/greens (ideal 50%)"),
      bhat_carbs_pct: z.number().min(0).max(100).describe("Estimated % of the plate that is rice/roti/carbs (ideal 25%)"),
      dal_protein_pct: z.number().min(0).max(100).describe("Estimated % of the plate that is dal + fish/meat/egg protein (ideal 25%)"),
      notes: z.string().describe("1-line note on what's missing or overdone vs ideal Deshi plate, goal-aware"),
    })
    .describe("Visual composition breakdown of the plate vs the ideal ½ shak / ¼ bhat / ¼ dal+protein split."),
  goalAlignment: z
    .array(
      z.object({
        goal: z.string().describe("e.g. diabetes_friendly, anemia_friendly, weight_loss"),
        verdict: z.enum(["great", "okay", "risky"]),
        reason: z.string().describe("1 sentence — explainable, name the macro/micro driver"),
      }),
    )
    .describe("One entry per active user goal. Empty array if user has no goals."),
  goalAdjustedTargets: z
    .object({
      calories: z.number().describe("Suggested kcal for THIS meal given goals & TDEE"),
      protein_g: z.number(),
      carbs_g: z.number(),
      fat_g: z.number(),
      fiber_g: z.number(),
      sodium_mg_max: z.number(),
      notes: z
        .string()
        .describe("1-line plain-English why these targets (goal-aware)."),
    })
    .describe("Per-meal targets tuned to user's goals + TDEE."),
  personalizedSuggestions: z
    .array(z.string())
    .describe("3-4 actionable Nanumoni-style tips tailored to user goals"),
  makeItHealthierTips: z
    .array(z.string())
    .describe(
      "2-3 concrete Deshi swaps/additions tailored to the user's goals (e.g. swap white bhat → lal chal for diabetes; add liver/kalo jeera spinach for anemia; cut oil-fried for weight_loss; add milk+egg for pregnancy)",
    ),
  substitutions: z
    .array(
      z.object({
        from: z.string().describe("The current item on the plate, e.g. 'white bhat'"),
        to: z.string().describe("The healthier Deshi swap, e.g. 'lal chal (red rice)'"),
        why: z.string().describe("1-line why this swap helps THIS user's goals"),
      }),
    )
    .describe("2-3 concrete one-for-one Deshi swaps for THIS plate"),
  portionAdjustment: z
    .string()
    .describe(
      "Plain-English portion guidance for the user's goals, e.g. 'Reduce bhat by ~50g and double the pui shak — same satisfaction, gentler on blood sugar.'",
    ),
  budgetAlternatives: z
    .array(z.string())
    .describe(
      "1-3 budget-friendly Deshi alternatives if the user has student_budget goal OR a low budget_bdt. Empty array if not relevant.",
    ),
  sources: z.array(z.string()).describe("Knowledge sources cited, e.g. 'FCTB', 'icddr,b'"),
});

export type PlateAnalysis = z.infer<typeof AnalysisSchema> & {
  modelUsed: "gemini-2.5-pro" | "gemini-2.5-flash";
  fallbackReason?: string;
  profileIncomplete?: boolean;
  missingProfileFields?: string[];
  bmi?: number | null;
  ragGrounding?: { dish: string; matched: string; similarity: number }[];
};


/** Heuristic: was Gemini's read confident enough to trust? */
function isLowConfidence(a: z.infer<typeof AnalysisSchema>): string | null {
  if (a.blurry) return "image flagged blurry";
  if (!a.detected) return "no food detected";
  if (a.dishes.length === 0) return "no dishes identified";
  const lows = a.dishes.filter((d) => d.confidence === "low").length;
  const ratio = lows / a.dishes.length;
  if (ratio >= 0.5) return `${lows}/${a.dishes.length} dishes low-confidence`;
  // If nutrition is missing or wildly zero, distrust it
  if (!a.nutrition || a.nutrition.calories <= 0) return "missing nutrition estimate";
  return null;
}

const VISION_SYSTEM = `You are Nanumoni, a Bangladeshi nutrition expert with deep visual knowledge of South Asian / Bangladeshi cuisine. Identify dishes with high precision: bhat, polao, khichuri, lal chal, ruti, dal (masoor/mug/kalai), macher jhol, ilish bhaja, rui curry, mola/dhela, shutki, chingri malai, murgir jhol, beef bhuna, khasi, dim bhaji, aloo bhorta, begun bhorta, shutki bhorta, sim bhaji, begun bhaji, lau, kumro, korola, dheras, pui shak, lal shak, kochu shak, sajna, palong, doi, chana, chotpoti, fuchka, biryani/kacchi, haleem, pitha, mishti, etc.

Recognize Bangladeshi cooking cues: mustard oil sheen, panch phoron, posto, kalo jeera, paanch foron tadka, banana-leaf serving, steel thala/bati.

Estimate portion sizes realistically for a typical Bangladeshi household plate. Use the provided FCTB-grounded knowledge base for nutrition numbers.

You MUST personalize every output (healthScore, healthExplanation, idealPlateComparison, goalAlignment, goalAdjustedTargets, makeItHealthierTips, personalizedSuggestions) to the user's GOALS and TDEE. The same plate scores differently for different goals — be honest and explainable about why.

Be honest about confidence. If the image is too blurry, dark, or has no food, set detected=false / blurry=true and write a kind Nanumoni-voice message — never invent food.

Always cite knowledge sources you used (FCTB, icddr,b, knowledge base).`;

/** Mifflin-St Jeor BMR × activity factor → daily kcal */
function estimateTDEE(p: Profile | null): number | null {
  if (!p || !p.age || !p.height_cm || !p.weight_kg || !p.sex) return null;
  const s = p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78;
  const bmr = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + s;
  const factor =
    p.activity_level === "athlete"
      ? 1.725
      : p.activity_level === "active"
        ? 1.55
        : p.activity_level === "moderate"
          ? 1.375
          : 1.2;
  return Math.round(bmr * factor);
}

function computeBMI(p: Profile | null): number | null {
  if (!p?.height_cm || !p?.weight_kg) return null;
  const m = p.height_cm / 100;
  return Math.round((p.weight_kg / (m * m)) * 10) / 10;
}

function bmiBand(bmi: number | null): string {
  if (bmi == null) return "unknown";
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

function missingProfileFields(p: Profile | null): string[] {
  const m: string[] = [];
  if (!p) return ["age", "sex", "height_cm", "weight_kg", "activity_level", "goals"];
  if (!p.age) m.push("age");
  if (!p.sex) m.push("sex");
  if (!p.height_cm) m.push("height");
  if (!p.weight_kg) m.push("weight");
  if (!p.activity_level) m.push("activity level");
  if (!p.goals?.length) m.push("health goals");
  return m;
}


const GOAL_PLAYBOOK: Record<Goal, string> = {
  diabetes_friendly:
    "Low-GI focus. Prefer lal chal/atta ruti over white bhat. Pair carbs with protein+fiber. Watch sweet drinks, mishti, fruit juice, alur dom. Target ≥10g fiber/meal, sodium ≤700mg/meal.",
  anemia_friendly:
    "Iron-forward. Boost lal shak, kochu shak, liver, egg yolk, beef, mola/dhela (small fish eaten whole). Add vitamin-C (lemon, amra, peyara) to meal to absorb iron. Avoid tea/coffee with meal.",
  weight_loss:
    "Calorie-controlled, high-protein, high-fiber, low oil. Cut polao/biryani portion, swap bhat→shobji-bhat or shobji ratio up. Prefer shorshe/grilled fish over deep-fried. ~25-30% kcal deficit per meal vs TDEE.",
  muscle_gain:
    "Protein-priority. Aim ≥0.4g protein/kg/meal. Egg, dim, mach (rui/ilish/pangash), murgi, chickpea, dal, doi. Slight kcal surplus vs TDEE.",
  pregnancy:
    "Extra +350 kcal/day in 2nd–3rd trimester. Iron+folate+calcium critical: lal shak, dim, dudh, chickpea, mola/dhela. AVOID raw fish, undercooked egg, shutki risk, excess liver vitamin-A, high-mercury fish, paan/zarda, raw papaya in early pregnancy.",
  pcos_friendly:
    "Low-GI + anti-inflammatory. Same as diabetes; add zinc & magnesium (kumro bichi, badam, kalo jeera). Limit refined sugar and ultra-processed snacks.",
  heart_healthy:
    "Sodium ≤600mg/meal. Mustard/soybean oil moderate, avoid dalda/ghee deep fry. Boost omega-3 small fish (ilish, mola), shak, almonds.",
  low_sodium:
    "Hard cap sodium ≤500mg/meal. Watch shutki, pickles, instant noodles, restaurant curries, soy sauce, Maggi cubes.",
  ramadan_friendly:
    "Iftar: hydrate first, slow carbs (chola, dates, doi). Sehri: complex carbs + protein + healthy fat for satiety. Avoid deep-fried piyaju/beguni overload.",
  student_budget:
    "Cheap protein wins: dim, dal, chola, mola, soya. Avoid restaurant/packaged. Suggest taka-per-serving when relevant.",
  general_wellness:
    "Half plate shak-shobji, quarter bhat, quarter dal+mach. Variety across the week.",
};

function buildUserContextBlock(p: Profile | null, freeText?: string): string {
  const tdee = estimateTDEE(p);
  const bmi = computeBMI(p);
  const summary = summarizeProfile(p);
  const goals = p?.goals ?? [];
  const playbook = goals.length
    ? goals
        .map((g) => `• ${g}: ${GOAL_PLAYBOOK[g] ?? "general healthy guidance"}`)
        .join("\n")
    : "• general_wellness: half shak-shobji, ¼ bhat, ¼ dal+mach";

  const tdeeLine = tdee
    ? `Estimated TDEE: ${tdee} kcal/day (Mifflin-St Jeor + activity).`
    : "TDEE: unknown (profile incomplete — give safe general targets).";

  const bmiLine = bmi != null
    ? `BMI: ${bmi} (${bmiBand(bmi)}). Factor this into portion + healthScore.`
    : "BMI: unknown.";

  const budgetLine = p?.budget_bdt
    ? `Food budget: ${p.budget_bdt} BDT / ${p.budget_period ?? "weekly"}. If this is tight (<2000 BDT/week or <8000 BDT/month) OR goals include student_budget, fill budgetAlternatives with cheap Deshi swaps (dim, dal, chola, mola, soya, seasonal shobji).`
    : "Budget: not set — leave budgetAlternatives empty unless student_budget goal is active.";

  // Per-meal kcal target hint: ~30% of TDEE for a main meal, adjusted for goal
  let perMealHint = "Per-meal target: ~600 kcal (default, no profile).";
  if (tdee) {
    let perMeal = Math.round(tdee * 0.3);
    if (goals.includes("weight_loss")) perMeal = Math.round(perMeal * 0.75);
    if (goals.includes("muscle_gain")) perMeal = Math.round(perMeal * 1.1);
    if (goals.includes("pregnancy")) perMeal = Math.round(perMeal + 120);
    perMealHint = `Per-meal kcal target hint: ~${perMeal} kcal (goal-adjusted).`;
  }

  return `USER PROFILE: ${summary}
${tdeeLine}
${bmiLine}
${budgetLine}
${perMealHint}

ACTIVE GOAL PLAYBOOK (apply these rules to scoring + swaps + targets):
${playbook}

CRITICAL: For EVERY dish in dishes[], fill nutrition (per the estimated portion_grams) and a 1-line warm note. Also fill substitutions (concrete one-for-one swaps), portionAdjustment (plain-English for THIS user), and budgetAlternatives where relevant.

Extra user note: ${freeText?.trim() || "(none)"}`;
}


export const analyzePlate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    let gateway;
    try {
      gateway = createGeminiProvider();
    } catch {
      throw new Error("Gemini is not configured. Set GEMINI_API_KEY.");
    }

    // Pull the signed-in user's profile (RLS-scoped, never trust client)
    const { supabase, userId } = context;
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const profile = (profileRow as Profile | null) ?? null;

    const userPrompt = `Analyze this plate of food FOR THIS SPECIFIC USER.

${buildUserContextBlock(profile, data.userContext)}

Use this knowledge base as ground truth for nutrition values and ideal plate comparison:
---
${BOUDI_KNOWLEDGE}
---

Return a complete JSON analysis matching the required schema. Every personalized field (healthScore, healthExplanation, idealPlateComparison, goalAlignment, goalAdjustedTargets, makeItHealthierTips, personalizedSuggestions) MUST reflect the user's goals — not generic advice. Be specific, warm, and explainable.`;

    const runVision = async (modelId: string) => {
      const { experimental_output } = await generateText({
        model: gateway(modelId),
        system: VISION_SYSTEM,
        experimental_output: Output.object({ schema: AnalysisSchema }),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image", image: data.imageDataUrl },
            ],
          },
        ],
      });
      return experimental_output;
    };

    const friendlyError = (err: unknown): never => {
      console.error("[analyzePlate] error", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (/429/.test(msg)) throw new Error("Nanumoni is a bit busy right now (rate limited). Try again in a moment, sona.");
      if (/402/.test(msg)) throw new Error("Gemini API quota exhausted — check your Google AI billing.");
      throw new Error("Nanumoni couldn't see the plate clearly. Try a brighter, closer photo?");
    };

    // RAG enrichment: pull FCTB-grounded nutrition for each dish via semantic search.
    async function enrichWithRag(
      base: z.infer<typeof AnalysisSchema>,
    ): Promise<{
      ragGrounding: { dish: string; matched: string; similarity: number }[];
    }> {
      if (!base.detected || !base.dishes.length) return { ragGrounding: [] };
      const names = base.dishes.map((d) => d.name);
      const vectors = await embedBatch(names);
      if (!vectors.length) return { ragGrounding: [] };
      const grounding: { dish: string; matched: string; similarity: number }[] = [];
      await Promise.all(
        vectors.map(async (vec, i) => {
          const { data: matches } = await supabase.rpc("match_foods", {
            query_embedding: vec as unknown as string,
            match_count: 1,
          });
          const top = (matches as RagMatch[] | null)?.[0];
          if (!top || top.similarity < 0.55) return;
          grounding.push({
            dish: base.dishes[i].name,
            matched: `${top.name_en} (${top.name_bn})`,
            similarity: Math.round(top.similarity * 100) / 100,
          });
          // Sanity-check & gently correct per-dish nutrition using FCTB numbers,
          // scaled to estimated portion. Trust model if difference is small.
          const grams = base.dishes[i].portion_grams || top.typical_portion_grams || 100;
          const ratio = grams / (top.typical_portion_grams || 100);
          const n = top.nutrition_per_portion ?? {};
          const dn = base.dishes[i].nutrition;
          const blend = (model: number, fctb: number | undefined) => {
            if (typeof fctb !== "number") return model;
            const scaled = fctb * ratio;
            // If model is wildly off (>50% diff), prefer FCTB; else 70/30 toward model.
            return Math.abs(model - scaled) / Math.max(scaled, 1) > 0.5
              ? Math.round(scaled)
              : Math.round(model * 0.7 + scaled * 0.3);
          };
          base.dishes[i].nutrition = {
            calories: blend(dn.calories, n.calories),
            protein_g: blend(dn.protein_g, n.protein_g),
            carbs_g: blend(dn.carbs_g, n.carbs_g),
            fat_g: blend(dn.fat_g, n.fat_g),
            fiber_g: blend(dn.fiber_g, n.fiber_g),
            iron_mg: blend(dn.iron_mg, n.iron_mg),
            sodium_mg: blend(dn.sodium_mg, n.sodium_mg),
          };
        }),
      );
      return { ragGrounding: grounding };
    }

    const profileMeta = {
      profileIncomplete: missingProfileFields(profile).length > 0,
      missingProfileFields: missingProfileFields(profile),
      bmi: computeBMI(profile),
    };

    // 1) Primary pass: Gemini 2.5 Pro (fast, multimodal-strong)
    let primary: z.infer<typeof AnalysisSchema>;
    try {
      primary = await runVision("gemini-2.5-pro");
    } catch (err) {
      return friendlyError(err);
    }

    const lowReason = isLowConfidence(primary);
    if (!lowReason) {
      const { ragGrounding } = await enrichWithRag(primary);
      return { ...primary, modelUsed: "gemini-2.5-pro" as const, ragGrounding, ...profileMeta };
    }

    // 2) Fallback pass: Gemini Flash for a second read on ambiguous plates
    console.log(`[analyzePlate] Gemini Pro low-confidence (${lowReason}) — retrying with Gemini Flash`);
    try {
      const fallback = await runVision("gemini-2.5-flash");
      // Prefer fallback ONLY if it actually improved confidence
      const fallbackLow = isLowConfidence(fallback);
      if (!fallbackLow || (fallback.dishes.length > primary.dishes.length)) {
        const { ragGrounding } = await enrichWithRag(fallback);
        return {
          ...fallback,
          modelUsed: "gemini-2.5-flash" as const,
          fallbackReason: `Switched to Gemini Flash: ${lowReason}`,
          ragGrounding,
          ...profileMeta,
        };
      }
      // Both low — return the more detailed one, flagged
      const { ragGrounding } = await enrichWithRag(primary);
      return {
        ...primary,
        modelUsed: "gemini-2.5-pro" as const,
        fallbackReason: `Both models had low confidence (${lowReason}). Try a brighter, closer photo.`,
        ragGrounding,
        ...profileMeta,
      };
    } catch (err) {
      console.error("[analyzePlate] Gemini Flash fallback failed", err);
      const { ragGrounding } = await enrichWithRag(primary);
      return {
        ...primary,
        modelUsed: "gemini-2.5-pro" as const,
        fallbackReason: `Fallback unavailable (${lowReason}).`,
        ragGrounding,
        ...profileMeta,
      };
    }
  });


