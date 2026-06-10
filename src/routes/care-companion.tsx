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
  Database
} from "lucide-react";
import { toast } from "sonner";
import { buildWhatsAppShareUrl, copyShareSummary } from "@/lib/share-summary";

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
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard" })} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-bold">Care Companion</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <section className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-bdgreen/10 rounded-full text-bdgreen mb-2">
            <Stethoscope className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Prepare for your follow-up</h2>
          <p className="text-muted-foreground">
            Turn your recent meal pattern into safe discussion points for your doctor or dietitian.
          </p>
        </section>

        <Card className="border-bdgreen/20 bg-bdgreen/5 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant={summary?.confidence === "high" ? "default" : summary?.confidence === "medium" ? "secondary" : "outline"} className="bg-bdgreen text-white border-none">
                Confidence: {summary?.confidence?.toUpperCase() || "..."}
              </Badge>
              {demo && <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Demo Mode</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Clock className="h-4 w-4 text-bdgreen" />
              <span>Period: {summary?.periodLabel}</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Database className="h-4 w-4 mt-0.5 text-bdgreen" />
              <div>
                <span className="font-medium">Data sources:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {summary?.dataSourcesUsed.map(src => (
                    <Badge key={src} variant="outline" className="text-[10px] py-0 h-5">
                      {src.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            {summary?.confidence === "low" && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-xs">
                <Info className="h-4 w-4 shrink-0" />
                <p>Limited meal logs available. These points are general discussion starters based on available data.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {summary ? (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-bdgreen" /> Recent meal pattern
              </h3>
              <div className="grid gap-2">
                {summary.mealPatternNotes.map((note, i) => (
                  <div key={i} className="p-3 bg-white border rounded-xl text-sm shadow-sm flex gap-3">
                    <span className="text-bdgreen font-bold">{i + 1}.</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-bdgreen" /> Nutrition discussion points
              </h3>
              <div className="grid gap-2">
                {summary.nutritionDiscussionPoints.map((point, i) => (
                  <div key={i} className="p-3 bg-white border rounded-xl text-sm shadow-sm flex gap-3">
                    <span className="text-bdgreen font-bold">{i + 1}.</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-bdgreen" /> Questions for your doctor/dietitian
              </h3>
              <div className="grid gap-2">
                {summary.questionsToAsk.map((q, i) => (
                  <div key={i} className="p-3 bg-bdgreen/5 border border-bdgreen/10 rounded-xl text-sm shadow-sm flex gap-3 italic">
                    <span className="text-bdgreen font-bold">Q:</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-bdgreen" /> Suggested next steps
              </h3>
              <ul className="space-y-2">
                {summary.suggestedNextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-bdgreen shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2">
              <h3 className="font-display font-bold text-red-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                <AlertCircle className="h-4 w-4" /> Red Flag Reminder
              </h3>
              <p className="text-xs text-red-700 leading-relaxed">
                {summary.redFlagReminder}
              </p>
            </section>

            <div className="flex flex-col gap-3 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleCopy} variant="outline" className="h-12 shadow-sm border-slate-200">
                  <Clipboard className="mr-2 h-4 w-4" /> Copy Summary
                </Button>
                <Button onClick={handleWhatsApp} variant="outline" className="h-12 shadow-sm border-slate-200">
                  <Share2 className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
              </div>
              <Button asChild className="h-12 bg-bdgreen hover:bg-bdgreen/90 text-white shadow-warm">
                <Link to="/report">
                  <Printer className="mr-2 h-4 w-4" /> View PDF Summary
                </Link>
              </Button>
              <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-12 w-12 rounded-full border-4 border-bdgreen border-t-transparent animate-spin mb-4" />
            <p className="text-muted-foreground">Generating your care summary...</p>
          </div>
        )}

        <footer className="pt-10 pb-6 text-center">
          <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            {summary?.disclaimer}
          </p>
        </footer>
      </main>
    </div>
  );
}
