import { apiRequest } from '../api'

const SERVICE_URL_TO_ROUTE = {
  // SnP
  'apps-cltn': '/layanan/cltn',
  'apps-asn-aktif': '/layanan/asn-aktif',
  'apps-cpns-pns': '/layanan/cpns-pns',
  'apps-pertek-pensiun': '/layanan/pertek-pensiun',
  'apps-sk-pensiun': '/layanan/sk-pensiun',
  'apps-regis-pensiun': '/layanan/regis-pensiun',
  // PnM
  'apps-kp': '/layanan/kenaikan-pangkat',
  'apps-pg': '/layanan/pencantuman-gelar',
  'apps-tapnip': '/layanan/penetapan-nip',
  'apps-pmk': '/layanan/peninjauan-masa-kerja',
  'apps-pi': '/layanan/pindah-instansi',
  // Wasdal
  'apps-merit': '/layanan/sistem-merit',
  'apps-nspk': '/layanan/indeks-nspk',
  'apps-wasdal': '/layanan/wasdal-netralitas',
  // PMA
  'apps-mt': '/layanan/manajemen-talenta',
  'apps-pembinaan-kinerja': '/layanan/pembinaan-kinerja',
  'apps-pembinaan-kompetensi-karier': '/layanan/pengembangan-kompetensi',
  'apps-pembinaan-disiplin-budaya-citra': '/layanan/disiplin-budaya-citra',
  'apps-kompetensi': '/layanan/penilaian-kompetensi',
  'apps-karier': '/layanan/penilaian-karier',
  // SIDIGI
  'apps-statistik': '/layanan/statistik-pegawai',
  'apps-pdm': '/layanan/peremajaan-data',
  'apps-dispa': '/layanan/disparitas-data',
  'apps-integrasi': '/layanan/integrasi-siasn',
  'apps-takah': '/layanan/arsip-takah',
  'apps-dms': '/layanan/arsip-dms',
  'apps-cat': '/layanan/fasilitasi-cat',
  'apps-pnbp': '/layanan/pnbp-cat',
  // TU
  'apps-anggaran': '/layanan/anggaran',
  'apps-ikm': '/layanan/ikm',
  'apps-humas': '/layanan/humas',
  'apps-surat': '/layanan/surat',
  'apps-konsultasi': '/layanan/konsultasi',
  'apps-ikpa': '/layanan/ikpa',
  'apps-statistik-internal': '/layanan/statistik-internal',
  'apps-ekin': '/layanan/ekin',
  'apps-manage-assets': '/layanan/manage-assets',
  'apps-manage-project': '/layanan/manage-project',
  'apps-lost-and-found': '/layanan/lost-and-found',
  'apps-ikk': '/layanan/ikk',
}

const ENROLL_CODE_TO_ROUTE = {
  integrasi: '/layanan/integrasi-siasn',
  peremajaan: '/layanan/peremajaan-data',
  statistik: '/layanan/statistik-pegawai',
  katalog: '/layanan/arsip-takah',
  alihmedia: '/layanan/arsip-dms',
  dms: '/layanan/arsip-dms',
  disparitas: '/layanan/disparitas-data',
  cat: '/layanan/fasilitasi-cat',
}

const TIM_CODE_TO_FRONTEND_ID = {
  tu: 'tu',
  sidigi: 'sidigi',
  pnm: 'pm',
  pmasn: 'pembinaan',
  pnp: 'wasdal',
  snp: 'sp',
}

export function resolveServiceRoute(rawUrl, fallbackCode = '') {
  const clean = String(rawUrl || '').trim().replace(/^\/+/, '')
  if (clean && SERVICE_URL_TO_ROUTE[clean]) {
    return SERVICE_URL_TO_ROUTE[clean]
  }
  const code = String(fallbackCode || '').trim().toLowerCase()
  if (code && ENROLL_CODE_TO_ROUTE[code]) {
    return ENROLL_CODE_TO_ROUTE[code]
  }
  if (clean.startsWith('layanan/')) {
    return `/${clean}`
  }
  return '/my-tasks'
}

export function resolveTimKerjaId(dbCode) {
  const key = String(dbCode || '').trim().toLowerCase()
  return TIM_CODE_TO_FRONTEND_ID[key] || 'tu'
}

export async function fetchDashboardSummary({ signal } = {}) {
  const res = await apiRequest('/api/dashboard/summary', { method: 'GET', signal })
  return res?.data || null
}
