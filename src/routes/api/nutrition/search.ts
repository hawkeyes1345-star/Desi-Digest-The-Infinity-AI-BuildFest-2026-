import { createFileRoute } from "@tanstack/react-router";

import { lookupNutrition } from "@/lib/external-api.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Body = { query?: unknown };

export const Route = createFileRoute("/api/nutrition/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const query = typeof body.query === "string" ? body.query.trim() : "";
        if (!query) return Response.json({ error: "query is required" }, { status: 400 });
        let result;
        try {
          result = await lookupNutrition(query, supabaseAdmin);
        } catch {
          result = await lookupNutrition(query);
        }
        return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
      },
    },
  },
});
