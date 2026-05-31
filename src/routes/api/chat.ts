
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { classifyMessageIntent, extractLikelyLookupTerm } from "@/lib/intent-classifier";
import { lookupNutrition, lookupOpenFda, lookupRxNorm, lookupWhoIcd } from "@/lib/external-api.server";
import {
  conditionTemplate,
  generalChatTemplate,
  healthSafeFoodRecommendationTemplate,
  medicineTemplate,
  nutritionTemplate,
  sourceLabelForIntent,
  unknownTemplate,
} from "@/lib/api-response-templates.server";
import { generateChatResponse } from "@/lib/ai-gateway.server";

type ChatRequestBody = { message?: unknown; threadId?: string; messages?: unknown; context?: unknown };

type UiPart = { type: "text"; text: string };

type TemplateResponse = {
  intent: ReturnType<typeof classifyMessageIntent>;
  term: string;
  template: string;
  context: Record<string, unknown>;
  sourceLabel: string;
  hasRetrievedData: boolean;
  skipGemini?: boolean;
};

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

function startOfTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

function roundNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.round(number) : 0;
}

function loggedMealReviewTemplate(rows: any[]) {
  if (!rows.length) {
    return "Ajker logged meal ami ekhono dekhte pacchi na. Food name type korun or plate upload korun, tahole ami check kore bolbo.\nTemplate fallback response.";
  }

  return [
    "Ajker logged meal data:",
    ...rows.map((m: any) => {
      const nutrients = [
        roundNumber(m.calories) + " kcal",
        roundNumber(m.protein_g) + "g protein",
        roundNumber(m.carbs_g) + "g carbs",
        roundNumber(m.fat_g) + "g fat",
      ].join(", ");
      const score = typeof m.health_score === "number" ? ", health score " + Number(m.health_score).toFixed(1) + "/10" : "";
      return "- " + m.meal_type + ": " + m.name + " (" + nutrients + score + ")";
    }),
  ].join("\n");
}

async function buildTemplateResponse(message: string, supabase: any): Promise<TemplateResponse> {
  const intent = classifyMessageIntent(message);
  const term = extractLikelyLookupTerm(message, intent);

  if (intent === "nutrition") {
    const nutrition = await lookupNutrition(term, supabase);
    return { intent, term, template: nutritionTemplate(nutrition), context: { nutritionData: nutrition }, sourceLabel: nutrition.sourceLabel, hasRetrievedData: true };
  }

  if (intent === "medicine") {
    const [rxnorm, openfda] = await Promise.all([lookupRxNorm(term), lookupOpenFda(term)]);
    return { intent, term, template: medicineTemplate(rxnorm, openfda), context: { medicineData: rxnorm, openfdaData: openfda }, sourceLabel: "RxNorm / openFDA", hasRetrievedData: true };
  }

  if (intent === "condition") {
    const condition = await lookupWhoIcd(term);
    return { intent, term, template: conditionTemplate(condition), context: { conditionData: condition }, sourceLabel: condition.sourceLabel, hasRetrievedData: true };
  }

  if (intent === "health_safe_food_recommendation") {
    return { intent, term, template: healthSafeFoodRecommendationTemplate(message), context: {}, sourceLabel: "General health guidelines", hasRetrievedData: false };
  }

  if (intent === "logged_meal_review") {
    const { data } = await supabase
      .from("meal_logs")
      .select("meal_type,name,calories,protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg,health_score,notes,source,logged_at,analysis")
      .gte("logged_at", startOfTodayIso())
      .order("logged_at", { ascending: false })
      .limit(10);
    const rows = Array.isArray(data) ? data : [];
    return {
      intent,
      term,
      template: loggedMealReviewTemplate(rows),
      context: rows.length ? { mealHistory: rows } : {},
      sourceLabel: rows.length ? "Supabase meal history" : "Template fallback response",
      hasRetrievedData: rows.length > 0,
      skipGemini: rows.length === 0,
    };
  }

  if (intent === "meal_history") {
    const { data } = await supabase.from("meal_logs").select("meal_type,name,calories,logged_at").order("logged_at", { ascending: false }).limit(5);
    const rows = Array.isArray(data) ? data : [];
    const template = rows.length
      ? ["Recent meal history:", ...rows.map((m: any) => "- " + m.meal_type + ": " + m.name + " (" + Math.round(Number(m.calories || 0)) + " kcal)"), "Template fallback response."].join("\n")
      : "I do not see recent meal history yet. Add meals from plate analysis or the dashboard first.\nTemplate fallback response.";
    return { intent, term, template, context: rows.length ? { mealHistory: rows } : {}, sourceLabel: rows.length ? "Supabase meal history" : "Template fallback response", hasRetrievedData: rows.length > 0 };
  }

  if (intent === "general_chat") {
    return { intent, term, template: generalChatTemplate(message), context: {}, sourceLabel: "Gemini conversation", hasRetrievedData: false };
  }

  return { intent, term, template: unknownTemplate(), context: {}, sourceLabel: sourceLabelForIntent(intent), hasRetrievedData: false };
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

        // Fetch user profile for context
        const { data: userProfile } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();

        const built = await buildTemplateResponse(message, supabase);
        
        // Distinguish simple greetings from real questions
        const isSimpleGreeting = /^(hi|hello|hey|salam|assalamu|assalamu alaikum|nanu|hola|namaste)$/i.test(message.toLowerCase());
        const isVeryShort = message.length < 3;

        let assistantText: string;
        let usedGemini = false;
        let fallbackReason: string | undefined;

        if (isSimpleGreeting || isVeryShort || built.skipGemini) {
          assistantText = built.template;
        } else {
          const chatResponse = await generateChatResponse({ 
            userMessage: message, 
            template: built.template, 
            context: built.context,
            userProfile
          });
          usedGemini = chatResponse.usedGemini;
          assistantText = usedGemini ? chatResponse.text : built.template;
          fallbackReason = chatResponse.fallbackReason;
        }

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
        
        // Final source label logic
        let sourceLabel = built.sourceLabel;
        if (usedGemini && built.intent === "logged_meal_review" && built.hasRetrievedData) {
          sourceLabel = "Supabase meal history + Gemini explanation";
        } else if (usedGemini && built.hasRetrievedData) {
          sourceLabel = built.sourceLabel + " + Gemini conversation";
        } else if (usedGemini) {
          sourceLabel = "Gemini conversation";
        } else if (fallbackReason || built.skipGemini) {
          sourceLabel = "Template fallback response";
        }

        return Response.json({
          id: assistantRow?.id || crypto.randomUUID(),
          role: "assistant",
          parts: assistantParts,
          text: assistantText,
          intent: built.intent,
          sourceLabel: sourceLabel,
          geminiUsed: usedGemini,
          fallbackReason: fallbackReason,
        });
      },
    },
  },
});
