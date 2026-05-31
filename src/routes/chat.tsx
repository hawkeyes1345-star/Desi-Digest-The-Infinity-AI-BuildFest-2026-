import { createFileRoute, Outlet, redirect, Link, useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listThreads, createThread, deleteThread } from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, LogOut, Menu, X, Camera, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PlateAnalyzer } from "@/components/PlateAnalyzer";
import logoMark from "@/assets/logo-mark.png";

export const Route = createFileRoute("/chat")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: ChatLayout,
});

function ChatLayout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const params = useParams({ strict: false }) as { threadId?: string };
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const del = useServerFn(deleteThread);
  const [openMobile, setOpenMobile] = useState(false);

  const threadsQ = useQuery({ queryKey: ["threads"], queryFn: () => list() });

  const createMut = useMutation({
    mutationFn: () => create(),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
      setOpenMobile(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (params.threadId === id) navigate({ to: "/chat" });
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="flex h-screen w-full bg-warm-gradient">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0",
          openMobile ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full shadow-soft ring-1 ring-primary/20">
              <img src={logoMark} alt="" width={32} height={32} className="h-full w-full object-cover" />
            </span>
            <span className="font-display text-base font-semibold">Deshi Digest</span>
          </Link>
          <button
            className="md:hidden"
            onClick={() => setOpenMobile(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-3">
          <Button
            className="w-full justify-start"
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending}
          >
            <Plus className="h-4 w-4" /> New conversation
          </Button>
        </div>
        <nav className="mt-3 flex-1 overflow-y-auto px-2">
          {threadsQ.isLoading && (
            <p className="px-2 py-4 text-xs text-muted-foreground">Loading…</p>
          )}
          {threadsQ.data?.length === 0 && (
            <p className="px-2 py-4 text-xs text-muted-foreground">
              No conversations yet. Start one!
            </p>
          )}
          <ul className="space-y-1">
            {threadsQ.data?.map((t) => {
              const active = params.threadId === t.id;
              return (
                <li key={t.id} className="group">
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-lg pr-1 transition",
                      active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
                    )}
                  >
                    <Link
                      to="/chat/$threadId"
                      params={{ threadId: t.id }}
                      onClick={() => setOpenMobile(false)}
                      className="flex-1 truncate px-3 py-2 text-sm"
                    >
                      {t.title || "Untitled"}
                    </Link>
                    <button
                      onClick={() => delMut.mutate(t.id)}
                      aria-label="Delete conversation"
                      className="rounded-md p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {openMobile && (
        <div
          className="fixed inset-0 z-20 bg-foreground/30 md:hidden"
          onClick={() => setOpenMobile(false)}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 glass-nav px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="md:hidden" onClick={() => setOpenMobile(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display text-base font-semibold md:hidden">Deshi Digest</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Link to="/dashboard">
              <Button size="sm" variant="ghost">Dashboard</Button>
            </Link>
            <PlateAnalyzer
              trigger={
                <Button size="sm" className="shadow-warm">
                  <Camera className="h-4 w-4" /> 📸 Analyze plate
                </Button>
              }
            />
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

// Auto-create a thread if user lands on /chat directly
export function useEnsureThread() {
  const navigate = useNavigate();
  const create = useServerFn(createThread);
  const list = useServerFn(listThreads);
  useEffect(() => {
    (async () => {
      const ts = await list();
      if (ts.length) {
        navigate({ to: "/chat/$threadId", params: { threadId: ts[0].id }, replace: true });
      } else {
        const t = await create();
        navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
      }
    })();
  }, [navigate, create, list]);
}
