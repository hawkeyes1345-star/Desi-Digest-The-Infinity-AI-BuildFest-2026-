import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";

/**
 * Global gate: if a logged-in user lands on a personalized feature
 * without a complete profile, send them to /onboarding once.
 *
 * Public landing, login, onboarding itself, and profile page are exempt
 * so users can browse and edit freely.
 */
const EXEMPT_PREFIXES = ["/login", "/onboarding", "/profile", "/auth"];
const EXEMPT_EXACT = new Set(["/"]);

export function OnboardingGate() {
  const navigate = useNavigate();
  const { profile, isComplete, isLoading } = useProfile();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (isLoading) return;
    if (isComplete) return;
    if (!profile && !isLoading) {
      // not logged in — nothing to do; route guards handle it
      return;
    }
    if (EXEMPT_EXACT.has(path)) return;
    if (EXEMPT_PREFIXES.some((p) => path.startsWith(p))) return;
    navigate({ to: "/onboarding" });
  }, [isComplete, isLoading, profile, path, navigate]);

  return null;
}
