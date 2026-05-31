
import { createFileRoute } from "@tanstack/react-router";

import { lookupEdamamImageFood } from "@/lib/external-api.server";

type Body = { imageDataUrl?: unknown };

const FRIENDLY_UNAVAILABLE = "Image food detection is temporarily unavailable. You can type the food name and I will search the nutrition database.";

function isDevelopment() {
  return process.env.NODE_ENV !== "production";
}

export const Route = createFileRoute("/api/edamam/image-food")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : "";
        if (!imageDataUrl) {
          return Response.json(
            {
              detected: false,
              foods: [],
              sourceLabel: "Edamam Vision API",
              publicMessage: FRIENDLY_UNAVAILABLE,
              error: isDevelopment() ? "imageDataUrl is required" : FRIENDLY_UNAVAILABLE,
              errorCode: "EDAMAM_IMAGE_REQUIRED",
            },
            { status: 400, headers: { "Cache-Control": "no-store" } },
          );
        }
        const result = await lookupEdamamImageFood(imageDataUrl);
        const status = result.errorCode === "EDAMAM_IMAGE_TOO_LARGE" ? 413 : 200;
        return Response.json(
          {
            ...result,
            publicMessage: result.publicMessage || (result.detected ? undefined : FRIENDLY_UNAVAILABLE),
            error: isDevelopment() ? result.error : result.detected ? undefined : FRIENDLY_UNAVAILABLE,
            debugMessage: isDevelopment() ? result.debugMessage : undefined,
          },
          { status, headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
