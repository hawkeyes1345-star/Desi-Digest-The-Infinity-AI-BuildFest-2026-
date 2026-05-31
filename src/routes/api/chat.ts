
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { classifyMessageIntent, extractLikelyLookupTerm } from "@/lib/intent-classifier";
import { lookupNutrition, lookupOpenFda, lookupRxNorm, lookupWhoIcd } from "@/lib/external-api.server";
import {
  conditionTemplate,
  generalChatTemplate,
  medicineTemplate,
  nutritionTemplate,
  sourceLabelForIntent,
  unknownTemplate,
} from "@/lib/api-response-templates.server";
import { generateFriendlyExplanation } from "@/lib/ai-gateway.server";

type ChatRequestBody = { message?: unknown; threadId?: string; messages?: unknown; context?: unknown };

type UiPart = { type: "text"; text: string };

function extractLastUserMessage(body: ChatRequestBody) {
  if (typeof body.message === "string") return body.message;
  if (Array.isArray(body.messages)) {
    const last = [...body.messages].reverse().find((m: any) => m?.role === "user");
    if (last && Array.isArray((last as any).parts)) {
      return (last as any).parts.map((p: any) => (p?.type === "text" ? p.text : "")).join(" ").trim();
    }
  }
  return "";
}

async function buildTemplateResponse(message: string, supabase: any) {
  const intent = classifyMessageIntent(message);
  const term = extractLikelyLookupTerm(message, intent);

  if (intent === "nutrition") {
    const nutrition = await lookupNutrition(term, supabase);
    return { intent, term, template: nutritionTemplate(nutrition), context: { nutritionData: nutrition }, sourceLabel: nutrition.sourceLabel };
  }

  if (intent === "medicine") {
    const [rxnorm, openfda] = await Promise.all([lookupRxNorm(term), lookupOpenFda(term)]);
    return { intent, term, template: medicineTemplate(rxnorm, openfda), context: { medicineData: rxnorm, openfdaData: openfda }, sourceLabel: "RxNorm / openFDA" };
  }

  if (intent === "condition") {
    const condition = await lookupWhoIcd(term);
    return { intent, term, template: conditionTemplate(condition), context: { conditionData: condition }, sourceLabel: condition.sourceLabel };
  }

  if (intent === "meal_history") {
    const { data } = await supabase.from("meal_logs").select("meal_type,name,calories,logged_at").order("logged_at", { ascending: false }).limit(5);
    const rows = Array.isArray(data) ? data : [];
    const template = rows.length
      ? ["Recent meal history:", ...rows.map((m: any) => "- " + m.meal_type + ": " + m.name + " (" + Math.round(Number(m.calories || 0)) + " kcal)"), "Source: Supabase meal history.", "Template fallback response."].join("\n")
      : "I do not see recent meal history yet. Add meals from plate analysis or the dashboard first.\nSource: Supabase meal history.\nTemplate fallback response.";
    return { intent, term, template, context: { mealHistory: rows }, sourceLabel: "Supabase meal history" };
  }

  if (intent === "general_chat") {
    return { intent, term, template: generalChatTemplate(message), context: {}, sourceLabel: "AI/template conversation" };
  }

  return { intent, term, template: unknownTemplate(), context: {}, sourceLabel: sourceLabelForIntent(intent) };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = auth.slice(7);

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return Response.json({ error: "Supabase server environment is missing" }, { status: 500 });
        }

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: "Bearer " + token } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
        if (claimsErr || !claimsData?.claims?.sub) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const userId = claimsData.claims.sub;

        const body = (await request.json().catch(() => ({}))) as ChatRequestBody;
        const threadId = body.threadId;
        const message = extractLastUserMessage(body).trim();
        if (!threadId || !message) return Response.json({ error: "threadId and message are required" }, { status: 400 });

        const { data: thread } = await supabase.from("chat_threads").select("id, title").eq("id", threadId).maybeSingle();
        if (!thread) return Response.json({ error: "Thread not found" }, { status: 404 });

        const built = await buildTemplateResponse(message, supabase);
        const explanation = await generateFriendlyExplanation({ userMessage: message, template: built.template, context: built.context });
        const assistantText = explanation.usedGemini
          ? explanation.text
          : built.template + (explanation.fallbackReason ? "\n\nAI explanation is temporarily limited, but here are the facts from the database." : "");

        const userParts: UiPart[] = [{ type: "text", text: message }];
        const assistantParts: UiPart[] = [{ type: "text", text: assistantText }];
        const { data: inserted, error: insertError } = await supabase
          .from("chat_messages")
          .insert([
            { thread_id: threadId, user_id: userId, role: "user", parts: userParts },
            { thread_id: threadId, user_id: userId, role: "assistant", parts: assistantParts },
          ])
          .select("id, role, parts");
        if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

        if (thread.title === "New conversation") {
          await supabase.from("chat_threads").update({ title: message.slice(0, 60) }).eq("id", threadId);
        }

        const assistantRow = inserted?.find((row: any) => row.role === "assistant");
        return Response.json({
          id: assistantRow?.id || crypto.randomUUID(),
          role: "assistant",
          parts: assistantParts,
          text: assistantText,
          intent: built.intent,
          sourceLabel: built.sourceLabel,
          geminiUsed: explanation.usedGemini,
          fallbackReason: explanation.fallbackReason,
        });
      },
    },
  },
});
