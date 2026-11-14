/**
 * PMA — Format Helpers & Design Tokens
 * Acuan: ai-context/PEDOMAN_STANDARISASI_TABLE_MASTER.md (SSOT)
 *
 * Dipisah dari komponen sel agar aturan fast-refresh React tetap_valid
 * (satu file hanya mengekspor komponen).
 */

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

export const PMA_FALLBACK_NIP = 'Belum diisi'

/** Format tanggal lokal Indonesia: `d MMM yyyy, HH.mm WIB` */
export function formatDateTimeId(dateStr) {
  if (!dateStr) return '-'
  const rawStr = String(dateStr).trim()
  if (!rawStr || rawStr.startsWith('0000-00-00')) return '-'
  try {
    const raw = rawStr.includes(' ') ? rawStr.replace(' ', 'T') : rawStr
    const d = new Date(raw)
    if (isNaN(d.getTime())) return rawStr
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
    return rawStr
  }
}

/** Format tanggal tanpa jam: `d MMM yyyy` */
export function formatDateId(dateStr) {
  if (!dateStr) return '-'
  const rawStr = String(dateStr).trim()
  if (!rawStr || rawStr.startsWith('0000-00-00')) return '-'
  try {
    const raw = rawStr.includes(' ') ? rawStr.replace(' ', 'T') : rawStr
    const d = new Date(raw)
    if (isNaN(d.getTime())) return rawStr
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return rawStr
  }
}

/**
 * Deteksi cara perolehan data (Data Origin):
 * true  -> Dokumen Spreadsheet / Impor Batch (Excel, CSV, Batch)
 * false -> Entri Manual / Form Web / Entri Sistem
 */
export function isExcelOrigin(item) {
  if (!item || typeof item !== 'object') return false

  // 1. Explicit boolean flag
  if (item.is_excel !== undefined && item.is_excel !== null) return Boolean(item.is_excel)
  if (item.is_batch !== undefined && item.is_batch !== null) return Boolean(item.is_batch)
  if (item.imported !== undefined && item.imported !== null) return Boolean(item.imported)
  if (item.is_imported !== undefined && item.is_imported !== null) return Boolean(item.is_imported)

  // 2. Batch or import identifiers
  if (item.batch_id || item.batch_no || item.upload_batch_id || item.import_id || item.import_batch_id) {
    return true
  }

  // 3. Source / channel / origin string
  const source = String(
    item.source ||
    item.data_origin ||
    item.origin ||
    item.channel ||
    item.activity_type ||
    item.metode_input ||
    item.tipe_input ||
    ''
  ).toLowerCase().trim()

  if (['excel', 'import', 'batch', 'spreadsheet', 'csv', 'xlsx', 'xls', 'file'].includes(source)) {
    return true
  }
  if (['manual', 'form', 'web', 'system', 'sistem', 'input', 'entri'].includes(source)) {
    return false
  }

  // 4. File extension or filename check
  const fileCandidate =
    item.file_name ||
    item.filename ||
    item.file_path ||
    item.berkas ||
    item.dokumen_file ||
    item.nama_file ||
    item.file ||
    ''
  if (typeof fileCandidate === 'string' && /\.(xlsx|xls|csv)$/i.test(fileCandidate)) {
    return true
  }

  // 5. Remarks / description containing import keywords
  const descCandidate = String(
    item.description ||
    item.keterangan ||
    item.remarks ||
    item.catatan ||
    ''
  ).toLowerCase()
  if (/import\s*batch|impor\s*batch|unggah\s*excel|berkas\s*excel|file\s*excel/i.test(descCandidate)) {
    return true
  }

  return false
}

/** Normalisasi NIP petugas: sembunyikan akun sistem & script migrasi, sisakan NIP asli. */
export function formatNip(val, fallback = PMA_FALLBACK_NIP) {
  if (!val) return fallback
  const raw = String(val).trim()
  if (!raw) return fallback
  if (
    ['admin', 'admin pma', 'system', 'superadmin', 'migration_script', 'migration', 'migrasi'].includes(
      raw.toLowerCase()
    )
  ) {
    return fallback
  }
  return raw
}

/** Normalisasi nama wilayah kerja dari data instansi aktual. */
export function formatWilayah(wilayah, kanreg) {
  const raw = String(wilayah || '').trim()
  if (raw) {
    const lower = raw.toLowerCase()
    if (lower === 'jabar') return 'Jawa Barat'
    if (lower === 'banten') return 'Banten'
    if (!/^\d+$/.test(raw)) return raw
  }
  return kanreg ? `Kanreg ${kanreg}` : '-'
}

/** Format label Kanreg dari data instansi aktual. */
export function formatKanregLabel(kanreg) {
  if (kanreg === null || kanreg === undefined || kanreg === '' || Number(kanreg) === 0) {
    return '-'
  }
  return `Kanreg ${kanreg} BKN`
}

/** Parse nilai persentase dari berbagai bentuk field (`85`, `'85%'`, `0.85`). */
export function parsePercent(value) {
  if (value === null || value === undefined || value === '') return null
  const raw = String(value).trim()
  const numeric = Number(raw.replace('%', ''))
  if (isNaN(numeric)) return null
  if (numeric > 0 && numeric <= 1 && !raw.includes('%')) return numeric * 100
  return numeric
}

export const formatNumber = (num) =>
  new Intl.NumberFormat('id-ID').format(Number(num || 0))

// ---------------------------------------------------------------------------
// Tone semantik badge (Emerald / Blue / Amber / Rose)
// ---------------------------------------------------------------------------

export const PMA_TONES = {
  emerald:
    'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
  blue: 'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
  amber:
    'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
  slate:
    'bg-slate-100/80 text-slate-700 border-slate-200/50 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700/50',
}

export const PMA_BAR_TONES = {
  emerald: 'bg-emerald-500',
  blue: 'bg-[#175CD3]',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
}
