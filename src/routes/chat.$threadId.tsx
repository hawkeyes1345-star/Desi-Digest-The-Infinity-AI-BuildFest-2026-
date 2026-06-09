
import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getThreadMessages } from "@/lib/threads.functions";
import { isDemoSession, getLocalDemoResponse } from "@/lib/demo-session";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import nanumoniAvatar from "@/assets/nanumoni-avatar.jpg";
import { toast } from "sonner";
import { detectFoodShoppingIntent, extractFoodSearchTerm } from "@/lib/food-location-intent";
import { FoodNearbySearchCard } from "@/components/FoodNearbySearchCard";

export const Route = createFileRoute("/chat/$threadId")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    if (isDemoSession()) return;
  },
  component: ChatThread,
});

const SUGGESTIONS = [
  "Nanumoni, ajke dinner ki khabo under 200 Tk for 4 people?",
  "I have type-2 diabetes — suggest a simple lunch plate.",
  "What should I eat for iron deficiency? I'm vegetarian.",
  "Ramadan iftar ideas that won't spike sugar?",
];

type ChatMessage = UIMessage;

function ChatThread() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const getMsgs = useServerFn(getThreadMessages);
  const demo = isDemoSession();
  
  const initialQ = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () => getMsgs({ data: { threadId } }),
    enabled: !demo,
  });

  const initialMessages = useMemo<ChatMessage[]>(() => {
    if (demo) {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`deshi-digest-demo-chat-${threadId}`);
          return stored ? JSON.parse(stored) : [];
        } catch {
          return [];
        }
      }
      return [];
    }
    if (!initialQ.data) return [];
    return initialQ.data.map((m) => ({
      id: m.id,
      role: m.role as UIMessage["role"],
      parts: m.parts as unknown as UIMessage["parts"],
    }));
  }, [initialQ.data, threadId, demo]);

  if (!demo && initialQ.isLoading) {
    return (
      <div className="grid flex-1 place-items-center">
        <Shimmer>Loading conversation…</Shimmer>
      </div>
    );
  }

  return <ChatInner key={threadId} threadId={threadId} initialMessages={initialMessages} />;
}

function ChatInner({ threadId, initialMessages }: { threadId: string; initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<"ready" | "submitted">("ready");
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId, status]);

  const isBusy = status === "submitted";
  const demo = isDemoSession();
  const suggestions = demo ? [
    "alu na dim konta khabo?",
    "diabetes thakle biryani khabo?",
    "student budget e protein ki khabo?",
    "rice na roti?",
  ] : SUGGESTIONS;

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    setStatus("submitted");
    const optimistic: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: trimmed }],
    };
    const nextMessages = [...messages, optimistic];
    setMessages(nextMessages);

    if (demo) {
      if (typeof window !== "undefined") {
        localStorage.setItem(`deshi-digest-demo-chat-${threadId}`, JSON.stringify(nextMessages));
      }
      setTimeout(() => {
        const replyText = getLocalDemoResponse(trimmed);
        const reply: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [{ type: "text", text: replyText }],
        };
        const updated = [...nextMessages, reply];
        setMessages(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem(`deshi-digest-demo-chat-${threadId}`, JSON.stringify(updated));
        }
        setStatus("ready");
      }, 800);
      return;
    }

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body: JSON.stringify({ threadId, message: trimmed }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Nanumoni couldn't reply. Please try again.");
      setMessages((current) => [
        ...current,
        {
          id: json.id || crypto.randomUUID(),
          role: "assistant",
          parts: json.parts || [{ type: "text", text: json.text || "" }],
        },
      ]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Nanumoni couldn't reply. Please try again.";
      const lower = msg.toLowerCase();
      let friendly = msg;
      if (
        lower.includes("quota") ||
        lower.includes("exhausted") ||
        lower.includes("retry") ||
        lower.includes("gemini") ||
        lower.includes("openrouter") ||
        lower.includes("429") ||
        lower.includes("api key") ||
        lower.includes("ai_unknown_error") ||
        lower.includes("provider") ||
        lower.includes("failed")
      ) {
        friendly = "Using Desi Digest local nutrition intelligence… We need one quick confirmation to make your report more accurate.";
      }
      toast.error(friendly);
    } finally {
      setStatus("ready");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center pt-10 text-center">
              <img src={nanumoniAvatar} alt="Nanumoni" width={88} height={88} className="h-22 w-22 rounded-full ring-2 ring-primary/30" />
              <h2 className="mt-4 font-display text-2xl font-semibold">Nanumoni is listening, sona.</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">Ask about nutrition facts, medicine references, conditions, budget meals, or Bangladeshi food.</p>
              <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => submit(s)} className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm leading-snug shadow-soft transition hover:-translate-y-0.5 hover:shadow-warm">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, idx) => {
            const rawText = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            // Strip any residual technical/debug markers from displayed text
            const text = rawText
              .replace(/\n?Template fallback response\.?/gi, "")
              .replace(/\bSOURCE:\s*[^\n]*/gi, "")
              .replace(/\b(GEMINI|FALLBACK|TEMPLATE|PROVIDER|MODEL|RAG)\b:?\s*[^\n]*/gi, "")
              .replace(/\n{3,}/g, "\n\n")
              .trim();
            if (m.role === "user") {
              return (
                <Message key={m.id} from="user">
                  <MessageContent className="bg-primary text-primary-foreground">{text}</MessageContent>
                </Message>
              );
            }

            let shoppingCard = null;
            if (idx > 0 && messages[idx - 1].role === "user") {
              const prevText = messages[idx - 1].parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              if (detectFoodShoppingIntent(prevText)) {
                const term = extractFoodSearchTerm(prevText);
                shoppingCard = (
                  <div className="ml-11 mt-2 w-full max-w-[85%]">
                    <FoodNearbySearchCard searchTerm={term} />
                  </div>
                );
              }
            }

            return (
              <Message key={m.id} from="assistant">
                <div className="flex w-full flex-col">
                  <div className="flex w-full gap-3">
                    <img src={nanumoniAvatar} alt="Nanumoni" width={32} height={32} className="mt-1 h-8 w-8 shrink-0 rounded-full ring-1 ring-border" />
                    <div className="min-w-0 flex-1">
                      <MessageResponse>{text}</MessageResponse>
                    </div>
                  </div>
                  {shoppingCard}
                </div>
              </Message>
            );
          })}

          {status === "submitted" && (
            <div className="flex items-center gap-3 px-1 pt-2">
              <img src={nanumoniAvatar} alt="Nanumoni" width={28} height={28} className="h-7 w-7 rounded-full ring-1 ring-border" />
              <Shimmer>Searching trusted databases…</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {demo && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-3 pt-0">
          <div className="rounded-xl border border-primary/20 bg-sage/10 p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <h3 className="font-display font-semibold text-primary">Demo chat is limited</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Sign in with Gmail to unlock full personalized Nanumoni AI chat, profile-aware advice, and meal-history context.
            </p>
            <div className="mt-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground shadow-warm transition-colors hover:bg-primary/90"
              >
                Sign in with Gmail
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="glass-soft border-t border-border/60">
        <div className="mx-auto w-full max-w-3xl p-3 sm:p-4">
          <PromptInput onSubmit={() => void submit(input)}>
            <PromptInputTextarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Nanumoni anything… (e.g. rice nutrition, paracetamol, diabetes)" disabled={isBusy} />
            <PromptInputFooter className="justify-between">
              <p className="px-1 text-[11px] text-muted-foreground">General nutrition guidance — not medical advice.</p>
              <PromptInputSubmit status={isBusy ? "submitted" : "ready"} disabled={isBusy || !input.trim()} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
