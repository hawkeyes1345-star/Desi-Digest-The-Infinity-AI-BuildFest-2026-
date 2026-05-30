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

  if (!apiKey) return { name: "FoodData Central / Data.gov", status: "FAILED", message: "Missing API key", key: masked };

  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=cooked+white+rice&pageSize=1`;
    const response = await fetchWithTimeout(url, {
      headers: { 'User-Agent': 'DeshiDietGuide/1.0' }
    });
    const data = await response.json();

    if (response.ok && data.foods) {
      return { name: "FoodData Central / Data.gov", status: "OK", key: masked };
    } else {
      return { name: "FoodData Central / Data.gov", status: "FAILED", message: data.error?.message || "Invalid response structure", key: masked, httpStatus: response.status };
    }
  } catch (error) {
    return { name: "FoodData Central / Data.gov", status: "FAILED", message: error.name === 'AbortError' ? 'Timeout' : error.message, key: masked };
  }
}

async function checkRxNorm() {
  const baseUrl = process.env.RXNORM_BASE_URL || "https://rxnav.nlm.nih.gov/REST";
  
  try {
    const url = `${baseUrl}/rxcui.json?name=metformin&search=2`;
    const response = await fetchWithTimeout(url, {
      headers: { 'User-Agent': 'DeshiDietGuide/1.0' }
    });
    const data = await response.json();

    if (response.ok && data.idGroup?.rxnormId) {
      return { name: "RxNorm", status: "OK", baseUrl };
    } else {
      return { name: "RxNorm", status: "FAILED", message: "No RxCUI found", httpStatus: response.status };
    }
  } catch (error) {
    return { name: "RxNorm", status: "FAILED", message: error.name === 'AbortError' ? 'Timeout' : error.message };
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
  
  const maskedKey = maskKey(key);
  const maskedServiceKey = maskKey(serviceKey);

  if (!url || !key) {
    return { name: "Supabase", status: "FAILED", message: "Missing URL or Publishable Key", key: maskedKey };
  }

  try {
    const response = await fetchWithTimeout(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    // Root rest/v1/ might return 200 with API info or 401 if restricted, 
    // but usually it confirms the key is valid for the endpoint.
    if (response.ok) {
      return { name: "Supabase", status: "OK", key: maskedKey, serviceKey: maskedServiceKey };
    } else {
      return { name: "Supabase", status: "FAILED", message: `REST check failed`, key: maskedKey, httpStatus: response.status };
    }
  } catch (error) {
    return { name: "Supabase", status: "FAILED", message: error.name === 'AbortError' ? 'Timeout' : error.message, key: maskedKey };
  }
}

async function main() {
  console.log("🚀 Starting API Health Checks...\n");

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
    const icon = res.status === "OK" ? "✅" : "❌";
    console.log(`${icon} ${res.name}`);
    if (res.status !== "OK") {
      allOk = false;
      console.log(`   - Status: ${res.httpStatus || 'N/A'}`);
      console.log(`   - Error: ${res.message}`);
      console.log(`   - Key Check: ${res.key || 'N/A'}`);
      if (res.name === "Supabase" && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
         console.log(`   - Note: SUPABASE_SERVICE_ROLE_KEY is missing but not used for this REST check.`);
      }
    }
  });

  console.log("\n--------------------------------------------------");
  if (allOk) {
    console.log("🎉 ALL SYSTEMS GO!");
  } else {
    console.log("⚠️ SOME CHECKS FAILED. Please verify your .env variables.");
  }
}

main().catch(err => {
  console.error("Fatal error during health check:", err);
  process.exit(1);
});
