/**
 * Safe server-side environment variables manager for Desi Digest.
 * Crucially, this file is backend-only and should never be imported or executed in the client.
 * 
 * NOTE: After changing environment variables in .env or .env.local,
 * the development server must be restarted:
 * npm run dev
 */

// Helper to log safe preview of keys for debugging in development without leaking secrets
function formatKeyPreview(key: string | undefined): string {
  if (!key) return "undefined";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return `[length: ${trimmed.length}]`;
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-2)} (length: ${trimmed.length})`;
}

/**
 * Validates and retrieves the Gemini API Key.
 * Supports both GOOGLE_GENERATIVE_AI_API_KEY and GEMINI_API_KEY (preferring GOOGLE_GENERATIVE_AI_API_KEY).
 */
export function getGeminiApiKey(): string {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === "your-gemini-api-key" || apiKey === "") {
    throw new Error("Missing Gemini API key configuration on server.");
  }
  return apiKey;
}

/**
 * Validates and retrieves the OpenRouter API key.
 */
export function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey || apiKey === "sk-or-v1-your-key-here" || apiKey === "") {
    throw new Error("Missing OpenRouter API key configuration on server.");
  }
  return apiKey;
}

/**
 * Validates and retrieves Edamam API credentials.
 * Prefers server-side EDAMAM_APP_ID/KEY over VITE_ prefixed counterparts.
 */
export function getEdamamCredentials(): { appId: string; appKey: string } {
  const appId = process.env.EDAMAM_APP_ID?.trim() || process.env.VITE_EDAMAM_APP_ID?.trim();
  const appKey = process.env.EDAMAM_APP_KEY?.trim() || process.env.VITE_EDAMAM_APP_KEY?.trim();

  if (!appId || !appKey || appId === "your-edamam-app-id" || appKey === "your-edamam-app-key") {
    throw new Error("Missing Edamam credentials (EDAMAM_APP_ID / EDAMAM_APP_KEY) on server.");
  }
  return { appId, appKey };
}

/**
 * Validates and retrieves server-side Supabase configuration.
 */
export function getSupabaseServerEnv(): {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabasePublishableKey: string;
} {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL configuration on server.");
  }
  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY configuration on server.");
  }
  if (!supabasePublishableKey) {
    throw new Error("Missing SUPABASE_PUBLISHABLE_KEY configuration on server.");
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    supabasePublishableKey,
  };
}

/**
 * Validates and retrieves WHO ICD credentials.
 */
export function getWhoIcdCredentials(): {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  baseUrl: string;
} {
  const clientId = process.env.WHO_ICD_CLIENT_ID?.trim();
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET?.trim();
  const tokenUrl = process.env.WHO_ICD_TOKEN_URL?.trim() || "https://icdaccessmanagement.who.int/connect/token";
  const baseUrl = process.env.WHO_ICD_BASE_URL?.trim() || "https://id.who.int/icd";

  if (!clientId || !clientSecret || clientId === "your_who_icd_client_id_here" || clientSecret === "your_who_icd_client_secret_here") {
    throw new Error("Missing WHO ICD credentials (WHO_ICD_CLIENT_ID / WHO_ICD_CLIENT_SECRET) on server.");
  }

  return { clientId, clientSecret, tokenUrl, baseUrl };
}

/**
 * Retrieves the optional Data.gov/USDA FDC API key.
 */
export function getDataGovApiKey(): string | undefined {
  const apiKey = process.env.DATA_GOV_API_KEY?.trim();
  if (!apiKey || apiKey === "your_data_gov_api_key_here") {
    return undefined;
  }
  return apiKey;
}

/**
 * Retrieves OpenRouter text model list.
 */
export function getOpenRouterTextModels(): string[] {
  const models = process.env.OPENROUTER_TEXT_MODELS;
  if (!models) return ["google/gemini-2.5-flash-lite", "openrouter/free"];
  return models.split(",").map(m => m.trim()).filter(m => m !== "");
}

/**
 * Retrieves OpenRouter vision model list.
 */
export function getOpenRouterVisionModels(): string[] {
  const models = process.env.OPENROUTER_VISION_MODELS;
  if (!models) return ["google/gemini-2.5-flash", "openrouter/free"];
  return models.split(",").map(m => m.trim()).filter(m => m !== "");
}

/**
 * Checks if AI consensus mode is enabled.
 */
export function isAiConsensusModeEnabled(): boolean {
  return process.env.AI_CONSENSUS_MODE === "true";
}

/**
 * Returns helper paths for RxNorm, openFDA, and USDA.
 */
export function getExternalApiUrls(): {
  rxNormBaseUrl: string;
  openFdaBaseUrl: string;
  usdaFdcBaseUrl: string;
} {
  return {
    rxNormBaseUrl: process.env.RXNORM_BASE_URL?.trim() || "https://rxnav.nlm.nih.gov/REST",
    openFdaBaseUrl: process.env.OPENFDA_BASE_URL?.trim() || "https://api.fda.gov",
    usdaFdcBaseUrl: process.env.USDA_FDC_BASE_URL?.trim() || "https://api.nal.usda.gov/fdc/v1",
  };
}
