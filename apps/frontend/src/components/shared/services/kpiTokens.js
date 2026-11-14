/**
 * Shared KPI typography & badge tokens (Plus Jakarta Sans single-font standard).
 * Proportional figures are used on KPI cards (no `tabular-nums`, no `font-mono`)
 * so digits keep natural geometric proportions alongside labels and units.
 */
export const KPI_TYPOGRAPHY = {
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5',
  label:
    'text-[11px] font-semibold tracking-[0.06em] text-slate-500 dark:text-slate-400 uppercase truncate leading-tight',
  valueNumeric:
    'text-2xl sm:text-[26px] font-bold tracking-[-0.025em] leading-none text-slate-900 dark:text-white',
  valueCompact:
    'text-lg sm:text-xl font-bold tracking-[-0.02em] leading-none text-slate-900 dark:text-white',
  unit: 'text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-none shrink-0',
  context: 'text-xs font-normal text-slate-500 dark:text-slate-400 leading-snug truncate',
  badge:
    'inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-semibold leading-none border shrink-0',
}

export const KPI_COMPACT_LENGTH_THRESHOLD = 13

export const KPI_BADGE_STYLES = {
  blue: 'bg-blue-50/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/40',
  emerald:
    'bg-emerald-50/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40',
  green:
    'bg-emerald-50/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40',
  amber:
    'bg-amber-50/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/40',
  orange:
    'bg-amber-50/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/40',
  indigo:
    'bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/40',
  purple:
    'bg-purple-50/70 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/40',
  rose: 'bg-rose-50/70 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/40',
  red: 'bg-rose-50/70 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/40',
  sky: 'bg-sky-50/70 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/50 dark:border-sky-800/40',
  slate:
    'bg-slate-100/70 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/40',
}

export function formatKpiNumber(num) {
  return new Intl.NumberFormat('id-ID').format(Number(num || 0))
}

export function formatKpiDate(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function formatKpiDisplayValue({ value, suffix = '', isDate = false, isText = false }) {
  const base = isDate ? formatKpiDate(value) : isText ? (value ?? '-') : formatKpiNumber(value)
  return `${base}${suffix}`
}
