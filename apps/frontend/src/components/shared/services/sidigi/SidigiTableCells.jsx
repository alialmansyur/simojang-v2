import { Clock, User } from 'lucide-react'
import { formatSidigiDateTime } from './sidigiFormatters'

/**
 * Sel Tabel TANGGAL (Sistem Informasi & Digitalisasi - SIDIGI)
 * Standar Gold Standard: Clock icon (w-3.5 h-3.5 text-slate-400) + d MMM yyyy, HH.mm WIB
 */
export function SidigiTanggalCell({ value, subValue, className = '' }) {
  return (
    <div className={`text-xs font-semibold text-slate-700 dark:text-slate-200 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>{formatSidigiDateTime(value)}</span>
      </div>
      {subValue && (
        <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
          {subValue}
        </div>
      )}
    </div>
  )
}

/**
 * Sel Tabel PETUGAS (Sistem Informasi & Digitalisasi - SIDIGI)
 * Standar Gold Standard: User icon (w-3.5 h-3.5 text-slate-400) + font-semibold NIP / User
 */
export function SidigiPetugasCell({ value, className = '' }) {
  const displayVal = value || '-'
  return (
    <div className={`flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 ${className}`}>
      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="font-semibold truncate max-w-[180px]" title={displayVal}>
        {displayVal}
      </span>
    </div>
  )
}
