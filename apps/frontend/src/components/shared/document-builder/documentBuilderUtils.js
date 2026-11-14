// Helper format tanggal Indonesia (contoh: 28 Oktober 2026)
export function formatDateIndo(dateStr) {
  if (!dateStr) return '-'
  try {
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const [y, m, d] = parts
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const mIdx = parseInt(m, 10) - 1
    return `${parseInt(d, 10)} ${months[mIdx] || m} ${y}`
  } catch {
    return dateStr
  }
}

// Helper hitung hari otomatis dari tanggal (contoh: Rabu)
export function getHariIndo(dateStr) {
  if (!dateStr) return '-'
  try {
    const parts = dateStr.split('-')
    if (parts.length !== 3) return '-'
    const [y, m, d] = parts
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10))
    if (isNaN(dateObj.getTime())) return '-'
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    return days[dateObj.getDay()]
  } catch {
    return '-'
  }
}

// Client-side image compressor (max 1200px, JPEG quality 0.75)
export function compressImageFile(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

// 4 Jenis Kategori Dokumentasi Standar BKN
export const DEFAULT_DOKUMENTASI_CATEGORIES = [
  {
    key: 'sambutan',
    label: 'Sambutan Pembukaan',
    desc: 'Foto pembukaan atau sambutan oleh pimpinan/koordinator.',
  },
  {
    key: 'paparan',
    label: 'Paparan / Arahan Teknis',
    desc: 'Foto paparan tata tertib dan petunjuk pengerjaan CAT.',
  },
  {
    key: 'registrasi',
    label: 'Registrasi & Kedatangan',
    desc: 'Foto alur penitipan barang, body checking, dan registrasi PIN.',
  },
  {
    key: 'proses_ujian',
    label: 'Proses Pelaksanaan Ujian',
    desc: 'Foto suasana ketertiban peserta di dalam ruang ujian CAT.',
  },
]
