import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";
import { listRecentMeals, type MealLog } from "@/lib/meals.functions";
import { isDemoSession, demoProfile, getDemoMeals } from "@/lib/demo-session";
import { getHabitState } from "@/lib/smart-health-nudge";
import { generateCareCompanionSummary, type CareCompanionSummary, type CareCompanionQuestion } from "@/lib/care-companion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { 
  Clipboard, 
  Share2, 
  ArrowLeft, 
  Stethoscope, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  ChevronRight,
  Printer,
  FileText,
  Clock,
  Database,
  CalendarDays,
  Activity,
  User,
  ShieldCheck,
  ListTodo
} from "lucide-react";
import { toast } from "sonner";
import { buildWhatsAppShareUrl, copyShareSummary } from "@/lib/share-summary";
import logoMark from "@/assets/logo-mark.png";

export const Route = createFileRoute("/care-companion")({
  head: () => ({
    meta: [
      { title: "Care Companion — Deshi Digest" },
      { name: "description", content: "Prepare for your next doctor or dietitian visit with a data-driven nutrition summary." }
    ],
  }),
  component: CareCompanionPage,
});

function parseCustomQuery(queryText: string): Omit<CareCompanionQuestion, "id" | "confidence"> {
  const text = queryText.toLowerCase();
  
  if (text.includes("oil") || text.includes("fried") || text.includes("bhaji") || text.includes("puri") || text.includes("singara") || text.includes("samosa") || text.includes("paratha") || text.includes("fat") || text.includes("vaji") || text.includes("তেল") || text.includes("তেলাক্ত")) {
    return {
      question: queryText,
      category: "fried_oily",
      whyThisMatters: "Oily or fried foods are highly calorie-dense and common in Bangladeshi cooking, which may impact heart health or digestion.",
      basedOn: ["Custom search query", "Oily/fried food keywords"],
      safeAnswer: "Based on available meal logs, oily or fried foods may raise your overall calorie and fat intake. It may be worth discussing cooking methods or portion balance with your doctor or dietitian. You do not need to label these foods as forbidden, but focus on portion moderation or air-frying swaps.",
      bangladeshiFoodExamples: ["Air-fried or baked snacks instead of deep-fried puri/singara", "Reducing oil used in curries", "Boiled or poached eggs instead of deep-fried egg bhaji"],
      whatToTrackNext: ["Number of fried items eaten per week", "Tablespoons of soybean/mustard oil used daily"],
      doctorDiscussionPrompt: "How can I balance fried foods in my diet, and what are some lower-oil traditional recipes I can use?"
    };
  }
  
  if (text.includes("rice") || text.includes("carb") || text.includes("bhat") || text.includes("sugar") || text.includes("sweet") || text.includes("misti") || text.includes("muri") || text.includes("chira") || text.includes("roti") || text.includes("bread") || text.includes("wheat") || text.includes("ভাত") || text.includes("মিষ্টি")) {
    return {
      question: queryText,
      category: "carb_portion",
      whyThisMatters: "Refined carbohydrates like white rice form the core of traditional Bangladeshi meals, but excess portions can elevate blood sugar levels.",
      basedOn: ["Custom search query", "Rice or carbohydrate keywords"],
      safeAnswer: "Based on available meal logs, carbohydrate and rice portions are worth discussing. White rice can be balanced with fiber and protein. Speak with your healthcare professional to find a suitable portion target for your activity level rather than completely eliminating rice.",
      bangladeshiFoodExamples: ["Replacing some white rice with lal atta roti", "Adding fiber-rich dal or vegetables to balance rice", "Puffed rice (muri) as a light snack"],
      whatToTrackNext: ["Rice portion sizes (e.g., measured in cups)", "Energy levels after high-carb meals"],
      doctorDiscussionPrompt: "What portion of white rice or roti is suitable for my goals, and how can I balance carbs with vegetables and protein?"
    };
  }

  if (text.includes("fiber") || text.includes("veg") || text.includes("shak") || text.includes("shobji") || text.includes("salad") || text.includes("fruit") || text.includes("cucumber") || text.includes("shobzi") || text.includes("সবজি") || text.includes("শাক")) {
    return {
      question: queryText,
      category: "fiber",
      whyThisMatters: "Fiber supports digestive regularity, blood sugar balance, and heart health. Traditional meals can sometimes lack sufficient vegetables.",
      basedOn: ["Custom search query", "Fiber or vegetable keywords"],
      safeAnswer: "Based on available meal logs, increasing fiber is a helpful topic to discuss. Adding local greens (shak) or seasonal vegetables gradually can improve fiber intake. Start slowly to avoid bloating.",
      bangladeshiFoodExamples: ["Lal shak, palong shak, or pui shak", "Mixed vegetables (shobji) cooked with minimal oil", "Local fruits like guava (peyara) or papaya (pepe)"],
      whatToTrackNext: ["Daily servings of cooked vegetables/shak", "Water intake to support fiber digestion"],
      doctorDiscussionPrompt: "How can I add more local fiber-rich foods to my routine safely, and are there vegetables I should avoid if I have a sensitive stomach?"
    };
  }

  if (text.includes("protein") || text.includes("egg") || text.includes("dim") || text.includes("fish") || text.includes("mach") || text.includes("chicken") || text.includes("murgi") || text.includes("meat") || text.includes("beef") || text.includes("mutton") || text.includes("dal") || text.includes("lentil") || text.includes("chola") || text.includes("yogurt") || text.includes("ডিম") || text.includes("মাছ") || text.includes("ডাল")) {
    return {
      question: queryText,
      category: "protein",
      whyThisMatters: "Protein is vital for muscle mass, immune function, and feeling full. Lean and plant-based protein sources are affordable and healthy options.",
      basedOn: ["Custom search query", "Protein or fish/egg/lentil keywords"],
      safeAnswer: "Based on available meal logs, protein intake may be worth discussing. Incorporating a balance of animal (fish, egg, chicken) and plant-based (dal, chola) proteins helps meet your nutrition goals without adding excessive saturated fat.",
      bangladeshiFoodExamples: ["Boiled eggs (dim)", "Small local fish (mola, kachki)", "Rui, Katla, or tilapia", "Lentil dal soup", "Chickpeas (chola)"],
      whatToTrackNext: ["Protein portions in each major meal", "Daily egg or lentil servings"],
      doctorDiscussionPrompt: "What is a safe daily protein intake for my kidneys, heart, and activity level?"
    };
  }

  if (text.includes("salt") || text.includes("sodium") || text.includes("salty") || text.includes("blood pressure") || text.includes("bp") || text.includes("pressure") || text.includes("hypertension") || text.includes("achar") || text.includes("pickle") || text.includes("shutki") || text.includes("লবণ")) {
    return {
      question: queryText,
      category: "sodium",
      whyThisMatters: "Excessive salt is a major contributor to high blood pressure. Traditional pickles, shutki (dried fish), and processed snacks are high in sodium.",
      basedOn: ["Custom search query", "Salt or blood pressure concerns"],
      safeAnswer: "Based on available meal logs, sodium levels may be worth discussing if heart health or blood pressure is a priority. Try seasoning with lime juice, garlic, ginger, and green herbs to reduce table salt.",
      bangladeshiFoodExamples: ["Fresh lemon juice (lebu)", "Coriander leaves (dhone pata)", "Reducing shutki and processed snacks like chanachur"],
      whatToTrackNext: ["Acreage of added table salt", "Frequency of pickles or dried fish consumption"],
      doctorDiscussionPrompt: "What is my daily sodium limit, and how can I replace salt in my favorite deshi foods without losing flavor?"
    };
  }

  if (text.includes("gastric") || text.includes("ulcer") || text.includes("acid") || text.includes("reflux") || text.includes("spicy") || text.includes("jhal") || text.includes("chili") || text.includes("stomach") || text.includes("bloat") || text.includes("গ্যাস")) {
    return {
      question: queryText,
      category: "general",
      whyThisMatters: "Acid reflux or gastric discomfort can be triggered by spicy, oily, or acidic foods in sensitive systems.",
      basedOn: ["Custom search query", "Gastric or spicy food keywords"],
      safeAnswer: "Based on available meal logs, spicy or oily meals are worth discussing for gastric comfort. Preparing milder versions of your favorite curries can support digestion. Consult a doctor for any persistent pain.",
      bangladeshiFoodExamples: ["Soft khichuri with minimal spices", "Boiled vegetables like bottle gourd (lau) or sweet pumpkin (misti kumra)", "Stewed papaya"],
      whatToTrackNext: ["Food triggers that cause acid reflux", "Gap between mealtime and sleeping"],
      doctorDiscussionPrompt: "Are there specific spices or ingredients I should avoid to prevent gastric irritation, and what are safe meal alternatives?"
    };
  }

  if (text.includes("habit") || text.includes("nudge") || text.includes("water") || text.includes("drink") || text.includes("walk") || text.includes("exercise") || text.includes("activity") || text.includes("sleep") || text.includes("step") || text.includes("হাঁটা") || text.includes("পানি")) {
    return {
      question: queryText,
      category: "general",
      whyThisMatters: "Lifestyle factors like movement, consistent sleep, and hydration support metabolism, heart health, and mental well-being.",
      basedOn: ["Custom search query", "Habit or water keywords"],
      safeAnswer: "Based on available meal logs and habit data, lifestyle metrics are worth discussing. Focus on drinking adequate clean water (around 8-10 glasses) and engaging in light walking after meals to assist digestion.",
      bangladeshiFoodExamples: ["Drinking water from a designated bottle", "Taking a 10-15 minute walk after dinner", "Tracking habits consistently"],
      whatToTrackNext: ["Glasses of water drank daily", "Daily walk duration in minutes"],
      doctorDiscussionPrompt: "How do my walking and hydration habits support my metabolic health, and what are reasonable goals for me?"
    };
  }

  // Fallback if no keywords matched
  return {
    question: queryText,
    category: "general",
    whyThisMatters: "Based on your custom query.",
    basedOn: ["Custom query input"],
    safeAnswer: "I can help turn this into a doctor/dietitian discussion question. Please mention a food, habit, or goal (e.g., 'rice portions', 'reducing fried foods', 'how to add fiber'). This will help me reference your available meal patterns safely.",
    bangladeshiFoodExamples: [],
    whatToTrackNext: [],
    doctorDiscussionPrompt: `How can I safely adjust my diet to address my question: "${queryText}"?`
  };
}

function CareCompanionPage() {
  const navigate = useNavigate();
  const getProfile = useServerFn(getMyProfile);
  const listMeals = useServerFn(listRecentMeals);
  const demo = isDemoSession();
  const [mounted, setMounted] = useState(false);

  const [customQuestions, setCustomQuestions] = useState<CareCompanionQuestion[]>([]);
  const [customQuery, setCustomQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<CareCompanionQuestion | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => {
      if (demo) return demoProfile;
      return getProfile();
    },
    enabled: mounted,
  });

  const mealsQ = useQuery({
    queryKey: ["meals"],
    queryFn: () => {
      if (demo) return getDemoMeals();
      return listMeals();
    },
    enabled: mounted,
  });

  const habitState = useMemo(() => {
    if (!mounted) return null;
    return getHabitState();
  }, [mounted]);

  const summary = useMemo(() => {
    if (!profileQ.data || !mealsQ.data) return null;
    return generateCareCompanionSummary(
      profileQ.data,
      mealsQ.data,
      habitState,
      demo
    );
  }, [profileQ.data, mealsQ.data, habitState, demo]);

  const allQuestions = useMemo(() => {
    if (!summary) return [];
    const merged = [...customQuestions, ...summary.questionsToAsk];
    const unique: CareCompanionQuestion[] = [];
    const seen = new Set<string>();
    for (const q of merged) {
      if (!seen.has(q.question.toLowerCase())) {
        seen.add(q.question.toLowerCase());
        unique.push(q);
      }
    }
    return unique;
  }, [summary, customQuestions]);

  const handleCustomQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    
    const parsed = parseCustomQuery(customQuery.trim());
    const newQ: CareCompanionQuestion = {
      ...parsed,
      id: "custom_" + Date.now(),
      confidence: summary?.confidence || "medium"
    };

    setCustomQuestions(prev => [newQ, ...prev]);
    setSelectedQuestion(newQ);
    setIsPanelOpen(true);
    setCustomQuery("");
    toast.success("Question explanation generated!");
  };

  const handleCopyAnswer = async (q: CareCompanionQuestion) => {
    const text = `Question: ${q.question}
Answer: ${q.safeAnswer}
Why Suggested: ${q.whyThisMatters}
Bangladeshi Food Examples: ${q.bangladeshiFoodExamples.join(", ") || "N/A"}
What to track next: ${q.whatToTrackNext.map(t => `- ${t}`).join("\n") || "N/A"}
For doctor discussion: "${q.doctorDiscussionPrompt}"

General nutrition guidance — not medical advice.`;
    const ok = await copyShareSummary(text);
    if (ok) toast.success("Question explanation copied to clipboard!");
    else toast.error("Failed to copy explanation.");
  };

  if (!mounted) return null;

  const handleCopy = async () => {
    if (!summary) return;
    const ok = await copyShareSummary(summary.shareText);
    if (ok) toast.success("Care summary copied to clipboard.");
    else toast.error("Failed to copy summary.");
  };

  const handleWhatsApp = () => {
    if (!summary) return;
    const url = buildWhatsAppShareUrl(summary.shareText);
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-warm-gradient pb-20">
      <header className="sticky top-0 z-10 border-b border-primary/10 bg-background/80 backdrop-blur-md glass-nav">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4 sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard" })} className="mr-3 shrink-0 rounded-full hover:bg-primary/10">
            <ArrowLeft className="h-5 w-5 text-foreground/80" />
          </Button>
          <div className="flex items-center gap-2">
             <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full shadow-sm ring-1 ring-primary/20">
                <img src={logoMark} alt="" width={32} height={32} className="h-full w-full object-cover" />
              </span>
            <h1 className="font-display text-lg font-bold text-foreground">Care Companion</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {!summary ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
             <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
                <div className="relative h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-soft">
                   <Stethoscope className="h-8 w-8 animate-pulse" />
                </div>
             </div>
             <h3 className="font-display text-xl font-semibold mb-2">Preparing your nutrition dashboard...</h3>
             <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Analyzing your recent meal patterns and habits for your care provider.
             </p>
             <div className="mt-8 space-y-4 w-full max-w-md">
                <div className="h-24 bg-card rounded-2xl animate-pulse border border-border/50" />
                <div className="h-32 bg-card rounded-2xl animate-pulse border border-border/50" />
             </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* A. Premium Hero Card */}
            <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card p-6 sm:p-8 shadow-warm">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/10 via-sage/15 to-transparent blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-gradient-to-tr from-spice/10 via-transparent to-transparent blur-3xl" />
              
              <div className="relative flex flex-col md:flex-row gap-6 md:items-start justify-between">
                 <div className="space-y-4 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                       <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
                          <Stethoscope className="w-3 h-3 mr-1.5 inline-block -mt-0.5" />
                          Nutrition Discussion Guide
                       </Badge>
                       {demo && (
                         <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
                           Sample Demo Data Only
                         </Badge>
                       )}
                    </div>
                    <div>
                       <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
                         Nutrition Summary
                       </h2>
                       <p className="text-muted-foreground mt-2 text-base sm:text-lg leading-relaxed text-balance">
                         Prepare a safe nutrition follow-up summary for your doctor or dietitian based on available meal logs.
                       </p>
                    </div>
                 </div>

                 <div className="shrink-0 flex flex-col gap-2 bg-background/50 rounded-2xl p-4 border border-border/50 backdrop-blur-sm self-start">
                    <div className="flex items-center gap-2">
                       <Badge variant={summary.confidence === "high" ? "default" : summary.confidence === "medium" ? "secondary" : "outline"} className={summary.confidence === "high" ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm" : ""}>
                          Confidence: {summary.confidence.toUpperCase()}
                       </Badge>
                       <span className="text-xs text-muted-foreground font-medium">Data Quality</span>
                    </div>
                    {summary.confidence === "low" && (
                      <p className="text-[10px] text-amber-700 leading-tight max-w-[150px]">
                        Limited meal logs available — use this as discussion starters.
                      </p>
                    )}
                 </div>
              </div>
            </section>

            {/* B. Data Insight Strip */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
               <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-start">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                     <CalendarDays className="h-4 w-4" />
                     <span className="text-xs font-semibold uppercase tracking-wider">Period</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{summary.periodLabel}</span>
               </div>
               <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-start">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                     <Database className="h-4 w-4" />
                     <span className="text-xs font-semibold uppercase tracking-wider">Sources</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {summary.dataSourcesUsed.map(src => (
                      <Badge key={src} variant="secondary" className="text-[9px] py-0 h-4 bg-muted text-muted-foreground hover:bg-muted/80">
                        {src.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
               </div>
               <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-start">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                     <Activity className="h-4 w-4" />
                     <span className="text-xs font-semibold uppercase tracking-wider">Logs</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{mealsQ.data?.length || 0} meals</span>
               </div>
               <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-start">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                     <CheckCircle2 className="h-4 w-4" />
                     <span className="text-xs font-semibold uppercase tracking-wider">Habit Feedback</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{habitState?.days?.length || 0} days recorded</span>
               </div>
            </section>

            {/* C & D. Main Content Grid and Better Section Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-6">
                  
                  <div className="bg-card border border-border/80 rounded-[1.5rem] p-5 sm:p-6 shadow-soft hover:shadow-md transition-shadow relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/80" />
                     <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary/10 p-2 rounded-xl text-primary">
                           <FileText className="h-5 w-5" />
                        </div>
                        <div>
                           <h3 className="font-display font-semibold text-lg text-foreground">Meal Pattern</h3>
                           <p className="text-xs text-muted-foreground">Generated from available meal logs</p>
                        </div>
                     </div>
                     <ul className="space-y-3">
                        {summary.mealPatternNotes.map((note, i) => (
                          <li key={i} className="flex gap-3 text-sm text-foreground/90 bg-muted/30 p-3 rounded-xl">
                            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                            <span className="leading-relaxed font-medium">{note}</span>
                          </li>
                        ))}
                     </ul>
                  </div>

                  <div className="bg-card border border-border/80 rounded-[1.5rem] p-5 sm:p-6 shadow-soft hover:shadow-md transition-shadow relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/80" />
                     <div className="flex items-center gap-3 mb-4">
                        <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600">
                           <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                           <h3 className="font-display font-semibold text-lg text-foreground">Discussion Points</h3>
                           <p className="text-xs text-muted-foreground">Nutrition topics worth discussing</p>
                        </div>
                     </div>
                     <ul className="space-y-3">
                        {summary.nutritionDiscussionPoints.map((point, i) => (
                          <li key={i} className="flex gap-3 text-sm text-foreground/90 bg-muted/30 p-3 rounded-xl">
                            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                            <span className="leading-relaxed font-medium">{point}</span>
                          </li>
                        ))}
                     </ul>
                  </div>

                  <div className="bg-card border border-border/80 rounded-[1.5rem] p-5 sm:p-6 shadow-soft hover:shadow-md transition-shadow relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500/80" />
                     <div className="flex items-center gap-3 mb-4">
                        <div className="bg-sky-500/10 p-2 rounded-xl text-sky-600">
                           <Info className="h-5 w-5" />
                        </div>
                        <div>
                           <h3 className="font-display font-semibold text-lg text-foreground">Questions to Ask</h3>
                           <p className="text-xs text-muted-foreground">Tap a question to see a safe explanation.</p>
                        </div>
                     </div>
                     <ul className="space-y-3">
                        {allQuestions.map((q, i) => (
                          <li key={q.id || i}>
                            <button
                              onClick={() => {
                                setSelectedQuestion(q);
                                setIsPanelOpen(true);
                              }}
                              className="w-full flex items-center justify-between text-left text-sm text-foreground/90 bg-muted/30 hover:bg-primary/5 active:bg-primary/10 border border-transparent hover:border-primary/20 p-3 rounded-xl transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary"
                              aria-label={`Explain question: ${q.question}`}
                            >
                              <span className="flex gap-3 items-center pr-2">
                                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-sky-500/10 text-sky-700 flex items-center justify-center text-xs font-bold group-hover:bg-sky-500/20">Q</span>
                                <span className="font-medium leading-relaxed">{q.question}</span>
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 select-none">
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity font-semibold">Explain</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                              </span>
                            </button>
                          </li>
                        ))}
                     </ul>
                  </div>

                  {/* Ask about your summary card */}
                  <div className="bg-card border border-border/80 rounded-[1.5rem] p-5 sm:p-6 shadow-soft hover:shadow-md transition-shadow relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/80" />
                     <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary/10 p-2 rounded-xl text-primary">
                           <Stethoscope className="h-5 w-5" />
                        </div>
                        <div>
                           <h3 className="font-display font-semibold text-lg text-foreground">Ask about your summary</h3>
                           <p className="text-xs text-muted-foreground">Get instant safe nutrition explanations based on your profile.</p>
                        </div>
                     </div>
                     
                     <form onSubmit={handleCustomQuerySubmit} className="space-y-3">
                       <div className="relative">
                         <input
                           type="text"
                           value={customQuery}
                           onChange={(e) => setCustomQuery(e.target.value)}
                           placeholder="Example: How can I reduce fried food without losing taste?"
                           className="w-full h-11 px-4 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60"
                           aria-label="Ask custom nutrition question"
                         />
                       </div>
                       <div className="flex justify-between items-center gap-2">
                         <p className="text-[10px] text-muted-foreground">
                           *Self-care guidelines only. No diagnostic or medical prescription.
                         </p>
                         <Button
                           type="submit"
                           size="sm"
                           className="rounded-lg h-9 font-semibold shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                         >
                           Ask Nanumoni
                         </Button>
                       </div>
                     </form>
                  </div>

               </div>

               <div className="lg:col-span-1 space-y-6">
                  
                  {/* Sidebar Items */}
                  <div className="bg-card border border-border/80 rounded-[1.5rem] p-5 shadow-soft relative overflow-hidden">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="bg-spice/10 p-2 rounded-xl text-spice">
                           <ListTodo className="h-5 w-5" />
                        </div>
                        <h3 className="font-display font-semibold text-lg text-foreground">Next Steps</h3>
                     </div>
                     <ul className="space-y-3">
                        {summary.suggestedNextSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                            <ChevronRight className="h-4 w-4 text-spice shrink-0 mt-0.5" />
                            <span className="leading-snug">{step}</span>
                          </li>
                        ))}
                     </ul>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-[1.5rem] p-5 shadow-soft">
                     <div className="flex items-center gap-2 mb-3 text-red-800">
                        <AlertCircle className="h-5 w-5" />
                        <h3 className="font-display font-bold text-sm uppercase tracking-wider">Red Flag Reminder</h3>
                     </div>
                     <p className="text-xs text-red-700 leading-relaxed font-medium">
                        {summary.redFlagReminder}
                     </p>
                  </div>

                  {/* E. Better CTA Area */}
                  <div className="bg-card border border-border/80 rounded-[1.5rem] p-5 shadow-soft space-y-3">
                     <h3 className="font-display font-semibold text-base mb-4">Share Actions</h3>
                     <Button 
                       onClick={handleCopy} 
                       className="w-full justify-start h-12 shadow-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                     >
                       <Clipboard className="mr-3 h-4 w-4" /> Copy Summary
                     </Button>
                     <Button 
                       onClick={handleWhatsApp} 
                       className="w-full justify-start h-12 shadow-sm font-semibold rounded-xl bg-[#25D366] text-white hover:bg-[#128C7E]"
                     >
                       <Share2 className="mr-3 h-4 w-4" /> Share on WhatsApp
                     </Button>
                     <Button 
                       asChild 
                       variant="outline"
                       className="w-full justify-start h-12 shadow-sm font-semibold rounded-xl border-border/80 hover:bg-muted"
                     >
                       <Link to="/report">
                         <Printer className="mr-3 h-4 w-4" /> Open PDF Summary
                       </Link>
                     </Button>
                     <div className="pt-2">
                       <Button 
                         variant="ghost" 
                         onClick={() => navigate({ to: "/dashboard" })}
                         className="w-full justify-center h-12 font-medium text-muted-foreground hover:text-foreground"
                       >
                         Back to Dashboard
                       </Button>
                     </div>
                  </div>

               </div>
            </div>

            <footer className="pt-8 pb-4 text-center">
              <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-muted/50 rounded-full border border-border/50 text-[10px] text-muted-foreground font-medium max-w-lg mx-auto">
                <Info className="h-3 w-3 shrink-0 text-primary/60" />
                <span className="leading-snug">
                   {summary.disclaimer} Not medical advice.
                </span>
              </div>
            </footer>

          </div>
        )}
      </main>

      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6 space-y-6 bg-card border-l border-border/80">
          {selectedQuestion && (
            <>
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-sky-500/10 text-sky-700 border-sky-200">
                    Category: {selectedQuestion.category.replace("_", " ")}
                  </Badge>
                  <Badge variant={selectedQuestion.confidence === "high" ? "default" : selectedQuestion.confidence === "medium" ? "secondary" : "outline"} className="text-[10px] uppercase font-bold tracking-wider">
                    Confidence: {selectedQuestion.confidence}
                  </Badge>
                </div>
                <SheetTitle className="font-display text-xl font-bold leading-snug">
                  {selectedQuestion.question}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-5">
                {/* Safe Answer Section */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Nanumoni Safe Answer
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                    {selectedQuestion.safeAnswer}
                  </p>
                </div>

                {/* Why Suggested Section */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why this was suggested</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {selectedQuestion.whyThisMatters}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedQuestion.basedOn.map((b, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[9px] font-medium bg-muted text-muted-foreground">
                        {b}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Bangladeshi Food Examples */}
                {selectedQuestion.bangladeshiFoodExamples.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bangladeshi Food Swaps/Examples</h4>
                    <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-1">
                      {selectedQuestion.bangladeshiFoodExamples.map((ex, idx) => (
                        <li key={idx} className="leading-snug">{ex}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What to Track Next */}
                {selectedQuestion.whatToTrackNext.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What to Track Next</h4>
                    <ul className="space-y-1.5">
                      {selectedQuestion.whatToTrackNext.map((track, idx) => (
                        <li key={idx} className="flex gap-2 items-start text-sm text-foreground/80 bg-muted/20 p-2 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{track}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Doctor Prompt Section */}
                <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Doctor/Dietitian discussion prompt</h4>
                  <div className="bg-background border border-border/80 rounded-xl p-3 text-xs italic font-medium leading-relaxed relative">
                    "{selectedQuestion.doctorDiscussionPrompt}"
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedQuestion.doctorDiscussionPrompt);
                      toast.success("Prompt copied to clipboard!");
                    }}
                    className="w-full text-xs font-semibold h-8 rounded-lg"
                  >
                    Copy this prompt
                  </Button>
                </div>
              </div>

              {/* Share/Action Strip */}
              <div className="pt-4 border-t border-border space-y-2">
                <Button 
                  onClick={() => handleCopyAnswer(selectedQuestion)} 
                  className="w-full h-10 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Clipboard className="mr-2 h-4 w-4" /> Copy this answer
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCopy} 
                    className="h-10 text-xs font-semibold rounded-xl"
                  >
                    Copy Full Summary
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleWhatsApp} 
                    className="h-10 text-xs font-semibold rounded-xl bg-[#25D366] text-white hover:bg-[#128C7E] border-transparent"
                  >
                    Share WhatsApp
                  </Button>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" className="w-full h-10 text-xs font-semibold text-muted-foreground">
                    Close Explanation
                  </Button>
                </SheetClose>
              </div>

              {/* Disclaimer */}
              <div className="flex gap-1.5 p-2.5 bg-red-50/50 border border-red-100 rounded-xl text-[10px] text-red-800 leading-tight">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />
                <span>
                  <strong>Clinical Safety Note:</strong> General guidance only. Always consult a healthcare professional before altering medical routines.
                </span>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
