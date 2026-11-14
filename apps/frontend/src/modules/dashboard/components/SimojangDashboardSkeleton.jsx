export function SimojangDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat Dashboard SIMOJANG">
      {/* Row 1: Clean Highlight Sapaan (8) + Agenda Hari Ini (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 py-1 space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-36 rounded-md bg-slate-200/70 dark:bg-slate-800" />
            <div className="h-8 w-72 max-w-full rounded-lg bg-slate-200/80 dark:bg-slate-800" />
          </div>
          <div className="space-y-2 max-w-xl">
            <div className="h-4 w-full rounded bg-slate-200/60 dark:bg-slate-800/70" />
            <div className="h-4 w-4/5 rounded bg-slate-200/60 dark:bg-slate-800/70" />
          </div>
          <div className="flex items-center gap-2.5 pt-1">
            <div className="h-10 w-40 rounded-xl bg-slate-200/80 dark:bg-slate-800" />
            <div className="h-10 w-40 rounded-xl bg-slate-200/60 dark:bg-slate-800/70" />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-3">
          <div className="h-10 w-full rounded-xl bg-slate-200/60 dark:bg-slate-800/70" />
          <div className="h-28 rounded-2xl bg-white dark:bg-slate-900 shadow-2xs" />
          <div className="h-28 rounded-2xl bg-white dark:bg-slate-900 shadow-2xs" />
        </div>
      </div>

      {/* Row 2: Aktivitas Unggahan Terbaru Table */}
      <div className="h-80 rounded-2xl bg-white dark:bg-slate-900 shadow-2xs p-6" />
    </div>
  )
}
