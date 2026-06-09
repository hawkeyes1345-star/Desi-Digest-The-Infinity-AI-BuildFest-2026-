import React, { useEffect, useState } from "react";
import { type SmartHealthNudge, generateSmartNudge, shouldShowNudge, recordNudgeShown, dismissNudge, initOrUpdateHabitState } from "@/lib/smart-health-nudge";
import { getSmartHealthNudgeFn } from "@/lib/smart-health-nudge.functions";
import { Button } from "@/components/ui/button";
import { X, Info, Utensils, Droplets, Egg, Fish, ArrowRight, Calendar, Sparkles } from "lucide-react";
import { type MealLog } from "@/lib/meals.functions";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

interface SmartHealthNudgePopupProps {
  profile: any;
  recentMeals: MealLog[];
  isDemo?: boolean;
}

const FALLBACK_ICONS: Record<string, React.ReactNode> = {
  "lal-shak": <Utensils className="h-8 w-8 text-green-600" />,
  "dal": <Utensils className="h-8 w-8 text-yellow-600" />,
  "water": <Droplets className="h-8 w-8 text-blue-500" />,
  "egg": <Egg className="h-8 w-8 text-orange-400" />,
  "fish": <Fish className="h-8 w-8 text-cyan-600" />,
  "vegetables": <Utensils className="h-8 w-8 text-emerald-500" />,
  "rice-balance": <Utensils className="h-8 w-8 text-amber-700" />,
  "generic": <Info className="h-8 w-8 text-primary" />,
};

const GRADIENTS: Record<string, string> = {
  "lal-shak": "from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/10",
  "dal": "from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-900/10",
  "water": "from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/10",
  "egg": "from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-900/10",
  "fish": "from-cyan-100 to-cyan-50 dark:from-cyan-900/40 dark:to-cyan-900/10",
  "vegetables": "from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-900/10",
  "rice-balance": "from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/10",
  "generic": "from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/5",
};

export function SmartHealthNudgePopup({ profile, recentMeals, isDemo = false }: SmartHealthNudgePopupProps) {
  const fetchNudge = useServerFn(getSmartHealthNudgeFn);
  
  const [localNudge, setLocalNudge] = useState<SmartHealthNudge | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  // 1. Instantly show local deterministic nudge
  useEffect(() => {
    const generated = generateSmartNudge(profile, recentMeals, isDemo);
    if (generated && shouldShowNudge(generated.id)) {
      setLocalNudge(generated);
      setIsVisible(true);
    }
  }, [profile, recentMeals, isDemo]);

  // 2. Fetch AI nudge in background (only if we're showing something)
  const { data: aiNudge } = useQuery({
    queryKey: ["smart-nudge", profile?.id, isDemo, recentMeals.length],
    queryFn: async () => {
      return await fetchNudge({ data: { profile, recentMeals, isDemo } });
    },
    enabled: isVisible, 
    staleTime: 4 * 60 * 60 * 1000 // 4 hours
  });

  const nudge = aiNudge || localNudge;

  useEffect(() => {
    if (nudge && isVisible) {
      recordNudgeShown(nudge.id);
      initOrUpdateHabitState(nudge);
    }
  }, [nudge?.id, isVisible]);

  if (!nudge || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    dismissNudge(nudge.id);
  };

  const handleAction = () => {
    setIsVisible(false);
    dismissNudge(nudge.id);
    toast.success("Try adding this to your next meal. 🌿");
  };

  const gradientClass = GRADIENTS[nudge.imageKind] || GRADIENTS.generic;
  const icon = FALLBACK_ICONS[nudge.imageKind] || FALLBACK_ICONS.generic;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-500 sm:bottom-6 sm:right-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh]">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-50 pointer-events-none`} />
        
        <div className="relative p-5 overflow-y-auto custom-scrollbar">
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-full bg-background/50 p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground backdrop-blur-sm z-10"
            aria-label="Hide for now"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex gap-4">
            <div className="flex shrink-0 items-center justify-center h-16 w-16 rounded-xl bg-background/80 shadow-soft backdrop-blur-sm border border-border/50 overflow-hidden relative">
              {nudge.imageUrl ? (
                <img src={nudge.imageUrl} alt={nudge.title} className="object-cover w-full h-full" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} />
              ) : (
                icon
              )}
            </div>

            <div className="flex-1 space-y-1">
              {nudge.isDemo && (
                <span className="inline-block rounded-full bg-spice/10 px-2 py-0.5 text-[10px] font-medium text-spice uppercase tracking-wider mb-1">
                  Sample Demo Data
                </span>
              )}
              {aiNudge && !nudge.isDemo && (
                 <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary uppercase tracking-wider mb-1">
                 <Sparkles className="h-3 w-3" /> AI Personalized
               </span>
              )}
              <h4 className="font-display text-sm font-semibold leading-tight">
                {nudge.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {nudge.message}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-start gap-2 rounded-lg bg-background/60 p-2.5 text-xs text-foreground backdrop-blur-sm">
              <SparklesIcon className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
              <span className="font-medium">{nudge.benefit}</span>
            </div>

            {nudge.sevenDayPlan && nudge.sevenDayPlan.length > 0 && (
              <div className="border border-border/50 rounded-lg overflow-hidden bg-background/40 backdrop-blur-sm">
                <button 
                  onClick={() => setShowPlan(!showPlan)}
                  className="w-full flex items-center justify-between p-3 text-xs font-semibold text-foreground hover:bg-background/50 transition-colors"
                >
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" /> View 7-Day Plan</span>
                  <ArrowRight className={`h-4 w-4 transition-transform ${showPlan ? "rotate-90" : ""}`} />
                </button>
                {showPlan && (
                  <div className="p-3 pt-0 space-y-3">
                    {nudge.sevenDayPlan.map((day, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex shrink-0 items-center justify-center h-10 w-10 rounded-lg bg-background/80 shadow-soft overflow-hidden relative border border-border/40">
                           {day.imageUrl ? (
                              <img src={day.imageUrl} alt={day.title} className="object-cover w-full h-full" />
                            ) : (
                              FALLBACK_ICONS[day.imageKind] || FALLBACK_ICONS.generic
                            )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Day {day.day}</p>
                          <p className="text-xs font-medium leading-tight">{day.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug">{day.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button onClick={handleAction} size="sm" className="w-full shadow-warm group">
                {nudge.actionLabel}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
            
            <p className="text-center text-[9px] text-muted-foreground opacity-70">
              {nudge.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
