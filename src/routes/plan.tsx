import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generatePlan, type NutritionPlan } from "@/lib/recommend.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { logMeal } from "@/lib/meals.functions";
import { Button } from "@/components/ui/button";
import { NutritionLabel } from "@/components/NutritionLabel";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Heart,
  Utensils,
  Store,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import nanumoniAvatar from "@/assets/nanumoni-avatar.jpg";

export const Route = createFileRoute("/plan")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        throw redirect({ to: "/login" });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
      console.error("[auth] Session check failed on plan load, redirecting:", err);
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Your Nanumoni plan — Deshi Digest" }] }),
  component: PlanPage,
});

function PlanPage() {
  const qc = useQueryClient();
  const gen = useServerFn(generatePlan);
  const getProfile = useServerFn(getMyProfile);
  const log = useServerFn(logMeal);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const planMut = useMutation({
    mutationFn: () => gen(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't generate"),
  });

  const logMut = useMutation({
    mutationFn: (m: NutritionPlan["meals"][number]) =>
      log({
        data: {
          meal_type: m.meal_type,
          name: m.name,
          notes: m.portion,
          calories: m.nutrition.calories,
          protein_g: m.nutrition.protein_g,
          fat_g: m.nutrition.fat_g,
          carbs_g: m.nutrition.carbs_g,
          fiber_g: m.nutrition.fiber_g,
          sugar_g: m.nutrition.sugar_g,
          sodium_mg: m.nutrition.sodium_mg,
          source: "recommendation",
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meals"] });
      toast.success("Added to today's log");
    },
  });

  const plan = planMut.data;
  const altMode = !!profileQ.data?.alternative_mode;
  const needsProfile = !profileQ.data || !profileQ.data.age || profileQ.data.goals.length === 0;

  return (
    <div className="min-h-screen bg-warm-gradient">
      <header className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-5">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span className="ml-auto flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold">Nanumoni's plan</span>
        </span>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 pb-16">
        <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-warm sm:flex-row sm:items-center">
          <img src={nanumoniAvatar} alt="" width={56} height={56} className="h-14 w-14 rounded-full ring-2 ring-primary/30" />
          <div className="flex-1">
            <h1 className="font-display text-xl">Personalised Deshi plan</h1>
            <p className="text-sm text-muted-foreground">
              Built from your profile + FCTB knowledge base. Every meal explains why.
              {altMode && <span className="ml-1 rounded-full bg-sage/20 px-2 py-0.5 text-xs font-medium text-sage-foreground">Gharer Recipe Mode</span>}
            </p>
          </div>
          <Button onClick={() => planMut.mutate()} disabled={planMut.isPending} className="shadow-warm">
            {planMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {plan ? "Regenerate" : "Generate plan"}
          </Button>
        </section>

        {needsProfile && !plan && (
          <div className="rounded-2xl border border-border bg-secondary/50 p-5 text-sm">
            <p>
              <strong>Nanumoni needs your details first.</strong> Set age, weight, activity and goals so the plan fits you.
            </p>
            <Link to="/profile">
              <Button size="sm" className="mt-3">Complete profile</Button>
            </Link>
          </div>
        )}

        {planMut.isPending && (
          <div className="flex items-center gap-3 rounded-2xl bg-card p-5 shadow-soft">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm">Nanumoni is thinking — pulling FCTB values, your goals, your budget…</p>
          </div>
        )}

        {plan && (
          <>
            <section className="rounded-3xl bg-warm-gradient p-5 ring-1 ring-border">
              <p className="font-display text-lg leading-snug">{plan.nanumoni_opener}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Pill label="kcal" value={Math.round(plan.daily_targets.calories)} />
                <Pill label="Protein" value={`${Math.round(plan.daily_targets.protein_g)}g`} />
                <Pill label="Fiber" value={`${Math.round(plan.daily_targets.fiber_g)}g`} />
                <Pill label="Water" value={`${Math.round(plan.daily_targets.water_ml)}ml`} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Utensils className="h-4 w-4 text-primary" /> Meals
              </h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {plan.meals.map((m, i) => (
                  <li key={i} className="space-y-2">
                    <NutritionLabel
                      title={m.name}
                      subtitle={`${cap(m.meal_type)} · ${m.portion}`}
                      nutrition={m.nutrition}
                      costBdt={m.est_cost_bdt}
                    />
                    <div className="rounded-xl border border-border bg-card p-3 text-xs leading-relaxed">
                      <p><span className="font-semibold text-primary">Nanumoni:</span> {m.reasoning}</p>
                      <p className="mt-1.5"><span className="font-semibold text-sage-foreground">Swap:</span> {m.swap_tip}</p>
                    </div>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => logMut.mutate(m)}>
                      <Heart className="h-4 w-4" /> Add to today's log
                    </Button>
                  </li>
                ))}
              </ul>
            </section>

            <Section title="This week's focus" icon={<Sparkles className="h-4 w-4" />}>
              <p className="text-sm leading-relaxed">{plan.weekly_focus}</p>
            </Section>

            <Section title="Healthier substitutions" icon={<Lightbulb className="h-4 w-4" />}>
              <ul className="space-y-1.5 text-sm">
                {plan.substitutions.map((s, i) => (
                  <li key={i} className="flex gap-2"><span className="text-sage">✓</span><span>{s}</span></li>
                ))}
              </ul>
            </Section>

            {!altMode && plan.restaurant_picks.length > 0 && (
              <Section title="Local picks that fit your budget" icon={<Store className="h-4 w-4" />}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {plan.restaurant_picks.map((r, i) => (
                    <li key={i} className="rounded-xl border border-border bg-card p-3">
                      <p className="font-medium">{r.name} <span className="text-xs text-muted-foreground">· {r.area}</span></p>
                      <p className="text-sm">{r.dish} <span className="rounded-full bg-spice/15 px-2 py-0.5 text-xs font-semibold text-spice">৳{Math.round(r.est_cost_bdt)}</span></p>
                      <p className="mt-1 text-xs text-muted-foreground">{r.why}</p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="How Nanumoni built this (transparent reasoning)" icon={<Sparkles className="h-4 w-4" />}>
              <ol className="space-y-1.5 text-sm">
                {plan.reasoning_steps.map((s, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary">{i + 1}.</span><span>{s}</span></li>
                ))}
              </ol>
            </Section>

            <p className="text-center text-xs italic text-muted-foreground">
              Mone rekho — ami ekjon AI, doctor noi. Consult a registered doctor for medical concerns.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function Pill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl glass-soft px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-base font-semibold">{value}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">{icon} {title}</h3>
      {children}
    </section>
  );
}
