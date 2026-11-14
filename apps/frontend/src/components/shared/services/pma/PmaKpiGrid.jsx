import { FileText } from 'lucide-react'
import { KpiCardGrid } from '../KpiCard'

/**
 * PmaKpiGrid
 * Standardized KPI Cards Grid delegating to shared KpiCard tokens:
 * - Label: text-[11px] font-semibold uppercase tracking-[0.06em]
 * - Main Metric: text-2xl sm:text-[26px] font-bold tracking-[-0.025em] (proportional figures)
 * - Unit: text-[13px] font-medium
 * - Context: text-xs font-normal | Badge: text-[10.5px] font-semibold
 */
export function PmaKpiGrid({ kpis = [], isLoading = false }) {
  return (
    <KpiCardGrid
      kpis={kpis}
      isLoading={isLoading}
      borderless
      defaultContext="Rekapitulasi"
      fallbackIcon={FileText}
    />
  )
}
