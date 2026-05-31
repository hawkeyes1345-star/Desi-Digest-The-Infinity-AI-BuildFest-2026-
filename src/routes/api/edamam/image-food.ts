import { createFileRoute } from "@tanstack/react-router";

import { lookupEdamamImageFood } from "@/lib/external-api.server";

type Body = { imageDataUrl?: unknown };

export const Route = createFileRoute("/api/edamam/image-food")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : "";
        if (!imageDataUrl) return Response.json({ error: "imageDataUrl is required" }, { status: 400 });
        const result = await lookupEdamamImageFood(imageDataUrl);
        return Response.json(result, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
