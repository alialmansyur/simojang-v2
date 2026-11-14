/**
 * SIMOJANG DESIGN SYSTEM - COLOR GUIDE & TOKENS
 * 
 * Standar Palet Warna Resmi SIMOJANG Kanreg III BKN:
 * - primary: #123B73 (Brand Utama / Identitas Resmi)
 * - action: #175CD3 (Tombol Aksi Utama / CTA)
 * - hover: #1249A8 (State Hover Aksi)
 * - primary.soft: #EAF2FC (Aksen Lembut / Background Seleksi / Active Submenu)
 * - page: #F7F9FC (Background Halaman Utama)
 * - surface: #FFFFFF (Background Kartu / Panel / Tabel / Modal)
 * - borderNeutral: #D0D5DD (Garis Pembatas Netral)
 * - status.success: #067647 (Status Berhasil / Selesai / Valid)
 * - status.warning: #B54708 (Status Menunggu / Dalam Proses)
 * - status.danger: #B42318 (Status Gagal / Ditolak / BTS)
 */

export const COLOR_GUIDE = Object.freeze({
  primary: {
    DEFAULT: '#123B73',
    soft: '#EAF2FC',
    hover: '#0E2E5B',
    dark: '#0A2142',
    rgb: '18, 59, 115',
  },
  action: {
    DEFAULT: '#175CD3',
    hover: '#1249A8',
    active: '#0F3C8A',
    soft: '#EAF2FC',
    rgb: '23, 92, 211',
  },
  page: {
    DEFAULT: '#F7F9FC',
    dark: '#0B111E',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    dark: '#151F30',
  },
  borderNeutral: {
    DEFAULT: '#EAECF0',
    subtle: '#EAECF0',
    dark: '#1E293B',
  },
  status: {
    success: {
      DEFAULT: '#067647',
      hover: '#05603A',
      soft: '#ECFDF3',
      border: '#A6F4C5',
      darkText: '#75E0A7',
      darkBg: 'rgba(6, 118, 71, 0.2)',
    },
    warning: {
      DEFAULT: '#B54708',
      hover: '#93370D',
      soft: '#FFFAEB',
      border: '#FEDF89',
      darkText: '#FEC84B',
      darkBg: 'rgba(181, 71, 8, 0.2)',
    },
    danger: {
      DEFAULT: '#B42318',
      hover: '#912018',
      soft: '#FEF3F2',
      border: '#FECDCA',
      darkText: '#FDA29B',
      darkBg: 'rgba(180, 35, 24, 0.2)',
    },
  },
})

// Helper Class Names Generator untuk Standardisasi Komponen
export const COMPONENT_STYLES = Object.freeze({
  // Action Buttons
  btnAction: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#175CD3] hover:bg-[#1249A8] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  btnPrimary: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#123B73] hover:bg-[#0E2E5B] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  btnPrimarySoft: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#EAF2FC] hover:bg-[#D9E9FA] text-[#123B73] text-xs sm:text-sm font-bold border border-[#175CD3]/20 active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-50',
  btnNeutral: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-[#F7F9FC] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold border border-[#D0D5DD] dark:border-slate-700 transition-all duration-150 cursor-pointer',

  // Surface Cards & Panels - Subtle Borders
  cardSurface: 'bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-800 rounded-3xl transition-colors shadow-none',
  cardSurfaceHover: 'bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-800 hover:border-[#175CD3]/60 rounded-3xl transition-all duration-200 shadow-none',

  // Form Inputs
  inputBase: 'w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30 focus:border-[#175CD3] transition-all',

  // Status Badges
  badgeSuccess: 'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#ECFDF3] text-[#067647] border border-[#A6F4C5] dark:bg-[#067647]/20 dark:text-[#75E0A7] dark:border-[#067647]/40',
  badgeWarning: 'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89] dark:bg-[#B54708]/20 dark:text-[#FEC84B] dark:border-[#B54708]/40',
  badgeDanger: 'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA] dark:bg-[#B42318]/20 dark:text-[#FDA29B] dark:border-[#B42318]/40',
  badgePrimary: 'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#EAF2FC] text-[#123B73] border border-[#175CD3]/20 dark:bg-[#123B73]/30 dark:text-[#EAF2FC] dark:border-[#175CD3]/40',
})

/**
 * Helper untuk mendapatkan styling status badge otomatis berdasarkan string status
 */
export function getStatusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('selesai') || s.includes('valid') || s.includes('disetujui') || s.includes('sukses') || s.includes('tercapai')) {
    return COMPONENT_STYLES.badgeSuccess
  }
  if (s.includes('menunggu') || s.includes('proses') || s.includes('pending') || s.includes('draft') || s.includes('warning')) {
    return COMPONENT_STYLES.badgeWarning
  }
  if (s.includes('bts') || s.includes('tolak') || s.includes('batal') || s.includes('gagal') || s.includes('danger')) {
    return COMPONENT_STYLES.badgeDanger
  }
  return COMPONENT_STYLES.badgePrimary
}

export default COLOR_GUIDE
