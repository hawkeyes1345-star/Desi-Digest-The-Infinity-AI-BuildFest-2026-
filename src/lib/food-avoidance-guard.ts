import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { extractFoodAvoidanceAi } from "./food-avoidance-ai.server";

// ─── Constants ───────────────────────────────────────────────────────────────

const AVOIDANCE_ALIASES: Record<string, string[]> = {
  shrimp: ["shrimp", "prawn", "chingri", "চিংড়ি", "চিংড়ি", "bagda", "galda"],
  chingri: ["shrimp", "prawn", "chingri", "চিংড়ি", "চিংড়ি", "bagda", "galda"],
  beef: ["beef", "cow", "gorur", "goru", "mangsho", "meat", "মাংস", "গরু", "গরুর"],
  egg: ["egg", "dim", "ডিম", "bhaji", "boiled"],
  mustard: ["mustard", "shorisha", "sorisha", "shorishar", "sorishar", "সরিষা", "সরিষার", "oil"],
  milk: ["milk", "dudh", "dud", "cream", "butter", "lactose", "দুধ"],
  peanut: ["peanut", "badam", "বাদাম", "peanuts", "chinabadam"],
  nut: ["nut", "badam", "বাদাম", "cashew", "almond", "walnut", "pestachiot"],
  fish: ["fish", "mach", "maach", "মাছ", "ilish", "rui", "katla", "pangash", "pabda", "shing", "magur"]
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type FoodAvoidanceMatch = {
  userAvoidItem: string;
  matchedText: string;
  confidence: "low" | "medium" | "high";
  reason: string;
  isAiDetected?: boolean;
};

export type FoodAvoidanceReview = {
  hasAvoidanceMatch: boolean;
  matches: FoodAvoidanceMatch[];
  warningMessage?: string;
  suggestedSwaps: string[];
  uncertaintyNote?: string;
  disclaimer: string;
};

// ─── Helper Functions ────────────────────────────────────────────────────────

export function normalizeFoodAvoidanceItem(item: string): string {
  const lower = item.toLowerCase().trim();
  if (lower === "shrimp" || lower === "chingri" || lower.includes("shrimp") || lower.includes("chingri")) {
    return "shrimp/chingri";
  }
  if (lower === "beef" || lower === "gorur" || lower === "gorur mangsho" || lower.includes("beef") || lower.includes("gorur")) {
    return "beef/gorur mangsho";
  }
  if (lower === "egg" || lower === "dim" || lower.includes("egg") || lower.includes("dim")) {
    return "egg/dim";
  }
  if (lower === "mustard" || lower === "shorisha" || lower === "shorishar" || lower.includes("mustard") || lower.includes("shorisha")) {
    return "mustard/shorisha";
  }
  return item;
}

export function sanitizeAvoidanceText(text: string): string {
  if (!text) return "";
  let clean = text;
  clean = clean.replace(/\ballergy-safe\b/gi, "cautious");
  clean = clean.replace(/\bguaranteed safe\b/gi, "supported with caution");
  clean = clean.replace(/\bcure\b/gi, "support");
  clean = clean.replace(/\btreatment\b/gi, "guidance");
  clean = clean.replace(/\bmedicine\b/gi, "medical advice");
  clean = clean.replace(/\bfree of allergies\b/gi, "portion-controlled");
  return clean;
}

export function deterministicAvoidanceMatch(
  mealCombinedText: string,
  userAvoidList: string[]
): FoodAvoidanceMatch[] {
  const matches: FoodAvoidanceMatch[] = [];
  const text = mealCombinedText.toLowerCase();

  for (const avoidItem of userAvoidList) {
    const avoidLower = avoidItem.toLowerCase().trim();
    if (!avoidLower) continue;

    // 1. Direct match check
    if (text.includes(avoidLower)) {
      matches.push({
        userAvoidItem: avoidItem,
        matchedText: avoidLower,
        confidence: "high",
        reason: `Direct match for '${avoidItem}' in meal text.`
      });
      continue;
    }

    // 2. Alias mapping checks
    let aliasKeys: string[] = [];
    for (const [key, list] of Object.entries(AVOIDANCE_ALIASES)) {
      if (key === avoidLower || list.includes(avoidLower)) {
        aliasKeys.push(key);
      }
    }

    let matchedAlias = false;
    for (const key of aliasKeys) {
      const aliases = AVOIDANCE_ALIASES[key];
      for (const alias of aliases) {
        if (text.includes(alias)) {
          matches.push({
            userAvoidItem: avoidItem,
            matchedText: alias,
            confidence: "high",
            reason: `Match for avoid item '${avoidItem}' via alias '${alias}' in meal text.`
          });
          matchedAlias = true;
          break;
        }
      }
      if (matchedAlias) break;
    }
  }

  return matches;
}

// ─── Server Function ─────────────────────────────────────────────────────────

const AvoidanceInputSchema = z.object({
  mealText: z.string().optional().nullable(),
  ingredients: z.array(z.string()).optional().nullable(),
  basketItems: z.array(z.string()).optional().nullable(),
  userAvoidList: z.array(z.string()),
  skipAi: z.boolean().optional().nullable()
});

export const reviewFoodAvoidance = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AvoidanceInputSchema.parse(input))
  .handler(async ({ data }): Promise<FoodAvoidanceReview> => {
    const { mealText, ingredients, basketItems, userAvoidList, skipAi } = data;

    const combinedList = [
      mealText,
      ...(ingredients || []),
      ...(basketItems || [])
    ].filter(Boolean);
    const combinedText = combinedList.join(" ").toLowerCase();

    // 1. Run deterministic local matching first
    let matches = deterministicAvoidanceMatch(combinedText, userAvoidList);
    let uncertaintyNote = "";

    // 2. Call AI extraction if requested and available
    if (!skipAi && userAvoidList.length > 0 && combinedText.length > 0) {
      try {
        const aiResult = await extractFoodAvoidanceAi({
          mealText: mealText || undefined,
          ingredients: ingredients || undefined,
          basketItems: basketItems || undefined,
          userAvoidList
        });

        if (aiResult.uncertaintyNote) {
          uncertaintyNote = aiResult.uncertaintyNote;
        }

        // Merge AI-detected possible ingredients for deterministic validation
        if (aiResult.possibleIngredients && aiResult.possibleIngredients.length > 0) {
          const aiIngredientsText = aiResult.possibleIngredients.join(" ").toLowerCase();
          const extraMatches = deterministicAvoidanceMatch(aiIngredientsText, userAvoidList);
          
          extraMatches.forEach(em => {
            const exists = matches.some(m => 
              normalizeFoodAvoidanceItem(m.userAvoidItem) === normalizeFoodAvoidanceItem(em.userAvoidItem) &&
              normalizeFoodAvoidanceItem(m.matchedText) === normalizeFoodAvoidanceItem(em.matchedText)
            );
            if (!exists) {
              matches.push({
                ...em,
                confidence: "medium", // Match verified through AI ingredient extraction
                reason: `Indirect match: AI suggested meal contains '${em.matchedText}' which maps to avoid item '${em.userAvoidItem}'.`
              });
            }
          });
        }

        // Merge directly suggested matches from AI
        if (aiResult.possibleAvoidanceMatches && aiResult.possibleAvoidanceMatches.length > 0) {
          aiResult.possibleAvoidanceMatches.forEach(am => {
            const exists = matches.some(m =>
              normalizeFoodAvoidanceItem(m.userAvoidItem) === normalizeFoodAvoidanceItem(am.userAvoidItem)
            );
            if (!exists) {
              matches.push({
                userAvoidItem: am.userAvoidItem,
                matchedText: am.matchedText,
                confidence: am.confidence === "high" ? "medium" : am.confidence, // Lower confidence slightly if only detected by AI
                reason: am.reason,
                isAiDetected: true
              });
            }
          });
        }
      } catch (err) {
        console.warn("[food-avoidance-guard] AI extraction failed or timed out. Reverted to local deterministic guard.", err);
        uncertaintyNote = "AI helper unavailable. Reverted to standard local checks.";
      }
    }

    // 3. Normalize all items
    matches = matches.map(m => ({
      ...m,
      userAvoidItem: normalizeFoodAvoidanceItem(m.userAvoidItem),
      matchedText: normalizeFoodAvoidanceItem(m.matchedText),
      reason: sanitizeAvoidanceText(m.reason)
    }));

    // 4. Build warning message and response
    const hasAvoidanceMatch = matches.length > 0;
    let warningMessage = "";
    if (hasAvoidanceMatch) {
      const matchNames = Array.from(new Set(matches.map(m => m.userAvoidItem)));
      const namesStr = matchNames.join(" and ");
      warningMessage = sanitizeAvoidanceText(
        `This may include ${namesStr}, which you marked as an avoid item. Please check ingredients before eating.`
      );
    }

    return {
      hasAvoidanceMatch,
      matches,
      warningMessage,
      suggestedSwaps: ["dal", "egg", "chicken", "fish"],
      uncertaintyNote: uncertaintyNote ? sanitizeAvoidanceText(uncertaintyNote) : undefined,
      disclaimer: "General nutrition guidance — not medical advice. For serious allergies, consult a qualified clinician."
    };
  });
