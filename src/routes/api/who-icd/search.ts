import { createFileRoute } from "@tanstack/react-router";

import { lookupWhoIcd } from "@/lib/external-api.server";

type Body = { query?: unknown };

export const Route = createFileRoute("/api/who-icd/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const query = typeof body.query === "string" ? body.query.trim() : "";
        if (!query) return Response.json({ error: "query is required" }, { status: 400 });
        const result = await lookupWhoIcd(query);
        return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
      },
    },
  },
});
