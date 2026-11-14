import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  ShieldCheck,
  Calendar,
  Download,
  MapPin,
  User,
  Clock,
  FileText,
  AlertTriangle,
  Award,
  BarChart2,
  Building2,
} from 'lucide-react'

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

/**
 * WasdalDetailDialog — Modal Detail berbasis data aktual API untuk layanan Wasdal
 * Dirender melalui createPortal ke document.body dengan z-[100] agar selalu di atas Sidebar & Topbar.
 */
export function WasdalDetailDialog({ isOpen, onClose, item, type = 'merit' }) {
  useEffect(() => {
    if (!isOpen || !item) return undefined

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, item, onClose])

  if (!isOpen || !item || typeof document === 'undefined') return null

  const normalizedType = (() => {
    const t = String(type || '').toLowerCase()
    if (t.includes('nspk')) return 'nspk'
    if (t.includes('netralitas') || t.includes('wasdal')) return 'netralitas'
    return 'merit'
  })()

  // ─── Formatters Aktual ───────────────────────────────────────
  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(Number(num ?? 0))

  const formatDateOnly = (dateStr) => {
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
      return (
        d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB'
      )
    } catch {
      return String(dateStr)
    }
  }

  const formatPeriodLabel = (period) => {
    if (!period) return '-'
    const raw = String(period).trim()
    const match = raw.match(/^(\d{4})-(\d{2})$/)
    if (match) {
      const year = match[1]
      const monthIdx = parseInt(match[2], 10) - 1
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${MONTH_NAMES[monthIdx]} ${year} (${raw})`
      }
    }
    return raw
  }

  const formatWilayah = (wilayah, kanreg) => {
    const w = String(wilayah || '').trim().toUpperCase()
    if (w === 'JABAR' || w === 'JAWA BARAT') return 'Jawa Barat'
    if (w === 'BANTEN') return 'Banten'
    if (w) return wilayah
    if (kanreg) return `Kanreg ${kanreg} BKN`
    return '-'
  }

  const formatAuditor = (row) => {
    const name = String(row?.created_by_name || '').trim()
    const nip = String(row?.created_by || '').trim()
    if (name && nip) return `${name} (NIP. ${nip})`
    if (name) return name
    if (nip) return `NIP. ${nip}`
    return 'Sistem / Belum Tercatat'
  }

  const formatActionOrigin = (action) => {
    const a = String(action || '').toLowerCase()
    if (a === 'import') return 'Import Batch Excel'
    if (a === 'update') return 'Pembaruan Data'
    if (a === 'create') return 'Input Data'
    return action || 'Tercatat di Basis Data'
  }

  // ─── Konfigurasi Predikat Aktual ─────────────────────────────
  const getMeritPredikat = (sla) => {
    const pct = Number(sla ?? 0)
    if (pct >= 90) {
      return {
        label: 'Sangat Baik (Sesuai SLA)',
        color:
          'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      }
    }
    if (pct >= 80) {
      return {
        label: 'Sesuai Target SLA',
        color:
          'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      }
    }
    if (pct >= 50) {
      return {
        label: 'Cukup / Perlu Evaluasi',
        color:
          'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      }
    }
    return {
      label: 'Perlu Evaluasi SLA',
      color:
        'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    }
  }

  const getLevelConfig = (level) => {
    const map = {
      A: {
        label: 'Sangat Baik',
        color:
          'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      },
      B: {
        label: 'Baik',
        color:
          'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      },
      C: {
        label: 'Cukup',
        color:
          'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      },
      D: {
        label: 'Kurang',
        color:
          'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      },
    }
    return map[String(level || 'B').toUpperCase()] || map.B
  }

  const getNetralitasConfig = (permasalahan) => {
    const p = String(permasalahan || '').toLowerCase()
    if (p.includes('netralitas')) {
      return {
        color:
          'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      }
    }
    if (p.includes('disiplin')) {
      return {
        color:
          'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      }
    }
    if (p.includes('kode etik') || p.includes('etik')) {
      return {
        color:
          'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      }
    }
    return {
      color:
        'bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    }
  }

  const hasActualNilai =
    item.nilai !== null && item.nilai !== undefined && String(item.nilai).trim() !== ''
  const actualNilaiFormatted = hasActualNilai
    ? Number(item.nilai).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null

  // Header Title & Badge
  const headerTitle =
    normalizedType === 'merit'
      ? `Rekapitulasi SLA Periode ${formatPeriodLabel(item.period)}`
      : item.instansi_name || `Instansi Kode: ${item.kodeins || item.instansi_id || '-'}`

  const headerSubtitle =
    normalizedType === 'merit'
      ? `Rentang Rekapitulasi: ${formatDateOnly(item.period_start_date)} – ${formatDateOnly(item.period_end_date)}`
      : `Kode Instansi: ${item.kodeins || item.instansi_id || '-'} • ${formatWilayah(item.wilayah, item.kanreg)}`

  let badgeLabel
  let badgeColor
  if (normalizedType === 'merit') {
    const p = getMeritPredikat(item.persentase_sla)
    badgeLabel = p.label
    badgeColor = p.color
  } else if (normalizedType === 'nspk') {
    const lvl = String(item.level || '-').toUpperCase()
    const lc = getLevelConfig(lvl)
    badgeLabel = `Level ${lvl} — ${lc.label}`
    badgeColor = lc.color
  } else {
    const nc = getNetralitasConfig(item.permasalahan)
    badgeLabel = item.permasalahan || 'Pengawasan'
    badgeColor = nc.color
  }

  // ─── Bento Cards Aktual ─────────────────────────────────────
  const bentoCards = (() => {
    if (normalizedType === 'merit') {
      return [
        {
          icon: FileText,
          label: 'Usul Masuk',
          value: formatNumber(item.usul_masuk),
          unit: 'Berkas',
          iconClass: 'text-blue-600 dark:text-blue-400',
          bgClass: 'bg-blue-50 dark:bg-blue-950/40',
        },
        {
          icon: Award,
          label: 'MS (Memenuhi)',
          value: formatNumber(item.ms),
          unit: 'Berkas',
          iconClass: 'text-emerald-600 dark:text-emerald-400',
          bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
        },
        {
          icon: AlertTriangle,
          label: 'TMS (Tidak MS)',
          value: formatNumber(item.tms),
          unit: 'Berkas',
          iconClass: 'text-rose-600 dark:text-rose-400',
          bgClass: 'bg-rose-50 dark:bg-rose-950/40',
        },
        {
          icon: BarChart2,
          label: 'Kepatuhan SLA',
          value: `${Number(item.persentase_sla ?? 0).toFixed(2)}%`,
          unit: '',
          iconClass: 'text-indigo-600 dark:text-indigo-400',
          bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
        },
      ]
    }
    if (normalizedType === 'nspk') {
      const lvl = String(item.level || '-').toUpperCase()
      return [
        {
          icon: Award,
          label: 'Level NSPK',
          value: `Level ${lvl}`,
          unit: '',
          iconClass: 'text-blue-600 dark:text-blue-400',
          bgClass: 'bg-blue-50 dark:bg-blue-950/40',
        },
        {
          icon: BarChart2,
          label: 'Nilai Indeks Aktual',
          value: actualNilaiFormatted ?? 'Belum Diinput',
          unit: actualNilaiFormatted ? '/ 100' : '',
          iconClass: 'text-emerald-600 dark:text-emerald-400',
          bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
        },
        {
          icon: Calendar,
          label: 'Periode Evaluasi',
          value: item.period || '-',
          unit: '',
          iconClass: 'text-amber-600 dark:text-amber-400',
          bgClass: 'bg-amber-50 dark:bg-amber-950/40',
        },
        {
          icon: MapPin,
          label: 'Wilayah Kerja',
          value: formatWilayah(item.wilayah, item.kanreg),
          unit: '',
          iconClass: 'text-indigo-600 dark:text-indigo-400',
          bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
        },
      ]
    }
    return [
      {
        icon: AlertTriangle,
        label: 'Total Kasus',
        value: formatNumber(item.total),
        unit: 'Kasus',
        iconClass: 'text-rose-600 dark:text-rose-400',
        bgClass: 'bg-rose-50 dark:bg-rose-950/40',
      },
      {
        icon: FileText,
        label: 'Jenis Permasalahan',
        value: item.permasalahan || '-',
        unit: '',
        iconClass: 'text-amber-600 dark:text-amber-400',
        bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      },
      {
        icon: Calendar,
        label: 'Periode Laporan',
        value: item.period || '-',
        unit: '',
        iconClass: 'text-blue-600 dark:text-blue-400',
        bgClass: 'bg-blue-50 dark:bg-blue-950/40',
      },
      {
        icon: MapPin,
        label: 'Wilayah Kerja',
        value: formatWilayah(item.wilayah, item.kanreg),
        unit: '',
        iconClass: 'text-indigo-600 dark:text-indigo-400',
        bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
      },
    ]
  })()

  // ─── Baris Detail Tabel Aktual ──────────────────────────────
  const detailRows = (() => {
    if (normalizedType === 'merit') {
      return [
        { label: 'Periode Rekapitulasi', value: formatPeriodLabel(item.period) },
        {
          label: 'Rentang Tanggal Pengawasan',
          value: `${formatDateOnly(item.period_start_date)} s/d ${formatDateOnly(item.period_end_date)}`,
        },
        { label: 'Tanggal Pencatatan Periode', value: formatDateOnly(item.period_date) },
        { label: 'Usul Masuk', value: `${formatNumber(item.usul_masuk)} berkas` },
        { label: 'Memenuhi Syarat (MS)', value: `${formatNumber(item.ms)} berkas` },
        { label: 'Tidak Memenuhi Syarat (TMS)', value: `${formatNumber(item.tms)} berkas` },
        {
          label: 'Total Realisasi Verifikasi',
          value: `${formatNumber(item.total_realisasi)} berkas`,
          highlight: 'text-slate-900 dark:text-white font-bold',
        },
        {
          label: 'SLA Sesuai (≤ 4 Hari Kerja)',
          value: `${formatNumber(item.sla_sesuai)} berkas`,
          highlight: 'text-emerald-700 dark:text-emerald-400 font-bold',
        },
        {
          label: 'SLA Tidak Sesuai (> 4 Hari Kerja)',
          value: `${formatNumber(item.sla_tidak_sesuai)} berkas`,
          highlight: 'text-rose-700 dark:text-rose-400 font-bold',
        },
        {
          label: 'Persentase Kepatuhan SLA',
          value: `${Number(item.persentase_sla ?? 0).toFixed(2)}% (${badgeLabel})`,
          highlight: 'text-[#175CD3] dark:text-blue-400 font-bold',
        },
        { label: 'Petugas / Auditor Pencatat', value: formatAuditor(item) },
        { label: 'Waktu Input Data', value: formatDateTime(item.created_at) },
        { label: 'Terakhir Diperbarui', value: formatDateTime(item.updated_at || item.created_at) },
      ]
    }

    if (normalizedType === 'nspk') {
      const lvl = String(item.level || '-').toUpperCase()
      const lc = getLevelConfig(lvl)
      return [
        {
          label: 'Nama Instansi Pemerintah',
          value: item.instansi_name || '-',
          highlight: 'text-slate-900 dark:text-white font-bold',
        },
        { label: 'Kode Instansi', value: String(item.kodeins || item.instansi_id || '-') },
        {
          label: 'Wilayah & Kantor Regional',
          value: `${formatWilayah(item.wilayah, item.kanreg)}${item.kanreg ? ` • Kanreg ${item.kanreg} BKN` : ''}`,
        },
        { label: 'Periode Evaluasi', value: formatPeriodLabel(item.period) },
        {
          label: 'Rentang Tanggal Evaluasi',
          value: `${formatDateOnly(item.period_start_date)} s/d ${formatDateOnly(item.period_end_date)}`,
        },
        { label: 'Tanggal Pencatatan Periode', value: formatDateOnly(item.period_date) },
        {
          label: 'Peringkat / Level Kepatuhan NSPK',
          value: `Level ${lvl} (${lc.label})`,
          highlight: 'text-[#175CD3] dark:text-blue-400 font-bold',
        },
        {
          label: 'Nilai Indeks NSPK Aktual',
          value: actualNilaiFormatted
            ? `${actualNilaiFormatted} / 100`
            : 'Belum tercatat (pencatatan berbasis Level)',
          highlight: actualNilaiFormatted
            ? 'text-emerald-700 dark:text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400',
        },
        { label: 'Metode Pencatatan', value: formatActionOrigin(item.action) },
        { label: 'Petugas / Auditor Pencatat', value: formatAuditor(item) },
        { label: 'Waktu Input Data', value: formatDateTime(item.created_at) },
        { label: 'Terakhir Diperbarui', value: formatDateTime(item.updated_at || item.created_at) },
      ]
    }

    // netralitas (txn_wasdal)
    return [
      {
        label: 'Nama Instansi Pemerintah',
        value: item.instansi_name || '-',
        highlight: 'text-slate-900 dark:text-white font-bold',
      },
      { label: 'Kode Instansi', value: String(item.kodeins || item.instansi_id || '-') },
      {
        label: 'Wilayah & Kantor Regional',
        value: `${formatWilayah(item.wilayah, item.kanreg)}${item.kanreg ? ` • Kanreg ${item.kanreg} BKN` : ''}`,
      },
      {
        label: 'Kategori Permasalahan / Pelanggaran',
        value: item.permasalahan || '-',
        highlight: 'text-slate-900 dark:text-white font-bold',
      },
      {
        label: 'Total Kasus / Pegawai Terlapor',
        value: `${formatNumber(item.total)} Kasus`,
        highlight: 'text-rose-700 dark:text-rose-400 font-bold',
      },
      { label: 'Periode Pelaporan', value: formatPeriodLabel(item.period) },
      {
        label: 'Rentang Tanggal Pengawasan',
        value: `${formatDateOnly(item.period_start_date)} s/d ${formatDateOnly(item.period_end_date)}`,
      },
      { label: 'Tanggal Pencatatan Periode', value: formatDateOnly(item.period_date) },
      { label: 'Metode Pencatatan', value: formatActionOrigin(item.action) },
      { label: 'Petugas / Auditor Pencatat', value: formatAuditor(item) },
      { label: 'Waktu Input Data', value: formatDateTime(item.created_at) },
      { label: 'Terakhir Diperbarui', value: formatDateTime(item.updated_at || item.created_at) },
    ]
  })()

  const handleExportCsv = () => {
    const csvLines = [
      ['Parameter', 'Nilai Aktual'],
      ...detailRows.map((r) => [r.label, r.value]),
    ]
    const csvContent =
      '\uFEFF' +
      csvLines
        .map((row) =>
          row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
        )
        .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `detail-${normalizedType}-${item.id || item.period || 'data'}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wasdal-detail-dialog-title"
    >
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 my-auto overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200/60 dark:border-slate-800 gap-3 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0 mt-0.5">
              {normalizedType === 'merit' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h2
                id="wasdal-detail-dialog-title"
                className="text-base font-bold text-slate-900 dark:text-white leading-snug break-words"
              >
                {headerTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {headerSubtitle}
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}
                >
                  {badgeLabel}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Tutup"
            aria-label="Tutup modal detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto clean-scrollbar flex-1">
          {/* Bento Grid KPI Aktual */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bentoCards.map((card, idx) => {
              const Icon = card.icon
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-3 flex flex-col gap-2"
                >
                  <div
                    className={`w-7 h-7 rounded-lg ${card.bgClass} flex items-center justify-center`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${card.iconClass}`} />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">
                      {card.label}
                    </div>
                    <div
                      className="mt-0.5 font-bold text-sm text-slate-900 dark:text-white leading-tight truncate tabular-nums"
                      title={String(card.value)}
                    >
                      {card.value}
                      {card.unit && (
                        <span className="text-[10px] font-normal text-slate-400 ml-1">
                          {card.unit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Auditor & Timestamp Strip */}
          <div className="flex flex-wrap items-center gap-4 py-3 px-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {formatDateTime(item.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {formatAuditor(item)}
              </span>
            </div>
            {normalizedType !== 'merit' && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {formatWilayah(item.wilayah, item.kanreg)}
                </span>
              </div>
            )}
          </div>

          {/* Detail Table Aktual */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rincian Data Aktual Basis Data
            </h3>
            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detailRows.map((row, idx) => (
                    <tr
                      key={row.label}
                      className={
                        idx % 2 === 0
                          ? 'bg-slate-50/60 dark:bg-slate-800/30'
                          : 'bg-white dark:bg-slate-900'
                      }
                    >
                      <td className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 w-5/12">
                        {row.label}
                      </td>
                      <td
                        className={`py-2.5 px-4 tabular-nums break-words ${
                          row.highlight || 'font-bold text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Laporan CSV</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
