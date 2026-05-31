import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Globe,
  HeartPulse,
  LockKeyhole,
  Mail,
  Milestone,
  Network,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMark from "@/assets/logo-mark.png";
import { VideoBackground } from "@/components/VideoBackground";
import { Footer } from "@/components/Footer";

const docsConfig = {
  isPublic: true,
  availableFrom: "2026-06-10T00:00:00+06:00",
  availableUntil: "2026-06-14T23:59:00+06:00",
  showScheduleNotice: true,
};

const team = [
  { name: "Safin", role: "Team Lead, Product Manager, Product Idea", email: "srrahman355@gmail.com" },
  { name: "Tasfiq Tasin", role: "Backend, Full-Stack AI, Gemini, Supabase & Deployment", email: "muhammadtasin18@gmail.com" },
  { name: "Mohammed Rayyanul", role: "Frontend and Application UI", email: "hawkeyes1345@gmail.com" },
  { name: "Sakib Mahmud", role: "LLM Model Training Support", email: "sakibmahmud1076@gmail.com" },
  { name: "Nafisa Karim", role: "Project Video, Research Analysis, Market Acceptance Research", email: "nafisanazlee3@gmail.com" },
];

const techStack = [
  "React",
  "TanStack Start",
  "TypeScript",
  "Vercel Server Functions",
  "Supabase Auth",
  "Supabase Postgres",
  "Supabase Storage",
  "pgvector",
  "Google Gemini API",
  "AI SDK",
  "Tailwind CSS",
];

const aiModels = [
  {
    name: "Gemini 2.5 Flash-Lite",
    use: "Conversational nutrition guidance, meal planning, and culturally-aware explanations.",
  },
  {
    name: "Gemini 2.5 Flash",
    use: "Plate image understanding for the Analyze My Plate workflow.",
  },
  {
    name: "gemini-embedding-001",
    use: "Food knowledge retrieval and semantic matching against local nutrition context.",
  },
];

const roadmap = [
  "Admin editable documentation dashboard",
  "Full-text documentation search",
  "PDF export for judges, mentors, and partners",
  "Expanded verified Bangladeshi food database",
  "Deeper physician and dietitian review workflows",
  "Localized market and vendor-aware recommendations",
];

const changelog = [
  {
    date: "2026-05-30",
    title: "Public docs module upgraded for submission",
    detail: "Added access scheduling config, team showcase, architecture, data flow, responsible AI, and roadmap sections.",
  },
  {
    date: "2026-05-26",
    title: "Backend integration completed",
    detail: "Supabase auth, database migrations, server functions, Gemini integration, and API health checks were added.",
  },
  {
    date: "2026-05-25",
    title: "Core app flows assembled",
    detail: "Landing page, dashboard, chat, onboarding, plate analyzer, and nutrition guidance screens were prepared.",
  },
];

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation - Deshi Digest" },
      {
        name: "description",
        content:
          "Public project documentation, pitch overview, architecture, AI model notes, team, and roadmap for Deshi Digest.",
      },
    ],
  }),
  component: DocsPage,
});

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDhakaDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}

function Section({
  id,
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  id: string;
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-5 scroll-mt-24">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-warm">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          ) : null}
          <h2 className="font-display text-2xl font-semibold tracking-normal sm:text-3xl">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function DocsPage() {
  const scheduleWindow = `${formatDhakaDate(docsConfig.availableFrom)} to ${formatDhakaDate(
    docsConfig.availableUntil,
  )} BST`;

  return (
    <div className="relative min-h-screen pb-16">
      <VideoBackground />

      <header className="sticky top-0 z-30 glass-nav">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full shadow-warm ring-1 ring-primary/30">
              <img src={logoMark} alt="Deshi Digest logo" width={40} height={40} className="h-full w-full object-cover" />
            </span>
            <span className="truncate font-display text-lg font-semibold tracking-normal sm:text-xl">Deshi Digest Docs</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            <a href="https://project-rae6k.vercel.app" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2 shadow-warm">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Live App</span>
              </Button>
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
        <section className="grid gap-8 pb-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/70 px-3 py-1 text-xs font-semibold text-primary shadow-soft backdrop-blur">
              <BookOpen className="h-3.5 w-3.5" />
              Google Gemini API BuildFest 2026 Submission
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl font-display text-4xl font-semibold tracking-normal text-balance sm:text-6xl">
                Deshi Digest public documentation
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                A culturally-aware nutrition companion for Bangladesh that combines local food knowledge, Gemini-powered
                chat, plate analysis, user profiles, and Supabase-backed meal history.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/chat">
                <Button className="gap-2 shadow-warm">
                  <PlayCircle className="h-4 w-4" />
                  Product Demo
                </Button>
              </Link>
              <a href="#architecture">
                <Button variant="outline" className="gap-2">
                  <Network className="h-4 w-4" />
                  Architecture
                </Button>
              </a>
              <a href="#team">
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Team
                </Button>
              </a>
            </div>
          </div>

          <aside className="glass rounded-lg p-5">
            <div className="flex items-start gap-3">
              <CalendarClock className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-3">
                <h2 className="font-display text-xl font-semibold tracking-normal">Access Control and Schedule</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Docs are public for judging and showcase access. Admin-controlled scheduling is prepared through docsConfig.
                </p>
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Public now</dt>
                    <dd className="font-semibold">{docsConfig.isPublic ? "Yes" : "No"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Show notice</dt>
                    <dd className="font-semibold">{docsConfig.showScheduleNotice ? "Enabled" : "Hidden"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Prepared window</dt>
                    <dd className="mt-1 font-semibold">{scheduleWindow}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>
        </section>

        <div className="grid gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Live route", value: "/docs", icon: FileText },
            { label: "Access", value: "Public", icon: LockKeyhole },
            { label: "Core AI", value: "Hybrid AI Stack", icon: Sparkles },
            { label: "Database", value: "Supabase", icon: Database },
          ].map((item) => (
            <div key={item.label} className="glass-soft rounded-lg p-4">
              <item.icon className="mb-3 h-5 w-5 text-primary" />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
              <p className="mt-1 font-display text-xl font-semibold tracking-normal">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-16">
          <Section id="problem" icon={Target} eyebrow="Problem" title="Nutrition advice rarely fits daily Bangladeshi life">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                "Generic diet apps often ignore rice, dal, local fish, vegetables, and everyday Bangladeshi meal patterns.",
                "Many recommendations assume expensive imported foods instead of budget-aware, locally available choices.",
                "People need safer guidance that explains tradeoffs without pretending to replace a doctor or dietitian.",
              ].map((text) => (
                <div key={text} className="glass rounded-lg p-5 text-sm leading-7 text-muted-foreground">
                  {text}
                </div>
              ))}
            </div>
          </Section>

          <Section id="solution" icon={Sparkles} eyebrow="Solution" title="Nanumoni gives practical, culturally-aware guidance">
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="glass rounded-lg p-6">
                <h3 className="font-display text-xl font-semibold tracking-normal">Product Overview</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Deshi Digest is a nutrition companion built around Bangladeshi food culture. It helps users chat about
                  meals, analyze plates, track history, and receive practical suggestions grounded in local ingredients and
                  responsible AI boundaries. The system uses Gemini for language reasoning and image understanding, embeddings/RAG for Bangladeshi food knowledge retrieval, Supabase-backed food and user data, model routing for AI tasks, and a custom model training direction for improving culturally aware nutrition guidance over time.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Warm conversational diet guidance",
                  "Vision-based plate analysis",
                  "Profile-aware recommendations",
                  "Meal and chat history",
                ].map((feature) => (
                  <div key={feature} className="glass-soft flex items-center gap-3 rounded-lg p-4 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section id="demo" icon={PlayCircle} eyebrow="Product Demo" title="Working app areas available from the live build">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Chat with Nanumoni", body: "Ask nutrition questions and receive contextual guidance.", to: "/chat" },
                { title: "Analyze My Plate", body: "Upload or capture food images for Gemini vision-assisted estimates.", to: "/plates" },
                { title: "Dashboard", body: "Review user profile context, meal history, and personalized summaries.", to: "/dashboard" },
              ].map((demo) => (
                <Link key={demo.title} to={demo.to} className="group glass rounded-lg p-5 transition hover:-translate-y-0.5 hover:shadow-warm">
                  <h3 className="font-display text-xl font-semibold tracking-normal">{demo.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{demo.body}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Open route <ExternalLink className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </Section>

          <Section id="tech-stack" icon={Code2} eyebrow="Tech Stack" title="Implementation stack">
            <div className="glass rounded-lg p-5">
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <span key={tech} className="rounded-md bg-background/65 px-3 py-2 text-sm font-semibold shadow-soft">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </Section>

          <Section id="ai-models" icon={Cpu} eyebrow="AI Models" title="Gemini model usage">
            <div className="grid gap-4 md:grid-cols-3">
              {aiModels.map((model) => (
                <div key={model.name} className="glass rounded-lg p-5">
                  <h3 className="font-display text-lg font-semibold tracking-normal">{model.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{model.use}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="data-sources" icon={Database} eyebrow="Data Sources" title="Food, profile, and external reference data">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="glass rounded-lg p-5">
                <h3 className="font-display text-xl font-semibold tracking-normal">Internal and curated data</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  <li>Curated Bangladeshi food knowledge base stored in application code and Supabase.</li>
                  <li>FCTB-based food context and local nutrition references.</li>
                  <li>User profile, chat threads, meal logs, and plate analysis records in Supabase with RLS.</li>
                </ul>
              </div>
              <div className="glass rounded-lg p-5">
                <h3 className="font-display text-xl font-semibold tracking-normal">External reference APIs</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  <li>USDA FoodData Central for nutrition lookup support.</li>
                  <li>RxNorm for medication reference context.</li>
                  <li>WHO ICD references for medical classification context where appropriate.</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section id="architecture" icon={Network} eyebrow="Architecture" title="System architecture">
            <div className="glass rounded-lg p-5 sm:p-6">
              <div className="grid gap-3 text-center text-sm font-semibold lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
                <div className="rounded-lg bg-background/70 p-4">Frontend React/TanStack</div>
                <div className="hidden text-2xl text-primary lg:block">-&gt;</div>
                <div className="rounded-lg bg-background/70 p-4">Vercel Server Functions</div>
                <div className="hidden text-2xl text-primary lg:block">-&gt;</div>
                <div className="rounded-lg bg-background/70 p-4">Gemini / Supabase / External APIs</div>
                <div className="hidden text-2xl text-primary lg:block">-&gt;</div>
                <div className="rounded-lg bg-background/70 p-4">Supabase Postgres + pgvector</div>
              </div>
              <pre className="mt-5 overflow-x-auto rounded-lg bg-foreground/90 p-4 text-xs leading-6 text-background">
{`flowchart LR
  A[Frontend React/TanStack] --> B[Vercel Server Functions]
  B --> C[Gemini / Supabase / External APIs]
  C --> D[Supabase Postgres + pgvector]`}
              </pre>
            </div>
          </Section>

          <Section id="data-flow" icon={Workflow} eyebrow="Data Flow" title="How a request moves through the product">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["1", "User submits chat, profile, or plate input from the React UI."],
                ["2", "TanStack Start server functions attach auth context and validate request shape."],
                ["3", "Gemini, Supabase, and selected external APIs provide model output and reference context."],
                ["4", "Results and user history are returned to the UI and persisted through Supabase policies."],
              ].map(([step, text]) => (
                <div key={step} className="glass-soft rounded-lg p-5">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">{step}</span>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="responsible-ai" icon={ShieldCheck} eyebrow="Responsible AI" title="Safety boundaries are explicit">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="glass rounded-lg p-5">
                <h3 className="flex items-center gap-2 font-display text-xl font-semibold tracking-normal">
                  <HeartPulse className="h-5 w-5 text-primary" />
                  Health guidance limits
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Nanumoni gives nutrition education and practical meal guidance. It does not diagnose, prescribe, or replace
                  qualified medical advice. Higher-risk health questions should be escalated to clinicians.
                </p>
              </div>
              <div className="glass rounded-lg p-5">
                <h3 className="font-display text-xl font-semibold tracking-normal">Mitigations in scope</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  <li>Clear not-medical-advice language in user-facing AI workflows.</li>
                  <li>Profile-aware but conservative recommendations.</li>
                  <li>RLS-backed storage for user-specific data.</li>
                  <li>Cultural sensitivity around Bangladeshi food patterns and affordability.</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section id="admin-roadmap" icon={LockKeyhole} eyebrow="Admin Editing" title="Admin controls roadmap">
            <div className="glass rounded-lg p-5">
              <p className="text-sm leading-7 text-muted-foreground">
                A full WYSIWYG documentation editor is not implemented yet. The route is prepared for simple controlled
                visibility through a config object, and the next admin milestone is an editable docs dashboard.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  "Visibility toggle prepared through docsConfig.isPublic",
                  "Scheduling config prepared with availableFrom and availableUntil",
                  "Future editable docs dashboard planned",
                ].map((item) => (
                  <div key={item} className="glass-soft rounded-lg p-4 text-sm font-semibold">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section id="documentation-roadmap" icon={Search} eyebrow="Search and Export" title="Documentation roadmap">
            <div className="glass rounded-lg p-5">
              <p className="text-sm leading-7 text-muted-foreground">
                Full documentation search and PDF export are planned but not shipped in this submission build. This page keeps
                the scope honest by presenting the live documentation content directly instead of showing non-working controls.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="glass-soft rounded-lg p-4 text-sm font-semibold">Planned: full-text docs search</div>
                <div className="glass-soft rounded-lg p-4 text-sm font-semibold">Planned: PDF export for submission packets</div>
              </div>
            </div>
          </Section>

          <Section id="roadmap" icon={Milestone} eyebrow="Roadmap" title="Product roadmap">
            <div className="grid gap-3 md:grid-cols-2">
              {roadmap.map((item) => (
                <div key={item} className="glass-soft flex items-center gap-3 rounded-lg p-4 text-sm font-semibold">
                  <Zap className="h-4 w-4 shrink-0 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </Section>

          <Section id="team" icon={Users} eyebrow="Team" title="Team showcase">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => (
                <article key={member.name} className="glass flex min-h-44 flex-col rounded-lg p-5">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-warm">
                      {initials(member.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-xl font-semibold tracking-normal">{member.name}</h3>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-5 text-sm">
                    {member.email ? (
                      <a href={`mailto:${member.email}`} className="inline-flex items-center gap-2 font-semibold text-primary">
                        <Mail className="h-4 w-4" />
                        {member.email}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        Email not provided
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section id="changelog" icon={FileText} eyebrow="Changelog" title="Recent project changes">
            <div className="space-y-3">
              {changelog.map((entry) => (
                <article key={`${entry.date}-${entry.title}`} className="glass rounded-lg p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="font-display text-xl font-semibold tracking-normal">{entry.title}</h3>
                    <time className="text-sm font-semibold text-primary">{entry.date}</time>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.detail}</p>
                </article>
              ))}
            </div>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
