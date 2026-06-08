import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profile.functions";
import { listRecentMeals, type MealLog } from "@/lib/meals.functions";
import { isDemoSession, demoProfile, getDemoMeals } from "@/lib/demo-session";
import { Button } from "@/components/ui/button";
import { Printer, X, ShieldAlert, Award } from "lucide-react";
import logoMark from "@/assets/logo-mark.png";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Nutrition Summary — Deshi Digest" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReportPage,
});

function startOf7DaysAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ReportPage() {
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
      if (demo) {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("deshi-digest-demo-profile");
          return stored ? JSON.parse(stored) : demoProfile;
        }
        return demoProfile;
      }
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

  const profile = profileQ.data;
  const allMeals = mealsQ.data ?? [];

  // Filter last 7 days of meals
  const last7DaysMeals = useMemo(() => {
    const limit = startOf7DaysAgo();
    return Array.isArray(allMeals)
      ? allMeals.filter((m) => m && m.logged_at && new Date(m.logged_at) >= limit)
      : [];
  }, [allMeals]);

  // Calculations
  const stats = useMemo(() => {
    if (!last7DaysMeals.length) return null;

    const totalCal = last7DaysMeals.reduce((acc, m) => acc + (m.calories ?? 0), 0);
    const totalPro = last7DaysMeals.reduce((acc, m) => acc + (m.protein_g ?? 0), 0);
    const totalCarb = last7DaysMeals.reduce((acc, m) => acc + (m.carbs_g ?? 0), 0);
    const totalFiber = last7DaysMeals.reduce((acc, m) => acc + (m.fiber_g ?? 0), 0);

    const distinctDays = new Set(
      last7DaysMeals.map((m) => m.logged_at?.split("T")[0]).filter(Boolean)
    ).size || 1;

    const avgCal = totalCal / distinctDays;
    const avgPro = totalPro / distinctDays;
    const avgCarb = totalCarb / distinctDays;
    const avgFiber = totalFiber / distinctDays;

    const highRiskCount = last7DaysMeals.filter(
      (m) => typeof m.health_score === "number" && m.health_score < 6
    ).length;

    // Extract healthier swaps
    const swaps: string[] = [];
    for (const m of last7DaysMeals) {
      if (m.analysis && typeof m.analysis === "object") {
        const a = m.analysis as any;
        if (Array.isArray(a.substitutions)) {
          for (const s of a.substitutions) {
            const txt = typeof s === "string" ? s : s.why ? `${s.from} ➔ ${s.to}: ${s.why}` : s.from && s.to ? `${s.from} ➔ ${s.to}` : "";
            if (txt && !swaps.includes(txt)) {
              swaps.push(txt);
            }
          }
        }
        if (Array.isArray(a.makeItHealthierTips)) {
          for (const t of a.makeItHealthierTips) {
            if (t && typeof t === "string" && !swaps.includes(t)) {
              swaps.push(t);
            }
          }
        }
        if (Array.isArray(a.personalizedSuggestions)) {
          for (const t of a.personalizedSuggestions) {
            if (t && typeof t === "string" && !swaps.includes(t)) {
              swaps.push(t);
            }
          }
        }
      }
    }

    return {
      totalCal,
      avgCal,
      totalPro,
      avgPro,
      totalCarb,
      avgCarb,
      totalFiber,
      avgFiber,
      highRiskCount,
      daysLogged: distinctDays,
      topSwaps: swaps.slice(0, 3),
    };
  }, [last7DaysMeals]);

  // Auto print on load once data is resolved and ?print=1 is present
  useEffect(() => {
    if (mounted && !profileQ.isLoading && !mealsQ.isLoading && last7DaysMeals.length > 0) {
      const isPrintMode = new URLSearchParams(window.location.search).get("print") === "1";
      if (isPrintMode) {
        const timer = setTimeout(() => {
          window.print();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [mounted, profileQ.isLoading, mealsQ.isLoading, last7DaysMeals]);

  if (!mounted || profileQ.isLoading || mealsQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-sm text-muted-foreground">
        Generating summary report...
      </div>
    );
  }

  if (last7DaysMeals.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-display text-lg font-bold">No meal history found</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Log or analyze meals first to export a summary.
        </p>
        <Button onClick={() => window.close()} className="mt-6">
          Close Window
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-6 md:p-10 font-sans print:p-0">
      {/* Print bar - hidden when printing */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 print:hidden">
        <div>
          <h1 className="font-display text-sm font-semibold">Deshi Digest Nutrition Summary</h1>
          <p className="text-xs text-gray-500">This page is optimized for printing and PDF saving.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} className="shadow-warm bg-primary hover:bg-primary/90 text-white">
            <Printer className="h-4 w-4 mr-1.5" /> Print / Save as PDF
          </Button>
          <Button variant="outline" onClick={() => window.close()}>
            <X className="h-4 w-4 mr-1.5" /> Close
          </Button>
        </div>
      </div>

      {/* Main Report Wrapper */}
      <div className="mx-auto max-w-4xl border border-gray-200 p-8 shadow-sm rounded-2xl print:border-0 print:shadow-none print:p-0">
        
        {/* Banner for Demo mode */}
        {demo && (
          <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-center text-xs text-orange-800 font-semibold uppercase tracking-wider">
            ⚠️ Sample demo data only — for evaluation purposes
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <img src={logoMark} alt="" width={32} height={32} className="h-8 w-8 object-cover" />
              <span className="font-display text-xl font-bold tracking-tight">Deshi Digest</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Grounded in local food composition data</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-800">Doctor-Shareable Nutrition Summary</h2>
            <p className="text-xs text-gray-500 mt-0.5">Date Range: Last 7 Days</p>
          </div>
        </div>

        {/* Profile details */}
        <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-xs md:grid-cols-4">
          <div>
            <p className="font-bold text-gray-500 uppercase">Patient Name</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{profile?.full_name || "Demo User"}</p>
          </div>
          <div>
            <p className="font-bold text-gray-500 uppercase">Profile Basics</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {profile?.age ? `${profile.age} yrs` : ""} · {profile?.sex ? capitalize(profile.sex) : ""}
            </p>
          </div>
          <div>
            <p className="font-bold text-gray-500 uppercase">Conditions</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {profile?.health_conditions && profile.health_conditions.length > 0
                ? profile.health_conditions.map((c: string) => capitalize(c.replace(/_/g, " "))).join(", ")
                : "None reported"}
            </p>
          </div>
          <div>
            <p className="font-bold text-gray-500 uppercase">Active Goals</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {profile?.goals && profile.goals.length > 0
                ? profile.goals.map((g: string) => capitalize(g.replace(/_/g, " "))).join(", ")
                : "General wellness"}
            </p>
          </div>
        </div>

        {/* Summary metrics */}
        {stats && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-1">Nutrition totals & averages</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard 
                label="Calories" 
                value={`${Math.round(stats.avgCal)} kcal/day`} 
                subValue={`Total: ${Math.round(stats.totalCal)} kcal`} 
                target="Target: ~2000 kcal/day" 
              />
              <StatCard 
                label="Protein" 
                value={`${Math.round(stats.avgPro)} g/day`} 
                subValue={`Total: ${Math.round(stats.totalPro)} g`} 
                target="Target: 60-80g/day" 
              />
              <StatCard 
                label="Carbs" 
                value={`${Math.round(stats.avgCarb)} g/day`} 
                subValue={`Total: ${Math.round(stats.totalCarb)} g`} 
                target="Target: 220-300g/day" 
              />
              <StatCard 
                label="Fiber" 
                value={`${Math.round(stats.avgFiber)} g/day`} 
                subValue={`Total: ${Math.round(stats.totalFiber)} g`} 
                target="Target: 25g/day" 
              />
            </div>
            {stats.highRiskCount > 0 && (
              <div className="mt-3 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-xs text-red-800 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
                <span>Found <strong>{stats.highRiskCount}</strong> logged meals with low health scores (&lt; 6.0/10) due to elevated sodium or glycemic index values.</span>
              </div>
            )}
          </div>
        )}

        {/* Meal Logs Table */}
        <div className="mt-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-1">Logged Meal Records</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 font-bold text-gray-600">
                  <th className="py-2.5 px-3">Date/Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Meal Name</th>
                  <th className="py-2.5 px-3 text-right">Calories</th>
                  <th className="py-2.5 px-3 text-right">Carbs (g)</th>
                  <th className="py-2.5 px-3 text-right">Protein (g)</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {last7DaysMeals.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-2 px-3 text-gray-500 whitespace-nowrap">
                      {m.logged_at ? formatDate(m.logged_at) + " " + formatTime(m.logged_at) : ""}
                    </td>
                    <td className="py-2 px-3 text-gray-500 font-semibold uppercase">{m.meal_type}</td>
                    <td className="py-2 px-3 font-medium text-gray-800">{m.name}</td>
                    <td className="py-2 px-3 text-right font-medium">{Math.round(m.calories ?? 0)} kcal</td>
                    <td className="py-2 px-3 text-right">{Math.round(m.carbs_g ?? 0)}g</td>
                    <td className="py-2 px-3 text-right">{Math.round(m.protein_g ?? 0)}g</td>
                    <td className="py-2 px-3 text-right font-semibold">
                      {m.health_score ? `${m.health_score.toFixed(1)}/10` : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Healthier swaps */}
        {stats && stats.topSwaps.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-1">
              Top Healthier Swap Opportunities
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              {stats.topSwaps.map((s, i) => (
                <li key={i} className="flex gap-2.5 items-start rounded-lg border border-gray-100 bg-gray-50/50 p-2.5">
                  <Award className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Doctor Note */}
        <div className="mt-6 border-t-2 border-gray-100 pt-6">
          <h3 className="text-xs font-bold text-gray-800 uppercase">Consulting Clinician Review Note</h3>
          <div className="mt-2 h-16 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/30 p-3 text-[11px] text-gray-400 italic">
            This space is left blank for doctor / registered nutritionist notes and signatures.
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-[10px] text-gray-500 leading-relaxed">
          <strong>Disclaimer:</strong> Desi Digest provides nutrition estimates and general guidance only. It is not a medical diagnosis or treatment plan. Actual nutrition may vary by portion size, oil, recipe, and preparation method. Consult a qualified doctor or registered nutritionist for medical advice.
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between border-t border-gray-100 pt-4 text-[10px] text-gray-400">
          <span>Generated by Desi Digest</span>
          <span>Printed on: {new Date().toLocaleString()}</span>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, target }: { label: string; value: string; subValue?: string; target: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-center">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="font-display text-base font-bold text-gray-800 mt-1">{value}</p>
      {subValue && <p className="text-[10px] text-gray-500 font-medium mt-0.5">{subValue}</p>}
      <p className="text-[9px] text-gray-400 mt-0.5">{target}</p>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
