import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";
import { listRecentMeals, type MealLog } from "@/lib/meals.functions";
import { isDemoSession, demoProfile, getDemoMeals } from "@/lib/demo-session";
import { getHabitState } from "@/lib/smart-health-nudge";
import { generateCareCompanionSummary, type CareCompanionSummary } from "@/lib/care-companion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

function CareCompanionPage() {
  const navigate = useNavigate();
  const getProfile = useServerFn(getMyProfile);
  const listMeals = useServerFn(listRecentMeals);
  const demo = isDemoSession();
  const [mounted, setMounted] = useState(false);

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
                           <p className="text-xs text-muted-foreground">General nutrition guidance inquiries</p>
                        </div>
                     </div>
                     <ul className="space-y-3">
                        {summary.questionsToAsk.map((q, i) => (
                          <li key={i} className="flex gap-3 text-sm text-foreground/90 bg-muted/30 p-3 rounded-xl italic">
                            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-sky-500/20 text-sky-700 flex items-center justify-center text-xs font-bold">Q</span>
                            <span className="leading-relaxed font-medium">"{q}"</span>
                          </li>
                        ))}
                     </ul>
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
    </div>
  );
}
