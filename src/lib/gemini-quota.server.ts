const DEFAULT_MAX_CALLS = 30;
let quotaDay = "";
let quotaCount = 0;
let geminiCooldownUntil = 0;

function currentDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function envFlag(name: string, fallback: boolean) {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function isGeminiChatEnabled() {
  return envFlag("ENABLE_GEMINI_CHAT", true);
}

export function useTemplateFallback() {
  return envFlag("USE_TEMPLATE_FALLBACK", true);
}

export function isGeminiOnCooldown(): boolean {
  return Date.now() < geminiCooldownUntil;
}

export function setGeminiCooldown(minutes = 30) {
  geminiCooldownUntil = Date.now() + minutes * 60 * 1000;
}

export function resetGeminiCooldown() {
  geminiCooldownUntil = 0;
}

export type SafeAiErrorType = "AI_QUOTA_EXCEEDED" | "AI_TEMPORARILY_UNAVAILABLE" | "AI_NETWORK_ERROR" | "AI_UNKNOWN_ERROR";

export function detectAndMapAiError(error: unknown): { code: SafeAiErrorType; isQuotaOrRateLimit: boolean } {
  const msg = error instanceof Error ? error.message : String(error || "");
  const lower = msg.toLowerCase();
  
  if (
    lower.includes("resource_exhausted") ||
    lower.includes("quota exceeded") ||
    lower.includes("ai_retryerror") ||
    lower.includes("rate limit") ||
    lower.includes("429")
  ) {
    return { code: "AI_QUOTA_EXCEEDED", isQuotaOrRateLimit: true };
  }
  
  if (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("model unavailable") ||
    lower.includes("unavailable")
  ) {
    return { code: "AI_TEMPORARILY_UNAVAILABLE", isQuotaOrRateLimit: true };
  }

  if (
    lower.includes("timeout") ||
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("failed after retries") ||
    lower.includes("failed after 3 attempts")
  ) {
    return { code: "AI_NETWORK_ERROR", isQuotaOrRateLimit: false };
  }

  return { code: "AI_UNKNOWN_ERROR", isQuotaOrRateLimit: false };
}

export function tryConsumeGeminiQuota() {
  if (isGeminiOnCooldown()) {
    return { allowed: false, reason: "AI_QUOTA_EXCEEDED" };
  }
  if (!isGeminiChatEnabled()) return { allowed: false, reason: "Gemini chat is disabled" };
  const max = Number(process.env.MAX_GEMINI_CALLS_PER_DAY || DEFAULT_MAX_CALLS);
  const day = currentDayKey();
  if (quotaDay !== day) {
    quotaDay = day;
    quotaCount = 0;
  }
  if (Number.isFinite(max) && max >= 0 && quotaCount >= max) {
    return { allowed: false, reason: "Daily Gemini explanation limit reached" };
  }
  quotaCount += 1;
  return { allowed: true, reason: null };
}

