
import { searchNutritionByQuery } from "@/lib/nutrition-data.server";
import type { NutritionSearchResult } from "@/lib/nutrition-data.server";
import type { ConditionLookupResult, MedicineLookupResult, OpenFdaLookupResult } from "@/lib/api-response-templates.server";
import {
  getEdamamCredentials,
  getWhoIcdCredentials,
  getDataGovApiKey,
  getExternalApiUrls,
} from "@/lib/env.server";

export type ApiErrorResult = { error: string };

type SupabaseLike = { from: (table: string) => any };

function cleanBaseUrl(value: string | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/$/, "");
}

function firstArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function compactText(value: string, max = 280) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export async function lookupNutrition(query: string, supabase?: SupabaseLike): Promise<NutritionSearchResult> {
  return searchNutritionByQuery(query, supabase);
}

export async function lookupRxNorm(name: string): Promise<MedicineLookupResult> {
  const { rxNormBaseUrl } = getExternalApiUrls();
  const baseUrl = cleanBaseUrl(rxNormBaseUrl, "https://rxnav.nlm.nih.gov/REST");
  const url = new URL(baseUrl + "/rxcui.json");
  url.searchParams.set("name", name);
  url.searchParams.set("search", "2");
  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("RxNorm failed: " + response.status);
    const json = await response.json();
    const ids = Array.isArray(json?.idGroup?.rxnormId) ? json.idGroup.rxnormId.filter(Boolean) : [];
    const rxcui = ids[0];
    let normalizedName = name;
    if (rxcui) {
      try {
        const propUrl = new URL(baseUrl + "/rxcui/" + encodeURIComponent(rxcui) + "/properties.json");
        const propResponse = await fetch(propUrl, { headers: { accept: "application/json" } });
        if (propResponse.ok) {
          const propJson = await propResponse.json();
          normalizedName = propJson?.properties?.name || normalizedName;
        }
      } catch {
        // RxCUI is still useful even if properties are temporarily unavailable.
      }
    }
    return {
      query: name,
      rxcui,
      name: normalizedName,
      candidates: ids.slice(0, 5).map((id: string) => ({ rxcui: id, name: id === rxcui ? normalizedName : id })),
      sourceLabel: "RxNorm",
    };
  } catch (error) {
    return {
      query: name,
      candidates: [],
      sourceLabel: "RxNorm",
      error: error instanceof Error ? error.message : "RxNorm lookup failed",
    };
  }
}

export async function lookupOpenFda(drug: string): Promise<OpenFdaLookupResult> {
  const { openFdaBaseUrl } = getExternalApiUrls();
  const baseUrl = cleanBaseUrl(openFdaBaseUrl, "https://api.fda.gov");
  const apiKey = getDataGovApiKey();
  const url = new URL(baseUrl + "/drug/label.json");
  const safeDrug = drug.replace(/"/g, "");
  url.searchParams.set("search", 'openfda.brand_name:"' + safeDrug + '" OR openfda.generic_name:"' + safeDrug + '"');
  url.searchParams.set("limit", "1");
  if (apiKey) url.searchParams.set("api_key", apiKey);
  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("openFDA failed: " + response.status);
    const json = await response.json();
    const item = Array.isArray(json?.results) ? json.results[0] : null;
    if (!item) throw new Error("No openFDA label found");
    return {
      query: drug,
      brandNames: firstArray(item?.openfda?.brand_name),
      genericNames: firstArray(item?.openfda?.generic_name),
      purposes: firstArray(item?.purpose).slice(0, 2).map((v) => compactText(v)),
      indications: firstArray(item?.indications_and_usage).slice(0, 2).map((v) => compactText(v)),
      warnings: firstArray(item?.warnings).slice(0, 2).map((v) => compactText(v)),
      dosage: firstArray(item?.dosage_and_administration).slice(0, 1).map((v) => compactText(v)),
      sourceLabel: "openFDA",
    };
  } catch (error) {
    return {
      query: drug,
      brandNames: [],
      genericNames: [],
      purposes: [],
      indications: [],
      warnings: [],
      dosage: [],
      sourceLabel: "openFDA",
      error: error instanceof Error ? error.message : "openFDA lookup failed",
    };
  }
}

let whoToken: { accessToken: string; expiresAt: number } | null = null;

async function getWhoToken() {
  const now = Date.now();
  if (whoToken && whoToken.expiresAt - 60_000 > now) return whoToken.accessToken;
  const { clientId, clientSecret, tokenUrl } = getWhoIcdCredentials();
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, scope: "icdapi_access", grant_type: "client_credentials" });
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("WHO ICD token failed: " + response.status);
  const json = await response.json();
  const accessToken = json?.access_token;
  if (!accessToken) throw new Error("WHO ICD token response missing access token");
  whoToken = { accessToken, expiresAt: now + Number(json?.expires_in || 3600) * 1000 };
  return accessToken;
}

export async function lookupWhoIcd(query: string): Promise<ConditionLookupResult> {
  try {
    const token = await getWhoToken();
    const { baseUrl: rawBaseUrl } = getWhoIcdCredentials();
    const baseUrl = cleanBaseUrl(rawBaseUrl, "https://id.who.int/icd");
    const url = new URL(baseUrl + "/entity/search");
    url.searchParams.set("q", query);
    url.searchParams.set("flatResults", "true");
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "API-Version": "v2",
        "Accept-Language": "en",
        Authorization: "Bearer " + token,
      },
    });
    if (!response.ok) throw new Error("WHO ICD lookup failed: " + response.status);
    const json = await response.json();
    const destination = Array.isArray(json?.destinationEntities) ? json.destinationEntities : [];
    return {
      query,
      matches: destination.slice(0, 5).map((item: any) => ({
        title: String(item?.title || item?.theCode || item?.id || "Unknown condition").replace(/<[^>]+>/g, ""),
        code: item?.theCode ? String(item.theCode) : undefined,
        uri: item?.id ? String(item.id) : undefined,
      })),
      sourceLabel: "WHO ICD",
    };
  } catch (error) {
    return {
      query,
      matches: [],
      sourceLabel: "WHO ICD",
      error: error instanceof Error ? error.message : "WHO ICD lookup failed",
    };
  }
}


export type EdamamImageFoodResult = {
  detected: boolean;
  foods: Array<{ name: string; confidence?: number; nutrition?: Record<string, number> }>;
  sourceLabel: string;
  publicMessage?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  debugMessage?: string;
  visionAccess?: "available" | "missing_or_forbidden" | "unknown";
};

const EDAMAM_IMAGE_MAX_BYTES = 4_000_000;
const EDAMAM_FRIENDLY_UNAVAILABLE = "Image food detection is temporarily unavailable. You can type the food name and I will search the nutrition database.";

function getFriendlyEdamamMessage(code: string, statusCode?: number): string {
  if (statusCode === 429) return "Image detection is temporarily rate-limited. Please try again later, type the meal name, or use a demo sample.";
  if (statusCode === 401 || statusCode === 403 || code === "EDAMAM_VISION_ACCESS_DENIED") return "Image detection is not available for this API plan. You can still type the meal name manually.";
  if (code === "EDAMAM_ENV_MISSING") return "Image detection is not configured yet. You can still type the meal name manually.";
  return "Image food detection is temporarily unavailable. You can still type the meal name manually or use a demo sample.";
}

function edamamError(input: {
  code: string;
  message: string;
  statusCode?: number;
  debugMessage?: string;
  visionAccess?: EdamamImageFoodResult["visionAccess"];
}): EdamamImageFoodResult {
  if (input.statusCode === 429) {
    console.info("[image-analysis] external provider limited; using vision estimate");
  } else if (input.statusCode === 401 || input.statusCode === 403 || input.code === "EDAMAM_VISION_ACCESS_DENIED") {
    console.info("[image-analysis] external provider limited; using vision estimate");
  } else if (input.code === "EDAMAM_FETCH_FAILED") {
    console.info("[image-analysis] external provider limited; using vision estimate");
  } else {
    if (process.env.DEBUG_ANALYSIS === "true") {
      const rawMsg = input.debugMessage || input.message;
      const cleanMsg = rawMsg.includes("<html") || rawMsg.includes("<!DOCTYPE")
        ? "HTML error response"
        : rawMsg.slice(0, 150);
      console.error(`[edamam-image-food] ${input.code} error: ${cleanMsg}; using vision fallback`);
    }
  }

  if (process.env.DEBUG_ANALYSIS === "true" && process.env.DEBUG === "true") {
    console.error("[edamam-image-food-debug-details]", {
      code: input.code,
      statusCode: input.statusCode,
      message: input.message,
      debugMessage: input.debugMessage?.slice(0, 500),
      visionAccess: input.visionAccess || "unknown",
    });
  }

  const friendly = getFriendlyEdamamMessage(input.code, input.statusCode);
  return {
    detected: false,
    foods: [],
    sourceLabel: "Edamam Vision API",
    publicMessage: friendly,
    error: friendly,
    errorCode: input.code,
    statusCode: input.statusCode,
    debugMessage: undefined,
    visionAccess: input.visionAccess || "unknown",
  };
}

function nutrientQuantityMap(totalNutrients: any): Record<string, number> | undefined {
  if (!totalNutrients || typeof totalNutrients !== "object") return undefined;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(totalNutrients)) {
    const quantity = (value as any)?.quantity;
    if (typeof quantity === "number") out[key] = quantity;
  }
  return Object.keys(out).length ? out : undefined;
}

function foodsFromEdamamVision(json: any): EdamamImageFoodResult["foods"] {
  const foods: EdamamImageFoodResult["foods"] = [];
  const parsedFood = json?.parsed?.food;
  if (parsedFood?.label) {
    foods.push({ name: String(parsedFood.label), nutrition: parsedFood.nutrients });
  }
  const recipe = json?.recipe;
  const ingredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  for (const ingredient of ingredients) {
    const name = ingredient?.foodMatch || ingredient?.food || ingredient?.text;
    if (name) foods.push({ name: String(name), nutrition: nutrientQuantityMap(ingredient?.nutrients) });
  }
  const ingredientLines = Array.isArray(recipe?.ingredientLines) ? recipe.ingredientLines : [];
  for (const line of ingredientLines) {
    if (typeof line === "string" && line.trim()) foods.push({ name: line.trim() });
  }
  if (!foods.length && recipe?.label) {
    foods.push({ name: String(recipe.label), nutrition: nutrientQuantityMap(recipe.totalNutrients) });
  }
  const seen = new Set<string>();
  return foods.filter((food) => {
    const key = food.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

export async function lookupEdamamImageFood(imageDataUrl: string): Promise<EdamamImageFoodResult> {
  // Server-only credentials. Never use VITE_EDAMAM_* here because those would expose keys to the browser.
  let appId = "";
  let appKey = "";
  try {
    const creds = getEdamamCredentials();
    appId = creds.appId;
    appKey = creds.appKey;
  } catch (err) {
    return edamamError({
      code: "EDAMAM_ENV_MISSING",
      message: err instanceof Error ? err.message : "Missing EDAMAM_APP_ID or EDAMAM_APP_KEY on the server",
      visionAccess: "unknown",
    });
  }

  const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return edamamError({ code: "EDAMAM_INVALID_IMAGE", message: "Image must be a base64 data URI" });
  }

  const mimeType = match[1];
  const base64 = match[2];
  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes > EDAMAM_IMAGE_MAX_BYTES) {
    return edamamError({
      code: "EDAMAM_IMAGE_TOO_LARGE",
      message: "Image is too large for Edamam Vision API after resizing",
      debugMessage: "Image size " + approxBytes + " bytes exceeds limit " + EDAMAM_IMAGE_MAX_BYTES,
    });
  }
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mimeType)) {
    return edamamError({ code: "EDAMAM_UNSUPPORTED_IMAGE_TYPE", message: "Unsupported image type for Edamam: " + mimeType });
  }

  const url = new URL("https://api.edamam.com/api/food-database/nutrients-from-image");
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("beta", "true");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ image: imageDataUrl }),
    });
  } catch (error) {
    return edamamError({
      code: "EDAMAM_FETCH_FAILED",
      message: "Failed to reach Edamam Vision API",
      debugMessage: error instanceof Error ? error.message : String(error),
      visionAccess: "unknown",
    });
  }

  const responseText = await response.text().catch(() => "");
  let json: any = null;
  try {
    json = responseText ? JSON.parse(responseText) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const edamamMessage = Array.isArray(json) ? json.map((e: any) => e?.message || e?.errorCode).filter(Boolean).join("; ") : json?.message || json?.error || responseText;
    const authFailure = response.status === 401 || response.status === 403;
    return edamamError({
      code: authFailure ? "EDAMAM_VISION_ACCESS_DENIED" : "EDAMAM_ENDPOINT_ERROR",
      statusCode: response.status,
      message: authFailure
        ? "Edamam credentials are valid only if the account has Vision API access; request was denied with HTTP " + response.status
        : "Edamam Vision API returned HTTP " + response.status,
      debugMessage: edamamMessage || response.statusText,
      visionAccess: authFailure ? "missing_or_forbidden" : "unknown",
    });
  }

  const foods = foodsFromEdamamVision(json);
  if (!foods.length) {
    return edamamError({
      code: "EDAMAM_NO_FOOD_DETECTED",
      statusCode: response.status,
      message: "Edamam Vision API returned success but no recognizable food items",
      debugMessage: responseText.slice(0, 600),
      visionAccess: "available",
    });
  }

  console.info("[edamam-image-food] success", { statusCode: response.status, foods: foods.map((food) => food.name) });
  return { detected: true, foods, sourceLabel: "Edamam Vision API", visionAccess: "available" };
}
