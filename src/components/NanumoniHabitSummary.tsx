import React, { useState } from "react";
import { getHabitState, markSevenDaySummaryShown } from "@/lib/smart-health-nudge";
import { Button } from "@/components/ui/button";
import { X, Calendar, CheckCircle2, TrendingUp, Sparkles, XCircle, MinusCircle } from "lucide-react";
import nanumoniAvatar from "@/assets/nanumoni-avatar.jpg";

interface NanumoniHabitSummaryProps {
  onClose: () => void;
}

export function NanumoniHabitSummary({ onClose }: NanumoniHabitSummaryProps) {
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const state = getHabitState();

  if (!state || state.days.length === 0) {
    onClose();
    return null;
  }

  const days = state.days.filter(d => d.answer && d.answer !== "skip");
  const totalDays = days.length;
  
  let yesCount = 0;
  let partlyCount = 0;
  let noCount = 0;

  days.forEach(d => {
    if (d.answer === "yes") yesCount++;
    if (d.answer === "partly") partlyCount++;
    if (d.answer === "no") noCount++;
  });

  const maxScore = totalDays;
  const score = yesCount + (partlyCount * 0.5);
  const consistencyPercent = totalDays > 0 ? Math.round((score / maxScore) * 100) : 0;

  const handleClose = () => {
    markSevenDaySummaryShown();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-sage/10 pointer-events-none" />
        
        <div className="relative p-6 overflow-y-auto custom-scrollbar">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full bg-background/50 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground backdrop-blur-sm z-10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-center space-y-4">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <span className="absolute -inset-3 rounded-full bg-gradient-to-br from-primary/30 to-sage/30 blur-lg animate-pulse" />
                <img
                  src={nanumoniAvatar}
                  alt="Nanumoni"
                  width={72}
                  height={72}
                  className="relative h-[72px] w-[72px] rounded-full object-cover ring-4 ring-card shadow-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <button
                onClick={() => setLang("bn")}
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${lang === "bn" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLang("en")}
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${lang === "en" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                English
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />
              {lang === "bn" ? "৭ দিনের Habit Summary" : "7-Day Habit Summary"}
            </div>

            <h3 className="font-display text-xl font-semibold leading-tight">
              {lang === "bn" 
                ? "General nutrition habit progress" 
                : "Your nutrition habit consistency"}
            </h3>

            <p className="text-sm text-muted-foreground">
              {lang === "bn" 
                ? "এটি সাধারণ পুষ্টি নির্দেশনা, চিকিৎসা পরামর্শ নয়।" 
                : "General nutrition guidance only — not medical advice."}
            </p>

            <div className="bg-background/60 backdrop-blur-sm rounded-2xl p-5 border border-border shadow-inner mt-6">
              <div className="flex justify-center items-baseline gap-1">
                <span className="text-5xl font-display font-bold text-primary">{consistencyPercent}%</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">
                Consistency Score
              </p>

              <div className="grid grid-cols-3 gap-2 mt-5">
                <div className="flex flex-col items-center bg-card rounded-xl p-2 shadow-soft border border-border/50">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
                  <span className="text-lg font-bold">{yesCount}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Yes</span>
                </div>
                <div className="flex flex-col items-center bg-card rounded-xl p-2 shadow-soft border border-border/50">
                  <MinusCircle className="h-5 w-5 text-yellow-500 mb-1" />
                  <span className="text-lg font-bold">{partlyCount}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Partly</span>
                </div>
                <div className="flex flex-col items-center bg-card rounded-xl p-2 shadow-soft border border-border/50">
                  <XCircle className="h-5 w-5 text-red-400 mb-1" />
                  <span className="text-lg font-bold">{noCount}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">No</span>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 text-left flex gap-3 mt-4">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed text-foreground/90">
                {lang === "bn" 
                  ? `Apni ${totalDays} diner moddhe ${yesCount} din habit fully follow korte perechen. Eta ekta good start. Ei habit continue korle apnar daily meal balance support korte pare.`
                  : `You fully followed your habits ${yesCount} out of ${totalDays} days. That's a good start! Continuing this habit can help support a balanced daily meal routine.`}
              </p>
            </div>

            <Button onClick={handleClose} className="w-full h-12 mt-4 shadow-warm text-md font-semibold">
              {lang === "bn" ? "Okay, Got it!" : "Keep it up"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
