import { Skeleton } from "@/components/ui/skeleton";

function HeaderSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="space-y-3">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-[min(32rem,100%)]" />
      </div>
      {withAction ? <Skeleton className="h-10 w-full sm:w-40" /> : null}
    </div>
  );
}

function TableCardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-10 w-full sm:w-56" />
      </div>
      <div className="mt-5 hidden overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 md:block">
        <div className="grid grid-cols-5 gap-4 bg-slate-50 p-4 dark:bg-slate-900">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-4" />
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-900">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-4 p-4">
              {Array.from({ length: 5 }).map((_, columnIndex) => (
                <Skeleton key={columnIndex} className="h-5" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 space-y-3 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function LandingPageSkeleton() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-slate-950 p-4 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Skeleton className="h-10 w-44 bg-slate-800" />
          <div className="hidden gap-3 md:flex">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-20 bg-slate-800" />
            ))}
          </div>
          <Skeleton className="h-10 w-28 bg-slate-800" />
        </div>
      </div>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-5">
          <Skeleton className="h-7 w-40 rounded-full" />
          <Skeleton className="h-14 w-full max-w-2xl" />
          <Skeleton className="h-14 w-4/5 max-w-xl" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <Skeleton className="h-5 w-3/4 max-w-xl" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-12 w-full sm:w-40" />
            <Skeleton className="h-12 w-full sm:w-40" />
          </div>
        </div>
        <Skeleton className="h-[420px] rounded-2xl" />
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </section>
    </main>
  );
}

export function LoginPageSkeleton() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4 py-10 sm:py-16">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur">
        <div className="space-y-4">
          <Skeleton className="mx-auto h-12 w-12 rounded-xl bg-white/20" />
          <Skeleton className="mx-auto h-7 w-44 bg-white/20" />
          <Skeleton className="mx-auto h-4 w-64 bg-white/20" />
          <Skeleton className="h-10 w-full bg-white/20" />
          <Skeleton className="h-10 w-full bg-white/20" />
          <Skeleton className="h-11 w-full bg-white/20" />
          <Skeleton className="h-24 w-full bg-white/20" />
        </div>
      </div>
    </main>
  );
}

export function BookingPageSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <HeaderSkeleton />
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-slate-200/80 bg-white/85 p-5 dark:border-slate-800 dark:bg-slate-950/80">
            <Skeleton className="h-7 w-48" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
            <Skeleton className="mt-4 h-24" />
            <Skeleton className="mt-4 h-11" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

export function DashboardTablePageSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton withAction />
      <TableCardSkeleton />
    </div>
  );
}

export function DashboardPaymentsSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton withAction />
      <TableCardSkeleton />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

export function DashboardReportsSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-lg" />
      <TableCardSkeleton rows={5} />
    </div>
  );
}

export function DashboardSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[520px] rounded-lg lg:col-span-2" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}

export function CustomerHistorySkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Skeleton className="h-72 rounded-lg" />
        <TableCardSkeleton rows={5} />
      </div>
    </div>
  );
}
