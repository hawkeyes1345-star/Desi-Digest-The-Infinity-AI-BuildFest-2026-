import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { UserCog, ArrowRight, Sparkles, Heart, Leaf, Wand2, Camera, Upload, ShieldCheck, AlertTriangle, Info, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type PlateAnalysis } from "@/lib/analyze-plate.functions";
import { reviewMealSafety, normalizeHealthConcerns, sanitizeClinicalSafetyText } from "@/lib/clinical-nutrition-safety";

function formatGoal(g: string) {
  return g
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPolishedSourceLabel(modelUsed?: string, fallbackReason?: string) {
  const wasQuotaLimited = fallbackReason === "AI_QUOTA_EXCEEDED" || 
                          fallbackReason === "AI_TEMPORARILY_UNAVAILABLE" ||
                          (fallbackReason && /quota|exhausted|limit|cooldown/i.test(fallbackReason));
  
  if (wasQuotaLimited && (modelUsed === "edamam-image-food" || modelUsed === "gemini-vision-fallback")) {
    return "Estimated locally";
  }

  if (modelUsed === "edamam-image-food") {
    return "Nutrition scan report";
  }
  if (modelUsed === "gemini-vision-fallback") {
    return "Nutrition scan report";
  }
  if (modelUsed === "manual-entry") {
    return "Typed meal estimate";
  }
  if (modelUsed === "demo-sample") {
    return "Demo nutrition estimate";
  }
  return "Nutrition scan report";
}

function getOverallConfidence(analysis: PlateAnalysis) {
  if (analysis.modelUsed === "manual-entry" || analysis.modelUsed === "demo-sample") {
    return { label: "High", tone: "high" };
  }
  const confidences = analysis.dishes.map(d => d.confidence || "medium");
  if (confidences.includes("low")) {
    return { label: "Low", tone: "low" };
  }
  if (confidences.every(c => c === "high")) {
    return { label: "High", tone: "high" };
  }
  return { label: "Medium", tone: "medium" };
}

function getMetricInterpretation(key: string, value: number) {
  if (key === "calories") {
    return value > 800 ? "High energy load" : value > 500 ? "Moderate energy" : "Light meal";
  }
  if (key === "carbs") {
    return value > 80 ? "Glycemic heavy" : value > 50 ? "Moderate balance" : "Low carb choice";
  }
  if (key === "protein") {
    return value > 25 ? "High protein" : value > 15 ? "Good balance" : "Low protein level";
  }
  if (key === "fat") {
    return value > 25 ? "High fat density" : value > 12 ? "Moderate fat" : "Low fat choice";
  }
  if (key === "fiber") {
    return value > 6 ? "High fiber" : value > 3 ? "Moderate fiber" : "Low fiber level";
  }
  if (key === "sodium") {
    return value > 800 ? "High sodium" : value > 400 ? "Moderate sodium" : "Low sodium choice";
  }
  return "";
}

function getScanValidationNotes(analysis: PlateAnalysis) {
  const notes: string[] = [];
  const n = analysis.nutrition;

  // 1. Low quality or estimated note
  if (analysis.nutritionEstimated || analysis.dishes.some(d => d.confidence === "low")) {
    const confidenceLabel = getOverallConfidence(analysis).label;
    notes.push(`Estimate quality: ${confidenceLabel}. Confirm the main ingredients for better accuracy.`);
  }

  // 2. Composite meal detection
  const compositeKeywords = ["thali", "meal", "plate", "biryani", "khichuri", "curry", "bhat", "mix", "jhol", "bhuna"];
  const isComposite = analysis.dishes.some(d =>
    compositeKeywords.some(kw => d.name.toLowerCase().includes(kw))
  );
  if (isComposite) {
    notes.push("Composite meal detected. Nutrition may vary depending on oil, portion size, and recipe.");
  }

  // 3. Suspicious values check
  if (n && n.calories > 350 && (n.carbs_g < 2 || n.protein_g < 2)) {
    notes.push("Some values may be incomplete. Confirm the plate items to improve accuracy.");
  }

  return notes;
}

function getDishMainContribution(d: any) {
  const nut = d.nutrition;
  if (!nut) return "Flavor / Garnish";
  if (nut.protein_g > 12) return "High Protein Source";
  if (nut.fiber_g > 4) return "Fiber & Micronutrients";
  if (nut.carbs_g > 30) return "Primary Carb Source";
  if (nut.protein_g > nut.carbs_g && nut.protein_g > nut.fat_g) return "Protein Source";
  if (nut.carbs_g > nut.protein_g && nut.carbs_g > nut.fat_g) return "Carbohydrate Source";
  if (nut.fat_g > nut.protein_g && nut.fat_g > nut.carbs_g) return "Dietary Fat Source";
  return "Macro Balance";
}

function TargetCmp({
  label,
  actual,
  target,
  unit,
  cap,
  higherIsBetter,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
  cap?: boolean;
  higherIsBetter?: boolean;
}) {
  const pct = target > 0 ? (actual / target) * 100 : 0;
  let tone: "good" | "warn" | "bad" = "good";
  if (cap) {
    tone = actual <= target ? "good" : actual <= target * 1.25 ? "warn" : "bad";
  } else if (higherIsBetter) {
    tone = actual >= target ? "good" : actual >= target * 0.7 ? "warn" : "bad";
  } else {
    const diff = Math.abs(pct - 100);
    tone = diff <= 15 ? "good" : diff <= 35 ? "warn" : "bad";
  }
  return (
    <div className="rounded-lg bg-secondary/60 px-2.5 py-2">
      <p className="flex items-center justify-between text-[10px] uppercase text-muted-foreground font-bold tracking-wide">
        <span>{label}</span>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase",
            tone === "good" && "bg-sage/20 text-sage",
            tone === "warn" && "bg-spice/20 text-spice",
            tone === "bad" && "bg-destructive/20 text-destructive",
          )}
        >
          {tone === "good" ? "on target" : tone === "warn" ? "off" : cap ? "too high" : higherIsBetter ? "too low" : "far off"}
        </span>
      </p>
      <p className="font-medium text-sm mt-0.5">
        {Math.round(actual)}
        {unit} <span className="text-muted-foreground text-[10px]">/ {Math.round(target)}{unit}</span>
      </p>
    </div>
  );
}

function PlateMatch({
  label,
  actual,
  ideal,
}: {
  label: string;
  actual: number;
  ideal: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(actual)));
  const diff = pct - ideal;
  const absDiff = Math.abs(diff);
  const status: "good" | "missing" | "over" =
    absDiff <= 8 ? "good" : diff < 0 ? "missing" : "over";
  const statusLabel =
    status === "good" ? "Balanced" : status === "missing" ? "Missing" : "Overdoing";
  const barColor =
    status === "good" ? "bg-sage" : status === "missing" ? "bg-spice" : "bg-destructive";
  const icon = status === "good" ? "✓" : status === "missing" ? "↓" : "↑";
  return (
    <div
      className={cn(
        "rounded-lg border border-border p-2.5",
        status === "good" && "bg-sage/5",
        status === "missing" && "bg-spice/5",
        status === "over" && "bg-destructive/5",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-bold">
          <span
            className={cn(
              "inline-flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold text-white",
              barColor,
            )}
          >
            {icon}
          </span>
          {label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          <span className="font-semibold text-foreground">{pct}%</span> / {ideal}%
          <span
            className={cn(
              "ml-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide",
              status === "good" && "bg-sage/20 text-sage",
              status === "missing" && "bg-spice/20 text-spice",
              status === "over" && "bg-destructive/20 text-destructive",
            )}
          >
            {statusLabel}
          </span>
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="absolute inset-y-0 left-0 w-0.5 bg-foreground/40"
          style={{ left: `${ideal}%` }}
          aria-hidden
        />
        <div
          className={cn("h-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value * 10));
  const color =
    value >= 7 ? "bg-sage" : value >= 4 ? "bg-spice" : "bg-destructive";
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
      <div className={cn("h-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PlateAnalysisResult({
  analysis,
  imageDataUrl,
  isRecentCached,
  onRetake,
  onReupload,
}: {
  analysis: PlateAnalysis;
  imageDataUrl?: string | null;
  isRecentCached?: boolean;
  onRetake?: () => void;
  onReupload?: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (!analysis.detected || analysis.blurry) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-display text-base">{analysis.nanumoniMessage}</p>
      </div>
    );
  }

  const n = analysis.nutrition;
  const score = Math.round(analysis.healthScore);
  const confidence = getOverallConfidence(analysis);
  const validationNotes = getScanValidationNotes(analysis);
  
  const safetyReview = reviewMealSafety({
    ingredients: analysis.dishes.map(d => d.name),
    nutrition: analysis.nutrition,
    healthConcerns: normalizeHealthConcerns({ goals: analysis.goalAlignment?.map(g => g.goal) || [] }),
    isDemo: analysis.modelUsed === "demo-sample"
  });

  return (
    <div className="space-y-4">
      {/* Profile Complete Nudge */}
      {analysis.profileIncomplete && (
        <div className="flex items-start gap-3 rounded-2xl border border-spice/30 bg-spice/5 px-4 py-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-spice/15 text-spice">
            <UserCog className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold">
              Sona, Nanumoni can be more personal if you finish your profile
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Still missing: {analysis.missingProfileFields?.join(", ") || "—"}.
              Add it once and every plate gets tuned to YOU.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link to="/profile">
              Complete <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* A. Report Header & Image Area */}
      <div className="border-b border-border pb-4 space-y-4">
        {imageDataUrl && (
          <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm max-h-[200px] sm:max-h-[250px]">
            <img
              src={imageDataUrl}
              alt="Scan Preview"
              className="w-full h-full object-cover"
            />
            {/* Overlay badges */}
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm shadow-sm border border-white/10">
                {getPolishedSourceLabel(analysis.modelUsed, analysis.fallbackReason)}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm shadow-sm border border-white/10",
                confidence.tone === "high" && "bg-emerald-600/80",
                confidence.tone === "medium" && "bg-primary/80",
                confidence.tone === "low" && "bg-spice/80"
              )}>
                Confidence: {confidence.label}
              </span>
              {isRecentCached && (
                <span className="inline-flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm shadow-sm border border-white/10">
                  Recent Scan Reused
                </span>
              )}
            </div>
            {/* Overlay actions */}
            {(onRetake || onReupload) && (
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {onRetake && (
                  <button
                    onClick={onRetake}
                    className="rounded-full px-3 py-1.5 bg-black/55 hover:bg-black/75 text-white backdrop-blur-md border border-white/10 shadow-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Camera className="h-3 w-3" />
                    <span>Retake</span>
                  </button>
                )}
                {onReupload && (
                  <button
                    onClick={onReupload}
                    className="rounded-full px-3 py-1.5 bg-black/55 hover:bg-black/75 text-white backdrop-blur-md border border-white/10 shadow-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Upload new</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
            Nutrition Intelligence Summary
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Clinical-style nutrition estimate based on visible food items, portion cues, and nutrition database cross-checks.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-2.5 w-2.5" /> {getPolishedSourceLabel(analysis.modelUsed, analysis.fallbackReason)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sage/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sage">
              <Heart className="h-2.5 w-2.5" /> Nutrition Cross-Check
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              <Leaf className="h-2.5 w-2.5" /> Safety Review
            </span>
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
              confidence.tone === "high" && "bg-sage/20 text-sage",
              confidence.tone === "medium" && "bg-primary/15 text-primary",
              confidence.tone === "low" && "bg-spice/20 text-spice"
            )}>
              Estimate quality: {confidence.label}
            </span>
          </div>
        </div>

        {/* Scan Validation Notes (Task 8) */}
        {validationNotes.length > 0 && (
          <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.01] p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            {validationNotes.map((note, idx) => (
              <p key={idx} className="flex items-start gap-1.5 leading-relaxed">
                <span className="text-amber-500 font-bold mt-0.5">•</span>
                <span>{note}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* B. Key Metrics Section */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Left: Health Score Card (1/3 width) */}
        <div className="rounded-2xl border border-border bg-warm-gradient p-4 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Estimated Health Score</p>
            <p className="mt-1 font-display text-3xl font-black text-foreground">{score}<span className="text-base font-normal text-muted-foreground">/10</span></p>
          </div>
          <div className="mt-4">
            <ScoreBar value={score} />
            <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
              {score >= 7 ? "Well-balanced Deshi meal" : score >= 4 ? "Moderately balanced plate" : "Unbalanced; swap elements"}
            </p>
          </div>
        </div>

        {/* Right: 6 Macro/Micro stats (2/3 width) */}
        <div className="sm:col-span-2 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Calories</p>
              <p className="mt-1 font-display text-lg font-bold text-foreground leading-none">{Math.round(n?.calories ?? 0)} <span className="text-xs font-normal text-muted-foreground">kcal</span></p>
            </div>
            <p className="text-[9px] text-muted-foreground font-medium mt-1 select-none border-t border-border/40 pt-1">
              {getMetricInterpretation("calories", n?.calories ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Protein</p>
              <p className="mt-1 font-display text-lg font-bold text-foreground leading-none">{Math.round(n?.protein_g ?? 0)} <span className="text-xs font-normal text-muted-foreground">g</span></p>
            </div>
            <p className="text-[9px] text-muted-foreground font-medium mt-1 select-none border-t border-border/40 pt-1">
              {getMetricInterpretation("protein", n?.protein_g ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Carbs</p>
              <p className="mt-1 font-display text-lg font-bold text-foreground leading-none">{Math.round(n?.carbs_g ?? 0)} <span className="text-xs font-normal text-muted-foreground">g</span></p>
            </div>
            <p className="text-[9px] text-muted-foreground font-medium mt-1 select-none border-t border-border/40 pt-1">
              {getMetricInterpretation("carbs", n?.carbs_g ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Fat</p>
              <p className="mt-1 font-display text-lg font-bold text-foreground leading-none">{Math.round(n?.fat_g ?? 0)} <span className="text-xs font-normal text-muted-foreground">g</span></p>
            </div>
            <p className="text-[9px] text-muted-foreground font-medium mt-1 select-none border-t border-border/40 pt-1">
              {getMetricInterpretation("fat", n?.fat_g ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Fiber</p>
              <p className="mt-1 font-display text-lg font-bold text-foreground leading-none">{Math.round(n?.fiber_g ?? 0)} <span className="text-xs font-normal text-muted-foreground">g</span></p>
            </div>
            <p className="text-[9px] text-muted-foreground font-medium mt-1 select-none border-t border-border/40 pt-1">
              {getMetricInterpretation("fiber", n?.fiber_g ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Sodium</p>
              <p className="mt-1 font-display text-lg font-bold text-foreground leading-none">{Math.round(n?.sodium_mg ?? 0)} <span className="text-xs font-normal text-muted-foreground">mg</span></p>
            </div>
            <p className="text-[9px] text-muted-foreground font-medium mt-1 select-none border-t border-border/40 pt-1">
              {getMetricInterpretation("sodium", n?.sodium_mg ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* C. Metabolic Safety Review (Task 4C) */}
      <div className="rounded-2xl border border-rose-500/10 bg-rose-500/[0.01] p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <Heart className="h-5 w-5" />
          <h4 className="font-display text-xs font-bold uppercase tracking-wider">Metabolic Safety Review</h4>
        </div>
        
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-background/60 p-3 border border-border/40 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Blood Sugar Impact</span>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-display text-xs font-bold">Glycemic Load</span>
              <span className={cn(
                "rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider",
                n.carbs_g > 85 ? "bg-red-500/10 text-red-500 border border-red-500/20" : n.carbs_g > 55 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              )}>
                {n.carbs_g > 85 ? "High concern" : n.carbs_g > 55 ? "Moderate" : "Low concern"}
              </span>
            </div>
          </div>
          
          <div className="rounded-lg bg-background/60 p-3 border border-border/40 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Portion Balance</span>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-display text-xs font-bold">Proportions</span>
              <span className={cn(
                "rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider",
                score < 4 ? "bg-red-500/10 text-red-500 border border-red-500/20" : score < 7 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              )}>
                {score < 4 ? "High concern" : score < 7 ? "Moderate" : "Low concern"}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-background/60 p-3 border border-border/40 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sodium & Fat</span>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-display text-xs font-bold">Cardio Markers</span>
              <span className={cn(
                "rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider",
                (n.sodium_mg > 800 || n.fat_g > 25) ? "bg-red-500/10 text-red-500 border border-red-500/20" : (n.sodium_mg > 400 || n.fat_g > 15) ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              )}>
                {(n.sodium_mg > 800 || n.fat_g > 25) ? "High concern" : (n.sodium_mg > 400 || n.fat_g > 15) ? "Moderate" : "Low concern"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-background/50 border border-border/40 p-3 text-xs leading-relaxed text-foreground/90 space-y-2">
          <p><strong>Nutrition Scan Summary:</strong> {analysis.healthExplanation}</p>
          {analysis.hygieneNotes && <p><strong>Freshness Note:</strong> {analysis.hygieneNotes}</p>}
        </div>
      </div>

      {/* D. What Was Detected */}
      {analysis.dishes.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Leaf className="h-4 w-4" /> Detected Meal Items
            </h4>
            <span className="text-xs text-muted-foreground">
              {analysis.dishes.length} items identified
            </span>
          </div>

          <div className="space-y-2">
            {analysis.dishes.map((d, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-secondary/25 p-3 flex flex-col justify-between gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-display text-sm font-bold text-foreground">{d.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground font-medium">
                      {d.portion}{d.portion_grams ? ` (~${Math.round(d.portion_grams)}g)` : ""}
                    </span>
                  </div>
                  <span className={cn(
                    "rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider",
                    d.confidence === "high" && "bg-sage/20 text-sage border border-sage/20",
                    d.confidence === "medium" && "bg-primary/15 text-primary border border-primary/20",
                    d.confidence === "low" && "bg-spice/20 text-spice border border-spice/20",
                  )}>
                    {d.confidence}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
                  <div className="flex flex-wrap gap-1.5">
                    <span>{Math.round(d.nutrition?.calories ?? 0)} kcal</span>
                    <span>•</span>
                    <span>P: {Math.round(d.nutrition?.protein_g ?? 0)}g</span>
                    <span>•</span>
                    <span>C: {Math.round(d.nutrition?.carbs_g ?? 0)}g</span>
                    <span>•</span>
                    <span>F: {Math.round(d.nutrition?.fat_g ?? 0)}g</span>
                  </div>
                  <span className="rounded bg-accent/40 px-1 py-0.5 text-[9px] font-semibold text-accent-foreground">
                    {getDishMainContribution(d)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E. Healthier Plan Section */}
      <div id="nanumoni-healthier-tips" className="rounded-2xl border border-sage bg-sage/[0.02] p-5 shadow-sm space-y-4 transition-all duration-1000">
        <div className="flex items-center gap-2 text-sage">
          <Wand2 className="h-5 w-5" />
          <h4 className="font-display text-base font-bold uppercase tracking-wider">Healthier Plan</h4>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Actionable Tips */}
          {analysis.makeItHealthierTips.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Adjustments for Next Time</h5>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {analysis.makeItHealthierTips.map((t, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-sage font-bold">✓</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deshi Swaps */}
          {analysis.substitutions && analysis.substitutions.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Smart Deshi Swaps</h5>
              <ul className="space-y-2 text-xs">
                {analysis.substitutions.map((s, i) => (
                  <li key={i} className="bg-background/40 border border-border/40 rounded-lg p-2.5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-1 font-semibold">
                      <span className="rounded bg-secondary/80 px-1 py-0.5 text-[9px] text-muted-foreground">{s.from}</span>
                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="rounded bg-sage/20 px-1 py-0.5 text-[9px] text-sage">{s.to}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-foreground/80 leading-relaxed">{s.why}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Portion Guidance & Budget Option */}
        <div className="grid gap-3 sm:grid-cols-2 border-t border-border/40 pt-3 text-xs leading-relaxed text-foreground/90">
          {analysis.portionAdjustment && (
            <div>
              <h5 className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Portion Guidance</h5>
              <p>{analysis.portionAdjustment}</p>
            </div>
          )}
          {analysis.budgetAlternatives && analysis.budgetAlternatives.length > 0 && (
            <div>
              <h5 className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Budget-Friendly Alternatives</h5>
              <p>{analysis.budgetAlternatives.join(" · ")}</p>
            </div>
          )}
        </div>
      </div>

      {/* F. Goal Fit */}
      {analysis.goalAlignment && analysis.goalAlignment.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <UserCog className="h-4.5 w-4.5" />
            <h4 className="font-display text-xs font-bold uppercase tracking-wider font-semibold">Goal Fit</h4>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {analysis.goalAlignment.slice(0, 3).map((g, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border border-border/50 p-2.5 text-xs",
                  g.verdict === "great" && "bg-emerald-500/[0.01] border-emerald-500/10",
                  g.verdict === "okay" && "bg-secondary/25",
                  g.verdict === "risky" && "bg-rose-500/[0.01] border-rose-500/10",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
                    {formatGoal(g.goal)}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider",
                      g.verdict === "great" && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                      g.verdict === "okay" && "bg-secondary/90 text-secondary-foreground",
                      g.verdict === "risky" && "bg-rose-500/10 text-rose-500 border border-rose-500/20",
                    )}
                  >
                    {g.verdict === "great" ? "Great Fit" : g.verdict === "okay" ? "Neutral Fit" : "Needs attention"}
                  </span>
                </div>
                <span className="text-foreground/85 mt-0.5 leading-relaxed">{g.reason}</span>
              </div>
            ))}
          </div>

          {/* Goal-Tuned Targets */}
          {analysis.goalAdjustedTargets && n && (
            <div className="border-t border-border/40 pt-3">
              <p className="text-[10px] text-muted-foreground mb-2.5 leading-relaxed">
                {analysis.goalAdjustedTargets.notes}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <TargetCmp label="kcal" actual={n.calories} target={analysis.goalAdjustedTargets.calories} unit="" />
                <TargetCmp label="Protein" actual={n.protein_g} target={analysis.goalAdjustedTargets.protein_g} unit="g" />
                <TargetCmp label="Carbs" actual={n.carbs_g} target={analysis.goalAdjustedTargets.carbs_g} unit="g" />
                <TargetCmp label="Fat" actual={n.fat_g} target={analysis.goalAdjustedTargets.fat_g} unit="g" />
                <TargetCmp label="Fiber" actual={n.fiber_g} target={analysis.goalAdjustedTargets.fiber_g} unit="g" higherIsBetter />
                <TargetCmp label="Sodium" actual={n.sodium_mg} target={analysis.goalAdjustedTargets.sodium_mg_max} unit="mg" cap />
              </div>
            </div>
          )}
        </div>
      )}

      {/* F2. Clinical Nutrition Safety Review */}
      {safetyReview.flags.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck className="h-4.5 w-4.5" />
            <h4 className="font-display text-xs font-bold uppercase tracking-wider font-semibold">Clinical Nutrition Safety Review</h4>
          </div>
          <div className="space-y-3">
            {safetyReview.flags.slice(0, 3).map((flag) => (
              <div key={flag.id} className={cn(
                "rounded-lg border p-3 flex flex-col gap-1.5 text-xs",
                flag.severity === "discuss" ? "bg-rose-500/[0.02] border-rose-500/20" :
                flag.severity === "caution" ? "bg-amber-500/[0.02] border-amber-500/20" :
                "bg-emerald-500/[0.02] border-emerald-500/20"
              )}>
                <div className="flex items-center gap-2">
                  {flag.severity === "discuss" ? <AlertTriangle className="h-4 w-4 text-rose-500" /> :
                   flag.severity === "caution" ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
                   <Info className="h-4 w-4 text-emerald-500" />}
                  <span className={cn("font-bold uppercase tracking-wider text-[10px]", 
                    flag.severity === "discuss" ? "text-rose-500" :
                    flag.severity === "caution" ? "text-amber-600 dark:text-amber-400" :
                    "text-emerald-600"
                  )}>{flag.title}</span>
                </div>
                <p className="text-foreground/85 leading-relaxed">{sanitizeClinicalSafetyText(flag.message)}</p>
                {flag.suggestedSwap && (
                  <p className="text-muted-foreground mt-0.5"><span className="font-semibold text-foreground/80">Consider:</span> {sanitizeClinicalSafetyText(flag.suggestedSwap)}</p>
                )}
                {flag.doctorDiscussionQuestion && (
                  <p className="text-primary mt-1 p-1.5 rounded bg-primary/5 flex gap-1.5 items-start">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{sanitizeClinicalSafetyText(flag.doctorDiscussionQuestion)}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {safetyReview.dataQualityNote} {safetyReview.disclaimer}
            </p>
          </div>
        </div>
      )}

      {/* G. Collapsible Detailed Insights Block */}
      <div className="rounded-xl border border-border/60 bg-secondary/15 overflow-hidden shadow-sm">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary/25 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            {showDetails ? "Hide detailed breakdown" : "View detailed breakdown"}
          </span>
          <span className="text-[10px] font-bold text-primary underline uppercase">
            {showDetails ? "Collapse" : "Expand"}
          </span>
        </button>

        {showDetails && (
          <div className="p-4 border-t border-border/40 space-y-4 bg-card">
            {/* Ideal Deshi Plate Composition */}
            <div>
              <h5 className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Ideal Deshi Plate Composition
              </h5>
              <p className="mb-3 rounded-lg bg-accent/45 px-3 py-2 text-xs font-medium text-accent-foreground leading-relaxed">
                {analysis.idealPlateComparison}
              </p>
              {analysis.idealPlateBreakdown && (
                <div className="space-y-2">
                  <PlateMatch
                    label="½ Shak-Shobji (greens & veg)"
                    actual={analysis.idealPlateBreakdown.shak_shobji_pct}
                    ideal={50}
                  />
                  <PlateMatch
                    label="¼ Bhat / Ruti (carbs)"
                    actual={analysis.idealPlateBreakdown.bhat_carbs_pct}
                    ideal={25}
                  />
                  <PlateMatch
                    label="¼ Dal + Mach/Mangsho (protein)"
                    actual={analysis.idealPlateBreakdown.dal_protein_pct}
                    ideal={25}
                  />
                  {analysis.idealPlateBreakdown.notes && (
                    <p className="pt-1 text-[11px] text-muted-foreground leading-relaxed">
                      {analysis.idealPlateBreakdown.notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Personalized Suggestions */}
            {analysis.personalizedSuggestions?.length > 0 && (
              <div className="border-t border-border/40 pt-3">
                <h5 className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Personalized Tips
                </h5>
                <ul className="space-y-1.5 text-xs">
                  {analysis.personalizedSuggestions.map((t, i) => (
                    <li key={i} className="flex gap-2 text-foreground/80 leading-relaxed">
                      <span className="text-primary font-bold">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety disclaimer */}
      <div className="rounded-xl border border-border bg-secondary/30 p-3.5 text-[10px] leading-relaxed text-muted-foreground/85 shadow-sm">
        <strong>Important:</strong> Clinical-style nutrition estimate. Not medical advice. Actual nutrition may vary by portion size, oil, recipe, and preparation method. Consult a qualified doctor or registered nutritionist for medical advice.
      </div>

      {/* H. Subtle User & Developer Footnotes */}
      <div className="pt-2.5 flex flex-col sm:flex-row justify-between gap-1.5 border-t border-border/40 text-[10px] text-muted-foreground/60 leading-relaxed select-none">
        <p>Analysis method: Vision-assisted nutrition estimate</p>
        <p className="sm:text-right">Data basis: Nutrition database + local food estimate</p>
      </div>

      {import.meta.env.DEV && analysis.sources.length > 0 && (
        <p className="pt-1.5 text-[9px] text-muted-foreground/40 text-right font-mono tracking-tight select-none">
          [Dev only] Diagnostic ID: {analysis.modelUsed} · Engine sources: {analysis.sources.join(", ")}
        </p>
      )}
    </div>
  );
}
