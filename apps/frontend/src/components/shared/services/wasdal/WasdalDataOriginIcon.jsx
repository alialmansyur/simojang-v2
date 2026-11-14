import React from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'

/**
 * WasdalDataOriginIcon / DataOriginIcon
 * Standarisasi ikon kolom pertama tabel berdasarkan Data Origin:
 * - Excel / Spreadsheet / Batch Import: FileSpreadsheet (Emerald Theme)
 * - Manual Web Form / Entri Sistem: FileText (Blue Theme)
 */
export function WasdalDataOriginIcon({ type = 'manual', isExcel = false, className = '' }) {
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

export const DataOriginIcon = WasdalDataOriginIcon

/**
 * Helper otomatisasi deteksi tipe origin (Excel/Batch vs Manual Form)
 */
export function isExcelOrigin(item, defaultToExcel = false) {
  if (!item) return defaultToExcel
  if (defaultToExcel) return true
  if (item.source === 'excel' || item.source === 'import' || item.source === 'batch') return true
  if (item.source === 'manual' || item.source === 'form') return false
  if (item.tipe_input === 'excel' || item.tipe_input === 'batch' || item.tipe_input === 'import') return true
  if (item.tipe_input === 'manual' || item.tipe_input === 'form') return false
  if (item.metode === 'EXCEL' || item.metode === 'IMPORT' || item.metode === 'SPREADSHEET') return true
  if (item.metode === 'MANUAL' || item.metode === 'FORM') return false
  if (item.origin === 'excel' || item.origin === 'batch' || item.origin === 'spreadsheet') return true
  if (item.origin === 'manual' || item.origin === 'form') return false
  if (item.is_batch === true || item.is_batch === 1 || item.is_batch === '1') return true
  if (item.is_manual === true || item.is_manual === 1 || item.is_manual === '1') return false
  if (item.batch_id || item.batch_no || item.is_excel) return true
  if (typeof item.file_name === 'string' && item.file_name.match(/\.(xlsx|xls|csv)$/i)) return true
  if (typeof item.filename === 'string' && item.filename.match(/\.(xlsx|xls|csv)$/i)) return true
  if (typeof item.file === 'string' && item.file.match(/\.(xlsx|xls|csv)$/i)) return true
  if (typeof item.lampiran === 'string' && item.lampiran.match(/\.(xlsx|xls|csv)$/i)) return true
  if (typeof item.attachment_url === 'string' && item.attachment_url.match(/\.(xlsx|xls|csv)$/i)) return true
  if (item.file_id || item.import_id) return true
  return false
}

export default WasdalDataOriginIcon
