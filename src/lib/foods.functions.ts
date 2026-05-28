import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";
import { embedMany } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { FOODS, buildEmbedText, type FoodSeed } from "@/lib/foods-dataset";
import { createGeminiEmbeddingModel, GEMINI_EMBEDDING_DIMS } from "@/lib/ai-gateway.server";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = GEMINI_EMBEDDING_DIMS;

async function embed(input: string | string[], isQuery = false): Promise<number[][]> {
  const values = Array.isArray(input) ? input : [input];
  try {
    const { embeddings } = await embedMany({
      model: createGeminiEmbeddingModel(),
      values,
      providerOptions: {
        google: {
          outputDimensionality: EMBED_DIMS,
          taskType: isQuery ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
        },
      },
    });

    // Validate embedding dimension for each result
    embeddings.forEach((embedding, i) => {
      if (embedding.length !== EMBED_DIMS) {
        throw new Error(`Embedding dimension mismatch: expected ${EMBED_DIMS}, got ${embedding.length}`);
      }
    });

    return embeddings;
  } catch (error) {
    console.error("[food-kb-sync] embedding failed", {
      model: EMBED_MODEL,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasGoogleKey: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      error: error instanceof Error ? error.message : String(error),
    });
    const msg = error instanceof Error ? error.message : String(error);
    if (/429|rate/i.test(msg)) throw new Error("Embedding rate limited, try again in a moment.");
    throw new Error(`Gemini embedding error: ${msg.slice(0, 200)}`);
  }
}

function contentHash(f: FoodSeed): string {
  return createHash("sha1").update(JSON.stringify(f)).digest("hex").slice(0, 16);
}

/** Idempotent seed: upserts every FOODS item; only re-embeds when content hash changes. */
export const seedFoods = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    // Fetch existing hashes to skip unchanged items
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("foods")
      .select("food_id, embedding_source");
    if (exErr) throw new Error(exErr.message);
    const existingMap = new Map((existing ?? []).map((r) => [r.food_id, r.embedding_source ?? ""]));

    const toEmbed: FoodSeed[] = [];
    const skipped: string[] = [];
    for (const f of FOODS) {
      const tag = `${EMBED_MODEL}:${contentHash(f)}`;
      if (existingMap.get(f.food_id) === tag) skipped.push(f.food_id);
      else toEmbed.push(f);
    }

    let inserted = 0;
    if (toEmbed.length) {
      // Batch embed (max 256 per call — we're well under)
      const vectors = await embed(toEmbed.map(buildEmbedText));
      const rows = toEmbed.map((f, i) => ({
        food_id: f.food_id,
        name_en: f.name_en,
        name_bn: f.name_bn,
        category: f.category,
        typical_portion_grams: f.typical_portion_grams,
        nutrition_per_portion: f.nutrition_per_portion,
        visual_description: f.visual_description,
        common_combinations: f.common_combinations,
        health_tags: f.health_tags,
        nanumoni_friendly_note: f.nanumoni_friendly_note,
        embedding: vectors[i] as unknown as string, // pgvector accepts number[] via supabase-js
        embedding_source: `${EMBED_MODEL}:${contentHash(f)}`,
      }));
      const { error } = await supabaseAdmin
        .from("foods")
        .upsert(rows, { onConflict: "food_id" });
      if (error) throw new Error(error.message);
      inserted = rows.length;
    }

    return {
      total: FOODS.length,
      embedded: inserted,
      skipped: skipped.length,
      model: EMBED_MODEL,
    };
  });

/** Semantic recall — embed a free-text query and return top matches. */
export const searchFoods = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        query: z.string().min(1).max(1000),
        limit: z.number().int().min(1).max(20).default(6),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const [vec] = await embed(data.query, true);
    const { supabase } = context;
    const { data: matches, error } = await supabase.rpc("match_foods", {
      query_embedding: vec as unknown as string,
      match_count: data.limit,
    });
    if (error) throw new Error(error.message);
    return { matches: matches ?? [] };
  });
