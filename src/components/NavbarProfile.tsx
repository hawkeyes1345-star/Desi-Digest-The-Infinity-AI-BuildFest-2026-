import { Link } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Profile avatar / completion gate for the navbar.
 * - Shows initials in a circle
 * - Red dot indicator if profile is incomplete
 * - Links to /onboarding if incomplete, /profile otherwise
 */
export function NavbarProfile({ className }: { className?: string }) {
  const { profile, isComplete, completeness } = useProfile({ toastOnChange: true });

  const name = profile?.full_name || profile?.display_name || "";
  const initials =
    name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || null;

  const to = isComplete ? "/profile" : "/onboarding";

  return (
    <Link
      to={to}
      title={isComplete ? "Your profile" : `Complete your profile (${completeness}%)`}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-full glass-soft px-2 py-1.5 transition hover:shadow-warm",
        className,
      )}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-spice text-xs font-semibold text-primary-foreground">
        {initials ?? <User className="h-4 w-4" />}
      </span>
      {!isComplete && (
        <span
          aria-label="Profile incomplete"
          className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-destructive text-destructive-foreground ring-2 ring-background"
        >
          <AlertCircle className="h-3 w-3" />
        </span>
      )}
      {name && (
        <span className="hidden pr-2 text-sm font-medium sm:inline">
          {name.split(" ")[0]}
        </span>
      )}
    </Link>
  );
}
