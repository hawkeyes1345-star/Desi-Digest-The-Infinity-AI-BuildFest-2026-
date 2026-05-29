import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { embedMany, generateText, Output } from "ai";
import { createGeminiEmbeddingModel, createGeminiProvider, GEMINI_EMBEDDING_DIMS } from "@/lib/ai-gateway.server";
import { ALLOWED_IMAGE_MIME_TYPES, normalizeImageMimeType, parseImageDataUrl } from "@/lib/image-mime";
import { BOUDI_KNOWLEDGE } from "@/lib/nanumoni-knowledge";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type Goal, type Profile, summarizeProfile } from "@/lib/profile.functions";

const VISION_MODEL_NAME = "gemini-2.5-flash" as const;

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


const InputSchema = z
  .object({
    imageBase64: z.string().min(32).max(8_000_000).optional(),
    mimeType: z.string().max(64).optional(),
    imageDataUrl: z.string().min(32).max(8_000_000).optional(),
    userContext: z.string().max(500).optional(),
  })
  .refine((input) => Boolean(input.imageBase64 || input.imageDataUrl), {
    message: "Image payload is required",
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

Be honest about confidence. If the image is too blurry, dark, or has no food, set detected=false / blurry=true and write a kind Nanumoni-voice message — never invent food. If it's a single food item (like a bowl of rice) or a partial plate, identify it and DO NOT say the image is unclear. Provide a partial but useful analysis.

If you can see only cooked rice / bhat, set detected=true and blurry=false, include one dish such as "Cooked White Rice / Bhat", use medium or high confidence when visually reasonable, and say: "I can see rice, but I may be missing other foods." Do not require a plate shape; bowls, close-ups, partial plates, and single food items are valid food photos.

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
  .inputValidator((input: unknown) => {
    try {
      return InputSchema.parse(input);
    } catch (error) {
      console.error("[plate-analysis] failed", {
        phase: "schema_parse",
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  })
  .handler(async ({ data, context }) => {
    const parsedDataUrl = data.imageDataUrl ? parseImageDataUrl(data.imageDataUrl) : null;
    const imageBase64 = data.imageBase64 ?? parsedDataUrl?.imageBase64 ?? "";
    const mimeType = normalizeImageMimeType(data.mimeType) ?? parsedDataUrl?.mimeType ?? null;

    if (!imageBase64 || imageBase64.length < 1000) {
      throw new Error("Invalid or empty image payload");
    }

    if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
      throw new Error(`Unsupported image MIME type: ${mimeType}`);
    }

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
      console.info("[plate-analysis] starting Gemini vision call", {
        model: VISION_MODEL_NAME,
        hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
        mimeType,
        imageBase64Length: imageBase64?.length ?? 0,
      });

      try {
        const { text } = await generateText({
          model: gateway(modelId),
          system: VISION_SYSTEM,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                { type: "image", image: imageBase64, mediaType: mimeType },
              ],
            },
          ],
        });

        // Clean up markdown if present
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text;
        
        try {
          return AnalysisSchema.parse(JSON.parse(jsonString));
        } catch (parseError) {
          console.error("[plate-analysis] failed to parse Gemini JSON", {
            text,
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
          throw new Error("AI returned invalid data format. Please try again.");
        }
      } catch (error) {
        console.error("[plate-analysis] Gemini vision call failed", {
          model: VISION_MODEL_NAME,
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : undefined,
        });
        throw error;
      }
    };

    const friendlyError = (err: unknown): never => {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (/Unsupported image MIME type/i.test(msg)) {
        throw new Error("Please upload a PNG, JPG, JPEG, or WEBP image.");
      }
      if (/Invalid or empty image payload/i.test(msg)) {
        throw new Error("Image upload failed. Please reupload the photo.");
      }
      if (/429/.test(msg)) throw new Error("Nanumoni is a bit busy right now (rate limited). Try again in a moment, sona.");
      if (/402/.test(msg)) throw new Error("Gemini API quota exhausted — check your Google AI billing.");
      throw new Error("AI analysis failed. Please try again.");
    };

    const profileMeta = {
      profileIncomplete: missingProfileFields(profile).length > 0,
      missingProfileFields: missingProfileFields(profile),
      bmi: computeBMI(profile),
    };

    // Primary pass: Gemini 2.5 Flash
    try {
      const analysis = await runVision(VISION_MODEL_NAME);
      return { 
        ...analysis, 
        modelUsed: VISION_MODEL_NAME, 
        ragGrounding: [], 
        ...profileMeta 
      };
    } catch (err) {
      return friendlyError(err);
    }
  });


