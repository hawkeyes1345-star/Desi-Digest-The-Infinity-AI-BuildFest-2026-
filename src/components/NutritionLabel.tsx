import { deriveBadges, digestionScore, type FoodBadge, type NutritionFacts } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

const BADGE_STYLE: Record<FoodBadge, string> = {
  "High Protein": "bg-clay/15 text-clay border-clay/30",
  "Low Oil": "bg-sage/20 text-sage-foreground border-sage/40",
  "Diabetic Friendly": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  "Heart Friendly": "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300",
  "Iron-Rich": "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300",
  "Vitamin-A Rich": "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-300",
  "Budget-Friendly": "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  "High Fiber": "bg-lime-500/15 text-lime-700 border-lime-500/30 dark:text-lime-300",
  "Low Sodium": "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-300",
  "Easy Digest": "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-300",
};

export function NutritionLabel({
  title,
  subtitle,
  nutrition,
  costBdt,
  extraBadges,
  compact,
  className,
}: {
  title?: string;
  subtitle?: string;
  nutrition: NutritionFacts;
  costBdt?: number;
  extraBadges?: FoodBadge[];
  compact?: boolean;
  className?: string;
}) {
  const badges = Array.from(new Set([...(extraBadges ?? []), ...deriveBadges(nutrition, { costBdt })]));
  const dig = digestionScore(nutrition);
  if (dig >= 7) badges.push("Easy Digest");

  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-soft", className)}>
      {(title || subtitle) && (
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {title && <p className="truncate font-display text-base font-semibold">{title}</p>}
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {costBdt !== undefined && (
            <span className="shrink-0 rounded-full bg-spice/15 px-2.5 py-1 text-xs font-semibold text-spice">
              ৳{Math.round(costBdt)}
            </span>
          )}
        </div>
      )}

      <div className={cn("grid gap-2 px-4 py-3", compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
        <Cell label="kcal" value={Math.round(nutrition.calories)} accent />
        <Cell label="Protein" value={`${Math.round(nutrition.protein_g)}g`} />
        <Cell label="Carbs" value={`${Math.round(nutrition.carbs_g)}g`} />
        <Cell label="Fat" value={`${Math.round(nutrition.fat_g)}g`} />
        {!compact && (
          <>
            <Cell label="Fiber" value={`${Math.round(nutrition.fiber_g ?? 0)}g`} />
            <Cell label="Sugar" value={`${Math.round(nutrition.sugar_g ?? 0)}g`} />
            <Cell label="Sodium" value={`${Math.round(nutrition.sodium_mg ?? 0)}mg`} />
            <Cell label="Digest" value={`${dig}/10`} />
          </>
        )}
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-3">
          {badges.map((b) => (
            <span
              key={b}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                BADGE_STYLE[b],
              )}
            >
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Cell({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg px-2.5 py-2 text-center",
        accent ? "bg-warm-gradient" : "bg-secondary/50",
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-semibold">{value}</p>
    </div>
  );
}
