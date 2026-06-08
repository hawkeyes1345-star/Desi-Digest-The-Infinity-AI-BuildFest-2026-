import fs from "fs";
import path from "path";

// Load .env and .env.local manually
const root = process.cwd();
const loadEnv = (file) => {
  const envPath = path.join(root, file);
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2];
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[match[1]]) process.env[match[1]] = value;
      }
    });
  }
};
loadEnv(".env");
loadEnv(".env.local");

const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
  console.error("Error: OPENROUTER_API_KEY not found in .env or .env.local");
  process.exit(1);
}

async function listModels() {
  console.info("Fetching OpenRouter models...");
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const models = data.data;

    const families = [
      "openai",
      "google/gemini",
      "anthropic/claude",
      "x-ai/grok",
      "deepseek",
      "qwen",
      "openrouter/free"
    ];

    const relevantModels = models.filter(m => families.some(f => m.id.startsWith(f)));

    console.log("\n--- Vision Supported Models (Potential) ---");
    const visionModels = relevantModels.filter(m => {
      // OpenRouter doesn't always have a clear 'vision' flag in the top level list
      // but some models have it in their description or id
      const id = m.id.toLowerCase();
      const name = (m.name || "").toLowerCase();
      const description = (m.description || "").toLowerCase();
      
      return id.includes("vision") || 
             id.includes("-vl-") || 
             name.includes("vision") || 
             description.includes("image") || 
             description.includes("vision") ||
             id === "openai/gpt-4o" || 
             id === "openai/gpt-4o-mini" ||
             id.includes("gemini-1.5") ||
             id.includes("gemini-2.0") ||
             id.includes("gemini-2.5") ||
             id.includes("claude-3");
    });

    visionModels.forEach(m => {
      console.log(`- ${m.id} (${m.name})`);
    });

    console.log("\n--- All Relevant Models ---");
    relevantModels.forEach(m => {
      console.log(`- ${m.id}`);
    });

    console.log("\n--- Recommended ENV values ---");
    const textModels = relevantModels
      .filter(m => !m.id.includes("vision") && !m.id.includes("-vl-"))
      .slice(0, 6)
      .map(m => m.id)
      .join(",");
    
    const visionEnv = visionModels
      .slice(0, 6)
      .map(m => m.id)
      .join(",");

    console.log(`OPENROUTER_TEXT_MODELS=${textModels}`);
    console.log(`OPENROUTER_VISION_MODELS=${visionEnv}`);

  } catch (error) {
    console.error("Failed to fetch models:", error);
  }
}

listModels();
