import {
  isGeminiFlashOnCooldown,
  setGeminiFlashCooldown,
  isGeminiLiteOnCooldown,
  setGeminiLiteCooldown,
  tryConsumeGeminiQuota,
  detectAndMapAiError
} from "@/lib/gemini-quota.server";

let openRouterCooldownUntil = 0;

export function isOpenRouterOnCooldown(): boolean {
  return Date.now() < openRouterCooldownUntil;
}

export function setOpenRouterCooldown(minutes = 30) {
  openRouterCooldownUntil = Date.now() + minutes * 60 * 1000;
}

export async function routeAiCall<T>(
  providers: {
    geminiFlash?: () => Promise<T>;
    geminiLite?: () => Promise<T>;
    openRouter?: () => Promise<T>;
    fallback: () => T | Promise<T>;
  },
  contextName: string
): Promise<{ result: T; provider: 'gemini-flash' | 'gemini-lite' | 'openrouter' | 'fallback'; fallbackReason?: string }> {
  
  let hasCheckedQuota = false;
  let quotaAllowed = true;
  let quotaReason = "";

  const checkQuotaOnce = () => {
    if (!hasCheckedQuota) {
      hasCheckedQuota = true;
      const q = tryConsumeGeminiQuota();
      quotaAllowed = q.allowed;
      quotaReason = q.reason || "";
    }
    return quotaAllowed;
  };

  // 1. Try gemini-2.5-flash
  if (providers.geminiFlash) {
    if (!isGeminiFlashOnCooldown()) {
      if (checkQuotaOnce()) {
        try {
          const result = await providers.geminiFlash();
          return { result, provider: 'gemini-flash' };
        } catch (error) {
          const mapped = detectAndMapAiError(error);
          console.error(`[ai-router] Gemini Flash failed for ${contextName}:`, mapped.code);
          if (mapped.isQuotaOrRateLimit) {
            console.info(`[ai-router] gemini-2.5-flash quota cooldown active; trying gemini-2.5-flash-lite`);
            setGeminiFlashCooldown(30);
          }
        }
      } else {
        console.info(`[ai-router] Gemini Flash blocked by quota check: ${quotaReason}`);
      }
    } else {
      console.info(`[ai-router] gemini-2.5-flash quota cooldown active; trying gemini-2.5-flash-lite`);
    }
  }

  // 2. Try gemini-2.5-flash-lite
  if (providers.geminiLite) {
    if (!isGeminiLiteOnCooldown()) {
      if (checkQuotaOnce()) {
        try {
          const result = await providers.geminiLite();
          return { result, provider: 'gemini-lite' };
        } catch (error) {
          const mapped = detectAndMapAiError(error);
          console.error(`[ai-router] Gemini Lite failed for ${contextName}:`, mapped.code);
          if (mapped.isQuotaOrRateLimit) {
            console.info(`[ai-router] gemini-2.5-flash-lite failed; trying OpenRouter/free`);
            setGeminiLiteCooldown(30);
          }
        }
      } else {
        console.info(`[ai-router] Gemini Lite blocked by quota check: ${quotaReason}`);
      }
    } else {
      console.info(`[ai-router] gemini-2.5-flash-lite failed; trying OpenRouter/free`);
    }
  }

  // 3. Try OpenRouter
  if (providers.openRouter && !isOpenRouterOnCooldown()) {
    try {
      const result = await providers.openRouter();
      return { result, provider: 'openrouter' };
    } catch (error) {
      const mapped = detectAndMapAiError(error);
      console.error(`[ai-router] OpenRouter failed for ${contextName}:`, mapped.code);
      if (mapped.isQuotaOrRateLimit) {
        setOpenRouterCooldown(30);
      }
    }
  }

  // 4. Fallback
  console.info(`[ai-router] All AI providers unavailable for ${contextName}. Using fallback.`);
  const fallbackReason = (isGeminiFlashOnCooldown() || !providers.geminiFlash) && 
                         (isGeminiLiteOnCooldown() || !providers.geminiLite) && 
                         (isOpenRouterOnCooldown() || !providers.openRouter)
    ? 'AI_QUOTA_EXCEEDED' 
    : 'AI_TEMPORARILY_UNAVAILABLE';
    
  const result = await providers.fallback();
  return { result, provider: 'fallback', fallbackReason };
}
