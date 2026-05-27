import { createFileRoute } from "@tanstack/react-router";
import { useEnsureThread } from "./chat";
import nanumoniAvatar from "@/assets/nanumoni-avatar.jpg";

export const Route = createFileRoute("/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  useEnsureThread();
  return (
    <div className="grid flex-1 place-items-center p-8">
      <div className="flex flex-col items-center text-center">
        <img
          src={nanumoniAvatar}
          alt="Nanumoni"
          width={80}
          height={80}
          className="h-20 w-20 rounded-full ring-2 ring-primary/30"
        />
        <p className="mt-4 font-display text-lg">Opening your conversation…</p>
      </div>
    </div>
  );
}
