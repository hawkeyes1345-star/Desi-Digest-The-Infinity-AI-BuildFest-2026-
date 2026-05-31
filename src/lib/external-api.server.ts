
import { searchNutritionByQuery } from "@/lib/nutrition-data.server";
import type { NutritionSearchResult } from "@/lib/nutrition-data.server";
import type { ConditionLookupResult, MedicineLookupResult, OpenFdaLookupResult } from "@/lib/api-response-templates.server";

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
  const baseUrl = cleanBaseUrl(process.env.RXNORM_BASE_URL, "https://rxnav.nlm.nih.gov/REST");
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
  const baseUrl = cleanBaseUrl(process.env.OPENFDA_BASE_URL, "https://api.fda.gov");
  const apiKey = process.env.DATA_GOV_API_KEY?.trim();
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
  const clientId = process.env.WHO_ICD_CLIENT_ID?.trim();
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET?.trim();
  const tokenUrl = process.env.WHO_ICD_TOKEN_URL?.trim() || "https://icdaccessmanagement.who.int/connect/token";
  if (!clientId || !clientSecret) throw new Error("WHO ICD credentials are missing");
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
    const baseUrl = cleanBaseUrl(process.env.WHO_ICD_BASE_URL, "https://id.who.int/icd");
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
  error?: string;
};

export async function lookupEdamamImageFood(imageDataUrl: string): Promise<EdamamImageFoodResult> {
  const appId = process.env.EDAMAM_APP_ID?.trim();
  const appKey = process.env.EDAMAM_APP_KEY?.trim();
  if (!appId || !appKey) {
    return { detected: false, foods: [], sourceLabel: "Edamam", error: "Edamam image food detection is not configured" };
  }
  try {
    const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image data URL");
    const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
    const file = new Blob([bytes], { type: match[1] });
    const url = new URL("https://api.edamam.com/api/food-database/v2/parser");
    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    const form = new FormData();
    form.set("image", file, "plate.jpg");
    const response = await fetch(url, { method: "POST", body: form });
    if (!response.ok) throw new Error("Edamam image lookup failed: " + response.status);
    const json = await response.json();
    const hints = Array.isArray(json?.hints) ? json.hints : [];
    const foods = hints.slice(0, 5).map((hint: any) => ({
      name: String(hint?.food?.label || "Detected food"),
      confidence: typeof hint?.confidence === "number" ? hint.confidence : undefined,
      nutrition: hint?.food?.nutrients || undefined,
    }));
    return { detected: foods.length > 0, foods, sourceLabel: "Edamam" };
  } catch (error) {
    return { detected: false, foods: [], sourceLabel: "Edamam", error: error instanceof Error ? error.message : "Edamam lookup failed" };
  }
}
