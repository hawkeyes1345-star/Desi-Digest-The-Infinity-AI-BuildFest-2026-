import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppearanceProvider } from "@/lib/appearance";
import { OnboardingGate } from "@/components/OnboardingGate";
import { isDemoSession, endDemoSession } from "@/lib/demo-session";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-semibold text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl text-foreground">Nanumoni can't find this page</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Deshi Digest — Nanumoni's nutrition guide for Bangladesh" },
      {
        name: "description",
        content:
          "Warm, culturally intelligent nutrition guidance for Bangladesh — rice, dal, mach, shak. Chat with Nanumoni, your AI Deshi nutrition companion.",
      },
      { name: "author", content: "Deshi Digest" },
      { property: "og:title", content: "Deshi Digest — Chat with Nanumoni" },
      {
        property: "og:description",
        content: "Hyper-local Bangladeshi nutrition AI built on real FCTB food knowledge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session && isDemoSession()) endDemoSession();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && isDemoSession()) endDemoSession();
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  const demo = isDemoSession() && !session;

  const handleExitDemo = () => {
    endDemoSession();
    router.invalidate();
    queryClient.invalidateQueries();
    window.location.href = "/";
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <OnboardingGate />
        {demo && (
          <div className="sticky top-0 z-50 flex flex-col sm:flex-row items-center justify-between border-b border-primary/20 bg-sage/10 px-4 py-3 text-xs backdrop-blur-md shadow-sm gap-3 sm:gap-4">
            <div className="flex items-start gap-2">
              <span className="rounded-full bg-primary/20 px-2 py-0.5 font-bold tracking-wide text-primary whitespace-nowrap mt-0.5">
                JUDGE DEMO
              </span>
              <span className="text-muted-foreground leading-snug">
                <strong>Dadubhai, you are using Judge Demo Mode. This is sample data only.</strong> Sign in with Gmail to access the full AI features. If sign-in is temporarily limited, you can continue exploring the demo safely.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end">
              <Link
                to="/login"
                className="font-bold text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition text-[11px] whitespace-nowrap shadow-warm"
              >
                Sign in with Gmail
              </Link>
              <button
                onClick={handleExitDemo}
                className="font-medium text-muted-foreground hover:text-foreground underline transition whitespace-nowrap"
              >
                Exit demo
              </button>
            </div>
          </div>
        )}
        <Outlet />
        <Toaster />
      </AppearanceProvider>
    </QueryClientProvider>
  );
}
