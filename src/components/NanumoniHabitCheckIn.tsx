import React, { useState } from "react";
import { type HabitDay, type HabitAnswer, recordCheckIn } from "@/lib/smart-health-nudge";
import { Button } from "@/components/ui/button";
import { X, Check, Minus, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import nanumoniAvatar from "@/assets/nanumoni-avatar.jpg";

interface NanumoniHabitCheckInProps {
  pendingDay: HabitDay;
  onComplete: () => void;
}

export function NanumoniHabitCheckIn({ pendingDay, onComplete }: NanumoniHabitCheckInProps) {
  const [lang, setLang] = useState<"bn" | "en">("bn");

  const question = lang === "bn" ? pendingDay.checkInQuestionBn : pendingDay.checkInQuestionEn;

  const handleAnswer = (answer: HabitAnswer) => {
    recordCheckIn(pendingDay.date, answer);
    
    // Show supportive bottom-corner toast based on answer
    if (answer === "yes") {
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Darun! 🎉</span>
          <span className="text-xs">Ei habit ta maintain korle meal balance e help korte pare. Ajkeo try korun.</span>
        </div>,
        { duration: 4000 }
      );
    } else if (answer === "partly") {
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Bhalo start 🌱</span>
          <span className="text-xs">Ajke aro easy kore ekta small portion add korte paren.</span>
        </div>,
        { duration: 4000 }
      );
    } else if (answer === "no") {
      toast(
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Konো সমস্যা নাই 💚</span>
          <span className="text-xs">Ajke choto step nen — ekta small change add korar try korun.</span>
        </div>,
        { duration: 4000 }
      );
    } else if (answer === "skip") {
      toast(
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Thik ache 🌟</span>
          <span className="text-xs">Ajker nudge dekhe simple ekta habit try korte paren.</span>
        </div>,
        { duration: 4000 }
      );
    }

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl relative">
        <div className="p-6 text-center space-y-5">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <span className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/40 to-sage/40 blur-md" />
              <img
                src={nanumoniAvatar}
                alt="Nanumoni"
                width={64}
                height={64}
                className="relative h-16 w-16 rounded-full object-cover ring-4 ring-card"
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

          <h3 className="font-display text-lg font-semibold leading-snug">
            {question}
          </h3>

          <p className="text-xs text-muted-foreground">
            {lang === "bn" ? `গতকালকের টিপস: ${pendingDay.titleBn}` : `Yesterday's tip: ${pendingDay.titleEn}`}
          </p>

          <div className="grid grid-cols-1 gap-2 mt-4">
            <Button 
              onClick={() => handleAnswer("yes")} 
              className="w-full justify-start h-12 shadow-soft"
            >
              <Check className="h-4 w-4 mr-3 text-green-300" />
              {lang === "bn" ? "হ্যাঁ, পেরেছি (Yes)" : "Yes, I did"}
            </Button>
            
            <Button 
              onClick={() => handleAnswer("partly")} 
              variant="secondary"
              className="w-full justify-start h-12 shadow-soft"
            >
              <Minus className="h-4 w-4 mr-3 text-yellow-500" />
              {lang === "bn" ? "একটু পেরেছি (Partly)" : "Partly"}
            </Button>
            
            <Button 
              onClick={() => handleAnswer("no")} 
              variant="outline"
              className="w-full justify-start h-12"
            >
              <XCircle className="h-4 w-4 mr-3 text-red-400" />
              {lang === "bn" ? "পারি নাই (No)" : "No"}
            </Button>

            <button 
              onClick={() => handleAnswer("skip")}
              className="text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors flex items-center justify-center w-full py-2"
            >
              {lang === "bn" ? "এখন উত্তর দিবো না" : "Skip for now"}
              <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
