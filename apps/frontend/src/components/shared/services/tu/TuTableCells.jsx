import { Clock, User } from 'lucide-react'
import { formatTuDateTime } from './tuFormatters'

/**
 * Sel Tabel TANGGAL (Tata Usaha)
 * Standar Gold Standard: Clock icon (w-3.5 h-3.5 text-slate-400) + d MMM yyyy, HH.mm WIB
 */
export function TuTanggalCell({ value, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 ${className}`}>
      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span>{formatTuDateTime(value)}</span>
    </div>
  )
}

/**
 * Sel Tabel PETUGAS (Tata Usaha)
 * Standar Gold Standard: User icon (w-3.5 h-3.5 text-slate-400) + font-semibold NIP / Nama
 */
export function TuPetugasCell({ value, className = '' }) {
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
