import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import {
  Camera,
  Sprout,
  Sparkles,
  MessageCircle,
  Settings,
  LogOut,
  Trash2,
  ImageOff,
  ArrowLeft,
  Flame,
  Heart,
  Leaf,
  AlertTriangle,
  RefreshCw,
  Utensils,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { listPlateHistory, deleteMeal, listRecentMeals, type MealLog } from "@/lib/meals.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { PlateAnalyzer } from "@/components/PlateAnalyzer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import nanumoniAvatar from "@/assets/nanumoni-avatar.jpg";
import { isDemoSession, getDemoMeals, deleteDemoMeal, endDemoSession, demoProfile } from "@/lib/demo-session";
import { PlateAnalysisResult } from "@/components/plate/PlateAnalysisResult";
import {
  calculateSummaryData,
  buildDoctorShareSummary,
  buildWhatsAppShareUrl,
} from "@/lib/share-summary";

function PlatesSkeleton() {
  return (
    <div className="min-h-screen bg-warm-gradient">
      <header className="glass-nav h-[60px]" />
      <main className="mx-auto max-w-6xl space-y-6 px-5 py-6">
        <div className="h-24 w-full animate-pulse rounded-3xl bg-secondary/60" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      </main>
    </div>
  );
}

function PlatesErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[Plates Route Error]:", error);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive animate-bounce" />
      <h1 className="mt-4 font-display text-xl font-semibold">Plate history encountered a problem</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {error instanceof Error ? error.message : "Something went wrong while displaying your plates."}
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={() => reset()} className="shadow-warm">
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
        <a href="/">
          <Button variant="outline">Go back home</Button>
        </a>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/plates")({
  head: () => ({
    meta: [
      { title: "Plate History — Deshi Digest" },
      {
        name: "description",
        content:
          "Every meal you've snapped with Nanumoni — thumbnails, dates, and health scores at a glance.",
      },
      { property: "og:title", content: "Plate History — Deshi Digest" },
      {
        property: "og:description",
        content: "Browse every plate you've analyzed, sorted by date with health scores.",
      },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    if (isDemoSession()) return;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        throw redirect({ to: "/login" });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
      console.error("[auth] Session check failed on plates load, redirecting:", err);
      throw redirect({ to: "/login" });
    }
  },
  pendingComponent: PlatesSkeleton,
  errorComponent: PlatesErrorComponent,
  component: PlatesPage,
});

function scoreTone(score: number | null) {
  if (score == null) return "bg-muted text-foreground";
  if (score >= 8) return "bg-accent text-accent-foreground";
  if (score >= 6) return "bg-primary/15 text-primary";
  if (score >= 4) return "bg-spice/15 text-spice";
  return "bg-destructive/15 text-destructive";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function PlatesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const list = useServerFn(listPlateHistory);
  const del = useServerFn(deleteMeal);
  const getProfile = useServerFn(getMyProfile);
  const listMeals = useServerFn(listRecentMeals);
  const [selected, setSelected] = useState<MealLog | null>(null);

  const demo = isDemoSession();
  const [mounted, setMounted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  function handleExport() {
    setIsExporting(true);
    toast.info("Preparing doctor-shareable summary...", { duration: 2000 });
    setTimeout(() => {
      window.open("/report?print=1", "_blank");
      setIsExporting(false);
      toast.success("Nutrition summary opened for printing!");
    }, 1000);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  const q = useQuery({
    queryKey: ["plate-history"],
    queryFn: () => {
      if (demo) return getDemoMeals();
      return list();
    },
    enabled: mounted,
  });

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => {
      if (demo) {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("deshi-digest-demo-profile");
          return stored ? JSON.parse(stored) : demoProfile;
        }
        return demoProfile;
      }
      return getProfile();
    },
    enabled: mounted,
  });

  const mealsQ = useQuery({
    queryKey: ["meals"],
    queryFn: () => {
      if (demo) return getDemoMeals();
      return listMeals();
    },
    enabled: mounted,
  });

  const handleShare = () => {
    const profile = profileQ.data;
    const allMeals = mealsQ.data ?? [];
    const shareData = calculateSummaryData(profile, allMeals, demo);
    const text = buildDoctorShareSummary(shareData);
    const url = buildWhatsAppShareUrl(text);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const plates = ((q.data ?? []) as MealLog[]).filter((m) => m && m.source === "photo");

  const grouped = useMemo(() => {
    const map = new Map<string, MealLog[]>();
    for (const p of plates) {
      if (!p || !p.logged_at) continue;
      const key = formatDate(p.logged_at);
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [plates]);

  const avgScore = useMemo(() => {
    const scored = plates.filter((p) => typeof p.health_score === "number");
    if (!scored.length) return null;
    return scored.reduce((a, p) => a + (p.health_score ?? 0), 0) / scored.length;
  }, [plates]);

  const deleteMut = useMutation({
    mutationFn: async (p: MealLog) => {
      if (demo) {
        deleteDemoMeal(p.id);
        return;
      }
      // best-effort photo cleanup
      if (p.image_url) {
        try {
          const idx = p.image_url.indexOf("/plate-photos/");
          if (idx >= 0) {
            const path = p.image_url.slice(idx + "/plate-photos/".length);
            await supabase.storage.from("plate-photos").remove([path]);
          }
        } catch {
          // ignore
        }
      }
      await del({ data: { id: p.id } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plate-history"] });
      qc.invalidateQueries({ queryKey: ["meals"] });
      setSelected(null);
      toast.success("Plate removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't delete"),
  });

  async function signOut() {
    if (demo) {
      endDemoSession();
    } else {
      await supabase.auth.signOut();
    }
    router.invalidate();
    window.location.href = "/";
  }

  // ─── Loading state ─────────────────────────────────────────────────────────
  const isLoading = !mounted || q.isLoading;
  if (isLoading) return <PlatesSkeleton />;

  const isError = !demo && q.isError;
  if (isError) {
    const error = q.error;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive animate-bounce" />
        <h2 className="mt-4 font-display text-xl font-semibold">Couldn't load plate history</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {error instanceof Error ? error.message : "A connection error occurred. Please verify your connection."}
        </p>
        <Button onClick={() => q.refetch()} className="mt-6 shadow-warm">
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-gradient">
      <header className="glass-nav">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Sprout className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold">Deshi Digest</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Link to="/plan">
              <Button variant="ghost" size="sm">
                <Sparkles className="h-4 w-4" /> Plan
              </Button>
            </Link>
            <Link to="/chat">
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4" /> Chat
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-6">
        <section className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-warm">
          <div className="flex items-start gap-4">
            <img
              src={nanumoniAvatar}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-full ring-2 ring-primary/30"
            />
            <div>
              <h1 className="font-display text-2xl">Your plate history</h1>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Every khabar you've shown Nanumoni, with the health score she gave it. Tap a plate to
                see the full analysis again.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <span className="rounded-full bg-secondary px-3 py-1">
                  <strong className="font-semibold">{plates.length}</strong> plates saved
                </span>
                {avgScore != null && (
                  <span
                    className={cn(
                      "rounded-full px-3 py-1",
                      scoreTone(avgScore),
                    )}
                  >
                    Avg score <strong className="font-semibold">{avgScore.toFixed(1)}</strong>/10
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="outline"
              size="lg"
              onClick={handleExport}
              disabled={isExporting}
              className="shadow-soft"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              {isExporting ? "Exporting..." : "Download Doctor-Shareable Summary"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleShare}
              className="shadow-soft"
            >
              <MessageCircle className="h-4 w-4 mr-1.5 text-[#25D366]" /> Share Summary
            </Button>
            <PlateAnalyzer
              trigger={
                <Button size="lg" className="shadow-warm">
                  <Camera className="h-4 w-4" /> Analyze a new plate
                </Button>
              }
            />
          </div>
        </section>

        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-2xl bg-secondary/60"
              />
            ))}
          </div>
        )}

        {!q.isLoading && plates.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-border bg-card/60 p-10 text-center">
            <ImageOff className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl">No plates yet, shona</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Snap your next meal and Nanumoni will keep a beautiful record here — like a little
              khabar diary.
            </p>
            <div className="mt-5 inline-block">
              <PlateAnalyzer
                trigger={
                  <Button size="lg" className="shadow-warm">
                    <Camera className="h-4 w-4" /> 📸 Analyze my first plate
                  </Button>
                }
              />
            </div>
          </div>
        )}

        {grouped.map(([day, items]) => (
          <section key={day} className="space-y-3">
            <h2 className="font-display text-base text-muted-foreground">{day}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left shadow-soft transition hover:shadow-warm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-secondary">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex flex-col h-full w-full items-center justify-center bg-secondary/40 text-muted-foreground/50 transition duration-300 group-hover:bg-secondary/60">
                        <Utensils className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Demo Meal</span>
                      </div>
                    )}
                    {typeof p.health_score === "number" && (
                      <span
                        className={cn(
                          "absolute right-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur",
                          scoreTone(p.health_score),
                        )}
                      >
                        <Heart className="mr-1 inline h-3 w-3" />
                        {p.health_score.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-1 font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(p.logged_at)} · {Math.round(p.calories)} kcal
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto p-0 sm:w-full">
          {selected && (
            <>
              <DialogHeader className="glass-nav px-5 py-4">
                <DialogTitle className="font-display text-lg">{selected.name}</DialogTitle>
                <DialogDescription className="text-xs">
                  {formatDate(selected.logged_at)} · {formatTime(selected.logged_at)} ·{" "}
                  {selected.meal_type}
                </DialogDescription>
              </DialogHeader>
              <div className="p-5">
                {selected.image_url ? (
                  <div className="overflow-hidden rounded-2xl ring-1 ring-border mb-6">
                    <img
                      src={selected.image_url}
                      alt={selected.name}
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col mb-6 items-center justify-center rounded-2xl ring-1 ring-border bg-secondary/30 aspect-video w-full text-muted-foreground/50">
                    <Utensils className="h-10 w-10 mb-2 opacity-50" />
                    <span className="text-xs font-bold tracking-widest uppercase">Demo Meal</span>
                  </div>
                )}
                
                {selected.analysis ? (
                  <PlateAnalysisResult analysis={selected.analysis as any} />
                ) : (
                  <div className="p-10 text-center text-sm text-muted-foreground">No detailed analysis available.</div>
                )}

                <div className="mt-8 flex flex-wrap justify-end gap-2 border-t border-border/50 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => deleteMut.mutate(selected)}
                    disabled={deleteMut.isPending}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                  <Link to="/chat">
                    <Button>
                      <MessageCircle className="h-4 w-4" /> Ask Nanumoni about this
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
      <div className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground">
        {icon} {label}
      </div>
      <div className="font-display text-lg">{value}</div>
    </div>
  );
}

function AnalysisDetails({ analysis }: { analysis: MealLog["analysis"] }) {
  if (!analysis || typeof analysis !== "object") return null;
  const a = analysis as {
    nanumoniMessage?: string;
    healthExplanation?: string;
    idealPlateComparison?: string;
    hygieneNotes?: string;
    personalizedSuggestions?: string[];
    makeItHealthierTips?: string[];
    dishes?: { name: string; portion?: string }[];
    sources?: string[];
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      {a.nanumoniMessage && (
        <p className="font-display text-base leading-snug">{a.nanumoniMessage}</p>
      )}
      {a.dishes && a.dishes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {a.dishes.map((d, i) => (
            <span
              key={i}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs"
            >
              {d.name}
              {d.portion ? ` · ${d.portion}` : ""}
            </span>
          ))}
        </div>
      )}
      {a.healthExplanation && (
        <Section label="Why this score">{a.healthExplanation}</Section>
      )}
      {a.idealPlateComparison && (
        <Section label="Vs ideal Deshi plate">{a.idealPlateComparison}</Section>
      )}
      {a.makeItHealthierTips && a.makeItHealthierTips.length > 0 && (
        <Section label="Make it healthier">
          <ul className="list-disc space-y-1 pl-5">
            {a.makeItHealthierTips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Section>
      )}
      {a.personalizedSuggestions && a.personalizedSuggestions.length > 0 && (
        <Section label="Nanumoni's tips for you">
          <ul className="list-disc space-y-1 pl-5">
            {a.personalizedSuggestions.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Section>
      )}
      {a.hygieneNotes && <Section label="Hygiene & freshness">{a.hygieneNotes}</Section>}
      {a.sources && a.sources.length > 0 && (
        <p className="pt-1 text-[11px] text-muted-foreground">
          Sources: {a.sources.join(", ")}
        </p>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
