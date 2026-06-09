import React, { useEffect, useState } from "react";
import { type SmartHealthNudge, generateSmartNudge, shouldShowNudge, recordNudgeShown, dismissNudge, initOrUpdateHabitState, recordFeedbackCompleted, recordFeedbackRemindLater, recordFeedbackNotUseful, getFeedbackState } from "@/lib/smart-health-nudge";
import { getSmartHealthNudgeFn } from "@/lib/smart-health-nudge.functions";
import { Button } from "@/components/ui/button";
import { X, Info, Utensils, Droplets, Egg, Fish, ArrowRight, Calendar, Sparkles, Globe, Heart, ShieldCheck, ChevronRight, Copy, MessageSquare } from "lucide-react";
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
  const [isCompletedToday, setIsCompletedToday] = useState(false);

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
    if (nudge) {
      const state = getFeedbackState();
      setIsCompletedToday(state.completedNudgeIds.includes(nudge.id));
    }
  }, [nudge?.id]);

  useEffect(() => {
    if (nudge && isVisible) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[nudge image render]", nudge.imageUrl);
      }
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

  const getShareableText = () => {
    const mainNudgeText = lang === "bn" ? nudge.messageBn : nudge.messageEn;
    const habitText = lang === "bn" ? nudge.exerciseSuggestionBn : nudge.exerciseSuggestionEn;
    const checkInText = lang === "bn" ? nudge.checkInQuestionBn : nudge.checkInQuestionEn;
    
    let text = `Desi Digest — Smart Health Nudge Action Plan\n\n`;
    text += `Main nudge:\n${mainNudgeText}\n\n`;
    
    if (nudge.sevenDayPlan && nudge.sevenDayPlan.length > 0) {
      text += `7-day plan:\n`;
      nudge.sevenDayPlan.forEach(day => {
        const dayTitle = lang === "bn" ? day.titleBn : day.titleEn;
        const daySug = lang === "bn" ? day.suggestionBn : day.suggestionEn;
        text += `Day ${day.day}: ${dayTitle} - ${daySug}\n`;
      });
      text += `\n`;
    }
    
    if (habitText) {
      text += `Habit:\n${habitText}\n\n`;
    }
    
    if (checkInText) {
      text += `Tomorrow check-in:\n${checkInText}\n\n`;
    }
    
    text += `General nutrition guidance — not medical advice.`;
    
    return encodeURIComponent(text);
  };

  const handleCopyPlan = () => {
    const mainNudgeText = lang === "bn" ? nudge.messageBn : nudge.messageEn;
    const habitText = lang === "bn" ? nudge.exerciseSuggestionBn : nudge.exerciseSuggestionEn;
    const checkInText = lang === "bn" ? nudge.checkInQuestionBn : nudge.checkInQuestionEn;
    
    let text = `Desi Digest — Smart Health Nudge Action Plan\n\n`;
    text += `Main nudge:\n${mainNudgeText}\n\n`;
    
    if (nudge.sevenDayPlan && nudge.sevenDayPlan.length > 0) {
      text += `7-day plan:\n`;
      nudge.sevenDayPlan.forEach(day => {
        const dayTitle = lang === "bn" ? day.titleBn : day.titleEn;
        const daySug = lang === "bn" ? day.suggestionBn : day.suggestionEn;
        text += `Day ${day.day}: ${dayTitle} - ${daySug}\n`;
      });
      text += `\n`;
    }
    
    if (habitText) {
      text += `Habit:\n${habitText}\n\n`;
    }
    
    if (checkInText) {
      text += `Tomorrow check-in:\n${checkInText}\n\n`;
    }
    
    text += `General nutrition guidance — not medical advice.`;
    
    navigator.clipboard.writeText(text);
    toast.success(lang === "bn" ? "পরিকল্পনাটি কপি করা হয়েছে! 📋" : "Action plan copied to clipboard! 📋");
  };

  const handleCompletedClick = () => {
    recordFeedbackCompleted(nudge.id);
    setIsCompletedToday(true);
    toast.success(lang === "bn" ? "অসাধারণ! ছোট ছোট সুস্থ পদক্ষেপ বড় পরিবর্তন আনে। 🌱" : "Great! Small healthy steps add up. 🌱");
  };

  const handleRemindLaterClick = () => {
    recordFeedbackRemindLater(nudge.id);
    setIsVisible(false);
    toast.success(lang === "bn" ? "ঠিক আছে, আপনাকে পরে মনে করিয়ে দেওয়া হবে। ⏳" : "Okay, I'll remind you later. ⏳");
  };

  const handleNotUsefulClick = () => {
    recordFeedbackNotUseful(nudge.id);
    setIsVisible(false);
    toast.success(lang === "bn" ? "ধন্যবাদ। আমরা আজ এই পরামর্শটি আর দেখাবো না। 🛑" : "Thanks. We'll avoid showing this suggestion today. 🛑");
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
          {isCompletedToday ? (
            <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center min-h-[350px]">
              <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                <ShieldCheck className="h-12 w-12" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-2xl font-bold text-foreground">
                  {lang === "bn" ? "আজকের নুডজ সম্পন্ন হয়েছে ✅" : "Today’s nudge completed ✅"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {lang === "bn" ? "অসাধারণ! ছোট ছোট সুস্থ পদক্ষেপ বড় পরিবর্তন আনে। 🌱" : "Great! Small healthy steps add up. Keep it up! 🌿"}
                </p>
              </div>
              <Button onClick={() => setIsVisible(false)} size="lg" className="rounded-2xl px-10 h-12 font-bold shadow-soft">
                {lang === "bn" ? "বন্ধ করুন" : "Close"}
              </Button>
            </div>
          ) : (
            <>
              {/* Top Image Section */}
              <div className="relative h-64 w-full bg-muted flex items-center justify-center overflow-hidden">
            {nudge.imageUrl ? (
              <img 
                src={nudge.imageUrl} 
                alt={title} 
                className="h-full w-full object-cover"
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

            {!showPlan && exercise && (
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
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> 
                    {lang === "bn" ? "৭ দিনের অ্যাকশন প্ল্যান দেখুন" : "View 7-Day Action Plan"}
                  </span>
                  <ChevronRight className={cn("h-5 w-5 transition-transform duration-300", showPlan && "rotate-90")} />
                </button>
                {showPlan && (
                  <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    
                    {nudge.isDemo && (
                      <div className="bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-2xl p-3 border border-amber-500/20 text-xs font-bold text-center">
                        ⚠️ Sample demo data only
                      </div>
                    )}

                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                        {lang === "bn" ? "মূল উদ্দেশ্য" : "Main Nudge"}
                      </p>
                      <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                        {message}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                        {lang === "bn" ? "৭ দিনের অ্যাকশন প্ল্যান" : "7-Day Action Plan"}
                      </p>
                      {nudge.sevenDayPlan.map((day, idx) => (
                        <div key={idx} className="flex gap-4 p-3 rounded-2xl bg-card border border-border/40 hover:bg-background/50 transition-colors">
                          <div className="flex shrink-0 items-center justify-center h-10 w-10 rounded-xl bg-background border border-border/40 overflow-hidden">
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
                            <p className="text-xs font-bold leading-tight text-foreground">{lang === "bn" ? day.titleBn : day.titleEn}</p>
                            <p className="text-[11px] text-muted-foreground leading-snug">{lang === "bn" ? day.suggestionBn : day.suggestionEn}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {exercise && (
                      <div className="flex items-center gap-3 rounded-2xl border border-sage/30 bg-sage/5 p-3.5 shadow-sm">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage/20 text-sage">
                           <Droplets className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                           <p className="text-[9px] font-bold uppercase tracking-widest text-sage/80">Daily Activity Tip</p>
                           <p className="text-xs font-semibold text-foreground leading-tight">{exercise}</p>
                        </div>
                      </div>
                    )}

                    {(nudge.checkInQuestionBn || nudge.checkInQuestionEn) && (
                      <div className="bg-muted/50 rounded-2xl p-3.5 border border-border/50">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                          {lang === "bn" ? "আগামীকালের চেক-ইন প্রশ্ন" : "Tomorrow's Check-in Question"}
                        </p>
                        <p className="text-xs font-medium text-foreground/80 leading-snug italic">
                          "{lang === "bn" ? nudge.checkInQuestionBn : nudge.checkInQuestionEn}"
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCopyPlan}
                        className="rounded-xl h-10 font-semibold text-xs flex items-center justify-center gap-2 border border-border/80 hover:bg-muted"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {lang === "bn" ? "প্ল্যান কপি করুন" : "Copy Plan"}
                      </Button>
                      <a 
                        href={`https://wa.me/?text=${getShareableText()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl h-10 px-3 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {lang === "bn" ? "হোয়াটসঅ্যাপে শেয়ার" : "WhatsApp Share"}
                      </a>
                    </div>

                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleCompletedClick} 
                size="lg" 
                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-warm text-base font-bold flex items-center justify-center gap-2 group"
              >
                <ShieldCheck className="h-5 w-5" />
                {lang === "bn" ? "আমি এটি করেছি" : "I did this"}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleRemindLaterClick} 
                  variant="outline"
                  size="default" 
                  className="rounded-xl h-11 font-semibold text-xs border border-border/80 hover:bg-muted"
                >
                  {lang === "bn" ? "পরে মনে করাবেন" : "Remind me later"}
                </Button>

                <Button 
                  onClick={handleNotUsefulClick} 
                  variant="ghost"
                  size="default" 
                  className="rounded-xl h-11 font-semibold text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                >
                  {lang === "bn" ? "প্রয়োজনীয় নয়" : "Not useful"}
                </Button>
              </div>
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
        </>
      )}
    </div>
      </DialogContent>
    </Dialog>
  );
}
