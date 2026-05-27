import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { demoProfile, isDemoSession } from "@/lib/demo-session";
import {
  getMyProfile,
  isProfileComplete,
  profileCompleteness,
  computeBMI,
  computeBMR,
  computeTDEE,
  type Profile,
} from "@/lib/profile.functions";

/**
 * Live profile hook — fetches profile, subscribes to realtime updates,
 * and shows a gentle Nanumoni toast whenever the profile changes.
 * Skips the server fn entirely when there is no authenticated session,
 * so unauthenticated visitors never trigger a 401 from requireSupabaseAuth.
 */
export function useProfile(opts: { toastOnChange?: boolean } = {}) {
  const demo = isDemoSession();
  const get = useServerFn(getMyProfile);
  const qc = useQueryClient();
  const firstChange = useRef(true);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    if (demo) {
      setHasSession(true);
      return () => { mounted = false; };
    }
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setHasSession(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setHasSession(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [demo]);

  const q = useQuery({
    queryKey: ["profile"],
    queryFn: () => get(),
    staleTime: 30_000,
    enabled: hasSession === true,
  });


  useEffect(() => {
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (demo) return;

    (async () => {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
      if (!userId) return;
      channel = supabase
        .channel(`profile:${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${userId}` },
          () => {
            qc.invalidateQueries({ queryKey: ["profile"] });
            // also invalidate every personalized surface
            qc.invalidateQueries({ queryKey: ["plan"] });
            qc.invalidateQueries({ queryKey: ["dashboard"] });
            qc.invalidateQueries({ queryKey: ["recommendations"] });
            if (opts.toastOnChange && !firstChange.current) {
              toast.success("Nanumoni has updated her knowledge about you ❤️");
            }
            firstChange.current = false;
          },
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [qc, opts.toastOnChange, demo]);

  const profile: Profile | null = demo ? demoProfile : (q.data ?? null);
  return {
    profile,
    isLoading: q.isLoading,
    isComplete: isProfileComplete(profile),
    completeness: profileCompleteness(profile),
    bmi: computeBMI(profile),
    bmr: computeBMR(profile),
    tdee: computeTDEE(profile),
    refetch: q.refetch,
  };
}
