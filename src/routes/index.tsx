import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sprout, Heart, Sparkles, ShieldCheck, MessageCircle, Leaf, Camera } from "lucide-react";
import logoMark from "@/assets/logo-mark.png";
import heroImage from "@/assets/hero-kitchen.jpg";
import nanumoniAvatar from "@/assets/nanumoni-avatar.jpg";
import { PlateAnalyzer } from "@/components/PlateAnalyzer";
import { VideoBackground } from "@/components/VideoBackground";
import { NavbarProfile } from "@/components/NavbarProfile";
import { supabase } from "@/integrations/supabase/client";
import { isDemoSession } from "@/lib/demo-session";
import { useEffect, useState } from "react";


import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    if (isDemoSession()) {
      throw redirect({ to: "/dashboard" });
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Deshi Digest — Nanumoni's AI nutrition guide for Bangladesh" },
      {
        name: "description",
        content:
          "Chat with Nanumoni, your warm AI nutrition companion built on real Bangladeshi food (rice, dal, mach, shak) and FCTB data. Practical, affordable, culturally intelligent.",
      },
      { property: "og:image", content: heroImage },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (isDemoSession()) {
      setIsLoggedIn(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="relative min-h-screen">
      <VideoBackground />
      <header className="sticky top-0 z-30 glass-nav">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full shadow-warm ring-1 ring-primary/30">
              <img src={logoMark} alt="Deshi Digest logo" width={40} height={40} className="h-full w-full object-cover" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">Deshi Digest</span>
          </Link>
          <nav className="flex items-center gap-2">
            {isLoggedIn === false && (
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost">Sign in</Button>
              </Link>
            )}
            {isLoggedIn === true && (
              <>
                <Link to="/dashboard">
                  <Button className="shadow-warm">Open dashboard</Button>
                </Link>
                <NavbarProfile />
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-8 md:grid-cols-2 md:items-center md:gap-16 md:pt-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-medium text-foreground/80">
            <Leaf className="h-3.5 w-3.5 text-sage" /> Built for Bangladesh · FCTB-grounded
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
            Nutrition advice that <span className="text-primary">tastes like home.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Meet <span className="font-medium text-foreground">Nanumoni</span> — a warm, AI nutrition
            companion who actually knows your <em>bhat-dal-mach-shak</em> life. Practical,
            affordable, culturally celebratory, and easy to follow.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <PlateAnalyzer
              trigger={
                <Button size="lg" className="shadow-warm">
                  <Camera className="h-4 w-4" /> 📸 Analyze my plate
                </Button>
              }
            />
            <Link to="/chat">
              <Button size="lg" variant="outline">
                <MessageCircle className="h-4 w-4" /> Talk to Nanumoni
              </Button>
            </Link>
          </div>

          <div className="mt-7 grid max-w-md grid-cols-3 gap-3 text-center">
            {[
              { num: "300+", label: "Local foods" },
              { num: "FCTB", label: "Grounded" },
              { num: "৳", label: "Budget-aware" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl px-3 py-3">
                <p className="font-display text-xl font-semibold text-primary">{s.num}</p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3 text-sm text-foreground/85 glass-soft rounded-2xl p-3">
            <img
              src={nanumoniAvatar}
              alt="Nanumoni"
              width={40}
              height={40}
              loading="lazy"
              className="h-10 w-10 rounded-full ring-2 ring-primary/20"
            />
            <p className="max-w-sm italic">
              "Ei macher jhol ta khub healthy, Nanumoni bolchi…" — practical answers in a voice that
              feels like family.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-spice/20 via-transparent to-sage/30 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl glass-strong p-2">
            <img
              src={heroImage}
              alt="Bangladeshi village kitchen with rice, fish curry, leafy greens and mangoes at golden hour"
              width={1536}
              height={1024}
              className="relative aspect-[3/2] w-full rounded-2xl object-cover"
            />
          </div>

          {/* AI-detected floating pill (top-right) */}
          <div className="absolute -top-4 right-4 hidden items-center gap-2 rounded-full glass-strong px-3 py-2 sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-spice text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="text-left">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">AI-detected</p>
              <p className="text-xs font-semibold leading-tight">Bhat · Ilish · Pui shak</p>
            </div>
          </div>

          {/* Macro stat card (top-left) */}
          <div className="absolute -top-4 left-4 hidden rounded-2xl glass-strong px-3 py-2 md:block">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10">
                <svg viewBox="0 0 40 40" className="-rotate-90">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border)" strokeWidth="4" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 * 0.32} />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold">68%</span>
              </div>
              <div>
                <p className="font-display text-base font-semibold leading-none">540 <span className="text-xs font-normal text-muted-foreground">kcal</span></p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">This meal</p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 left-6 hidden rounded-2xl glass-strong p-4 md:block">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Today's tip
            </p>
            <p className="mt-1 max-w-[14rem] font-display text-base leading-snug">
              Add a wedge of <span className="text-primary">peyara</span> to your dal-bhat — vit C
              triples iron absorption.
            </p>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Why Nanumoni is different
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A loving, locally-grounded AI built specifically for Bangladeshi food, health
          challenges, and budgets.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map((f, i) => {
            const grads = [
              "from-primary to-spice",
              "from-sage to-primary/70",
              "from-spice to-sage",
            ];
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-3xl glass p-6 transition hover:-translate-y-1 hover:shadow-warm"
              >
                <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${grads[i]} opacity-10 blur-2xl transition-opacity group-hover:opacity-25`} />
                <span className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${grads[i]} text-primary-foreground shadow-warm`}>
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="relative mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl glass-strong p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold md:text-3xl">
                Ethical & responsible AI — by design
              </h2>
              <p className="mt-3 text-muted-foreground">
                Every recommendation shows its reasoning and the food-science source. Nanumoni never
                diagnoses, never sells your data, and always points you to a real doctor or
                nutritionist for medical concerns. Inclusive across regions, religions, and
                budgets.
              </p>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                "Transparent reasoning on every answer",
                "Grounded in FCTB & icddr,b nutrition data",
                "Privacy-first — your chats stay yours",
                "Inclusive of all regions & income levels",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-2 rounded-xl glass-soft px-3 py-2 text-foreground"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const features = [
  {
    icon: Heart,
    title: "Nanumoni's warm voice",
    body: "Bangla-English mix, never judgmental, always practical. Like calling your favourite Nanumoni about dinner.",
  },
  {
    icon: Sparkles,
    title: "RAG + explainability",
    body: "Answers grounded in a Bangladeshi food knowledge base — with the reasoning shown, not hidden.",
  },
  {
    icon: Sprout,
    title: "Real local food",
    body: "Ilish, mola, pui shak, dal, korola, peyara — seasonal, affordable, and culturally familiar.",
  },
];
