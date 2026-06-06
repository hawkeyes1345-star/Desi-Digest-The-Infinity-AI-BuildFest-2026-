import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, setAlternativeMode } from "@/lib/profile.functions";
import {
  addDemoMeal,
  deleteDemoMeal,
  demoProfile,
  endDemoSession,
  getDemoMeals,
  isDemoSession,
} from "@/lib/demo-session";
import { listRecentMeals, logMeal, deleteMeal, type MealLog } from "@/lib/meals.functions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Sprout,
  Camera,
  Sparkles,
  MessageCircle,
  Flame,
  Droplets,
  Award,
  LogOut,
  Settings,
  Heart,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { PlateAnalyzer } from "@/components/PlateAnalyzer";
import { NutritionLabel } from "@/components/NutritionLabel";
import { DAILY_TARGETS } from "@/lib/nutrition";
import { MacroRing } from "@/components/MacroRing";
import { LogMealDialog } from "@/components/LogMealDialog";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import nanumoniAvatar from "@/assets/nanumoni-avatar.jpg";
import logoMark from "@/assets/logo-mark.png";
import { NavbarProfile } from "@/components/NavbarProfile";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Accumulated daily nutrition totals displayed on the dashboard. */
export interface DailyNutritionTotals {
  calories: number;
  protein_g: number;
  fiber_g: number;
  water_ml: number;
  iron_mg: number;
}

/** Shape for the 7-day chart bars. */
interface DayBar {
  day: string;
  cal: number;
  pro: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STREAK_BADGE_3 = 3;
const STREAK_BADGE_7 = 7;
const MS_PER_DAY = 86_400_000;

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    if (typeof window !== "undefined" && isDemoSession()) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Your nutrition dashboard — Deshi Digest" }] }),
  component: Dashboard,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Shubho shokal";
  if (h < 16) return "Shubho dupur";
  if (h < 19) return "Shubho bikal";
  return "Shubho shondha";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Safely extract iron_mg from a meal's analysis JSON blob.
 * The MealLog type has no iron_mg field — it lives inside
 * `analysis.nutrition.iron_mg` when set by plate analyzer.
 */
function extractIronMg(meal: MealLog): number {
  if (!meal.analysis || typeof meal.analysis !== "object") return 0;
  const a = meal.analysis as Record<string, unknown>;

  // PlateAnalysis stores { nutrition: { iron_mg: number } }
  if (a.nutrition && typeof a.nutrition === "object") {
    const n = a.nutrition as Record<string, unknown>;
    const v = Number(n.iron_mg ?? 0);
    return Number.isFinite(v) ? v : 0;
  }

  return 0;
}

/** Accumulate today's nutrition from a list of meals, with safe fallbacks. */
function accumulateTotals(meals: MealLog[]): DailyNutritionTotals {
  return meals.reduce<DailyNutritionTotals>(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein_g: acc.protein_g + (m.protein_g ?? 0),
      fiber_g: acc.fiber_g + (m.fiber_g ?? 0),
      water_ml: acc.water_ml + (m.water_ml ?? 0),
      iron_mg: acc.iron_mg + extractIronMg(m),
    }),
    { calories: 0, protein_g: 0, fiber_g: 0, water_ml: 0, iron_mg: 0 },
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getProfile = useServerFn(getMyProfile);
  const listMeals = useServerFn(listRecentMeals);
  const setAlt = useServerFn(setAlternativeMode);
  const del = useServerFn(deleteMeal);

  const demo = isDemoSession();
  const [guestMeals, setGuestMeals] = useState<MealLog[]>(() => (demo ? getDemoMeals() : []));
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfile(), enabled: !demo });
  const mealsQ = useQuery({ queryKey: ["meals"], queryFn: () => listMeals(), enabled: !demo });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meals"] });
      toast.success("Meal deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't delete meal"),
  });

  const altMut = useMutation({
    mutationFn: (v: boolean) => setAlt({ data: { enabled: v } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["plan"] });
    },
  });

  async function signOut() {
    try {
      if (demo) endDemoSession();
      else await supabase.auth.signOut();
    } catch (err) {
      console.warn("[dashboard] sign-out error:", err);
    }
    navigate({ to: "/" });
  }

  function handleDeleteMeal(id: string) {
    if (demo) {
      setGuestMeals(deleteDemoMeal(id));
      toast.success("Meal deleted");
      return;
    }
    delMut.mutate(id);
  }

  // ─── Loading state ─────────────────────────────────────────────────────────
  // Show skeleton while initial server data is loading (not for demo mode).
  const isLoading = !demo && (profileQ.isLoading || mealsQ.isLoading);
  if (isLoading) return <DashboardSkeleton />;

  // ─── Derived data ──────────────────────────────────────────────────────────
  const today = startOfDay(new Date());
  const meals = demo ? guestMeals : (mealsQ.data ?? []);
  const todays = meals.filter((m) => new Date(m.logged_at) >= today);
  const totals = accumulateTotals(todays);

  // Last 7 days chart data
  const last7: DayBar[] = useMemo(() => {
    const days: DayBar[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = startOfDay(new Date(Date.now() - i * MS_PER_DAY));
      const next = new Date(d.getTime() + MS_PER_DAY);
      const ms = meals.filter((m) => {
        const t = new Date(m.logged_at);
        return t >= d && t < next;
      });
      days.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        cal: Math.round(ms.reduce((a, m) => a + (m.calories ?? 0), 0)),
        pro: Math.round(ms.reduce((a, m) => a + (m.protein_g ?? 0), 0)),
      });
    }
    return days;
  }, [meals]);

  // Streak: consecutive days from today with at least 1 logged meal
  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = startOfDay(new Date(Date.now() - i * MS_PER_DAY));
      const next = new Date(d.getTime() + MS_PER_DAY);
      const has = meals.some((m) => {
        const t = new Date(m.logged_at);
        return t >= d && t < next;
      });
      if (has) s++;
      else break;
    }
    return s;
  }, [meals]);

  const p = demo ? demoProfile : profileQ.data;
  const needsOnboarding = !p || !p.age || p.goals.length === 0;

  return (
    <div className="min-h-screen bg-warm-gradient">
      <header className="glass-nav">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full shadow-soft ring-1 ring-primary/20">
              <img src={logoMark} alt="" width={36} height={36} className="h-full w-full object-cover" />
            </span>
            <span className="font-display text-base font-semibold">Deshi Digest</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/plan">
              <Button variant="ghost" size="sm"><Sparkles className="h-4 w-4" /> Plan</Button>
            </Link>
            <Link to="/plates">
              <Button variant="ghost" size="sm"><Camera className="h-4 w-4" /> Plates</Button>
            </Link>
            <Link to="/chat">
              <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4" /> Chat</Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
            </Link>
            <NavbarProfile />
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-6">
        {/* ── Nanumoni greeting ── */}
        <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-warm md:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-spice/30 via-primary/15 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-gradient-to-tr from-sage/30 via-transparent to-transparent blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/40 to-sage/40 blur-md" />
              <img
                src={nanumoniAvatar}
                alt=""
                width={72}
                height={72}
                className="relative h-[72px] w-[72px] rounded-full object-cover ring-2 ring-card"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-balance sm:text-3xl">
                {greeting()}, {p?.display_name || "shona"}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                {streak >= 2 ? (
                  <>
                    <span className="font-medium text-spice">{streak}-day streak</span> 🔥 — Nanumoni is so proud. Keep
                    showing up for yourself.
                  </>
                ) : needsOnboarding ? (
                  "Tell Nanumoni about you so the plan fits your life."
                ) : (
                  "Let's log today's khabar together — every label is fully explained."
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PlateAnalyzer
                  trigger={
                    <Button size="sm" className="shadow-warm">
                      <Camera className="h-4 w-4" /> Analyze my plate
                    </Button>
                  }
                />
                <LogMealDialog
                  demo={demo}
                  onDemoMealLogged={(meal) => setGuestMeals((current) => [meal, ...current])}
                />
                <Link to="/plan">
                  <Button size="sm" variant="outline">
                    <Sparkles className="h-4 w-4" /> Today's plan
                  </Button>
                </Link>
                {needsOnboarding && (
                  <Link to="/profile">
                    <Button size="sm" variant="secondary">Complete profile</Button>
                  </Link>
                )}
              </div>
            </div>
            {p && (
              <div className="flex shrink-0 items-center gap-3 rounded-2xl glass-soft px-3 py-2 sm:flex-col sm:items-end sm:gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Gharer Recipe Mode
                </span>
                <Switch
                  checked={!!p.alternative_mode}
                  onCheckedChange={(v) => {
                    altMut.mutate(v);
                    toast.success(v ? "Gharer Recipe Mode ON — home cooking only" : "All suggestions back on");
                  }}
                />
              </div>
            )}
          </div>
        </section>

        {/* ── Today's macro rings ── */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MacroRing label="Calories" current={totals.calories} target={DAILY_TARGETS.calories} unit="kcal" icon={<Flame className="h-3.5 w-3.5" />} color="var(--primary)" />
          <MacroRing label="Protein" current={totals.protein_g} target={DAILY_TARGETS.protein_g} unit="g" icon={<Heart className="h-3.5 w-3.5" />} color="var(--spice)" />
          <MacroRing label="Fiber" current={totals.fiber_g} target={DAILY_TARGETS.fiber_g} unit="g" icon={<Sprout className="h-3.5 w-3.5" />} color="var(--sage)" />
          <MacroRing label="Water" current={totals.water_ml} target={DAILY_TARGETS.water_ml} unit="ml" icon={<Droplets className="h-3.5 w-3.5" />} color="oklch(0.65 0.13 220)" />
        </section>

        {/* ── Charts + streak ── */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
            <h3 className="font-display text-base font-semibold">Last 7 days</h3>
            <p className="text-xs text-muted-foreground">Calories logged per day</p>
            <div className="mt-3 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="cal" fill="var(--primary)" radius={[6, 6, 0, 0]} name="kcal" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold">
              <Award className="h-4 w-4 text-spice" /> Streaks & badges
            </h3>
            <p className="mt-3 text-4xl font-display font-semibold text-primary">{streak} <span className="text-base font-normal text-muted-foreground">days</span></p>
            <p className="text-xs text-muted-foreground">Consecutive logged days</p>
            <ul className="mt-4 space-y-2 text-sm">
              {streak >= STREAK_BADGE_3 && <li>🥇 3-day streak — Nanumoni smile unlocked</li>}
              {streak >= STREAK_BADGE_7 && <li>🔥 7-day healthy-eating streak</li>}
              {totals.protein_g >= DAILY_TARGETS.protein_g && <li>💪 Protein goal hit today</li>}
              {totals.fiber_g >= DAILY_TARGETS.fiber_g && <li>🌿 Fiber star today</li>}
              {streak === 0 && <li className="text-muted-foreground">Log a meal to start your streak 🌱</li>}
            </ul>
          </div>
        </section>

        {/* ── Today's meals ── */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Today's meals</h3>
            <span className="text-xs text-muted-foreground">{todays.length} logged</span>
          </div>
          {todays.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-secondary/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nothing logged yet. Snap your plate or add a meal manually — Nanumoni will label it.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <PlateAnalyzer
                  trigger={
                    <Button size="sm" variant="outline">
                      <Camera className="h-4 w-4" /> Snap a plate
                    </Button>
                  }
                />
                <LogMealDialog
                  demo={demo}
                  onDemoMealLogged={(meal) => setGuestMeals((current) => [meal, ...current])}
                />
              </div>
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {todays.map((m) => (
                <li key={m.id} className="relative">
                  <NutritionLabel
                    title={m.name}
                    subtitle={`${capitalize(m.meal_type)} · ${new Date(m.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${m.source !== "manual" ? ` · ${m.source}` : ""}`}
                    nutrition={{
                      calories: m.calories ?? 0,
                      protein_g: m.protein_g ?? 0,
                      fat_g: m.fat_g ?? 0,
                      carbs_g: m.carbs_g ?? 0,
                      fiber_g: m.fiber_g ?? 0,
                      sugar_g: m.sugar_g ?? 0,
                      sodium_mg: m.sodium_mg ?? 0,
                    }}
                  />
                  <button
                    aria-label="Delete meal"
                    onClick={() => handleDeleteMeal(m.id)}
                    className="absolute right-3 top-3 rounded-full bg-background/80 p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
