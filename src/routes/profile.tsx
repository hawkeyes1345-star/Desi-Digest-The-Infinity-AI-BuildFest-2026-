import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "@/lib/profile.functions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Check, Palette, Languages, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { THEMES, useAppearance, useT, type ThemeId } from "@/lib/appearance";
import logoMark from "@/assets/logo-mark.png";

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Your profile — Deshi Digest" }] }),
  component: ProfilePage,
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
  none: "None",
};

const DIET_LABEL: Record<DietaryPreference, string> = {
  non_veg: "Non-veg",
  pescatarian: "Pescatarian",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  eggetarian: "Veg + egg",
};

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getMyProfile);
  const save = useServerFn(upsertMyProfile);
  const appearance = useAppearance();
  const t = useT();

  const q = useQuery({ queryKey: ["profile"], queryFn: () => get() });

  const [form, setForm] = useState<{
    full_name: string;
    display_name: string;
    age: string;
    sex: "" | "female" | "male" | "other";
    height_cm: string;
    weight_kg: string;
    activity_level: "" | "sedentary" | "moderate" | "active" | "athlete";
    budget_bdt: string;
    budget_period: "weekly" | "monthly";
    goals: Goal[];
    health_conditions: HealthCondition[];
    dietary_preference: "" | DietaryPreference;
    allergies: string[];
    notes: string;
    location: string;
    alternative_mode: boolean;
  }>({
    full_name: "",
    display_name: "",
    age: "",
    sex: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "",
    budget_bdt: "",
    budget_period: "weekly",
    goals: [],
    health_conditions: [],
    dietary_preference: "",
    allergies: [],
    notes: "",
    location: "",
    alternative_mode: false,
  });
  const [hydrated, setHydrated] = useState(false);
  const [allergyInput, setAllergyInput] = useState("");

  if (q.data && !hydrated) {
    const p = q.data;
    setForm({
      full_name: p.full_name ?? "",
      display_name: p.display_name ?? "",
      age: p.age?.toString() ?? "",
      sex: (p.sex as any) ?? "",
      height_cm: p.height_cm?.toString() ?? "",
      weight_kg: p.weight_kg?.toString() ?? "",
      activity_level: (p.activity_level as any) ?? "",
      budget_bdt: p.budget_bdt?.toString() ?? "",
      budget_period: (p.budget_period as any) ?? "weekly",
      goals: p.goals ?? [],
      health_conditions: p.health_conditions ?? [],
      dietary_preference: (p.dietary_preference as any) ?? "",
      allergies: p.allergies ?? [],
      notes: p.notes ?? "",
      location: p.location ?? "",
      alternative_mode: !!p.alternative_mode,
    });
    setHydrated(true);
  }

  const mut = useMutation({
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
          budget_bdt: form.budget_bdt ? Number(form.budget_bdt) : null,
          budget_period: form.budget_period,
          goals: form.goals,
          health_conditions: form.health_conditions,
          dietary_preference: form.dietary_preference || null,
          allergies: form.allergies,
          notes: form.notes || null,
          location: form.location || null,
          alternative_mode: form.alternative_mode,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["plan"] });
      toast.success("Nanumoni has your details now ✓");
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  function toggleGoal(g: Goal) {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(g) ? f.goals.filter((x) => x !== g) : [...f.goals, g],
    }));
  }

  return (
    <div className="min-h-screen bg-warm-gradient">
      <header className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-5">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </button>
        <span className="ml-auto inline-flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full shadow-soft ring-1 ring-primary/20">
            <img src={logoMark} alt="" width={32} height={32} className="h-full w-full object-cover" />
          </span>
          <span className="font-display text-lg font-semibold">{t("your_profile")}</span>
        </span>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        className="mx-auto max-w-3xl space-y-6 px-5 pb-16"
      >
        <Card title="About you" subtitle="Nanumoni uses this to build a plan that actually fits.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Rumana Akhter" />
            </Field>
            <Field label="What Nanumoni calls you (optional)">
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="e.g. Rumana" />
            </Field>
            <Field label="Location (district, optional)">
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Dhaka, Sylhet" />
            </Field>
            <Field label="Age">
              <Input type="number" min={1} max={120} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
            </Field>
            <Field label="Biological sex">
              <Select value={form.sex} onChange={(v) => setForm({ ...form, sex: v as any })} options={[
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
                { value: "other", label: "Intersex" },
              ]} />
            </Field>
            <Field label="Height (cm)">
              <Input type="number" min={50} max={260} value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
            </Field>
            <Field label="Weight (kg)">
              <Input type="number" min={20} max={400} value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
            </Field>
            <Field label="Activity level">
              <Select value={form.activity_level} onChange={(v) => setForm({ ...form, activity_level: v as any })} options={[
                { value: "", label: "Select…" },
                { value: "sedentary", label: "Sedentary (desk job)" },
                { value: "moderate", label: "Moderate (walks, light exercise)" },
                { value: "active", label: "Active (regular exercise)" },
                { value: "athlete", label: "Athlete (intense training)" },
              ]} />
            </Field>
          </div>
        </Card>

        <Card title="Budget" subtitle="So Nanumoni never suggests something you can't afford.">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label="Food budget (BDT)">
              <Input type="number" min={0} value={form.budget_bdt} onChange={(e) => setForm({ ...form, budget_bdt: e.target.value })} placeholder="e.g. 1500" />
            </Field>
            <Field label="Per">
              <Select value={form.budget_period} onChange={(v) => setForm({ ...form, budget_period: v as any })} options={[
                { value: "weekly", label: "Week" },
                { value: "monthly", label: "Month" },
              ]} />
            </Field>
          </div>
        </Card>
        <Card title="Diet & health" subtitle="So Nanumoni can tailor every plate analysis and recommendation.">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">Dietary preference</Label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((d) => {
                  const on = form.dietary_preference === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm({ ...form, dietary_preference: d })}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        on ? "border-primary bg-primary text-primary-foreground shadow-warm" : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      {DIET_LABEL[d]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">Health conditions</Label>
              <div className="flex flex-wrap gap-2">
                {HEALTH_CONDITION_OPTIONS.map((h) => {
                  const on = form.health_conditions.includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          health_conditions: on
                            ? form.health_conditions.filter((x) => x !== h)
                            : [...form.health_conditions, h],
                        })
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        on ? "border-primary bg-primary text-primary-foreground shadow-warm" : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      {HEALTH_LABEL[h]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">Allergies</Label>
              <div className="flex gap-2">
                <Input
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = allergyInput.trim();
                      if (v && !form.allergies.includes(v)) {
                        setForm({ ...form, allergies: [...form.allergies, v] });
                        setAllergyInput("");
                      }
                    }
                  }}
                  placeholder="peanuts, shrimp, lactose…"
                />
              </div>
              {form.allergies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.allergies.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive">
                      {a}
                      <button type="button" onClick={() => setForm({ ...form, allergies: form.allergies.filter((x) => x !== a) })}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">Anything else Nanumoni should know?</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. I cook for a family of 5, night-shift worker, love hilsa…"
                maxLength={600}
                rows={3}
              />
            </div>
          </div>
        </Card>


        <Card title="Your goals" subtitle="Pick everything that applies.">
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((g) => {
              const on = form.goals.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGoal(g)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition",
                    on
                      ? "border-primary bg-primary text-primary-foreground shadow-warm"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  {GOAL_LABEL[g]}
                </button>
              );
            })}
          </div>
        </Card>


        <Card title={t("appearance")} subtitle="Make Deshi Digest feel like yours.">
          <div className="space-y-5">
            <div>
              <Label className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <Palette className="h-3.5 w-3.5" /> {t("theme")}
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {THEMES.map((th) => {
                  const active = appearance.theme === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => appearance.setTheme(th.id as ThemeId)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border bg-card p-3 text-left transition hover:border-primary/50",
                        active ? "border-primary shadow-warm" : "border-border",
                      )}
                    >
                      <ThemeSwatch id={th.id as ThemeId} />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-medium">{th.label}</span>
                        {active && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{th.hint}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <Languages className="h-3.5 w-3.5" /> {t("language")}
              </Label>
              <div className="inline-flex rounded-lg border border-border bg-card p-1">
                {(["en", "bn"] as const).map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => appearance.setLanguage(lng)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm transition",
                      appearance.language === lng
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {lng === "en" ? t("english") : t("bangla")}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-xl bg-secondary/50 px-4 py-3">
              <div>
                <p className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="h-4 w-4 text-primary" /> {t("reduce_motion")}
                </p>
                <p className="text-xs text-muted-foreground">{t("reduce_motion_hint")}</p>
              </div>
              <Switch checked={!appearance.animations} onCheckedChange={(v) => appearance.setAnimations(!v)} />
            </label>
          </div>
        </Card>

        <Card title="Gharer Recipe Mode" subtitle="Hide restaurants. Focus only on cheap home recipes with local ingredients.">
          <label className="flex items-center justify-between gap-4 rounded-xl bg-secondary/50 px-4 py-3">
            <div>
              <p className="font-medium">Alternative mode</p>
              <p className="text-xs text-muted-foreground">
                When on, Nanumoni suggests only home-cooked, low-cost, village-style recipes and shows cost per serving in BDT.
              </p>
            </div>
            <Switch checked={form.alternative_mode} onCheckedChange={(v) => setForm({ ...form, alternative_mode: v })} />
          </label>
        </Card>

        <Card
          title="Nanumoni food memory"
          subtitle="Nanumoni uses a curated Bangladeshi food knowledge base to give culturally familiar suggestions, explain ingredients, and support plate analysis."
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/50 px-4 py-3">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <Link to="/chat">
              <Button type="button" variant="outline">
                <MessageCircle className="h-4 w-4" />
                Explore with Nanumoni
              </Button>
            </Link>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" type="submit" disabled={mut.isPending} className="shadow-warm">
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const SWATCH: Record<ThemeId, string[]> = {
  "classic-deshi": ["#faf8f5", "#c4654a", "#87a878", "#2d2017"],
  "modern-green": ["#f5faf6", "#2d8a5f", "#a8d5b9", "#143824"],
  "festival-gold": ["#fbf5e6", "#d9a441", "#c45a2a", "#3a2a16"],
  "dark-midnight": ["#161b2a", "#d97a4a", "#3b5876", "#e8eaf2"],
  "light-minimal": ["#ffffff", "#1a1a1a", "#e5e5e5", "#737373"],
};

function ThemeSwatch({ id }: { id: ThemeId }) {
  const colors = SWATCH[id];
  return (
    <div className="flex h-10 w-full overflow-hidden rounded-md ring-1 ring-border">
      {colors.map((c, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}
