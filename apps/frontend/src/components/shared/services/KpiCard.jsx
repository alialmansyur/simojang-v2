import { FileText } from 'lucide-react'
import {
  KPI_TYPOGRAPHY,
  KPI_BADGE_STYLES,
  KPI_COMPACT_LENGTH_THRESHOLD,
  formatKpiDisplayValue,
} from './kpiTokens'

function getCardShellClass(borderless) {
  return borderless
    ? 'group relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between'
    : 'group relative p-3.5 sm:p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs hover:border-[#175CD3]/30 dark:hover:border-blue-500/30 transition-all duration-200 flex flex-col justify-between'
}

/**
 * Standardized loading skeleton row for 4-column KPI bento grids.
 */
export function KpiSkeletonGrid({
  count = 4,
  borderless = false,
  gridClassName = KPI_TYPOGRAPHY.grid,
}) {
  const skeletonCardClass = borderless
    ? 'p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-xs space-y-2 animate-pulse'
    : 'p-3.5 sm:p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 space-y-2 animate-pulse'

  return (
    <div className={gridClassName}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={skeletonCardClass}>
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded my-1.5" />
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-4 w-14 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Single standardized KPI Card implementing SIMOJANG typography hierarchy.
 * All cards in a row share one uniform primary metric size; compact sizing is
 * only applied uniformly when an entry exceeds `KPI_COMPACT_LENGTH_THRESHOLD`.
 */
export function KpiCard({
  label,
  value,
  suffix = '',
  unit = '',
  context,
  defaultContext = 'Rekapitulasi',
  badge,
  badgeColor = 'slate',
  badgeClassName = '',
  icon: Icon = FileText,
  iconColor = 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
  isText = false,
  isDate = false,
  compact,
  borderless = false,
  valueClassName = '',
}) {
  const displayText = formatKpiDisplayValue({ value, suffix, isDate, isText })
  const useCompact =
    compact !== undefined ? compact : displayText.length > KPI_COMPACT_LENGTH_THRESHOLD
  const baseValueClass = useCompact ? KPI_TYPOGRAPHY.valueCompact : KPI_TYPOGRAPHY.valueNumeric

  return (
    <div className={getCardShellClass(borderless)}>
      <div className="flex items-center justify-between gap-2">
        <span className={KPI_TYPOGRAPHY.label}>{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="my-2">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={`${baseValueClass} truncate max-w-full ${valueClassName}`.trim()}>
            {displayText}
          </span>
          {unit && <span className={KPI_TYPOGRAPHY.unit}>{unit}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-1">
        <span className={KPI_TYPOGRAPHY.context}>{context || defaultContext}</span>
        {badge && (
          <span
            className={`${KPI_TYPOGRAPHY.badge} ${
              badgeClassName || KPI_BADGE_STYLES[badgeColor] || KPI_BADGE_STYLES.slate
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Standardized responsive grid wrapper for KPI Card lists.
 * Ensures every card in the same grid shares the exact same metric font size.
 */
export function KpiCardGrid({
  kpis = [],
  isLoading = false,
  borderless = false,
  defaultContext = 'Rekapitulasi',
  fallbackIcon = FileText,
  gridClassName = KPI_TYPOGRAPHY.grid,
}) {
  if (isLoading) {
    return <KpiSkeletonGrid borderless={borderless} gridClassName={gridClassName} />
  }

  if (!kpis || kpis.length === 0) return null

  const useCompactRow = kpis.some(
    (kpi) => formatKpiDisplayValue(kpi).length > KPI_COMPACT_LENGTH_THRESHOLD
  )

  return (
    <div className={gridClassName}>
      {kpis.map((kpi, idx) => (
        <KpiCard
          key={kpi.id || kpi.label || idx}
          {...kpi}
          icon={kpi.icon || fallbackIcon}
          compact={kpi.compact !== undefined ? kpi.compact : useCompactRow}
          borderless={borderless}
          defaultContext={defaultContext}
        />
      ))}
    </div>
  )
}
