import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  ExternalLink, 
  ArrowLeft, 
  LayoutDashboard, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Sparkles, 
  Target,
  Zap,
  Globe,
  Heart,
  Microscope,
  Code2,
  Milestone
} from "lucide-react";
import logoMark from "@/assets/logo-mark.png";
import { VideoBackground } from "@/components/VideoBackground";
import { useEffect, useState } from "react";
import { isDemoSession } from "@/lib/demo-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — Deshi Digest / Nanumoni" },
      {
        name: "description",
        content: "Technical documentation, architecture, and project overview for Deshi Digest / Nanumoni.",
      },
    ],
  }),
  component: DocsPage,
});

function DocsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (isDemoSession()) {
      setIsLoggedIn(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
  }, []);

  return (
    <div className="relative min-h-screen pb-20">
      <VideoBackground />
      
      <header className="sticky top-0 z-30 glass-nav">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full shadow-warm ring-1 ring-primary/30">
              <img src={logoMark} alt="Deshi Digest logo" width={40} height={40} className="h-full w-full object-cover" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">Deshi Digest Docs</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Home
              </Button>
            </Link>
            <Link to={isLoggedIn ? "/dashboard" : "/login"}>
              <Button size="sm" className="gap-2 shadow-warm">
                {isLoggedIn ? <LayoutDashboard className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                {isLoggedIn ? "Dashboard" : "Get Started"}
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pt-12">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-warm">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Deshi Digest / Nanumoni
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A warm, culturally intelligent nutrition companion for Bangladesh.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a 
              href="https://project-rae6k.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full glass-soft px-4 py-1.5 text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <Globe className="h-4 w-4 text-primary" /> project-rae6k.vercel.app <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>

        <div className="space-y-16">
          {/* Overview Section */}
          <section id="overview" className="space-y-6">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Overview</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass rounded-3xl p-6">
                <h3 className="font-display text-lg font-semibold mb-2">Problem Statement</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Generic nutrition advice often fails in Bangladesh because it ignores local food staples like rice, dal, and local fish, or suggests unaffordable "superfoods." This creates a gap between professional health advice and daily reality.
                </p>
              </div>
              <div className="glass rounded-3xl p-6 border-primary/20 bg-primary/5">
                <h3 className="font-display text-lg font-semibold mb-2">The Solution</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Nanumoni — an AI nutrition guide that "speaks Deshi." Built on local food compositions (FCTB), she provides practical, budget-aware guidance in a warm, family-like tone that celebrates Bangladeshi food culture.
                </p>
              </div>
            </div>
          </section>

          {/* Tech Stack & Models */}
          <section id="tech-stack" className="space-y-6">
            <div className="flex items-center gap-3">
              <Code2 className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Technology & AI</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="glass rounded-3xl p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-spice" /> AI Models
                </h3>
                <ul className="space-y-3">
                  {[
                    { name: "Gemini 2.5 Flash-Lite", desc: "Core chat and meal guidance engine" },
                    { name: "Gemini 2.5 Flash", desc: "Computer vision for plate analysis" },
                    { name: "gemini-embedding-001", desc: "Semantic search and RAG embeddings" }
                  ].map(model => (
                    <li key={model.name} className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass rounded-3xl p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-sage" /> Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "React", "TanStack Start", "TypeScript", "Supabase", 
                    "Vercel", "Gemini API", "AI SDK", "pgvector/RAG"
                  ].map(tech => (
                    <span key={tech} className="px-3 py-1 bg-muted/50 rounded-full text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Data Sources */}
          <section id="data-sources" className="space-y-6">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Data & Knowledge</h2>
            </div>
            <div className="glass rounded-3xl p-6 overflow-hidden">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-semibold">Knowledge Bases</h3>
                  <ul className="space-y-3">
                    {[
                      "Curated Bangladeshi food knowledge base",
                      "FCTB-based food context (icddr,b)",
                      "Supabase user profile & meal history"
                    ].map(source => (
                      <li key={source} className="flex items-center gap-3 text-sm">
                        <Sparkles className="h-4 w-4 text-primary shrink-0" /> {source}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-semibold">External APIs</h3>
                  <ul className="space-y-3">
                    {[
                      "USDA/FoodData Central via Data.gov",
                      "RxNorm (Medication reference)",
                      "WHO ICD (Medical classification)"
                    ].map(api => (
                      <li key={api} className="flex items-center gap-3 text-sm">
                        <Microscope className="h-4 w-4 text-spice shrink-0" /> {api}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Architecture Summary */}
          <section id="architecture" className="space-y-6">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Architecture</h2>
            </div>
            <div className="relative glass rounded-3xl p-8 overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Code2 className="h-24 w-24" />
              </div>
              <div className="grid gap-6 md:grid-cols-4 text-center">
                {[
                  { title: "Frontend", body: "React UI via TanStack Start" },
                  { title: "Compute", body: "Vercel / Edge Functions" },
                  { title: "AI", body: "Gemini / AI SDK Core" },
                  { title: "Persistence", body: "Supabase & pgvector" }
                ].map((item, i) => (
                  <div key={item.title} className="space-y-2">
                    <div className="font-display font-semibold text-primary">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.body}</div>
                    {i < 3 && <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 opacity-20">→</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="space-y-6">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Key Features</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[
                "Personalized Dashboard",
                "Chat with Nanumoni",
                "Analyze My Plate (Vision)",
                "Meal History Tracking",
                "Personalized Guidance",
                "Budget-aware Tips"
              ].map(feature => (
                <div key={feature} className="glass-soft rounded-2xl p-4 text-sm font-medium flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  {feature}
                </div>
              ))}
            </div>
          </section>

          {/* Responsible AI */}
          <section id="responsible-ai" className="space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Responsible AI</h2>
            </div>
            <div className="glass rounded-3xl p-6 border-sage/30 bg-sage/5">
              <div className="flex flex-col md:flex-row gap-6 md:items-center">
                <div className="space-y-4 flex-1">
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    "Nanumoni is a guide, not a doctor. We prioritize safety and cultural sensitivity above all."
                  </p>
                  <ul className="grid gap-2 text-xs">
                    <li>• No medical diagnosis or prescribing</li>
                    <li>• Clear 'Not Medical Advice' disclaimers</li>
                    <li>• Explainable reasoning for all suggestions</li>
                    <li>• Culturally sensitive dietary adjustments</li>
                  </ul>
                </div>
                <div className="shrink-0">
                  <div className="rounded-2xl glass-strong p-4 text-center">
                    <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Safety First</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Roadmap */}
          <section id="roadmap" className="space-y-6 pb-12">
            <div className="flex items-center gap-3">
              <Milestone className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Roadmap</h2>
            </div>
            <div className="space-y-4">
              {[
                { phase: "Phase 1", title: "Stronger local food database", status: "Ongoing" },
                { phase: "Phase 2", title: "Guest mode & demo access", status: "Planned" },
                { phase: "Phase 3", title: "Vendor & local market ecosystem", status: "Future" },
                { phase: "Phase 4", title: "Future custom Nanumoni specialized model", status: "Long-term" }
              ].map(step => (
                <div key={step.title} className="glass-soft rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-spice">{step.phase}</span>
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-muted rounded-md opacity-70">
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-20 glass-nav border-t-0">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-foreground/75 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src={logoMark} alt="Logo" className="h-6 w-6 rounded-full" />
            <p>© {new Date().getFullYear()} Deshi Digest</p>
          </div>
          <p className="italic">Built for the Google Gemini API BuildFest 2026</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <Link to="/docs" className="font-bold text-primary underline underline-offset-4">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
