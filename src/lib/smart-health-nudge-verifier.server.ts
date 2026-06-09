import { type SmartHealthNudge, validateNudgeSafety, sanitizeNudgeText } from "./smart-health-nudge";
import { generateOpenRouterObject } from "./openrouter-chat.server";
import { z } from "zod";

const VerifierSchema = z.object({
  safe: z.boolean(),
  issues: z.array(z.string()),
  fixedNudge: z.object({
    id: z.string(),
    title: z.string(),
    message: z.string(),
    benefit: z.string(),
    actionLabel: z.string(),
    imageKind: z.enum(["lal-shak", "dal", "water", "egg", "fish", "vegetables", "rice-balance", "generic"]),
    priority: z.enum(["low", "medium", "high"]),
    reason: z.string(),
    disclaimer: z.string(),
    sevenDayPlan: z.array(z.object({
      day: z.number(),
      title: z.string(),
      suggestion: z.string(),
      benefit: z.string(),
      imageKind: z.enum(["lal-shak", "dal", "water", "egg", "fish", "vegetables", "rice-balance", "generic"]),
    })).optional()
  }).optional()
});

export async function verifyNudgePlan3(generatedNudge: SmartHealthNudge, fallbackNudge: SmartHealthNudge): Promise<SmartHealthNudge> {
  // 1. Initial local deterministic validation
  let nudgeToVerify = { ...generatedNudge };
  
  // Sanitize text fields
  nudgeToVerify.title = sanitizeNudgeText(nudgeToVerify.title);
  nudgeToVerify.message = sanitizeNudgeText(nudgeToVerify.message);
  nudgeToVerify.benefit = sanitizeNudgeText(nudgeToVerify.benefit);
  if (nudgeToVerify.sevenDayPlan) {
    nudgeToVerify.sevenDayPlan = nudgeToVerify.sevenDayPlan.map(p => ({
      ...p,
      title: sanitizeNudgeText(p.title),
      suggestion: sanitizeNudgeText(p.suggestion),
      benefit: sanitizeNudgeText(p.benefit)
    }));
  }

  const isLocallySafe = validateNudgeSafety(nudgeToVerify);
  if (!isLocallySafe) {
    console.warn("[Nudge Verifier] Failed local safety check. Returning fallback.");
    return fallbackNudge;
  }

  // 2. Optional AI verification (Plan 3)
  if (process.env.SMART_NUDGE_AI_VERIFY === "true") {
    try {
      const systemPrompt = `You are an AI Safety Engineer for a HealthTech application.
Your job is to strictly verify the safety of a generated nutrition nudge.
The app is NOT a medical device. It cannot diagnose, cure, or treat conditions.

CRITICAL RULES:
- MUST NOT contain any diagnosis (e.g. "you have diabetes", "your ulcer").
- MUST NOT claim to cure or treat any disease.
- MUST NOT contain names of AI providers, models, or APIs (no "Gemini", "OpenRouter", "AI").
- MUST include the disclaimer: "General nutrition guidance — not medical advice."
- The sevenDayPlan MUST contain exactly 7 items if present.

Analyze the nudge and return JSON. If unsafe, provide a fixed safe version in "fixedNudge".`;

      const userPrompt = `Nudge to verify:\n${JSON.stringify(nudgeToVerify, null, 2)}`;

      const result = await generateOpenRouterObject(VerifierSchema, systemPrompt, userPrompt);
      
      if (!result.safe) {
        if (result.fixedNudge && validateNudgeSafety(result.fixedNudge as SmartHealthNudge)) {
          return { ...result.fixedNudge, id: generatedNudge.id } as SmartHealthNudge;
        }
        console.warn("[Nudge Verifier] AI Verification failed and no safe fix provided.");
        return fallbackNudge;
      }
    } catch (e) {
      console.error("[Nudge Verifier] AI Verification threw error. Falling back to safe local nudge.");
      // It's already locally safe, but if the verifier throws, we can either return the local one or the fallback.
      // Returning the local one is fine since `validateNudgeSafety` passed.
      return nudgeToVerify;
    }
  }

  return nudgeToVerify;
}
