import {
  FileSpreadsheet,
  Layers,
  Building2,
  Clock,
} from 'lucide-react'
import { KpiCardGrid } from './KpiCard'
import { formatKpiDate } from './kpiTokens'

/**
 * Standard 4-card KPI Bento Grid for SIMOJANG service layouts.
 */
export function ServiceKpiGrid({
  summary = {},
  isLoading = false,
  kpis: propKpis,
  borderless = false,
}) {
  const defaultKpis = [
    {
      id: 'total_file',
      label: 'TOTAL FILE',
      value: summary?.total_file ?? summary?.total_data ?? 0,
      unit: 'File',
      context: 'Kapasitas arsip',
      badge: '100% Total',
      badgeColor: 'blue',
      icon: FileSpreadsheet,
      iconColor: 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_detail',
      label: 'TOTAL USUL DETAIL',
      value:
        summary?.total_baris_detail ??
        summary?.total_realisasi ??
        summary?.total_kasus ??
        summary?.total_data ??
        0,
      unit: 'Berkas',
      context: 'Rincian per instansi',
      badge: 'Realisasi',
      badgeColor: 'emerald',
      icon: Layers,
      iconColor: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_instansi',
      label: 'TOTAL INSTANSI',
      value: summary?.total_instansi ?? 0,
      unit: 'Instansi',
      context: 'Instansi pengusul',
      badge: 'Jabar & Banten',
      badgeColor: 'amber',
      icon: Building2,
      iconColor: 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'last_upload',
      label: 'UPLOAD TERAKHIR',
      value: formatKpiDate(summary?.last_upload || summary?.last_update),
      unit: '',
      isText: true,
      context: 'Pembaruan data',
      badge: 'Terbaru',
      badgeColor: 'indigo',
      icon: Clock,
      iconColor: 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
  ]

  return (
    <KpiCardGrid
      kpis={propKpis || defaultKpis}
      isLoading={isLoading}
      borderless={borderless}
      fallbackIcon={FileSpreadsheet}
    />
  )
}
