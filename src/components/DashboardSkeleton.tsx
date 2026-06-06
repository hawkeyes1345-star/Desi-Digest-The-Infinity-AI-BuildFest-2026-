import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-page skeleton that matches the dashboard card layout.
 * Shown while profile + meals data is loading on first render.
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-warm-gradient">
      {/* Navbar skeleton */}
      <header className="glass-nav">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-6">
        {/* Greeting card skeleton */}
        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-warm md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-40 rounded" />
              <Skeleton className="h-7 w-64 rounded-md" />
              <Skeleton className="h-4 w-80 rounded" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 w-32 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
              </div>
            </div>
          </div>
        </section>

        {/* Macro rings skeleton — 4 cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-6 w-24 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Chart + streak skeleton */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="mt-1 h-3 w-40 rounded" />
            <Skeleton className="mt-4 h-60 w-full rounded-xl" />
          </div>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="mt-4 h-10 w-16 rounded-md" />
            <Skeleton className="mt-1 h-3 w-36 rounded" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </div>
        </section>

        {/* Today's meals skeleton */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <Skeleton className="h-10 rounded-lg" />
                    <Skeleton className="h-10 rounded-lg" />
                    <Skeleton className="h-10 rounded-lg" />
                    <Skeleton className="h-10 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
