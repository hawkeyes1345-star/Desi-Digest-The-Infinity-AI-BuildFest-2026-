const DEFAULT_MAX_CALLS = 30;
let quotaDay = "";
let quotaCount = 0;

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

export function tryConsumeGeminiQuota() {
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
