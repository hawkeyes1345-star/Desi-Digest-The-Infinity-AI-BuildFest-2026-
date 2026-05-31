import { createFileRoute } from "@tanstack/react-router";

import { lookupRxNorm } from "@/lib/external-api.server";

type Body = { name?: unknown };

export const Route = createFileRoute("/api/rxnorm/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name) return Response.json({ error: "name is required" }, { status: 400 });
        const result = await lookupRxNorm(name);
        return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
      },
    },
  },
});
