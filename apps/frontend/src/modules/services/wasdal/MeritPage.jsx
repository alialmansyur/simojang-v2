import {
  Pencil,
  Trash2,
  Eye,
  Award,
  Layers,
  Clock,
  FileSpreadsheet,
  Calendar,
  ArrowUpDown,
  User,
} from 'lucide-react'
import { WasdalCrudLayoutShell } from '../../../components/shared/services/wasdal/WasdalCrudLayoutShell'
import { MeritFormModal } from '../../../components/shared/services/wasdal/MeritFormModal'
import {
  DataOriginIcon,
  isExcelOrigin,
} from '../../../components/shared/services/wasdal/WasdalDataOriginIcon'
import {
  fetchMeritSummary,
  fetchMeritData,
  deleteMeritData,
  importBatchMerit,
} from '../../../services/api/wasdalServicesApi'

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export default function MeritPage() {
  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(Number(num ?? 0))

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return String(dateStr)
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return String(dateStr)
    }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return String(dateStr)
      const datePart = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      const timePart = d
        .toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        .replace(':', '.')
      return `${datePart}, ${timePart} WIB`
    } catch {
      return String(dateStr)
    }
  }

  const formatPeriodTitle = (period) => {
    if (!period) return 'Rekapitulasi Periode'
    const raw = String(period).trim()
    const match = raw.match(/^(\d{4})-(\d{2})$/)
    if (match) {
      const year = match[1]
      const monthIdx = parseInt(match[2], 10) - 1
      if (monthIdx >= 0 && monthIdx < 12) {
        return `Periode ${MONTH_NAMES[monthIdx]} ${year}`
      }
    }
    return `Periode ${raw}`
  }

  const formatAuditor = (item) => {
    const name = String(item?.created_by_name || '').trim()
    const nip = String(item?.created_by || '').trim()
    if (name) return name
    if (nip) return nip
    return '-'
  }

  const getPredikat = (sla) => {
    const pct = Number(sla ?? 0)
    if (pct >= 90)
      return {
        label: 'Sangat Baik',
        color:
          'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      }
    if (pct >= 80)
      return {
        label: 'Sesuai SLA',
        color:
          'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      }
    if (pct >= 50)
      return {
        label: 'Cukup',
        color:
          'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      }
    return {
      label: 'Perlu Evaluasi',
      color:
        'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    }
  }

  const renderKpis = (summary) => [
    {
      id: 'total_file',
      label: 'TOTAL REKAP PERIODE',
      value: summary?.total_data ?? 0,
      unit: 'Periode',
      context: 'Rekapitulasi periode pengawasan',
      badge: '100% Total',
      badgeColor: 'blue',
      icon: FileSpreadsheet,
      iconColor: 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_detail',
      label: 'TOTAL REALISASI USUL',
      value: summary?.total_realisasi ?? 0,
      unit: 'Berkas',
      context: `Dari ${formatNumber(summary?.total_usul ?? 0)} usul masuk`,
      badge: 'Realisasi',
      badgeColor: 'emerald',
      icon: Layers,
      iconColor:
        'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'rata_sla',
      label: 'RATA-RATA KEPATUHAN SLA',
      value: `${Number(summary?.rata_sla ?? 0).toFixed(2)}%`,
      unit: '',
      isText: true,
      context: 'Pemenuhan SLA (≤ 4 Hari Kerja)',
      badge: 'Capaian SLA',
      badgeColor: 'amber',
      icon: Award,
      iconColor: 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'last_upload',
      label: 'PEMBARUAN TERAKHIR',
      value: formatDate(summary?.last_update || summary?.last_upload),
      unit: '',
      isText: true,
      context: 'Sinkronisasi rekap terakhir',
      badge: 'Terbaru',
      badgeColor: 'indigo',
      icon: Clock,
      iconColor:
        'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
  ]

  // 6 Kolom Standar (Bold Typography, 100% data aktual txn_merit)
  const columns = [
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>PERIODE &amp; RENTANG REKAP</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>USUL &amp; REALISASI</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>KEPATUHAN SLA (≤ 4 HK)</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>PREDIKAT SLA</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>TANGGAL</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>PETUGAS</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: <span className="font-bold">AKSI</span>,
      className: 'text-right',
    },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const predikat = getPredikat(item.persentase_sla)
    const slaPct = Number(item.persentase_sla ?? 0)

    return (
      <tr
        key={item.id || item.uid || rowNo}
        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors font-semibold"
      >
        {/* Kolom 1 — PERIODE & RENTANG REKAP */}
        <td className="px-4 sm:px-5 py-3.5 font-semibold">
          <div className="flex items-center gap-3">
            <DataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewDetail && onViewDetail(item)}
                title={`${formatPeriodTitle(item.period)} (${item.period || '-'})`}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
              >
                {formatPeriodTitle(item.period)}{' '}
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  ({item.period || '-'})
                </span>
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-xs sm:max-w-sm">
                  {formatDate(item.period_start_date)} – {formatDate(item.period_end_date)}
                </span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2 — USUL & REALISASI */}
        <td className="py-3.5 px-4 sm:px-5 font-semibold">
          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
            {formatNumber(item.total_realisasi)}{' '}
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Realisasi
            </span>
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Usul: {formatNumber(item.usul_masuk)} • MS: {formatNumber(item.ms)} • TMS:{' '}
            {formatNumber(item.tms)}
          </div>
        </td>

        {/* Kolom 3 — KEPATUHAN SLA */}
        <td className="py-3.5 px-4 sm:px-5 font-semibold">
          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
            {slaPct.toFixed(2)}%
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {formatNumber(item.sla_sesuai)} Sesuai • {formatNumber(item.sla_tidak_sesuai)}{' '}
            Lewat
          </div>
        </td>

        {/* Kolom 4 — PREDIKAT SLA */}
        <td className="py-3.5 px-4 sm:px-5 font-semibold">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${predikat.color}`}
          >
            {predikat.label}
          </span>
        </td>

        {/* Kolom 5 — TANGGAL */}
        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatDateTime(item.created_at)}</span>
          </div>
        </td>

        {/* Kolom 6 — PETUGAS */}
        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-200">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span
              className="font-semibold truncate max-w-[180px]"
              title={formatAuditor(item)}
            >
              {formatAuditor(item)}
            </span>
          </div>
        </td>

        {/* Kolom 7 — AKSI */}
        <td className="py-3.5 px-4 sm:px-5 font-medium">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap text-right">
            <button
              type="button"
              onClick={() => onViewDetail && onViewDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer transition-colors"
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors"
              title="Ubah Data"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
              title="Hapus Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const categories = [
    { value: 'sesuai', label: 'Sesuai SLA' },
    { value: 'tidak_sesuai', label: 'Perlu Evaluasi' },
  ]

  return (
    <WasdalCrudLayoutShell
      layananId={18}
      serviceTitle="Pengawasan Sistem Merit"
      shortTitle="Sistem Merit"
      timKerjaTitle="Pengawasan & Pengendalian"
      description="Monitoring rekapitulasi usulan kepegawaian dan kepatuhan SLA (≤ 4 Hari Kerja) wilayah kerja Kanreg III BKN."
      templateUrl="/templates/wasdal/template-sistem-merit.xlsx"
      templateName="template-sistem-merit.xlsx"
      fetchSummaryFn={fetchMeritSummary}
      fetchDataFn={fetchMeritData}
      deleteDataFn={deleteMeritData}
      batchUploadFn={importBatchMerit}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={MeritFormModal}
      categories={categories}
      searchPlaceholder="Cari periode rekapitulasi, tanggal, atau auditor..."
      detailType="merit"
    />
  )
}
