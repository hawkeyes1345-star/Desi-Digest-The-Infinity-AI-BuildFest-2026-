import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyProfile,
  upsertMyProfile,
  GOAL_OPTIONS,
  HEALTH_CONDITION_OPTIONS,
  DIETARY_OPTIONS,
  type Goal,
  type HealthCondition,
  type DietaryPreference,
  computeBMI,
  computeTDEE,
} from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Heart, Sparkles, Loader2, X } from "lucide-react";
import nanumoniAvatar from "@/assets/nanumoni-avatar.jpg";
import { VideoBackground } from "@/components/VideoBackground";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Welcome to Nanumoni — let's get to know you" }] }),
  component: OnboardingPage,
});

const GOAL_LABEL: Record<Goal, string> = {
  weight_loss: "Weight loss",
  muscle_gain: "Muscle gain",
  diabetes_friendly: "Diabetes-friendly",
  low_sodium: "Low sodium",
  heart_healthy: "Heart-healthy",
  pcos_friendly: "PCOS-friendly",
  anemia_friendly: "Anemia-friendly",
  pregnancy: "Pregnancy",
  student_budget: "Student budget meals",
  general_wellness: "General wellness",
  ramadan_friendly: "Ramadan-friendly",
};

const HEALTH_LABEL: Record<HealthCondition, string> = {
  diabetes: "Diabetes",
  prediabetes: "Pre-diabetes",
  hypertension: "Hypertension",
  anemia: "Anemia",
  pcos: "PCOS",
  pregnancy: "Pregnancy",
  lactating: "Lactating",
  high_cholesterol: "High cholesterol",
  thyroid: "Thyroid",
  ibs: "IBS / gut issues",
  kidney_care: "Kidney care",
  none: "None — I'm healthy 🌿",
};

const DIET_LABEL: Record<DietaryPreference, string> = {
  non_veg: "Non-veg (eat everything)",
  pescatarian: "Pescatarian (fish + veg)",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  eggetarian: "Veg + egg",
};

const STEPS = [
  { id: "name", title: "What should Nanumoni call you?" },
  { id: "body", title: "Your body basics" },
  { id: "activity", title: "How active are you?" },
  { id: "diet", title: "What do you eat?" },
  { id: "health", title: "Any health conditions?" },
  { id: "goals", title: "What are you working towards?" },
  { id: "budget", title: "What's your food budget?" },
  { id: "finish", title: "Anything else Nanumoni should know?" },
] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getMyProfile);
  const save = useServerFn(upsertMyProfile);
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    full_name: "",
    display_name: "",
    age: "",
    sex: "" as "" | "female" | "male" | "other",
    height_cm: "",
    weight_kg: "",
    activity_level: "" as "" | "sedentary" | "moderate" | "active" | "athlete",
    dietary_preference: "" as "" | DietaryPreference,
    health_conditions: [] as HealthCondition[],
    goals: [] as Goal[],
    budget_bdt: "",
    budget_period: "weekly" as "weekly" | "monthly",
    location: "",
    allergies: [] as string[],
    notes: "",
  });
  const [allergyInput, setAllergyInput] = useState("");

  // Pre-fill from existing profile
  useEffect(() => {
    (async () => {
      const p = await get();
      if (p) {
        setForm((f) => ({
          ...f,
          full_name: p.full_name ?? "",
          display_name: p.display_name ?? "",
          age: p.age?.toString() ?? "",
          sex: (p.sex as any) ?? "",
          height_cm: p.height_cm?.toString() ?? "",
          weight_kg: p.weight_kg?.toString() ?? "",
          activity_level: (p.activity_level as any) ?? "",
          dietary_preference: (p.dietary_preference as any) ?? "",
          health_conditions: p.health_conditions ?? [],
          goals: p.goals ?? [],
          budget_bdt: p.budget_bdt?.toString() ?? "",
          budget_period: (p.budget_period as any) ?? "weekly",
          location: p.location ?? "",
          allergies: p.allergies ?? [],
          notes: p.notes ?? "",
        }));
      }
    })();
  }, [get]);

  const finish = useMutation({
    mutationFn: () =>
      save({
        data: {
          full_name: form.full_name || null,
          display_name: form.display_name || form.full_name || null,
          age: form.age ? Number(form.age) : null,
          sex: form.sex || null,
          height_cm: form.height_cm ? Number(form.height_cm) : null,
          weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
          activity_level: form.activity_level || null,
          dietary_preference: form.dietary_preference || null,
          health_conditions: form.health_conditions,
          goals: form.goals,
          budget_bdt: form.budget_bdt ? Number(form.budget_bdt) : null,
          budget_period: form.budget_period,
          location: form.location || null,
          allergies: form.allergies,
          notes: form.notes || null,
          alternative_mode: false,
          mark_onboarded: true,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`Nanumoni knows you now, ${form.full_name || "my dear"} ❤️`);
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  const progress = Math.round(((step + 1) / STEPS.length) * 100);
  const current = STEPS[step].id;

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish.mutate();
  }
  function prev() {
    if (step > 0) setStep(step - 1);
  }
  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }
  function addAllergy() {
    const v = allergyInput.trim();
    if (!v || form.allergies.includes(v)) return;
    setForm((f) => ({ ...f, allergies: [...f.allergies, v] }));
    setAllergyInput("");
  }

  // Per-step validation
  const canProceed = (() => {
    switch (current) {
      case "name":
        return form.full_name.trim().length > 0;
      case "body":
        return Boolean(form.age && form.sex && form.height_cm && form.weight_kg);
      case "activity":
        return Boolean(form.activity_level);
      case "diet":
        return Boolean(form.dietary_preference);
      default:
        return true;
    }
  })();

  const bmi = computeBMI({
    height_cm: form.height_cm ? Number(form.height_cm) : null,
    weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
  } as any);
  const tdee = computeTDEE({
    age: form.age ? Number(form.age) : null,
    sex: form.sex || null,
    height_cm: form.height_cm ? Number(form.height_cm) : null,
    weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
    activity_level: form.activity_level || null,
  } as any);

  return (
    <div className="relative min-h-screen">
      <VideoBackground />
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 glass-soft rounded-2xl p-4">
          <img
            src={nanumoniAvatar}
            alt="Nanumoni"
            className="h-12 w-12 rounded-full ring-2 ring-primary/40"
          />
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Step {step + 1} of {STEPS.length}
            </p>
            <p className="font-display text-lg leading-tight">
              Let's make Nanumoni know you better ❤️
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-2 overflow-hidden rounded-full glass-soft">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-spice to-sage transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step card */}
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
            {STEPS[step].title}
          </h1>

          <div className="mt-6 space-y-5">
            {current === "name" && (
              <>
                <div>
                  <Label className="mb-2 block">Full name</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Rumana Akhter"
                    className="h-12 bg-background/60"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="mb-2 block">What should Nanumoni call you? (optional)</Label>
                  <Input
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    placeholder="e.g. Rumana"
                    className="h-12 bg-background/60"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Where are you? (optional)</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Dhaka / Sylhet / Village / Abroad"
                    className="h-12 bg-background/60"
                  />
                </div>
              </>
            )}

            {current === "body" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Age</Label>
                    <Input
                      type="number"
                      min={1}
                      max={120}
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      className="h-12 bg-background/60"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Biological sex</Label>
                    <div className="flex gap-1.5">
                      {(["female", "male", "other"] as const).map((s) => (
                        <Chip
                          key={s}
                          active={form.sex === s}
                          onClick={() => setForm({ ...form, sex: s })}
                          className="flex-1 justify-center capitalize"
                        >
                          {s === "other" ? "Intersex" : s}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Height (cm)</Label>
                    <Input
                      type="number"
                      min={50}
                      max={260}
                      value={form.height_cm}
                      onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                      className="h-12 bg-background/60"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Weight (kg)</Label>
                    <Input
                      type="number"
                      min={20}
                      max={400}
                      value={form.weight_kg}
                      onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                      className="h-12 bg-background/60"
                    />
                  </div>
                </div>
                {bmi && (
                  <div className="rounded-xl bg-secondary/50 px-4 py-3 text-sm">
                    <span className="text-muted-foreground">BMI:</span>{" "}
                    <span className="font-semibold">{bmi}</span>
                    {tdee && (
                      <>
                        {"  ·  "}
                        <span className="text-muted-foreground">Daily energy need:</span>{" "}
                        <span className="font-semibold">~{tdee} kcal</span>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {current === "activity" && (
              <div className="grid gap-2">
                {[
                  { v: "sedentary", t: "Sedentary", d: "Desk job, little exercise" },
                  { v: "moderate", t: "Moderately active", d: "Light walks, household chores" },
                  { v: "active", t: "Active", d: "Regular exercise 3-5×/week" },
                  { v: "athlete", t: "Athlete", d: "Intense daily training" },
                ].map((o) => {
                  const on = form.activity_level === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setForm({ ...form, activity_level: o.v as any })}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border-2 p-4 text-left transition",
                        on
                          ? "border-primary bg-primary/10 shadow-warm"
                          : "border-border bg-card/40 hover:border-primary/40",
                      )}
                    >
                      <div>
                        <p className="font-medium">{o.t}</p>
                        <p className="text-xs text-muted-foreground">{o.d}</p>
                      </div>
                      {on && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}

            {current === "diet" && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DIETARY_OPTIONS.map((d) => {
                  const on = form.dietary_preference === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm({ ...form, dietary_preference: d })}
                      className={cn(
                        "rounded-2xl border-2 p-4 text-center text-sm transition",
                        on
                          ? "border-primary bg-primary/10 shadow-warm"
                          : "border-border bg-card/40 hover:border-primary/40",
                      )}
                    >
                      {DIET_LABEL[d]}
                    </button>
                  );
                })}
              </div>
            )}

            {current === "health" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Pick anything that applies. Nanumoni will adjust her advice carefully.
                </p>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_CONDITION_OPTIONS.map((h) => (
                    <Chip
                      key={h}
                      active={form.health_conditions.includes(h)}
                      onClick={() =>
                        setForm({
                          ...form,
                          health_conditions: toggle(form.health_conditions, h),
                        })
                      }
                    >
                      {HEALTH_LABEL[h]}
                    </Chip>
                  ))}
                </div>
                <div className="mt-4">
                  <Label className="mb-2 block">Any allergies? (press Enter to add)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAllergy();
                        }
                      }}
                      placeholder="peanuts, shrimp, lactose…"
                      className="h-11 bg-background/60"
                    />
                    <Button type="button" onClick={addAllergy} variant="outline">
                      Add
                    </Button>
                  </div>
                  {form.allergies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {form.allergies.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive"
                        >
                          {a}
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                allergies: form.allergies.filter((x) => x !== a),
                              })
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {current === "goals" && (
              <>
                <p className="text-sm text-muted-foreground">Pick any that matter to you.</p>
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((g) => (
                    <Chip
                      key={g}
                      active={form.goals.includes(g)}
                      onClick={() => setForm({ ...form, goals: toggle(form.goals, g) })}
                    >
                      {GOAL_LABEL[g]}
                    </Chip>
                  ))}
                </div>
              </>
            )}

            {current === "budget" && (
              <>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <div>
                    <Label className="mb-2 block">Food budget (BDT)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.budget_bdt}
                      onChange={(e) => setForm({ ...form, budget_bdt: e.target.value })}
                      placeholder="e.g. 1500"
                      className="h-12 bg-background/60"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Per</Label>
                    <div className="flex h-12 gap-1.5">
                      {(["weekly", "monthly"] as const).map((p) => (
                        <Chip
                          key={p}
                          active={form.budget_period === p}
                          onClick={() => setForm({ ...form, budget_period: p })}
                          className="capitalize"
                        >
                          {p === "weekly" ? "Week" : "Month"}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nanumoni will never suggest something you can't afford.
                </p>
              </>
            )}

            {current === "finish" && (
              <>
                <Label className="mb-2 block">Anything else you want Nanumoni to remember?</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. I cook for my family of 5, I work night shifts, I love hilsa…"
                  rows={4}
                  maxLength={600}
                  className="bg-background/60"
                />
                <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-spice/15 p-4 text-sm">
                  <p className="flex items-center gap-2 font-medium">
                    <Heart className="h-4 w-4 text-primary" /> Almost done, {form.full_name || "my dear"}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Nanumoni will personalize every meal, plate analysis, and tip just for you. You
                    can edit anything later from your Profile.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={prev}
              disabled={step === 0}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              type="button"
              onClick={next}
              disabled={!canProceed || finish.isPending}
              size="lg"
              className="gap-1 shadow-warm"
            >
              {finish.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {step === STEPS.length - 1 ? (
                <>
                  <Sparkles className="h-4 w-4" /> Finish & meet Nanumoni
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-warm"
          : "glass-soft hover:border-primary/40",
        className,
      )}
    >
      {children}
    </button>
  );
}
