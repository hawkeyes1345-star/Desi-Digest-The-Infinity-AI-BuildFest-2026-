import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createGeminiProvider } from "@/lib/ai-gateway.server";
import { BOUDI_SYSTEM_PROMPT } from "@/lib/nanumoni-knowledge";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type ChatRequestBody = { messages?: unknown; threadId?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = auth.slice(7);

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
        if (claimsErr || !claimsData?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = claimsData.claims.sub;

        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const threadId = body.threadId;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("Bad request", { status: 400 });
        }

        // Verify thread belongs to user
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id, title")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        let model;
        try {
          model = createGeminiProvider()("gemini-2.5-flash");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Gemini is not configured";
          return new Response(message, { status: 500 });
        }

        const uiMessages = messages as UIMessage[];
        const lastUser = [...uiMessages].reverse().find((m) => m.role === "user");

        const result = streamText({
          model,
          system: BOUDI_SYSTEM_PROMPT,
          messages: await convertToModelMessages(uiMessages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ messages: finalMessages }) => {
            try {
              // Persist the most recent user message (if not already there) and the new assistant reply.
              const newOnes = finalMessages.slice(uiMessages.length - (lastUser ? 1 : 0));
              const rows = newOnes.map((m) => ({
                thread_id: threadId,
                user_id: userId,
                role: m.role,
                parts: JSON.parse(JSON.stringify(m.parts)),
              }));
              if (rows.length) {
                const { error: insErr } = await supabase.from("chat_messages").insert(rows);
                if (insErr) console.error("[chat] insert error", insErr);
              }
              // Auto-title from first user message
              if (thread.title === "New conversation" && lastUser) {
                const text = lastUser.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join(" ")
                  .trim()
                  .slice(0, 60);
                if (text) {
                  await supabase.from("chat_threads").update({ title: text }).eq("id", threadId);
                }
              }
            } catch (e) {
              console.error("[chat] onFinish error", e);
            }
          },
        });
      },
    },
  },
});
