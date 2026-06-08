import { isGeminiOnCooldown, setGeminiCooldown, tryConsumeGeminiQuota, detectAndMapAiError } from "@/lib/gemini-quota.server";

let openRouterCooldownUntil = 0;

export function isOpenRouterOnCooldown(): boolean {
  return Date.now() < openRouterCooldownUntil;
}

export function setOpenRouterCooldown(minutes = 30) {
  openRouterCooldownUntil = Date.now() + minutes * 60 * 1000;
}

export async function routeAiCall<T>(
  geminiCall: () => Promise<T>,
  openRouterCall: () => Promise<T>,
  fallbackCall: () => T | Promise<T>,
  contextName: string
): Promise<{ result: T; provider: 'gemini' | 'openrouter' | 'fallback'; fallbackReason?: string }> {
  
  // 1. Try Gemini
  if (!isGeminiOnCooldown()) {
    const quota = tryConsumeGeminiQuota();
    if (quota.allowed) {
      try {
        const result = await geminiCall();
        return { result, provider: 'gemini' };
      } catch (error) {
        const mapped = detectAndMapAiError(error);
        console.error(`[ai-router] Gemini failed for ${contextName}:`, mapped.code);
        if (mapped.isQuotaOrRateLimit) setGeminiCooldown(30);
      }
    } else {
      console.info(`[ai-router] Gemini blocked by quota for ${contextName}: ${quota.reason}`);
    }
  }

  // 2. Try OpenRouter
  if (!isOpenRouterOnCooldown()) {
    try {
      const result = await openRouterCall();
      return { result, provider: 'openrouter' };
    } catch (error) {
      const mapped = detectAndMapAiError(error);
      console.error(`[ai-router] OpenRouter failed for ${contextName}:`, mapped.code);
      if (mapped.isQuotaOrRateLimit) setOpenRouterCooldown(30);
    }
  }

  // 3. Fallback
  console.info(`[ai-router] Both providers unavailable for ${contextName}. Using fallback.`);
  const fallbackReason = isGeminiOnCooldown() && isOpenRouterOnCooldown() 
    ? 'AI_QUOTA_EXCEEDED' 
    : 'AI_TEMPORARILY_UNAVAILABLE';
    
  const result = await fallbackCall();
  return { result, provider: 'fallback', fallbackReason };
}
