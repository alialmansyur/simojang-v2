/**
 * PMA — Standarisasi Sel Tabel (6 Kolom Adaptif)
 * Acuan: ai-context/PEDOMAN_STANDARISASI_TABLE_MASTER.md (SSOT)
 * Gold Standard: /layanan/kenaikan-pangkat (KpPage.jsx & ServiceLogTable.jsx)
 *
 * Semua 6 halaman layanan PMA (Manajemen Talenta, Pembinaan Kinerja,
 * Pengembangan Kompetensi, Disiplin & Budaya Citra, Penilaian Kompetensi,
 * Penilaian Karier) memakai sel-sel ini agar tipografi & visual rhythm seragam.
 *
 * Format helper & token warna berada di `pmaFormatters.js`.
 */
import {
  Building2,
  Calendar,
  Clock,
  User,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import { PMA_BAR_TONES, PMA_TONES, parsePercent, isExcelOrigin } from './pmaFormatters'

export { isExcelOrigin }

// ---------------------------------------------------------------------------
// Header tabel (PEDOMAN §2B — Sort Indicator)
// ---------------------------------------------------------------------------

export function PmaTableHeader({ label, align = 'left' }) {
  const alignClass =
    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''
  return (
    <div className={`flex items-center gap-1.5 cursor-default ${alignClass}`}>
      <span>{label}</span>
      <ArrowUpDown className="w-3 h-3 text-slate-400" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ikon Asal Data (Data Origin Icon) — Standar Kolom 1
// ---------------------------------------------------------------------------

export function DataOriginIcon({ isExcel = false, className = '' }) {
  if (isExcel) {
    return (
      <div
        className={`w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 ${className}`}
        title="Dokumen Spreadsheet / Impor Batch"
      >
        <FileSpreadsheet className="w-4 h-4" />
      </div>
    )
  }
  return (
    <div
      className={`w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 ${className}`}
      title="Entri Manual / Form Sistem"
    >
      <FileText className="w-4 h-4" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kolom 1 — INSTANSI DAERAH / ENTITAS
// ---------------------------------------------------------------------------

export function PmaInstansiCell({
  item,
  isExcel,
  icon: Icon,
  title,
  subtitle,
  onClick,
}) {
  const excelFlag = isExcel !== undefined ? Boolean(isExcel) : isExcelOrigin(item)
  const clickable = typeof onClick === 'function'

  return (
    <div className="flex items-center gap-3">
      {Icon ? (
        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
          <Icon className="w-4 h-4" />
        </div>
      ) : (
        <DataOriginIcon isExcel={excelFlag} />
      )}
      <div className="min-w-0">
        {clickable ? (
          <button
            type="button"
            onClick={onClick}
            title={title}
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
          >
            {title}
          </button>
        ) : (
          <div
            title={title}
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block max-w-xs sm:max-w-sm"
          >
            {title}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
          <span className="truncate max-w-xs sm:max-w-sm">{subtitle}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kolom 2 — PERIODE ASISTENSI
// ---------------------------------------------------------------------------

export function PmaPeriodeBadge({ children, icon: Icon = Calendar, weightClass = 'font-semibold' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs ${weightClass} bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 whitespace-nowrap`}>
      {Icon ? <Icon className="w-3 h-3 text-slate-400" /> : null}
      <span>{children || '-'}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Kolom 3 — TAHAPAN / STATUS / PREDIKAT
// ---------------------------------------------------------------------------

export function PmaStatusBadge({ children, tone = 'blue', weightClass = 'font-semibold' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] ${weightClass} border whitespace-nowrap ${
        PMA_TONES[tone] || PMA_TONES.blue
      }`}
    >
      {children || '-'}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Kolom 4 — CAPAIAN / PERSENTAGE
// ---------------------------------------------------------------------------

export function PmaCapaianCell({
  percent,
  value,
  suffix = '%',
  tone = 'blue',
  note,
  weightClass = '',
}) {
  const parsed = percent === undefined || percent === null ? null : parsePercent(percent)
  const width = parsed === null ? 0 : Math.min(Math.max(parsed, 0), 100)
  const display =
    parsed !== null
      ? `${parsed}${suffix}`
      : value !== undefined && value !== null
      ? value
      : '-'
  const valueWeight = weightClass || 'font-extrabold'
  const noteWeight = weightClass || 'font-normal'
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`${valueWeight} text-slate-800 dark:text-slate-200 text-xs tabular-nums`}>
          {display}
        </span>
        {parsed !== null && (
          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
            <div
              className={`h-full rounded-full ${PMA_BAR_TONES[tone] || PMA_BAR_TONES.blue}`}
              style={{ width: `${width}%` }}
            />
          </div>
        )}
      </div>
      {note ? (
        <div className={`text-[11px] ${noteWeight} text-slate-400 dark:text-slate-500 mt-0.5`}>
          {note}
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kolom 4 — TANGGAL (Acuan Gold Standard /layanan/kenaikan-pangkat)
// ---------------------------------------------------------------------------

export function PmaTanggalCell({ dateTime, weightClass = '' }) {
  const dateWeight = weightClass || 'font-normal'
  return (
    <div className={`flex items-center gap-1.5 text-xs ${dateWeight} text-slate-600 dark:text-slate-300 whitespace-nowrap`}>
      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span>{dateTime || '-'}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kolom 5 — PETUGAS (PIC) (Acuan Gold Standard /layanan/kenaikan-pangkat)
// ---------------------------------------------------------------------------

export function PmaPetugasCell({ petugas, weightClass = '' }) {
  const petugasWeight = weightClass || 'font-semibold'
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className={`${petugasWeight} text-xs truncate max-w-[180px]`} title={petugas || '-'}>
        {petugas || '-'}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kolom Legacy — TANGGAL & PETUGAS (PIC) (Fallback)
// ---------------------------------------------------------------------------

export function PmaTanggalPetugasCell({ dateTime, petugas, weightClass = '' }) {
  const dateWeight = weightClass || 'font-normal'
  const petugasWeight = weightClass || 'font-semibold'
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-xs ${dateWeight} text-slate-600 dark:text-slate-300 whitespace-nowrap`}>
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>{dateTime || '-'}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap mt-0.5">
        <User className="w-3.5 h-3.5 text-slate-400" />
        <span className={`${petugasWeight} text-xs`}>{petugas || '-'}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kolom 6 — AKSI
// ---------------------------------------------------------------------------

export function PmaActionButtons({ onView, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap text-right">
      {onView && (
        <button
          type="button"
          onClick={onView}
          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer active:scale-95"
          title="Lihat Detail / Rincian"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer active:scale-95"
          title="Ubah Data"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
          title="Hapus Data"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
