import { createFileRoute } from "@tanstack/react-router";

import { lookupOpenFda } from "@/lib/external-api.server";

type Body = { drug?: unknown };

export const Route = createFileRoute("/api/openfda/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const drug = typeof body.drug === "string" ? body.drug.trim() : "";
        if (!drug) return Response.json({ error: "drug is required" }, { status: 400 });
        const result = await lookupOpenFda(drug);
        return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
      },
    },
  },
});
