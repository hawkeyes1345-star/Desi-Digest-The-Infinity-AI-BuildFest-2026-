import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Load .env manually if not using --env-file
function loadEnv() {
  const envPath = join(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const maskKey = (key) => {
  if (!key) return "MISSING";
  if (key.length <= 8) return "****" + key.slice(-4);
  return `${key.slice(0, 4)}....${key.slice(-4)}`;
};

function getHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return "unknown";
  }
}

function isNetworkLikeError(error) {
  const message = String(error?.message || "").toLowerCase();
  const causeCode = String(error?.cause?.code || "").toLowerCase();

  return (
    error?.name === "TypeError" ||
    error?.name === "AbortError" ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("dns") ||
    causeCode.includes("enotfound") ||
    causeCode.includes("eai_again") ||
    causeCode.includes("etimedout") ||
    causeCode.includes("econnreset") ||
    causeCode.includes("econnrefused")
  );
}

function describeFetchFailure(error, url, curlCommand) {
  return {
    host: getHost(url),
    errorName: error?.name || "Error",
    errorMessage: error?.message || String(error),
    networkUnreachable: isNetworkLikeError(error) ? "likely" : "unknown",
    suggestion: "Test the endpoint from the same machine with curl.",
    curl: curlCommand,
  };
}

function getSupabaseKeyType(key) {
  if (!key) return "missing";
  if (key.startsWith("eyJ")) return "legacy_jwt_anon_key";
  return "new_publishable_key";
}

function getSupabaseHeaders(supabaseKey) {
  const headers = {
    apikey: supabaseKey,
  };

  if (supabaseKey?.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${supabaseKey}`;
  }

  return headers;
}

async function fetchWithTimeout(url, options = {}) {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function checkGemini() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const masked = maskKey(apiKey);
  
  if (!apiKey) return { name: "Gemini", status: "FAILED", message: "Missing API key", key: masked };

  try {
    const model = "gemini-2.5-flash-lite"; // As requested by user and used in codebase
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'DeshiDietGuide/1.0'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with exactly: Gemini OK" }] }]
      })
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (text.trim().includes("Gemini OK")) {
      return { name: "Gemini", status: "OK", key: masked };
    } else {
      return { name: "Gemini", status: "FAILED", message: `Unexpected response: ${text.slice(0, 50)}`, key: masked, httpStatus: response.status };
    }
  } catch (error) {
    return { name: "Gemini", status: "FAILED", message: error.name === 'AbortError' ? 'Timeout' : error.message, key: masked };
  }
}

async function checkUSDA() {
  const apiKey = process.env.DATA_GOV_API_KEY;
  const masked = maskKey(apiKey);
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=cooked%20white%20rice&api_key=${apiKey || "MISSING"}`;
  const curl = 'curl "https://api.nal.usda.gov/fdc/v1/foods/search?query=cooked%20white%20rice&api_key=$DATA_GOV_API_KEY"';

  if (!apiKey) {
    return { name: "FoodData Central / Data.gov", status: "FAILED", message: "Missing API key", key: masked, host: getHost(url), curl };
  }

  try {
    const response = await fetchWithTimeout(url, {
      headers: { 'User-Agent': 'DeshiDietGuide/1.0' }
    });
    const data = await response.json();

    if (response.ok && data.foods) {
      return { name: "FoodData Central / Data.gov", status: "OK", key: masked };
    } else {
      return {
        name: "FoodData Central / Data.gov",
        status: "FAILED",
        message: data.error?.message || "Invalid response structure",
        key: masked,
        httpStatus: response.status,
        host: getHost(url),
        curl,
      };
    }
  } catch (error) {
    return {
      name: "FoodData Central / Data.gov",
      status: "FAILED",
      message: error.name === 'AbortError' ? 'Timeout' : error.message,
      key: masked,
      ...describeFetchFailure(error, url, curl),
    };
  }
}

async function checkRxNorm() {
  const url = "https://rxnav.nlm.nih.gov/REST/rxcui.json?name=metformin&search=2";
  const curl = 'curl "https://rxnav.nlm.nih.gov/REST/rxcui.json?name=metformin&search=2"';
  
  try {
    const response = await fetchWithTimeout(url, {
      headers: { 'User-Agent': 'DeshiDietGuide/1.0' }
    });
    const data = await response.json();

    if (response.ok && data.idGroup?.rxnormId) {
      return { name: "RxNorm", status: "OK", host: getHost(url) };
    } else {
      return { name: "RxNorm", status: "FAILED", message: "No RxCUI found", httpStatus: response.status, host: getHost(url), curl };
    }
  } catch (error) {
    return {
      name: "RxNorm",
      status: "FAILED",
      message: error.name === 'AbortError' ? 'Timeout' : error.message,
      ...describeFetchFailure(error, url, curl),
    };
  }
}

async function checkWHO() {
  const clientId = process.env.WHO_ICD_CLIENT_ID;
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET;
  const maskedId = maskKey(clientId);
  const maskedSecret = maskKey(clientSecret);

  if (!clientId || !clientSecret) {
    return { name: "WHO ICD OAuth", status: "FAILED", message: "Missing Client ID or Secret", key: `${maskedId} / ${maskedSecret}` };
  }

  try {
    const response = await fetchWithTimeout("https://icdaccessmanagement.who.int/connect/token", {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'icdapi_access'
      })
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
      return { name: "WHO ICD OAuth", status: "OK", key: `${maskedId} / ${maskedSecret}` };
    } else {
      return { name: "WHO ICD OAuth", status: "FAILED", message: data.error || "Token retrieval failed", key: `${maskedId} / ${maskedSecret}`, httpStatus: response.status };
    }
  } catch (error) {
    return { name: "WHO ICD OAuth", status: "FAILED", message: error.name === 'AbortError' ? 'Timeout' : error.message, key: `${maskedId} / ${maskedSecret}` };
  }
}

async function checkSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyType = getSupabaseKeyType(key);
  
  const maskedKey = maskKey(key);
  const maskedServiceKey = maskKey(serviceKey);
  const curl = 'curl "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_PUBLISHABLE_KEY"';

  if (!url || !key) {
    return {
      name: "Supabase",
      status: "FAILED",
      message: "Missing URL or Publishable Key",
      key: maskedKey,
      keyType,
      curl,
    };
  }

  const baseUrl = url.replace(/\/$/, "");
  const checkUrl = keyType === "new_publishable_key"
    ? `${baseUrl}/auth/v1/settings`
    : `${baseUrl}/rest/v1/`;
  const checkedEndpoint = keyType === "new_publishable_key" ? "auth_settings" : "rest_root";

  try {
    const response = await fetchWithTimeout(checkUrl, {
      headers: getSupabaseHeaders(key)
    });

    if (response.ok) {
      return {
        name: "Supabase",
        status: "OK",
        key: maskedKey,
        keyType,
        serviceKey: maskedServiceKey,
        host: getHost(checkUrl),
        checkedEndpoint,
      };
    } else {
      let detail = "";
      try {
        detail = await response.text();
      } catch {
        detail = "Unable to read response body";
      }

      return {
        name: "Supabase",
        status: "FAILED",
        message: `Supabase check failed${detail ? `: ${detail.slice(0, 200)}` : ""}`,
        key: maskedKey,
        keyType,
        httpStatus: response.status,
        host: getHost(checkUrl),
        checkedEndpoint,
        curl,
      };
    }
  } catch (error) {
    return {
      name: "Supabase",
      status: "FAILED",
      message: error.name === 'AbortError' ? 'Timeout' : error.message,
      key: maskedKey,
      keyType,
      checkedEndpoint,
      ...describeFetchFailure(error, checkUrl, curl),
    };
  }
}

async function main() {
  console.log("Starting API Health Checks...\n");

  const results = await Promise.all([
    checkGemini(),
    checkUSDA(),
    checkRxNorm(),
    checkWHO(),
    checkSupabase()
  ]);

  console.log("API Health Check Results:");
  console.log("--------------------------------------------------");
  
  let allOk = true;
  results.forEach(res => {
    const icon = res.status === "OK" ? "OK" : "FAILED";
    console.log(`${icon} ${res.name}`);
    if (res.status !== "OK") {
      allOk = false;
      console.log(`   - Status: ${res.httpStatus || 'N/A'}`);
      console.log(`   - Error: ${res.message}`);
      console.log(`   - Key Check: ${res.key || 'N/A'}`);
      if (res.host) console.log(`   - Host: ${res.host}`);
      if (res.checkedEndpoint) console.log(`   - Checked Endpoint: ${res.checkedEndpoint}`);
      if (res.errorName) console.log(`   - Error Name: ${res.errorName}`);
      if (res.errorMessage) console.log(`   - Error Message: ${res.errorMessage}`);
      if (res.networkUnreachable) console.log(`   - DNS/Network: ${res.networkUnreachable}`);
      if (res.suggestion) console.log(`   - Suggestion: ${res.suggestion}`);
      if (res.curl) console.log(`   - Manual curl: ${res.curl}`);
      if (res.name === "Supabase") {
        console.log(`   - Supabase Key Type: ${res.keyType}`);
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.log(`   - Note: SUPABASE_SERVICE_ROLE_KEY is missing but not used for this REST check.`);
        }
      }
    } else {
      if (res.name === "Supabase") {
        console.log(`   - Supabase Key Type: ${res.keyType}`);
        console.log(`   - Checked Endpoint: ${res.checkedEndpoint}`);
      }
    }
  });

  console.log("\n--------------------------------------------------");
  if (allOk) {
    console.log("ALL SYSTEMS GO!");
  } else {
    console.log("SOME CHECKS FAILED. Please verify your .env variables or network access.");
  }
}

main().catch(err => {
  console.error("Fatal error during health check:", err);
  process.exit(1);
});
