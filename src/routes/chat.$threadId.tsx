
import { createFileRoute, useParams } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getThreadMessages } from "@/lib/threads.functions";
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

export const Route = createFileRoute("/chat/$threadId")({
  component: ChatThread,
});

const SUGGESTIONS = [
  "Nanumoni, ajke dinner ki khabo under 200 Tk for 4 people?",
  "I have type-2 diabetes — suggest a simple lunch plate.",
  "What should I eat for iron deficiency? I'm vegetarian.",
  "Ramadan iftar ideas that won't spike sugar?",
];

type ChatMessage = UIMessage & { sourceLabel?: string };

function ChatThread() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const getMsgs = useServerFn(getThreadMessages);
  const initialQ = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () => getMsgs({ data: { threadId } }),
  });

  const initialMessages = useMemo<ChatMessage[]>(() => {
    if (!initialQ.data) return [];
    return initialQ.data.map((m) => ({
      id: m.id,
      role: m.role as UIMessage["role"],
      parts: m.parts as unknown as UIMessage["parts"],
    }));
  }, [initialQ.data]);

  if (initialQ.isLoading) {
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
    setMessages((current) => [...current, optimistic]);
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
          sourceLabel: json.sourceLabel,
        },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nanumoni couldn't reply. Please try again.");
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
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => submit(s)} className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm leading-snug shadow-soft transition hover:-translate-y-0.5 hover:shadow-warm">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const rawText = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            // Strip debug markers from displayed text
            const text = rawText.replace(/\n?Template fallback response\.?/gi, "").trim();
            if (m.role === "user") {
              return (
                <Message key={m.id} from="user">
                  <MessageContent className="bg-primary text-primary-foreground">{text}</MessageContent>
                </Message>
              );
            }
            return (
              <Message key={m.id} from="assistant">
                <div className="flex w-full gap-3">
                  <img src={nanumoniAvatar} alt="Nanumoni" width={32} height={32} className="mt-1 h-8 w-8 shrink-0 rounded-full ring-1 ring-border" />
                  <div className="min-w-0 flex-1">
                    <MessageResponse>{text}</MessageResponse>
                  </div>
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

      <div className="glass-soft border-t border-border/60">
        <div className="mx-auto w-full max-w-3xl p-3 sm:p-4">
          <PromptInput onSubmit={() => void submit(input)}>
            <PromptInputTextarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Nanumoni anything… (e.g. rice nutrition, paracetamol, diabetes)" disabled={isBusy} />
            <PromptInputFooter className="justify-between">
              <p className="px-1 text-[11px] text-muted-foreground">Not medical advice — consult a doctor for health concerns.</p>
              <PromptInputSubmit status={isBusy ? "submitted" : "ready"} disabled={isBusy || !input.trim()} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
