import { type SmartHealthNudge, validateNudgeSafety, sanitizeNudgeText } from "./smart-health-nudge";
import { generateOpenRouterObject } from "./openrouter-chat.server";
import { z } from "zod";

const VerifierSchema = z.object({
  safe: z.boolean(),
  issues: z.array(z.string()),
  fixedNudge: z.object({
    id: z.string(),
    titleBn: z.string(),
    titleEn: z.string(),
    messageBn: z.string(),
    messageEn: z.string(),
    benefitBn: z.string(),
    benefitEn: z.string(),
    actionLabelBn: z.string(),
    actionLabelEn: z.string(),
    imageKind: z.enum(["lal-shak", "dal", "water", "egg", "fish", "vegetables", "rice-balance", "generic"]),
    priority: z.enum(["low", "medium", "high"]),
    reasonBn: z.string(),
    reasonEn: z.string(),
    disclaimerBn: z.string(),
    disclaimerEn: z.string(),
    sevenDayPlan: z.array(z.object({
      day: z.number(),
      titleBn: z.string(),
      titleEn: z.string(),
      suggestionBn: z.string(),
      suggestionEn: z.string(),
      benefitBn: z.string(),
      benefitEn: z.string(),
      imageKind: z.enum(["lal-shak", "dal", "water", "egg", "fish", "vegetables", "rice-balance", "generic"]),
    })).optional(),
    checkInQuestionBn: z.string().optional(),
    checkInQuestionEn: z.string().optional(),
    exerciseSuggestionBn: z.string().optional(),
    exerciseSuggestionEn: z.string().optional(),
  }).optional()
});

export async function verifyNudgePlan3(generatedNudge: SmartHealthNudge, fallbackNudge: SmartHealthNudge): Promise<SmartHealthNudge> {
  // 1. Initial local deterministic validation
  let nudgeToVerify = { ...generatedNudge };
  
  // Sanitize text fields
  nudgeToVerify.titleBn = sanitizeNudgeText(nudgeToVerify.titleBn);
  nudgeToVerify.titleEn = sanitizeNudgeText(nudgeToVerify.titleEn);
  nudgeToVerify.messageBn = sanitizeNudgeText(nudgeToVerify.messageBn);
  nudgeToVerify.messageEn = sanitizeNudgeText(nudgeToVerify.messageEn);
  nudgeToVerify.benefitBn = sanitizeNudgeText(nudgeToVerify.benefitBn);
  nudgeToVerify.benefitEn = sanitizeNudgeText(nudgeToVerify.benefitEn);
  
  if (nudgeToVerify.checkInQuestionBn) {
    nudgeToVerify.checkInQuestionBn = sanitizeNudgeText(nudgeToVerify.checkInQuestionBn);
  }
  if (nudgeToVerify.checkInQuestionEn) {
    nudgeToVerify.checkInQuestionEn = sanitizeNudgeText(nudgeToVerify.checkInQuestionEn);
  }
  if (nudgeToVerify.sevenDayPlan) {
    nudgeToVerify.sevenDayPlan = nudgeToVerify.sevenDayPlan.map(p => ({
      ...p,
      titleBn: sanitizeNudgeText(p.titleBn),
      titleEn: sanitizeNudgeText(p.titleEn),
      suggestionBn: sanitizeNudgeText(p.suggestionBn),
      suggestionEn: sanitizeNudgeText(p.suggestionEn),
      benefitBn: sanitizeNudgeText(p.benefitBn),
      benefitEn: sanitizeNudgeText(p.benefitEn),
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
      return nudgeToVerify;
    }
  }

  return nudgeToVerify;
}
