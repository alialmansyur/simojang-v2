import React from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'

/**
 * DataOriginIcon
 * Standarisasi ikon pada Kolom 1 tabel berdasarkan Data Origin:
 * - Excel / Spreadsheet / Batch Upload:
 *   * Ikon: Lucide <FileSpreadsheet className="w-4 h-4" />
 *   * Kontainer: w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400
 *   * Tooltip / Title: "Dokumen Spreadsheet / Impor Batch"
 * - Input Manual / Form Web / Entri Sistem:
 *   * Ikon: Lucide <FileText className="w-4 h-4" />
 *   * Kontainer: w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400
 *   * Tooltip / Title: "Entri Manual / Form Sistem"
 */
export function DataOriginIcon({ type = 'manual', isExcel = false, className = '' }) {
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
 * Helper otomatisasi deteksi tipe origin (Excel/Batch vs Manual Form)
 */
export function isExcelOrigin(item, defaultToExcel = false) {
  if (!item) return Boolean(defaultToExcel)
  if (defaultToExcel === true) return true
  if (item.source === 'excel' || item.source === 'import' || item.source === 'batch' || item.source === 'upload') return true
  if (item.source === 'manual' || item.source === 'form') return false
  if (item.tipe_input === 'excel' || item.tipe_input === 'batch' || item.tipe_input === 'import') return true
  if (item.tipe_input === 'manual' || item.tipe_input === 'form') return false
  if (item.metode === 'EXCEL' || item.metode === 'IMPORT' || item.metode === 'SPREADSHEET') return true
  if (item.metode === 'MANUAL' || item.metode === 'FORM') return false
  if (item.is_batch || item.batch_id || item.batch_no) return true
  if (item.is_manual || item.is_form) return false
  if (typeof item.file_name === 'string') {
    if (item.file_name.match(/\.(xlsx|xls|csv)$/i)) return true
    if (item.file_name.toLowerCase().includes('manual')) return false
  }
  if (typeof item.filename === 'string') {
    if (item.filename.match(/\.(xlsx|xls|csv)$/i)) return true
    if (item.filename.toLowerCase().includes('manual')) return false
  }
  if (typeof item.file_size === 'number' && item.file_size > 0) return true
  return Boolean(defaultToExcel)
}

export default DataOriginIcon
