import React from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'

/**
 * SidigiDataOriginIcon (DataOriginIcon)
 * Standarisasi ikon kolom pertama tabel berdasarkan Data Origin:
 * - Excel / Spreadsheet / Batch Import: FileSpreadsheet (Emerald Theme)
 * - Manual Web Form / Entri Sistem: FileText (Blue Theme)
 */
export function SidigiDataOriginIcon({ type = 'manual', isExcel = false, className = '' }) {
  const excel = isExcel || type === 'excel' || type === 'spreadsheet' || type === 'batch'

  if (excel) {
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

/**
 * Alias DataOriginIcon untuk kemudahan import sesuai pedoman
 */
export const DataOriginIcon = SidigiDataOriginIcon

/**
 * Helper otomatisasi deteksi tipe origin (Excel/Batch vs Manual Form)
 */
export function isExcelOrigin(item, defaultToExcel = false) {
  if (!item) return defaultToExcel
  if (defaultToExcel) return true
  if (item.source === 'excel' || item.source === 'import' || item.source === 'batch') return true
  if (item.tipe_input === 'excel' || item.tipe_input === 'batch' || item.tipe_input === 'import') return true
  if (item.metode === 'EXCEL' || item.metode === 'IMPORT' || item.metode === 'SPREADSHEET') return true
  if (item.is_batch || item.batch_id || item.batch_no || item.import_id) return true
  if (typeof item.file_name === 'string' && item.file_name.match(/\.(xlsx|xls|csv)$/i)) return true
  if (typeof item.filename === 'string' && item.filename.match(/\.(xlsx|xls|csv)$/i)) return true
  if (item.created_by && String(item.created_by).toLowerCase().includes('batch')) return true
  return false
}

export default SidigiDataOriginIcon
