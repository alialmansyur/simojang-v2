import * as XLSX from 'xlsx'
import { toast } from 'react-toastify'

/**
 * Utility export data ke format asli Microsoft Excel (.xlsx) dengan pre-formatted table & auto column widths.
 * Menghasilkan file OpenXML murni yang langsung terbuka di Excel tanpa dialog konversi/separator.
 */
export function exportToXlsx({
  filename = 'Export_Data.xlsx',
  sheetName = 'Rekapitulasi Data',
  data = [],
}) {
  if (!Array.isArray(data) || data.length === 0) {
    toast.warning('Tidak ada data yang dapat diekspor.')
    return
  }

  // Buat worksheet dari array of objects JSON
  const ws = XLSX.utils.json_to_sheet(data)

  // Hitung lebar kolom otomatis berdasarkan panjang isi terpanjang
  const keys = Object.keys(data[0] || {})
  const colWidths = keys.map((key) => {
    let maxLen = key.length
    data.forEach((row) => {
      const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : ''
      if (val.length > maxLen) maxLen = val.length
    })
    return { wch: Math.min(Math.max(maxLen + 3, 10), 45) }
  })
  ws['!cols'] = colWidths

  // Buat workbook baru dan append sheet
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))

  // Tulis dan unduh berkas .xlsx
  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(wb, finalFilename)
}
