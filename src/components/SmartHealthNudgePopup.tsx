import React, { useEffect, useState } from "react";
import { type SmartHealthNudge, generateSmartNudge, shouldShowNudge, recordNudgeShown, dismissNudge, initOrUpdateHabitState } from "@/lib/smart-health-nudge";
import { getSmartHealthNudgeFn } from "@/lib/smart-health-nudge.functions";
import { Button } from "@/components/ui/button";
import { X, Info, Utensils, Droplets, Egg, Fish, ArrowRight, Calendar, Sparkles, Globe, Heart, ShieldCheck, ChevronRight } from "lucide-react";
import { type MealLog } from "@/lib/meals.functions";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import nanumoniAvatar from "@/assets/nanumoni-avatar.jpg";

interface SmartHealthNudgePopupProps {
  profile: any;
  recentMeals: MealLog[];
  isDemo?: boolean;
}

const FALLBACK_ICONS: Record<string, React.ReactNode> = {
  "lal-shak": <Utensils className="h-10 w-10 text-green-600" />,
  "dal": <Utensils className="h-10 w-10 text-yellow-600" />,
  "water": <Droplets className="h-10 w-10 text-blue-500" />,
  "egg": <Egg className="h-10 w-10 text-orange-400" />,
  "fish": <Fish className="h-10 w-10 text-cyan-600" />,
  "vegetables": <Utensils className="h-10 w-10 text-emerald-500" />,
  "rice-balance": <Utensils className="h-10 w-10 text-amber-700" />,
  "generic": <Info className="h-10 w-10 text-primary" />,
};

const PLAN_FALLBACK_ICONS: Record<string, React.ReactNode> = {
  "lal-shak": <Utensils className="h-6 w-6 text-green-600" />,
  "dal": <Utensils className="h-6 w-6 text-yellow-600" />,
  "water": <Droplets className="h-6 w-6 text-blue-500" />,
  "egg": <Egg className="h-6 w-6 text-orange-400" />,
  "fish": <Fish className="h-6 w-6 text-cyan-600" />,
  "vegetables": <Utensils className="h-6 w-6 text-emerald-500" />,
  "rice-balance": <Utensils className="h-6 w-6 text-amber-700" />,
  "generic": <Info className="h-6 w-6 text-primary" />,
};

export function SmartHealthNudgePopup({ profile, recentMeals, isDemo = false }: SmartHealthNudgePopupProps) {
  const fetchNudge = useServerFn(getSmartHealthNudgeFn);
  
  const [localNudge, setLocalNudge] = useState<SmartHealthNudge | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [lang, setLang] = useState<"bn" | "en">("bn");

  // 1. Instantly show local deterministic nudge
  useEffect(() => {
    const generated = generateSmartNudge(profile, recentMeals, isDemo);
    if (generated && shouldShowNudge(generated.id)) {
      setLocalNudge(generated);
      setIsVisible(true);
    }
  }, [profile, recentMeals, isDemo]);

  // 2. Fetch AI nudge in background
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

  if (!nudge) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    dismissNudge(nudge.id);
  };

  const handleAction = () => {
    setIsVisible(false);
    dismissNudge(nudge.id);
    toast.success(lang === "bn" ? "দারুণ! আপনার পরবর্তী খাবারের সাথে এটি যোগ করার চেষ্টা করুন। 🌿" : "Great! Try adding this to your next meal. 🌿");
  };

  const title = lang === "bn" ? nudge.titleBn : nudge.titleEn;
  const message = lang === "bn" ? nudge.messageBn : nudge.messageEn;
  const benefit = lang === "bn" ? nudge.benefitBn : nudge.benefitEn;
  const actionLabel = lang === "bn" ? nudge.actionLabelBn : nudge.actionLabelEn;
  const reason = lang === "bn" ? nudge.reasonBn : nudge.reasonEn;
  const disclaimer = lang === "bn" ? nudge.disclaimerBn : nudge.disclaimerEn;
  const exercise = lang === "bn" ? nudge.exerciseSuggestionBn : nudge.exerciseSuggestionEn;

  return (
    <Dialog open={isVisible} onOpenChange={setIsVisible}>
      <DialogContent className="p-0 sm:max-w-[640px] overflow-hidden rounded-[2rem] border-none bg-card shadow-2xl transition-all duration-500 max-h-[92vh] flex flex-col">
        {/* Banner for Demo mode */}
        {nudge.isDemo && (
          <div className="bg-spice/10 px-4 py-2 text-center text-[10px] font-bold text-spice uppercase tracking-widest border-b border-spice/10">
            Sample Demo Data Evaluation
          </div>
        )}

        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pb-6">
          {/* Top Image Section */}
          <div className="relative h-64 w-full bg-muted flex items-center justify-center overflow-hidden">
            {nudge.imageUrl ? (
              <img 
                src={nudge.imageUrl} 
                alt={title} 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  // Force icon fallback
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'text-primary flex items-center justify-center h-full w-full bg-primary/5';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className="text-primary flex items-center justify-center h-full w-full bg-primary/5">
                {FALLBACK_ICONS[nudge.imageKind] || FALLBACK_ICONS.generic}
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            
            {/* Lang toggle over image */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 glass-soft px-2 py-1 rounded-full border border-white/20">
              <button
                onClick={() => setLang("bn")}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full transition-all",
                  lang === "bn" ? "bg-primary text-primary-foreground shadow-sm" : "text-white hover:bg-white/10"
                )}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full transition-all",
                  lang === "en" ? "bg-primary text-primary-foreground shadow-sm" : "text-white hover:bg-white/10"
                )}
              >
                English
              </button>
            </div>

            {/* AI Badge */}
            {aiNudge && !nudge.isDemo && (
               <div className="absolute top-4 right-12 z-10 flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider border border-white/30">
                 <Sparkles className="h-3 w-3" /> AI Personalized
               </div>
            )}

            <div className="absolute bottom-4 left-6 right-6">
              <h2 className="font-display text-2xl font-bold text-white leading-tight drop-shadow-md">
                {title}
              </h2>
            </div>
          </div>

          <div className="px-6 pt-6 space-y-6">
            <div className="flex flex-col gap-2">
               <p className="text-base leading-relaxed text-foreground/90 font-medium">
                {message}
              </p>
              
              <div className="flex items-start gap-3 rounded-2xl bg-primary/5 p-4 border border-primary/10">
                <Heart className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-primary uppercase tracking-wider">
                    {lang === "bn" ? "Personalized Suggestion" : "Personalized Suggestion"}
                  </p>
                  <p className="text-sm text-foreground/80 leading-snug font-medium">
                    {benefit}
                  </p>
                </div>
              </div>

              {reason && (
                <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4 border border-border/50">
                  <Info className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {lang === "bn" ? "Why this was suggested" : "Why this was suggested"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {reason}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {exercise && (
               <div className="flex items-center gap-3 rounded-2xl border border-sage/30 bg-sage/5 p-4 shadow-sm transition-all hover:shadow-md">
                 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/20 text-sage">
                    <Droplets className="h-5 w-5" />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-sage/80">Daily Activity Tip</p>
                    <p className="text-sm font-semibold text-foreground leading-tight">{exercise}</p>
                 </div>
               </div>
            )}

            {nudge.sevenDayPlan && nudge.sevenDayPlan.length > 0 && (
              <div className="border border-border/60 rounded-3xl overflow-hidden bg-background/30 shadow-soft">
                <button 
                  onClick={() => setShowPlan(!showPlan)}
                  className="w-full flex items-center justify-between p-4 text-sm font-bold text-foreground hover:bg-background/50 transition-all"
                >
                  <span className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> {lang === "bn" ? "৭ দিনের স্বাস্থ্য পরিকল্পনা দেখুন" : "View 7-Day Health Plan"}</span>
                  <ChevronRight className={cn("h-5 w-5 transition-transform duration-300", showPlan && "rotate-90")} />
                </button>
                {showPlan && (
                  <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    {nudge.sevenDayPlan.map((day, idx) => (
                      <div key={idx} className="flex gap-4 p-3 rounded-2xl hover:bg-background/50 transition-colors border border-transparent hover:border-border/40">
                        <div className="flex shrink-0 items-center justify-center h-12 w-12 rounded-xl bg-background shadow-soft border border-border/40 overflow-hidden">
                           {day.imageUrl ? (
                              <img src={day.imageUrl} alt={lang === "bn" ? day.titleBn : day.titleEn} className="object-cover w-full h-full" />
                            ) : (
                              PLAN_FALLBACK_ICONS[day.imageKind] || PLAN_FALLBACK_ICONS.generic
                            )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Day {day.day}</p>
                            <span className="text-[9px] font-bold text-sage bg-sage/10 px-1.5 rounded uppercase">Habit</span>
                          </div>
                          <p className="text-sm font-bold leading-tight">{lang === "bn" ? day.titleBn : day.titleEn}</p>
                          <p className="text-xs text-muted-foreground leading-snug">{lang === "bn" ? day.suggestionBn : day.suggestionEn}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={handleAction} size="lg" className="w-full h-14 rounded-2xl shadow-warm text-base font-bold group">
                {actionLabel}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <button 
                onClick={handleDismiss}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {lang === "bn" ? "আজকের মত থাক" : "Skip for now"}
              </button>
            </div>
            
            <div className="space-y-4 border-t border-border/50 pt-4">
               {nudge.imageUrl && nudge.imageSource && (
                <div className="flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground/60 italic">
                  <Globe className="h-3 w-3" />
                  {lang === "bn" ? "ছবির উৎস: " : "Image source: "}
                  <a href={nudge.imageSourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {nudge.imageSource}
                  </a>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-medium bg-muted/30 py-2 rounded-xl border border-border/30">
                <ShieldCheck className="h-3.5 w-3.5 text-primary/60" />
                {disclaimer}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
