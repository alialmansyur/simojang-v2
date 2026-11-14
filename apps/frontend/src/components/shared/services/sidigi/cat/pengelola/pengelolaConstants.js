export const PENGELOLA_ROLES = [
  {
    value: 'Koordinator',
    label: 'Koordinator',
    badgeClass:
      'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40',
  },
  {
    value: 'IT',
    label: 'Tim IT',
    badgeClass:
      'bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40',
  },
  {
    value: 'Pengawas',
    label: 'Pengawas',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
  },
]

export function getRoleMeta(role) {
  const key = String(role || '').toLowerCase()
  return (
    PENGELOLA_ROLES.find((r) => r.value.toLowerCase() === key) || {
      value: role || '',
      label: role || '-',
      badgeClass:
        'bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    }
  )
}

export const JADWAL_STATUS_META = {
  draft: {
    label: 'Draft',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
  },
  aktif: {
    label: 'Aktif',
    badgeClass:
      'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
  },
  selesai: {
    label: 'Selesai',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
  },
  batal: {
    label: 'Batal',
    badgeClass:
      'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
  },
}

export const ST_STATUS_META = {
  menunggu: {
    label: 'ST Menyusul',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
  },
  terhubung: {
    label: 'ST Terhubung',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
  },
}

export const DOC_CATEGORY_META = [
  { key: 'all', label: 'Semua Dokumen' },
  { key: 'personel', label: 'Kepegawaian & Tim' },
  { key: 'keuangan', label: 'Keuangan & Biaya' },
  { key: 'jamuan', label: 'Konsumsi & Katering' },
]

export const DOC_FALLBACK_CONFIG = {
  sp: { categoryKey: 'personel', hasPersonel: true, hasItems: false },
  st: { categoryKey: 'personel', hasPersonel: true, hasItems: false },
  hadir: { categoryKey: 'personel', hasPersonel: true, hasItems: false },
  nominatif: { categoryKey: 'keuangan', hasPersonel: true, hasItems: false },
  kwitansi: { categoryKey: 'keuangan', hasPersonel: true, hasItems: false },
  kwitansi_jamuan: { categoryKey: 'jamuan', hasPersonel: false, hasItems: true },
  surat_jalan: { categoryKey: 'jamuan', hasPersonel: false, hasItems: true },
  hadir_jamuan: { categoryKey: 'jamuan', hasPersonel: true, hasItems: false },
}

const DEFAULT_KOP_IMG = `${import.meta.env.BASE_URL || '/'}kop_surat.png`

/**
 * Mapping terpusat image Kop Surat resmi.
 * Cukup ganti path gambar per varian saat file Kop BKN Pusat & Kop Kanreg III final tersedia di public/.
 */
export const KOP_IMAGE_MAP = {
  bkn_pusat: {
    key: 'bkn_pusat',
    label: 'Kop BKN Pusat (Sementara: kop_surat.png)',
    src: DEFAULT_KOP_IMG,
  },
  kanreg_3: {
    key: 'kanreg_3',
    label: 'Kop Kanreg III BKN Bandung (Sementara: kop_surat.png)',
    src: DEFAULT_KOP_IMG,
  },
  none: {
    key: 'none',
    label: 'Tanpa Gambar Kop Surat',
    src: '',
  },
}

export function resolveKopImageSrc(variant = 'kanreg_3') {
  if (variant === 'none') return ''
  return KOP_IMAGE_MAP[variant]?.src || DEFAULT_KOP_IMG
}

export function formatRupiah(value) {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num))
}

export function formatAngkaId(value) {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return '0'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num))
}

export function angkaTerbilang(nilai) {
  const num = Math.floor(Math.abs(Number(nilai || 0)))
  if (num === 0) return 'Nol Rupiah'
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
  const rec = (n) => {
    if (n < 12) return satuan[n]
    if (n < 20) return `${rec(n - 10)} Belas`
    if (n < 100) return `${rec(Math.floor(n / 10))} Puluh${n % 10 ? ` ${rec(n % 10)}` : ''}`
    if (n < 200) return `Seratus${n - 100 ? ` ${rec(n - 100)}` : ''}`
    if (n < 1000) return `${rec(Math.floor(n / 100))} Ratus${n % 100 ? ` ${rec(n % 100)}` : ''}`
    if (n < 2000) return `Seribu${n - 1000 ? ` ${rec(n - 1000)}` : ''}`
    if (n < 1000000) return `${rec(Math.floor(n / 1000))} Ribu${n % 1000 ? ` ${rec(n % 1000)}` : ''}`
    if (n < 1000000000) return `${rec(Math.floor(n / 1000000))} Juta${n % 1000000 ? ` ${rec(n % 1000000)}` : ''}`
    return `${rec(Math.floor(n / 1000000000))} Miliar${n % 1000000000 ? ` ${rec(n % 1000000000)}` : ''}`
  }
  return `${rec(num).replace(/\s+/g, ' ').trim()} Rupiah`
}

export function formatTanggalPanjangId(dateStr) {
  if (!dateStr) return '-'
  try {
    const dt = new Date(dateStr)
    if (Number.isNaN(dt.getTime())) return String(dateStr)
    return dt.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return String(dateStr)
  }
}

export function formatHariId(dateStr) {
  if (!dateStr) return '-'
  try {
    const dt = new Date(dateStr)
    if (Number.isNaN(dt.getTime())) return '-'
    return dt.toLocaleDateString('id-ID', { weekday: 'long' })
  } catch {
    return '-'
  }
}

export function formatTanggalId(dateStr) {
  if (!dateStr) return '-'
  try {
    const dt = new Date(dateStr)
    if (Number.isNaN(dt.getTime())) return String(dateStr)
    return dt.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(dateStr)
  }
}

export function formatDateRangeId(start, end) {
  if (!start && !end) return 'Belum ditentukan'
  if (start && end && start !== end) {
    return `${formatTanggalId(start)} – ${formatTanggalId(end)}`
  }
  return formatTanggalId(start || end)
}

export const CAT_DOC_DETAILS = {
  sp: {
    number: 1,
    short: 'SP',
    title: 'Surat Perintah CAT',
    category: 'KEPEGAWAIAN & TIM',
    categoryKey: 'personel',
    description: 'Surat perintah pelaksanaan tugas fasilitasi CAT beserta daftar tim pengawas.',
  },
  st: {
    number: 2,
    short: 'ST',
    title: 'Surat Tugas Tim CAT',
    category: 'KEPEGAWAIAN & TIM',
    categoryKey: 'personel',
    description: 'Surat Tugas resmi penugasan personel CAT dengan opsi dasar & kop surat.',
  },
  nominatif: {
    number: 3,
    short: 'NOM',
    title: 'Daftar Nominatif Honorarium',
    category: 'KEUANGAN & BIAYA',
    categoryKey: 'keuangan',
    description: 'Daftar nominatif penerima honorarium/transport & rincian PPh Pasal 21 (Landscape).',
  },
  kwitansi: {
    number: 4,
    short: 'KWI',
    title: 'Kwitansi Pembayaran Tim',
    category: 'KEUANGAN & BIAYA',
    categoryKey: 'keuangan',
    description: 'Kuitansi per individu & rekap tanda terima pembayaran honorarium tim CAT.',
  },
  hadir: {
    number: 5,
    short: 'DH',
    title: 'Daftar Hadir Tim CAT',
    category: 'KEPEGAWAIAN & TIM',
    categoryKey: 'personel',
    description: 'Daftar hadir harian panitia / tim pelaksana fasilitasi CAT (internal & eksternal).',
  },
  kwitansi_jamuan: {
    number: 6,
    short: 'KWI-J',
    title: 'Kwitansi & Faktur Jamuan',
    category: 'KONSUMSI & KATERING',
    categoryKey: 'jamuan',
    description: 'Satu kesatuan: Kuitansi Jamuan di halaman 1 dan Faktur / Invoice Rekanan di halaman 2+.',
  },
  surat_jalan: {
    number: 7,
    short: 'SJ',
    title: 'Surat Jalan & Penerimaan Barang',
    category: 'KONSUMSI & KATERING',
    categoryKey: 'jamuan',
    description: 'Surat Jalan & Berita Acara Penyerahan Konsumsi/Barang untuk kegiatan CAT.',
  },
  hadir_jamuan: {
    number: 8,
    short: 'DH-J',
    title: 'Daftar Hadir Jamuan',
    category: 'KONSUMSI & KATERING',
    categoryKey: 'jamuan',
    description: 'Daftar hadir penerimaan konsumsi / jamuan rapat & panitia (format standar daftar hadir).',
  },
}

/**
 * Resolve tahun otomatis dokumen dari periode jenis tes, jadwal, atau tanggal dokumen.
 */
export function resolveDocAutoYear(doc) {
  const periodStr = String(
    doc?.jenis_periode_tahun || doc?.seleksi_periode || doc?.jadwal_periode || ''
  ).trim()
  const match = periodStr.match(/\b(20\d{2}|19\d{2})\b/)
  if (match) return match[1]
  const dateStr = String(doc?.doc_date || doc?.jadwal_tanggal_mulai || '').trim()
  if (/^\d{4}/.test(dateStr)) return dateStr.slice(0, 4)
  return String(new Date().getFullYear())
}

/**
 * Standar gaya font PDF cetak: Arial, size 12px, warna hitam murni (#000000).
 */
export const PDF_ARIAL_PAGE_STYLE = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '12px',
  color: '#000000',
}

/**
 * Standar kelas form input/label builder agar ukuran seragam dengan modal SSOT.
 */
export const CAT_FORM_LABEL_CLS =
  'block text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200'

export const CAT_FORM_INPUT_CLS =
  'w-full h-[38px] px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3] disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed'

export const CAT_FORM_SELECT_CLS =
  'w-full h-[38px] px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3] cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed'

export const CAT_FORM_TEXTAREA_CLS =
  'w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]'
