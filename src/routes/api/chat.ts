
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { classifyMessageIntent, extractLikelyLookupTerm, getMessageLanguage } from "@/lib/intent-classifier";
import { lookupNutrition, lookupOpenFda, lookupRxNorm, lookupWhoIcd } from "@/lib/external-api.server";
import {
  conditionTemplate,
  generalChatTemplate,
  healthSafeFoodRecommendationTemplate,
  medicineTemplate,
  nutritionTemplate,
  sourceLabelForIntent,
  unknownTemplate,
  foodComparisonTemplate,
} from "@/lib/api-response-templates.server";
import { generateChatResponse } from "@/lib/ai-gateway.server";
import { extractFoodEntities, extractComparisonGroups } from "@/lib/bangladeshi-food-knowledge";

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

function extractTextFromParts(parts: any): string {
  if (typeof parts === "string") return parts;
  if (Array.isArray(parts)) {
    return parts.map((p: any) => (p?.type === "text" ? p.text : typeof p === "string" ? p : "")).join(" ").trim();
  }
  return "";
}

function loggedMealReviewTemplate(rows: any[], language: "bangla_script" | "banglish" | "english" = "banglish") {
  if (language === "bangla_script") {
    if (!rows.length) {
      return "আজকের কোনো খাবার এখনও লগ করা হয়নি। খাবারের নাম লিখুন বা প্লেটের ছবি আপলোড করুন, আমি চেক করে দেব।";
    }
    return [
      "আজকের লগ করা খাবার:",
      ...rows.map((m: any) => {
        const nutrients = [
          roundNumber(m.calories) + " ক্যালরি",
          roundNumber(m.protein_g) + " গ্রাম প্রোটিন",
          roundNumber(m.carbs_g) + " গ্রাম কার্বস",
          roundNumber(m.fat_g) + " গ্রাম ফ্যাট",
        ].join(", ");
        const score = typeof m.health_score === "number" ? ", হেলথ স্কোর " + Number(m.health_score).toFixed(1) + "/10" : "";
        return "- " + m.meal_type + ": " + m.name + " (" + nutrients + score + ")";
      }),
    ].join("\n");
  }

  if (language === "english") {
    if (!rows.length) {
      return "I don't see any logged meals for today yet. Type a food name or upload a plate, and I'll review it.";
    }
    return [
      "Today's logged meals:",
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

  // Default: Banglish
  if (!rows.length) {
    return "Ajker logged meal ami ekhono dekhte pacchi na. Food name type korun or plate upload korun, tahole ami check kore bolbo.";
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

async function buildTemplateResponse(message: string, supabase: any, threadId?: string, userProfile?: any): Promise<TemplateResponse> {
  const intent = classifyMessageIntent(message);
  const term = extractLikelyLookupTerm(message, intent);
  const language = getMessageLanguage(message);

  if (intent === "language_rewrite") {
    let previousAssistantText = "";
    if (threadId) {
      const { data: lastAssistantMsg } = await supabase
        .from("chat_messages")
        .select("parts")
        .eq("thread_id", threadId)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastAssistantMsg) {
        previousAssistantText = extractTextFromParts(lastAssistantMsg.parts);
      }
    }

    let fallbackTemplate = "";
    if (language === "bangla_script") {
      fallbackTemplate = "দুঃখিত, আমি এখন অনুবাদ করতে পারছি না। দয়া করে একটু পরে চেষ্টা করুন।";
    } else if (language === "english") {
      fallbackTemplate = "Sorry, I cannot translate right now. Please try again in a bit.";
    } else {
      fallbackTemplate = "Sorry, ami ekhon translate korte পারছি না। Please ektu por try korun.";
    }

    return {
      intent,
      term,
      template: fallbackTemplate,
      context: { previousAssistantMessage: previousAssistantText },
      sourceLabel: "Nanumoni",
      hasRetrievedData: previousAssistantText.length > 0,
    };
  }

  if (intent === "food_comparison") {
    const entities = extractFoodEntities(message, language);
    const groups = extractComparisonGroups(message, language);
    const goals = userProfile?.goals ?? [];
    const primaryGoal = goals.find((g: string) => 
      ["diabetes_friendly", "weight_loss", "muscle_gain", "heart_healthy", "low_sodium"].includes(g)
    );
    return {
      intent,
      term,
      template: foodComparisonTemplate(entities, primaryGoal, language, groups, message),
      context: { foodEntities: entities, foodGroups: groups },
      sourceLabel: "Nutrition reference",
      hasRetrievedData: entities.length > 0,
    };
  }

  if (intent === "nutrition") {
    const nutrition = await lookupNutrition(term, supabase);
    return { intent, term, template: nutritionTemplate(nutrition, language), context: { nutritionData: nutrition }, sourceLabel: nutrition.sourceLabel, hasRetrievedData: true };
  }

  if (intent === "medicine") {
    const [rxnorm, openfda] = await Promise.all([lookupRxNorm(term), lookupOpenFda(term)]);
    return { intent, term, template: medicineTemplate(rxnorm, openfda, language), context: { medicineData: rxnorm, openfdaData: openfda }, sourceLabel: "Medicine reference", hasRetrievedData: true };
  }

  if (intent === "condition") {
    const condition = await lookupWhoIcd(term);
    return { intent, term, template: conditionTemplate(condition, language), context: { conditionData: condition }, sourceLabel: condition.sourceLabel, hasRetrievedData: true };
  }

  if (intent === "health_safe_food_recommendation") {
    return { intent, term, template: healthSafeFoodRecommendationTemplate(message, language), context: {}, sourceLabel: "Health guidelines", hasRetrievedData: false };
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
      template: loggedMealReviewTemplate(rows, language),
      context: rows.length ? { mealHistory: rows } : {},
      sourceLabel: rows.length ? "Your meal log" : "Nanumoni",
      hasRetrievedData: rows.length > 0,
      skipGemini: rows.length === 0,
    };
  }

  if (intent === "meal_history") {
    const { data } = await supabase.from("meal_logs").select("meal_type,name,calories,logged_at").order("logged_at", { ascending: false }).limit(5);
    const rows = Array.isArray(data) ? data : [];
    
    let template = "";
    if (language === "bangla_script") {
      template = rows.length
        ? ["সাম্প্রতিক খাবারের ইতিহাস:", ...rows.map((m: any) => "- " + m.meal_type + ": " + m.name + " (" + Math.round(Number(m.calories || 0)) + " ক্যালরি)")].join("\n")
        : "সাম্প্রতিক খাবারের কোনো তথ্য নেই। প্লেট অ্যানালাইসিস বা ড্যাশবোর্ড থেকে খাবার যুক্ত করুন।";
    } else if (language === "english") {
      template = rows.length
        ? ["Recent meal history:", ...rows.map((m: any) => "- " + m.meal_type + ": " + m.name + " (" + Math.round(Number(m.calories || 0)) + " kcal)")].join("\n")
        : "No recent meal history yet. Add meals from plate analysis or dashboard.";
    } else {
      template = rows.length
        ? ["Recent meal history:", ...rows.map((m: any) => "- " + m.meal_type + ": " + m.name + " (" + Math.round(Number(m.calories || 0)) + " kcal)")].join("\n")
        : "Recent meal history ekhono nei. Plate analysis ba dashboard theke meal add korun.";
    }

    return { intent, term, template, context: rows.length ? { mealHistory: rows } : {}, sourceLabel: rows.length ? "Your meal log" : "Nanumoni", hasRetrievedData: rows.length > 0 };
  }

  if (intent === "general_chat") {
    return { intent, term, template: generalChatTemplate(message, language), context: {}, sourceLabel: "Nanumoni", hasRetrievedData: false };
  }

  return { intent, term, template: unknownTemplate(language), context: {}, sourceLabel: sourceLabelForIntent(intent), hasRetrievedData: false };
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

        const built = await buildTemplateResponse(message, supabase, threadId, userProfile);
        
        // Distinguish simple greetings from real questions
        const isSimpleGreeting = /^(hi|hello|hey|salam|assalamu|assalamu alaikum|nanu|hola|namaste)$/i.test(message.toLowerCase());
        const isVeryShort = message.length < 3;
        const isRewrite = built.intent === "language_rewrite";
        const isComparison = built.intent === "food_comparison";

        let assistantText: string;
        let usedGemini = false;
        let fallbackReason: string | undefined;

        if ((isSimpleGreeting || isVeryShort || built.skipGemini) && !isRewrite && !isComparison) {
          assistantText = built.template;
        } else {
          const language = getMessageLanguage(message);
          const chatResponse = await generateChatResponse({ 
            userMessage: message, 
            template: built.template, 
            context: built.context,
            userProfile,
            requestedLanguage: language,
            previousAssistantMessage: built.context?.previousAssistantMessage as string | undefined,
          });
          usedGemini = chatResponse.usedGemini;
          assistantText = usedGemini ? chatResponse.text : built.template;
          fallbackReason = chatResponse.fallbackReason;
        }

        // Strip debug markers from assistantText before saving
        assistantText = assistantText.replace(/\n?Template fallback response\.?/gi, "").trim();

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
        
        // Final source label logic — sanitize all provider/technical names
        let sourceLabel = built.sourceLabel;
        if (usedGemini && built.intent === "logged_meal_review" && built.hasRetrievedData) {
          sourceLabel = "Your meal log";
        } else if (usedGemini && built.hasRetrievedData) {
          sourceLabel = built.sourceLabel;
        } else if (usedGemini) {
          sourceLabel = "Nanumoni";
        } else if (fallbackReason || built.skipGemini) {
          sourceLabel = "Nanumoni";
        }

        return Response.json({
          id: assistantRow?.id || crypto.randomUUID(),
          role: "assistant",
          parts: assistantParts,
          text: assistantText,
          intent: built.intent,
          sourceLabel: sourceLabel,
        });
      },
    },
  },
});
