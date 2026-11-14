/**
 * Sistem Informasi & Digitalisasi (SIDIGI) — Format Helpers & Design Tokens
 * Acuan: ai-context/PEDOMAN_STANDARISASI_TABLE_MASTER.md (SSOT)
 *
 * Dipisah dari komponen sel agar aturan fast-refresh React tetap valid
 * (satu file hanya mengekspor komponen).
 */

/** Format tanggal lokal Indonesia: `d MMM yyyy, HH.mm WIB` (atau `d MMM yyyy` jika tanggal saja) */
export function formatSidigiDateTime(dateStr) {
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
    // Jika data memuat jam & menit (mengandung ':' atau 'T' bukan midnight UTC)
    if (rawStr.includes(':') || (rawStr.includes('T') && !rawStr.endsWith('T00:00:00.000Z') && !rawStr.endsWith('T00:00:00Z'))) {
      const timePart = d
        .toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        .replace(':', '.')
      return `${datePart}, ${timePart} WIB`
    }
    return datePart
  } catch {
    return rawStr
  }
}

/** Format tanggal murni: `d MMM yyyy` */
export function formatSidigiDate(dateStr) {
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
